from rest_framework import serializers
from .models import Order, OrderItem
from users.serializers import UserSerializer
from restaurants.serializers import MenuItemSerializer

class OrderItemSerializer(serializers.ModelSerializer):
    menu_item_detail = MenuItemSerializer(source='menu_item', read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ['id', 'order', 'menu_item', 'menu_item_detail', 'quantity', 'price']
        read_only_fields = ['order']

class OrderSerializer(serializers.ModelSerializer):
    customer_detail = UserSerializer(source='customer', read_only=True)
    items = OrderItemSerializer(many=True) # Now writable
    
    class Meta:
        model = Order
        fields = ['id', 'customer', 'customer_detail', 'status', 'delivery_address', 'total_price', 'items', 'created_at', 'updated_at']
        read_only_fields = ['customer', 'created_at', 'updated_at']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        order = Order.objects.create(**validated_data)
        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)
        return order
