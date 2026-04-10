from django.urls import path
from .views import (
    PaymentListView, 
    PaymentCreateView, 
    PaymentDetailView,
    PaymentVerifyView,
    PaymentRefundView,
    selcom_payment_callback,
    EarningsView,
    WithdrawView
)

urlpatterns = [
    path('', PaymentListView.as_view(), name='payment-list'),
    path('<int:order_id>/pay/', PaymentCreateView.as_view(), name='payment-create'),
    path('<int:pk>/', PaymentDetailView.as_view(), name='payment-detail'),
    path('<int:pk>/verify/', PaymentVerifyView.as_view(), name='payment-verify'),
    path('<int:pk>/refund/', PaymentRefundView.as_view(), name='payment-refund'),
    # Webhook for Selcom callbacks (public, no auth required)
    path('webhook/selcom/', selcom_payment_callback, name='selcom-webhook'),
    path('earnings/', EarningsView.as_view(), name='earnings'),
    path('withdraw/', WithdrawView.as_view(), name='withdraw'),
]