from rest_framework import generics, permissions, status, exceptions
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from django.db import transaction
import json
import logging

from .models import Payment
from .serializers import PaymentCreateSerializer, PaymentSerializer
from .selcom_service import SelcomPaymentService
from orders.models import Order
from orders.services import auto_deliver_stale_orders

logger = logging.getLogger(__name__)


class PaymentCreateView(generics.CreateAPIView):
    """
    Initialize a payment via Selcom
    POST /api/payments/<order_id>/pay/
    
    Request body:
    {
        "payment_method": "mpesa"  # or "tigo_pesa", "airtel_money"
    }
    """
    serializer_class = PaymentCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        try:
            order = Order.objects.get(
                id=self.kwargs['order_id'],
                customer=self.request.user
            )
        except Order.DoesNotExist:
            raise exceptions.NotFound('Order not found')
        
        payment_method = self.request.data.get('payment_method', 'mpesa')
        
        # Create payment record
        payment = serializer.save(
            customer=self.request.user,
            order=order,
            amount=order.total_price,
            payment_method=payment_method,
            status='processing'
        )
        
        # Initiate payment with Selcom
        self._initiate_selcom_payment(payment)
    
    def _initiate_selcom_payment(self, payment: Payment):
        """Send payment request to Selcom"""
        
        success, response = SelcomPaymentService.initiate_payment(
            phone_number=payment.customer.phone_number,
            amount=payment.amount,
            order_id=payment.order.id,
            payment_method=payment.payment_method,
            customer_email=payment.customer.email,
            customer_name=payment.customer.first_name or payment.customer.username,
        )
        
        if success:
            # Payment initiated successfully
            is_mock_payment = str(response.get('transaction_id', '')).startswith('MOCK-TXN-')
            payment.status = 'completed' if is_mock_payment else 'pending'
            payment.transaction_id = response.get('transaction_id')
            payment.selcom_reference = response.get('reference_id')
            payment.save()
            if is_mock_payment:
                payment.order.status = 'confirmed'
                payment.order.save(update_fields=['status', 'updated_at'])
            logger.info(f"Payment {payment.id} initiated with Selcom")
        else:
            # Payment failed
            payment.status = 'failed'
            payment.error_message = response.get('error', 'Failed to initiate payment')
            payment.save()
            logger.error(f"Payment {payment.id} failed: {response}")
            
            raise exceptions.ValidationError(
                f"Payment initiation failed: {response.get('error', 'Unknown error')}"
            )


class PaymentDetailView(generics.RetrieveAPIView):
    """Get payment details"""
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Payment.objects.filter(customer=self.request.user)


class PaymentListView(generics.ListAPIView):
    """List all user payments"""
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Payment.objects.filter(
            customer=self.request.user
        ).order_by('-created_at')


