"""
Azam Payment Gateway Integration
Handles M-Pesa, Tigo Pesa, and Airtel Money payments
"""

import requests
import json
from decimal import Decimal
from django.conf import settings
from django.utils import timezone
from typing import Dict, Optional, Tuple


class AzamPaymentService:
    """
    Service for integrating with Azam payment gateway
    Supports M-Pesa, Tigo Pesa, and Airtel Money
    
    API Documentation: https://azampay.co.tz
    """
    
    # API Endpoints
    BASE_URL = "https://api.azampay.co.tz"
    SANDBOX_URL = "https://sandbox.azampay.co.tz"
    
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
    def _get_auth_token(cls) -> Optional[str]:
        """Get authentication token from Azam API"""
        try:
            url = f"{cls._get_base_url()}/api/v1/auth/login"
            payload = {
                'appName': getattr(settings, 'AZAM_CLIENT_ID', ''),
                'clientId': getattr(settings, 'AZAM_CLIENT_ID', ''),
                'clientSecret': getattr(settings, 'AZAM_CLIENT_SECRET', ''),
            }
            
            response = requests.post(url, json=payload, timeout=10)
            if response.status_code == 200:
                data = response.json()
                return data.get('data', {}).get('accessToken')
            else:
                print(f"Auth failed: {response.text}")
                return None
        except Exception as e:
            print(f"Error getting auth token: {str(e)}")
            return None
    
    @classmethod
    def _get_request_headers(cls, token: str = None) -> Dict[str, str]:
        """Prepare request headers with authentication"""
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
        if token:
            headers['Authorization'] = f'Bearer {token}'
        return headers
    
    @classmethod
    def _format_phone_number(cls, phone: str) -> str:
        """Format phone number to international format (+255...)"""
        if not phone:
            return '255000000000'
        phone = phone.strip().replace('+', '').replace(' ', '')
        if phone.startswith('0'):
            phone = '255' + phone[1:]
        elif not phone.startswith('255'):
            phone = '255' + phone
        return phone
    
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
        Initiate payment request to Azam
        """
        
        if payment_method not in cls.PAYMENT_METHODS:
            return False, {'error': f'Invalid payment method: {payment_method}'}
        
        # MOCK MODE: If no API key and in DEBUG mode, return success
        if (not getattr(settings, 'AZAM_CLIENT_ID', None) or not getattr(settings, 'AZAM_CLIENT_SECRET', None)) and settings.DEBUG:
            return True, {
                'status': 'success',
                'transaction_id': f'MOCK-AZAM-{timezone.now().timestamp()}',
                'reference_id': f'MOCK-REF-{order_id}',
                'message': 'Simulation Mode: Payment initiated successfully (No API credentials found)'
            }
        
        try:
            # Get authentication token
            token = cls._get_auth_token()
            if not token:
                return False, {'error': 'Failed to get authentication token from Azam'}
            
            # Prepare request payload
            url = f"{cls._get_base_url()}/api/v1/checkout/post/pay-msisdn"
            
            payload = {
                'amount': float(amount),
                'currencyCode': 'TZS',
                'externalId': f"ORDER-{order_id}",
                'phone': cls._format_phone_number(phone_number),
                'provider': cls.PAYMENT_METHODS[payment_method],
                'redirectSuccessUrl': f"{settings.AZAM_CALLBACK_URL}?status=success&order_id={order_id}",
                'redirectFailUrl': f"{settings.AZAM_CALLBACK_URL}?status=failed&order_id={order_id}",
            }
            
            headers = cls._get_request_headers(token)
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            
            if response.status_code in [200, 201]:
                data = response.json()
                return True, {
                    'status': 'success',
                    'transaction_id': data.get('data', {}).get('transactionId', f'AZAM-{order_id}'),
                    'reference_id': data.get('data', {}).get('externalId', f'ORDER-{order_id}'),
                    'link': data.get('data', {}).get('link', ''),
                    'message': 'Payment initiated successfully'
                }
            else:
                return False, {
                    'error': f'Payment initiation failed: {response.text}',
                    'status_code': response.status_code
                }
                
        except requests.exceptions.Timeout:
            return False, {'error': 'Request to Azam API timed out'}
        except requests.exceptions.RequestException as e:
            return False, {'error': f'Request failed: {str(e)}'}
        except Exception as e:
            return False, {'error': f'Unexpected error: {str(e)}'}
    
    @classmethod
    def check_payment_status(cls, transaction_id: str) -> Tuple[bool, Dict]:
        """
        Check the status of a payment
        """
        try:
            token = cls._get_auth_token()
            if not token:
                return False, {'error': 'Failed to get authentication token'}
            
            url = f"{cls._get_base_url()}/api/v1/checkout/query/{transaction_id}"
            headers = cls._get_request_headers(token)
            
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                return True, data.get('data', {})
            else:
                return False, {'error': 'Failed to check payment status', 'status_code': response.status_code}
                
        except Exception as e:
            return False, {'error': f'Error checking payment status: {str(e)}'}
    
    @classmethod
    def refund_payment(cls, transaction_id: str, amount: Decimal) -> Tuple[bool, Dict]:
        """
        Refund a payment
        """
        try:
            token = cls._get_auth_token()
            if not token:
                return False, {'error': 'Failed to get authentication token'}
            
            url = f"{cls._get_base_url()}/api/v1/checkout/refund"
            
            payload = {
                'transactionId': transaction_id,
                'amount': float(amount),
            }
            
            headers = cls._get_request_headers(token)
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            
            if response.status_code in [200, 201]:
                data = response.json()
                return True, data.get('data', {})
            else:
                return False, {'error': 'Failed to refund payment', 'status_code': response.status_code}
                
        except Exception as e:
            return False, {'error': f'Error refunding payment: {str(e)}'}
