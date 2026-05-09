from decimal import Decimal

from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from orders.models import Order, OrderItem
from .models import Payment
from restaurants.models import MenuItem, Restaurant
from users.models import User


class PaymentApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.customer = User.objects.create_user(
            username='customer',
            email='customer@example.com',
            password='password123',
            phone_number='255700000020',
        )
        self.owner = User.objects.create_user(
            username='owner',
            password='password123',
            phone_number='255700000021',
            is_restaurant_owner=True,
        )
        self.restaurant = Restaurant.objects.create(
            owner=self.owner,
            name='Owner Kitchen',
            address='Market Street',
            phone_number='255700000022',
        )
        self.menu_item = MenuItem.objects.create(
            restaurant=self.restaurant,
            name='Rice',
            price=Decimal('4000.00'),
        )
        self.order = Order.objects.create(
            customer=self.customer,
            delivery_address='Customer Street',
            total_price=Decimal('4000.00'),
        )
        OrderItem.objects.create(
            order=self.order,
            menu_item=self.menu_item,
            quantity=1,
            price=self.menu_item.price,
        )

    @override_settings(DEBUG=True, SELCOM_API_KEY='', SELCOM_MERCHANT_ID='')
    def test_payment_create_accepts_only_payment_method_from_client(self):
        self.client.force_authenticate(self.customer)
        response = self.client.post(
            f'/api/payments/{self.order.id}/pay/',
            {'payment_method': 'mpesa'},
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['payment_method'], 'mpesa')
        self.assertEqual(Decimal(response.data['amount']), Decimal('4000.00'))
        self.assertEqual(response.data['order'], self.order.id)
        self.assertEqual(response.data['customer'], self.customer.id)

    def test_earnings_split_available_and_pending_paid_orders(self):
        self.order.status = 'on_the_way'
        self.order.save(update_fields=['status'])
        Payment.objects.create(
            order=self.order,
            customer=self.customer,
            amount=self.order.total_price,
            payment_method='mpesa',
            status='completed',
            transaction_id='transit-txn',
        )

        delivered_order = Order.objects.create(
            customer=self.customer,
            delivery_address='Customer Street',
            total_price=Decimal('6000.00'),
            status='delivered',
        )
        OrderItem.objects.create(
            order=delivered_order,
            menu_item=self.menu_item,
            quantity=1,
            price=Decimal('6000.00'),
        )
        Payment.objects.create(
            order=delivered_order,
            customer=self.customer,
            amount=Decimal('6000.00'),
            payment_method='mpesa',
            status='completed',
            transaction_id='delivered-txn',
        )

        self.client.force_authenticate(self.owner)
        response = self.client.get('/api/payments/earnings/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(Decimal(response.data['available_balance']), Decimal('6000.00'))
        self.assertEqual(Decimal(response.data['pending_earnings']), Decimal('4000.00'))
        self.assertEqual(response.data['in_transit_count'], 1)

    def test_delivered_order_without_completed_payment_is_not_available(self):
        self.order.status = 'delivered'
        self.order.save(update_fields=['status'])

        self.client.force_authenticate(self.owner)
        response = self.client.get('/api/payments/earnings/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(Decimal(response.data['available_balance']), Decimal('0.00'))

    def test_delivered_order_with_completed_payment_is_available(self):
        self.order.status = 'delivered'
        self.order.save(update_fields=['status'])
        Payment.objects.create(
            order=self.order,
            customer=self.customer,
            amount=self.order.total_price,
            payment_method='mpesa',
            status='completed',
            transaction_id='available-txn',
        )

        self.client.force_authenticate(self.owner)
        response = self.client.get('/api/payments/earnings/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(Decimal(response.data['available_balance']), Decimal('4000.00'))
