from decimal import Decimal

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from payments.models import Payment
from restaurants.models import MenuItem, Restaurant
from users.models import User


class OrderApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.customer = User.objects.create_user(
            username='customer',
            password='password123',
            phone_number='255700000001',
        )
        self.owner = User.objects.create_user(
            username='owner',
            password='password123',
            phone_number='255700000002',
            is_restaurant_owner=True,
        )
        self.restaurant = Restaurant.objects.create(
            owner=self.owner,
            name='Owner Kitchen',
            address='Market Street',
            phone_number='255700000003',
        )
        self.menu_item = MenuItem.objects.create(
            restaurant=self.restaurant,
            name='Pilau',
            price=Decimal('5000.00'),
        )

    def test_order_totals_are_calculated_from_menu_prices(self):
        self.client.force_authenticate(self.customer)
        response = self.client.post('/api/orders/', {
            'delivery_address': 'Customer Street',
            'total_price': '1.00',
            'items': [{
                'menu_item': self.menu_item.id,
                'quantity': 2,
                'price': '1.00',
            }],
        }, format='json')

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Decimal(response.data['total_price']), Decimal('10000.00'))
        self.assertEqual(Decimal(response.data['items'][0]['price']), Decimal('5000.00'))

    def test_order_detail_is_read_only(self):
        self.client.force_authenticate(self.customer)
        create_response = self.client.post('/api/orders/', {
            'delivery_address': 'Customer Street',
            'items': [{'menu_item': self.menu_item.id, 'quantity': 1}],
        }, format='json')

        response = self.client.patch(
            f"/api/orders/{create_response.data['id']}/",
            {'status': 'delivered', 'total_price': '1.00'},
            format='json',
        )

        self.assertEqual(response.status_code, 405)

    def test_owner_cannot_mark_order_delivered_directly(self):
        self.client.force_authenticate(self.customer)
        create_response = self.client.post('/api/orders/', {
            'delivery_address': 'Customer Street',
            'items': [{'menu_item': self.menu_item.id, 'quantity': 1}],
        }, format='json')

        self.client.force_authenticate(self.owner)
        response = self.client.patch(
            f"/api/orders/{create_response.data['id']}/status/",
            {'status': 'delivered'},
            format='json',
        )

        self.assertEqual(response.status_code, 400)

    def test_customer_can_confirm_received_when_order_is_on_the_way(self):
        self.client.force_authenticate(self.customer)
        create_response = self.client.post('/api/orders/', {
            'delivery_address': 'Customer Street',
            'items': [{'menu_item': self.menu_item.id, 'quantity': 1}],
        }, format='json')

        self.client.force_authenticate(self.owner)
        self.client.patch(f"/api/orders/{create_response.data['id']}/status/", {'status': 'preparing'}, format='json')
        self.client.patch(f"/api/orders/{create_response.data['id']}/status/", {'status': 'ready'}, format='json')
        self.client.patch(f"/api/orders/{create_response.data['id']}/status/", {'status': 'on_the_way'}, format='json')

        self.client.force_authenticate(self.customer)
        response = self.client.post(f"/api/orders/{create_response.data['id']}/confirm-received/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'delivered')

    def test_paid_order_auto_delivers_after_transit_window(self):
        order = self._create_paid_order(status='on_the_way')
        Order = order.__class__
        Order.objects.filter(id=order.id).update(
            updated_at=timezone.now() - timezone.timedelta(hours=25)
        )

        self.client.force_authenticate(self.customer)
        response = self.client.get(f"/api/orders/{order.id}/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'delivered')

    def _create_paid_order(self, status):
        order = self.customer.order_set.create(
            delivery_address='Customer Street',
            total_price=Decimal('5000.00'),
            status=status,
        )
        order.items.create(menu_item=self.menu_item, quantity=1, price=self.menu_item.price)
        Payment.objects.create(
            order=order,
            customer=self.customer,
            amount=order.total_price,
            payment_method='mpesa',
            status='completed',
            transaction_id=f'txn-{order.id}',
        )
        return order
