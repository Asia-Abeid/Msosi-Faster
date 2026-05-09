from rest_framework import serializers
from .models import Order, OrderItem
from users.serializers import UserSerializer
from restaurants.serializers import MenuItemSerializer

class OrderItemSerializer(serializers.ModelSerializer):
    menu_item_detail = MenuItemSerializer(source='menu_item', read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ['id', 'order', 'menu_item', 'menu_item_detail', 'quantity', 'price']
        read_only_fields = ['order', 'price']

    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError('Quantity must be at least 1.')
        return value

class OrderSerializer(serializers.ModelSerializer):
    customer_detail = UserSerializer(source='customer', read_only=True)
    items = OrderItemSerializer(many=True)
    
    class Meta:
        model = Order
        fields = ['id', 'customer', 'customer_detail', 'status', 'delivery_address', 'total_price', 'items', 'created_at', 'updated_at']
        read_only_fields = ['customer', 'status', 'total_price', 'created_at', 'updated_at']

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError('At least one item is required.')
        return value

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        total_price = sum(item_data['menu_item'].price * item_data['quantity'] for item_data in items_data)
        order = Order.objects.create(total_price=total_price, **validated_data)
        for item_data in items_data:
            menu_item = item_data['menu_item']
            OrderItem.objects.create(
                order=order,
                menu_item=menu_item,
                quantity=item_data['quantity'],
                price=menu_item.price,
            )
        return order
