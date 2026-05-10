"""
Payment Transaction Validator
Enhanced validation for payment processing
"""

from decimal import Decimal
from django.utils import timezone
from django.db.models import Q
from django.core.exceptions import ValidationError
from datetime import timedelta
from typing import Tuple, Dict, Optional
import logging

from .models import Payment
from orders.models import Order

logger = logging.getLogger(__name__)


class PaymentValidator:
    """Comprehensive payment validation service"""
    
    # Configuration constants
    MIN_PAYMENT_AMOUNT = Decimal('1000.00')  # Minimum 1,000 TZS
    MAX_PAYMENT_AMOUNT = Decimal('5000000.00')  # Maximum 5,000,000 TZS
    PAYMENT_TIMEOUT_MINUTES = 30  # Payment expires after 30 minutes
    MAX_FAILED_ATTEMPTS = 3  # Max failed attempts before blocking
    RATE_LIMIT_MINUTES = 5  # Rate limit window in minutes
    
    @classmethod
    def validate_payment_creation(
        cls,
        customer,
        order: Order,
        payment_method: str
    ) -> Tuple[bool, Optional[str]]:
        """
        Validate all conditions before creating a payment
        
        Args:
            customer: User creating the payment
            order: Order being paid for
            payment_method: Selected payment method
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        
        # 1. Validate order exists and belongs to customer
        if order.customer != customer:
            logger.warning(f"Unauthorized payment attempt by {customer.id} for order {order.id}")
            return False, "You don't have permission to pay for this order"
        
        # 2. Validate order status
        if order.status not in ['pending', 'processing']:
            return False, f"Order status '{order.status}' cannot be paid. Must be pending or processing."
        
        # 3. Validate order total amount
        if not cls._validate_amount(order.total_price):
            return False, f"Order amount TZS {order.total_price} is outside allowed range (TZS {cls.MIN_PAYMENT_AMOUNT} - TZS {cls.MAX_PAYMENT_AMOUNT})"
        
        # 4. Validate payment method
        valid_methods = [method[0] for method in Payment.PAYMENT_METHOD_CHOICES]
        if payment_method not in valid_methods:
            return False, f"Invalid payment method '{payment_method}'. Choose from: {', '.join(valid_methods)}"
        
        # 5. Check for duplicate pending payment
        existing_payment = Payment.objects.filter(
            order=order,
            status__in=['processing', 'pending']
        ).first()
        
        if existing_payment:
            # Check if it's still within timeout
            age_minutes = (timezone.now() - existing_payment.created_at).total_seconds() / 60
            if age_minutes < cls.PAYMENT_TIMEOUT_MINUTES:
                return False, f"Payment for this order is already in progress. Please wait or cancel it first."
            else:
                # Old payment has timed out, allow new attempt
                logger.info(f"Payment {existing_payment.id} timed out, allowing new attempt")
        
        # 6. Check customer payment rate limiting
        is_rate_limited, message = cls._check_rate_limit(customer)
        if is_rate_limited:
            return False, message
        
        # 7. Check for too many recent failed attempts
        failed_count = Payment.objects.filter(
            customer=customer,
            status='failed',
            updated_at__gte=timezone.now() - timedelta(minutes=60)
        ).count()
        
        if failed_count >= cls.MAX_FAILED_ATTEMPTS:
            logger.warning(f"Customer {customer.id} has {failed_count} failed payments in last hour")
            return False, "Too many failed payment attempts. Please try again later."
        
        # 8. Verify customer has valid payment information (phone_number)
        if not customer.phone_number:
            return False, "Your profile doesn't have a phone number. Please update your profile first."
        
        return True, None
    
    @classmethod
    def validate_payment_verification(
        cls,
        payment: Payment
    ) -> Tuple[bool, Optional[str]]:
        """Validate payment before verification"""
        
        if not payment.transaction_id:
            return False, "Payment has no transaction ID"
        
        if payment.status not in ['pending', 'processing']:
            return False, f"Cannot verify payment with status '{payment.status}'"
        
        return True, None
    
    @classmethod
    def validate_payment_refund(
        cls,
        payment: Payment,
        refund_amount: Optional[Decimal] = None
    ) -> Tuple[bool, Optional[str]]:
        """Validate payment before refunding"""
        
        # Check payment status
        if payment.status == 'refunded':
            return False, "Payment has already been refunded"
        
        if payment.status != 'completed':
            return False, f"Only completed payments can be refunded. Current status: {payment.status}"
        
        if not payment.transaction_id:
            return False, "No transaction ID found for refund"
        
        # Validate refund amount if provided
        if refund_amount:
            if refund_amount <= 0:
                return False, "Refund amount must be greater than 0"
            
            if refund_amount > payment.amount:
                return False, f"Refund amount (TZS {refund_amount}) exceeds payment amount (TZS {payment.amount})"
        
        return True, None
    
    @classmethod
    def validate_webhook_payload(cls, payload: Dict) -> Tuple[bool, Optional[str]]:
        """Validate webhook payload from payment provider"""
        
        required_fields = ['transaction_id', 'order_id', 'status', 'amount']
        for field in required_fields:
            if field not in payload or payload[field] is None:
                return False, f"Missing required field: {field}"
        
        # Validate status
        valid_statuses = ['completed', 'failed', 'pending']
        if payload['status'] not in valid_statuses:
            return False, f"Invalid status: {payload['status']}"
        
        # Validate amount is positive
        try:
            amount = Decimal(str(payload['amount']))
            if amount <= 0:
                return False, "Amount must be positive"
        except (ValueError, TypeError):
            return False, "Amount must be a valid number"
        
        return True, None
    
    @staticmethod
    def _validate_amount(amount: Decimal) -> bool:
        """Check if amount is within allowed range"""
        return (
            PaymentValidator.MIN_PAYMENT_AMOUNT <= amount <= PaymentValidator.MAX_PAYMENT_AMOUNT
        )
    
    @classmethod
    def _check_rate_limit(cls, customer) -> Tuple[bool, Optional[str]]:
        """Check if customer has exceeded rate limit"""
        
        recent_payments = Payment.objects.filter(
            customer=customer,
            created_at__gte=timezone.now() - timedelta(minutes=cls.RATE_LIMIT_MINUTES)
        ).count()
        
        if recent_payments >= 3:  # Max 3 payment attempts per 5 minutes
            return True, f"Too many payment attempts. Please wait {cls.RATE_LIMIT_MINUTES} minutes."
        
        return False, None
    
    @classmethod
    def get_validation_status(cls, customer) -> Dict:
        """Get validation status for a customer"""
        
        failed_count = Payment.objects.filter(
            customer=customer,
            status='failed',
            updated_at__gte=timezone.now() - timedelta(minutes=60)
        ).count()
        
        recent_attempts = Payment.objects.filter(
            customer=customer,
            created_at__gte=timezone.now() - timedelta(minutes=cls.RATE_LIMIT_MINUTES)
        ).count()
        
        return {
            'can_pay': failed_count < cls.MAX_FAILED_ATTEMPTS,
            'failed_attempts_1h': failed_count,
            'recent_attempts_5m': recent_attempts,
            'max_failed_attempts': cls.MAX_FAILED_ATTEMPTS,
            'rate_limit_window_minutes': cls.RATE_LIMIT_MINUTES,
        }
