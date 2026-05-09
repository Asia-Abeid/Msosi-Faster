from django.urls import path
from .views import OrderList, OrderDetail, OwnerIncomingOrders, OwnerAllOrders, UpdateOrderStatus, ConfirmOrderReceived

urlpatterns = [
    path('', OrderList.as_view(), name='order-list'),
    path('<int:pk>/', OrderDetail.as_view(), name='order-detail'),
    path('<int:pk>/confirm-received/', ConfirmOrderReceived.as_view(), name='order-confirm-received'),
    path('restaurant/incoming/', OwnerIncomingOrders.as_view(), name='owner-incoming-orders'),
    path('restaurant/all/', OwnerAllOrders.as_view(), name='owner-all-orders'),
    path('<int:pk>/status/', UpdateOrderStatus.as_view(), name='owner-update-status'),
]
