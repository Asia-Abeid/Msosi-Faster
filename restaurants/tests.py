from django.test import TestCase
from rest_framework.test import APIClient

from .models import MenuItem, Restaurant
from users.models import User


class RestaurantApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.owner = User.objects.create_user(
            username='owner',
            password='password123',
            phone_number='255700000010',
            is_restaurant_owner=True,
        )
        self.customer = User.objects.create_user(
            username='customer',
            password='password123',
            phone_number='255700000011',
        )
        self.restaurant = Restaurant.objects.create(
            owner=self.owner,
            name='Owner Kitchen',
            address='Market Street',
            phone_number='255700000012',
        )

    def test_owner_can_create_menu_item_without_client_restaurant_field(self):
        self.client.force_authenticate(self.owner)
        response = self.client.post('/api/restaurants/food/create/', {
            'name': 'Chapati',
            'price': '1500.00',
            'description': 'Fresh',
        })

        self.assertEqual(response.status_code, 201)
        item = MenuItem.objects.get(id=response.data['id'])
        self.assertEqual(item.restaurant, self.restaurant)

    def test_restaurant_create_requires_owner(self):
        anonymous_response = self.client.post('/api/restaurants/', {
            'name': 'Anonymous Kitchen',
            'address': 'No Street',
            'phone_number': '255700000013',
        })
        self.assertEqual(anonymous_response.status_code, 401)

        self.client.force_authenticate(self.customer)
        customer_response = self.client.post('/api/restaurants/', {
            'name': 'Customer Kitchen',
            'address': 'No Street',
            'phone_number': '255700000014',
        })
        self.assertEqual(customer_response.status_code, 403)
