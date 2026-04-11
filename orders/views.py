from rest_framework import generics, status, permissions
from rest_framework.response import Response
from .models import Order, OrderItem
from .serializers import OrderSerializer, OrderItemSerializer
from msosi_backend.permissions import IsRestaurantOwner

class OrderList(generics.ListCreateAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Customers see only their own orders.
        return Order.objects.filter(customer=self.request.user)

    def perform_create(self, serializer):
        serializer.save(customer=self.request.user)

class OrderDetail(generics.RetrieveUpdateAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # A bit tricky here: 
        # Customers see their own orders.
        # Owners see orders containing their restaurant items.
        if self.request.user.is_restaurant_owner:
            return Order.objects.filter(items__menu_item__restaurant__owner=self.request.user).distinct()
        else:
            return Order.objects.filter(customer=self.request.user)

class OwnerIncomingOrders(generics.ListAPIView):
    """
    Owner dashboard: new, confirmed and preparing orders.
    """
    serializer_class = OrderSerializer
    permission_classes = [IsRestaurantOwner]

    def get_queryset(self):
        # Incoming: pending, confirmed, preparing.
        # Once it is marked as 'ready', it's still incoming? 
        # Usually it stays on the board until it's 'delivered' or 'cancelled'.
        # Let's say all statuses except delivered and cancelled.
        return Order.objects.filter(
            items__menu_item__restaurant__owner=self.request.user,
            status__in=['pending', 'confirmed', 'preparing', 'ready']
        ).distinct().order_by('-created_at')

class OwnerAllOrders(generics.ListAPIView):
    """
    Owner dashboard: full history.
    """
    serializer_class = OrderSerializer
    permission_classes = [IsRestaurantOwner]

    def get_queryset(self):
        return Order.objects.filter(
            items__menu_item__restaurant__owner=self.request.user
        ).distinct().order_by('-created_at')

class UpdateOrderStatus(generics.UpdateAPIView):
    """
    Allow owner to update status of an order that has their items.
    """
    serializer_class = OrderSerializer
    permission_classes = [IsRestaurantOwner]
    
    def get_queryset(self):
        return Order.objects.filter(items__menu_item__restaurant__owner=self.request.user).distinct()

    def patch(self, request, *args, **kwargs):
        order = self.get_object()
        new_status = request.data.get('status')
        if new_status:
            order.status = new_status
            order.save()
            return Response(OrderSerializer(order).data)
        return Response({"error": "No status provided"}, status=status.HTTP_400_BAD_REQUEST)