class PaymentVerifyView(generics.GenericAPIView):
    """
    Manually verify payment status with Selcom
    POST /api/payments/<id>/verify/
    """
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Payment.objects.filter(customer=self.request.user)
    
    def post(self, request, *args, **kwargs):
        payment = self.get_object()
        
        if not payment.transaction_id:
            return Response(
                {'error': 'No transaction ID found'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify with Selcom
        success, response = SelcomPaymentService.verify_payment(payment.transaction_id)
        
        if success:
            # Update payment status
            if response.get('status') == 'completed':
                payment.status = 'completed'
                payment.order.status = 'confirmed'
                payment.order.save()
            elif response.get('status') == 'failed':
                payment.status = 'failed'
                payment.error_message = response.get('error_message')
            
            payment.save()
            
            return Response(
                PaymentSerializer(payment).data,
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {'error': response.get('error', 'Verification failed')},
                status=status.HTTP_400_BAD_REQUEST
            )


class PaymentRefundView(generics.GenericAPIView):
    """
    Refund a payment
    POST /api/payments/<id>/refund/
    
    Request body:
    {
        "amount": 75000.00,  // optional, if not provided refunds full amount
        "reason": "Customer request"  // optional
    }
    """
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Payment.objects.filter(customer=self.request.user)
    
    def post(self, request, *args, **kwargs):
        payment = self.get_object()
        
        if payment.status == 'refunded':
            return Response(
                {'error': 'Payment already refunded'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if payment.status != 'completed':
            return Response(
                {'error': 'Only completed payments can be refunded'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not payment.transaction_id:
            return Response(
                {'error': 'No transaction ID found'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        amount = request.data.get('amount')
        reason = request.data.get('reason', 'Refund requested')
        
        # Request refund from Selcom
        success, response = SelcomPaymentService.refund_payment(
            transaction_id=payment.transaction_id,
            amount=amount,
            reason=reason
        )
        
        if success:
            payment.status = 'refunded'
            payment.save()
            
            return Response(
                PaymentSerializer(payment).data,
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {'error': response.get('error', 'Refund failed')},
                status=status.HTTP_400_BAD_REQUEST
            )


# ============= WEBHOOK ENDPOINTS =============

@csrf_exempt
@require_http_methods(["POST"])
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def selcom_payment_callback(request):
    """
    Webhook endpoint to receive payment status updates from Selcom
    Configure this URL in Selcom dashboard
    
    Expected headers:
    - X-SELCOM-SIGNATURE: HMAC signature
    
    Request body:
    {
        "transaction_id": "STN123456789",
        "order_id": 101,
        "status": "completed",
        "amount": 75000.00,
        "error_message": null
    }
    """
    
    try:
        # Parse request
        if isinstance(request.data, str):
            payload = json.loads(request.data)
        else:
            payload = request.data
        
        # Verify signature
        signature = request.headers.get('X-SELCOM-SIGNATURE', '')
        if not SelcomPaymentService.validate_webhook(payload, signature):
            logger.warning(f"Invalid webhook signature: {signature}")
            return Response(
                {'error': 'Invalid signature'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Get payment
        try:
            payment = Payment.objects.get(
                selcom_reference=payload.get('order_id'),
                transaction_id=payload.get('transaction_id')
            )
        except Payment.DoesNotExist:
            logger.error(f"Payment not found for transaction {payload.get('transaction_id')}")
            return Response(
                {'error': 'Payment not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Update payment based on Selcom status
        with transaction.atomic():
            if payload.get('status') == 'completed':
                payment.status = 'completed'
                payment.order.status = 'confirmed'
                payment.order.updated_at = timezone.now()
                payment.order.save()
                logger.info(f"Payment {payment.id} completed via webhook")
                
            elif payload.get('status') == 'failed':
                payment.status = 'failed'
                payment.error_message = payload.get('error_message')
                logger.warning(f"Payment {payment.id} failed: {payload.get('error_message')}")
            
            payment.updated_at = timezone.now()
            payment.save()
        
        return Response(
            {'status': 'received', 'payment_id': payment.id},
            status=status.HTTP_200_OK
        )
    
    except json.JSONDecodeError:
        logger.error("Invalid JSON in webhook request")
        return Response(
            {'error': 'Invalid JSON'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Unexpected error in webhook: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

from msosi_backend.permissions import IsRestaurantOwner
from .serializers import EarningsSummarySerializer
from django.db.models import Sum

class EarningsView(generics.GenericAPIView):
    serializer_class = EarningsSummarySerializer
    permission_classes = [IsRestaurantOwner]

    def get(self, request, *args, **kwargs):
        auto_deliver_stale_orders()
        user = request.user
        now = timezone.now()
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        start_of_week = start_of_day - timezone.timedelta(days=now.weekday())
        start_of_month = start_of_day.replace(day=1)

        owner_orders = Order.objects.filter(
            items__menu_item__restaurant__owner=user
        ).distinct()
        delivered_orders = owner_orders.filter(status='delivered')
        pending_orders = owner_orders.filter(
            status__in=['confirmed', 'preparing', 'ready', 'on_the_way']
        )

        def get_payment_total(orders):
            return Payment.objects.filter(
                order__in=orders,
                status='completed',
            ).aggregate(total=Sum('amount'))['total'] or 0

        def get_completed_payment_total(orders, start_date=None):
            payments = Payment.objects.filter(
                order__in=orders,
                status='completed',
            )
            if start_date:
                payments = payments.filter(updated_at__gte=start_date)
            return payments.aggregate(total=Sum('amount'))['total'] or 0

        earnings_data = {
            'total_earned_today': get_completed_payment_total(delivered_orders, start_of_day),
            'total_earned_this_week': get_completed_payment_total(delivered_orders, start_of_week),
            'total_earned_this_month': get_completed_payment_total(delivered_orders, start_of_month),
            'available_balance': get_payment_total(delivered_orders),
            'pending_earnings': get_payment_total(pending_orders),
            'in_transit_count': pending_orders.filter(status='on_the_way').count(),
            'order_count': delivered_orders.count(),
            'recent_payouts': Payment.objects.filter(
                order__in=delivered_orders,
                status='completed'
            ).distinct().order_by('-created_at')[:10]
        }
        
        return Response(EarningsSummarySerializer(earnings_data).data)

class WithdrawView(generics.GenericAPIView):
    permission_classes = [IsRestaurantOwner]

    def post(self, request, *args, **kwargs):
        # Mock withdrawal request
        return Response({
            "status": "success",
            "message": "Withdrawal request submitted successfully. You will receive funds on your M-Pesa shortly.",
            "amount": request.data.get('amount', 0)
        })
