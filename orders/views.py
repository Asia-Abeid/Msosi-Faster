from rest_framework import generics, status, permissions
from rest_framework.response import Response
from .models import Order
from .serializers import OrderSerializer
from .services import auto_deliver_stale_orders
from msosi_backend.permissions import IsRestaurantOwner

class OrderList(generics.ListCreateAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        auto_deliver_stale_orders()
        # Customers see only their own orders.
        return Order.objects.filter(customer=self.request.user)

    def perform_create(self, serializer):
        serializer.save(customer=self.request.user)

class OrderDetail(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        auto_deliver_stale_orders()
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
        auto_deliver_stale_orders()
        # Incoming: pending, confirmed, preparing.
        # Once it is marked as 'ready', it's still incoming? 
        # Usually it stays on the board until it's 'delivered' or 'cancelled'.
        # Let's say all statuses except delivered and cancelled.
        return Order.objects.filter(
            items__menu_item__restaurant__owner=self.request.user,
            status__in=['pending', 'confirmed', 'preparing', 'ready', 'on_the_way']
        ).distinct().order_by('-created_at')

class OwnerAllOrders(generics.ListAPIView):
    """
    Owner dashboard: full history.
    """
    serializer_class = OrderSerializer
    permission_classes = [IsRestaurantOwner]

    def get_queryset(self):
        auto_deliver_stale_orders()
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
        auto_deliver_stale_orders()
        return Order.objects.filter(items__menu_item__restaurant__owner=self.request.user).distinct()

    def patch(self, request, *args, **kwargs):
        order = self.get_object()
        new_status = request.data.get('status')
        allowed_transitions = {
            'pending': {'confirmed', 'preparing', 'cancelled'},
            'confirmed': {'preparing', 'cancelled'},
            'preparing': {'ready', 'cancelled'},
            'ready': {'on_the_way', 'cancelled'},
            'on_the_way': set(),
            'delivered': set(),
            'cancelled': set(),
        }
        if new_status in allowed_transitions.get(order.status, set()):
            order.status = new_status
            order.save(update_fields=['status', 'updated_at'])
            return Response(OrderSerializer(order).data)
        if new_status:
            return Response({"error": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"error": "No status provided"}, status=status.HTTP_400_BAD_REQUEST)


class ConfirmOrderReceived(generics.GenericAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        auto_deliver_stale_orders()
        return Order.objects.filter(customer=self.request.user)

    def post(self, request, *args, **kwargs):
        order = self.get_object()
        if order.status != 'on_the_way':
            return Response(
                {"error": "Only orders on the way can be confirmed as received."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order.status = 'delivered'
        order.save(update_fields=['status', 'updated_at'])
        return Response(OrderSerializer(order).data)
