"""
Selcom Payment Gateway Integration
Handles M-Pesa, Tigo Pesa, and Airtel Money payments
"""

import requests
import hashlib
import json
from decimal import Decimal
from django.conf import settings
from django.utils import timezone
from typing import Dict, Optional, Tuple


class SelcomPaymentService:
    """
    Service for integrating with Selcom payment gateway
    Supports M-Pesa, Tigo Pesa, and Airtel Money
    
    API Documentation: https://selcom.net/developers
    """
    
    # API Endpoints
    BASE_URL = "https://apigw.selcom.net/api/v1"
    SANDBOX_URL = "https://sandbox-apigw.selcom.net/api/v1"
    
    # Payment Methods
    PAYMENT_METHODS = {
        'mpesa': 'MPESA',
        'tigo_pesa': 'TIGOPESA',
        'airtel_money': 'AIRTEL',
    }
    
    @classmethod
    def _get_base_url(cls) -> str:
        """Get sandbox or production URL based on DEBUG setting"""
        return cls.SANDBOX_URL if settings.DEBUG else cls.BASE_URL
    
    @classmethod
    def _get_request_headers(cls) -> Dict[str, str]:
        """Prepare request headers with authentication"""
        return {
            'Authorization': f'Bearer {settings.SELCOM_API_KEY}',
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
    
    @classmethod
    def _generate_hash(cls, data: str) -> str:
        """Generate SHA256 hash for request validation"""
        hash_string = f"{data}{settings.SELCOM_API_SECRET}"
        return hashlib.sha256(hash_string.encode()).hexdigest()
    
    @classmethod
    def initiate_payment(
        cls,
        phone_number: str,
        amount: Decimal,
        order_id: int,
        payment_method: str,
        customer_email: str = None,
        customer_name: str = None,
    ) -> Tuple[bool, Dict]:
        """
        Initiate payment request to Selcom
        
        Args:
            phone_number: Customer's phone number (format: 255712345678)
            amount: Payment amount
            order_id: Your order ID
            payment_method: 'mpesa', 'tigo_pesa', or 'airtel_money'
            customer_email: Customer email (optional)
            customer_name: Customer name (optional)
        
        Returns:
            Tuple of (success: bool, response: dict)
        """
        
        if payment_method not in cls.PAYMENT_METHODS:
            return False, {'error': f'Invalid payment method: {payment_method}'}
        
        # Prepare request payload
        payload = {
            'merchant_id': settings.SELCOM_MERCHANT_ID,
            'phone': cls._format_phone_number(phone_number),
            'amount': float(amount),
            'order_id': str(order_id),
            'payment_method': cls.PAYMENT_METHODS[payment_method],
            'reference': f"ORDER-{order_id}",
            'description': f"Food order #{order_id}",
            'callback_url': settings.SELCOM_CALLBACK_URL,
        }
        
        if customer_email:
            payload['email'] = customer_email
        if customer_name:
            payload['first_name'] = customer_name.split()[0] if customer_name else ''
        
        try:
            response = requests.post(
                f"{cls._get_base_url()}/pay",
                json=payload,
                headers=cls._get_request_headers(),
                timeout=10
            )
            
            response.raise_for_status()
            data = response.json()
            
            success = data.get('status') == 'success' or response.status_code == 200
            return success, data
            
        except requests.exceptions.RequestException as e:
            return False, {
                'error': str(e),
                'message': 'Failed to connect to payment gateway'
            }
    
    @classmethod
    def verify_payment(cls, transaction_id: str) -> Tuple[bool, Dict]:
        """
        Verify payment status with Selcom
        
        Args:
            transaction_id: Selcom transaction ID
        
        Returns:
            Tuple of (success: bool, payment_data: dict)
        """
        
        try:
            response = requests.get(
                f"{cls._get_base_url()}/transaction/{transaction_id}",
                headers=cls._get_request_headers(),
                timeout=10
            )
            
            response.raise_for_status()
            data = response.json()
            
            return True, data
            
        except requests.exceptions.RequestException as e:
            return False, {'error': str(e)}
    
    @classmethod
    def refund_payment(
        cls,
        transaction_id: str,
        amount: Decimal = None,
        reason: str = None
    ) -> Tuple[bool, Dict]:
        """
        Refund a payment (full or partial)
        
        Args:
            transaction_id: Original Selcom transaction ID
            amount: Amount to refund (None = full refund)
            reason: Refund reason
        
        Returns:
            Tuple of (success: bool, response: dict)
        """
        
        payload = {
            'transaction_id': transaction_id,
        }
        
        if amount:
            payload['amount'] = float(amount)
        if reason:
            payload['reason'] = reason
        
        try:
            response = requests.post(
                f"{cls._get_base_url()}/refund",
                json=payload,
                headers=cls._get_request_headers(),
                timeout=10
            )
            
            response.raise_for_status()
            data = response.json()
            
            success = data.get('status') == 'success'
            return success, data
            
        except requests.exceptions.RequestException as e:
            return False, {'error': str(e)}
    
    @classmethod
    def validate_webhook(cls, payload: Dict, signature: str) -> bool:
        """
        Validate webhook signature from Selcom
        
        Args:
            payload: Webhook payload
            signature: Signature from Selcom header
        
        Returns:
            True if signature is valid
        """
        
        # Reconstruct the string that was signed
        signed_string = json.dumps(payload, sort_keys=True, separators=(',', ':'))
        expected_signature = cls._generate_hash(signed_string)
        
        return expected_signature == signature
    
    @staticmethod
    def _format_phone_number(phone: str) -> str:
        """
        Format phone number to 255712345678 format
        Handles various input formats
        """
        # Remove any spaces, dashes, or special characters
        phone = phone.replace(' ', '').replace('-', '').replace('+', '')
        
        # If starts with 0, replace with 255
        if phone.startswith('0'):
            phone = '255' + phone[1:]
        
        # If doesn't start with 255, prepend it
        if not phone.startswith('255'):
            phone = '255' + phone
        
        return phone


class PaymentStatusEnum:
    """Payment status constants"""
    PENDING = 'pending'
    PROCESSING = 'processing'
    COMPLETED = 'completed'
    FAILED = 'failed'
    REFUNDED = 'refunded'
    CANCELLED = 'cancelled'

    CHOICES = [
        (PENDING, 'Pending'),
        (PROCESSING, 'Processing'),
        (COMPLETED, 'Completed'),
        (FAILED, 'Failed'),
        (REFUNDED, 'Refunded'),
        (CANCELLED, 'Cancelled'),
    ]
