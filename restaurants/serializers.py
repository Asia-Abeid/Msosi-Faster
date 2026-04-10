from rest_framework import serializers
from .models import Restaurant, MenuItem

class RestaurantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Restaurant
        fields = '__all__'

class MenuItemSerializer(serializers.ModelSerializer):
    restaurant_name = serializers.ReadOnlyField(source='restaurant.name')
    
    class Meta:
        model = MenuItem
        fields = ['id', 'restaurant', 'restaurant_name', 'name', 'description', 'price', 'image', 'is_available', 'created_at']
        read_only_fields = ['restaurant', 'created_at']
