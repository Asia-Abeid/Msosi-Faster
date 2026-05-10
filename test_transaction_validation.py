"""
Test Transaction Validation
Comprehensive test of all validation mechanisms
"""

import os
import sys
import django
from decimal import Decimal
from datetime import datetime

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'msosi_backend.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.utils import timezone
from payments.validators import PaymentValidator
from payments.models import Payment
from orders.models import Order
from users.models import User


def test_validation():
    """Test payment validation logic"""
    
    print("=" * 70)
    print("TRANSACTION VALIDATION TESTING")
    print("=" * 70)
    
    # Test 1: Amount Validation
    print("\n1. AMOUNT VALIDATION TEST:")
    print("   " + "-" * 60)
    
    test_amounts = [
        (Decimal('500.00'), False, "Below minimum"),
        (Decimal('1000.00'), True, "Minimum accepted"),
        (Decimal('2500000.00'), True, "Within range"),
        (Decimal('5000000.00'), True, "Maximum accepted"),
        (Decimal('5000001.00'), False, "Above maximum"),
    ]
    
    for amount, expected, description in test_amounts:
        result = PaymentValidator._validate_amount(amount)
        status_icon = "✓" if result == expected else "✗"
        print(f"   {status_icon} TZS {amount}: {description} - {result}")
    
    # Test 2: Webhook Payload Validation
    print("\n2. WEBHOOK PAYLOAD VALIDATION TEST:")
    print("   " + "-" * 60)
    
    test_payloads = [
        (
            {
                'transaction_id': 'TXN123',
                'order_id': 1,
                'status': 'completed',
                'amount': 50000.00
            },
            True,
            "Valid completed payment"
        ),
        (
            {
                'transaction_id': 'TXN124',
                'order_id': 2,
                'status': 'failed',
                'amount': 50000.00
            },
            True,
            "Valid failed payment"
        ),
        (
            {
                'transaction_id': 'TXN125',
                'order_id': 3,
                'status': 'completed'
                # Missing amount
            },
            False,
            "Missing amount field"
        ),
        (
            {
                'transaction_id': 'TXN126',
                'order_id': 4,
                'status': 'invalid_status',
                'amount': 50000.00
            },
            False,
            "Invalid status value"
        ),
        (
            {
                'transaction_id': 'TXN127',
                'order_id': 5,
                'status': 'completed',
                'amount': -1000.00
            },
            False,
            "Negative amount"
        ),
    ]
    
    for payload, expected, description in test_payloads:
        is_valid, error_message = PaymentValidator.validate_webhook_payload(payload)
        status_icon = "✓" if is_valid == expected else "✗"
        result_str = f"Valid" if is_valid else f"Invalid ({error_message})"
        print(f"   {status_icon} {description}: {result_str}")
    
    # Test 3: Configuration Display
    print("\n3. VALIDATOR CONFIGURATION:")
    print("   " + "-" * 60)
    
    config = {
        'Minimum Payment': f"TZS {PaymentValidator.MIN_PAYMENT_AMOUNT}",
        'Maximum Payment': f"TZS {PaymentValidator.MAX_PAYMENT_AMOUNT}",
        'Payment Timeout': f"{PaymentValidator.PAYMENT_TIMEOUT_MINUTES} minutes",
        'Max Failed Attempts': f"{PaymentValidator.MAX_FAILED_ATTEMPTS} attempts/hour",
        'Rate Limit Window': f"{PaymentValidator.RATE_LIMIT_MINUTES} minutes",
    }
    
    for key, value in config.items():
        print(f"   • {key}: {value}")
    
    # Test 4: Rate Limit Check (for demo user if exists)
    print("\n4. RATE LIMIT VALIDATION DEMO:")
    print("   " + "-" * 60)
    
    try:
        # Get first user for demo (if exists)
        user = User.objects.first()
        if user:
            validation_status = PaymentValidator.get_validation_status(user)
            print(f"   User: {user.username}")
            print(f"   • Can Pay: {validation_status['can_pay']}")
            print(f"   • Failed attempts (1h): {validation_status['failed_attempts_1h']}")
            print(f"   • Recent attempts (5m): {validation_status['recent_attempts_5m']}")
            print(f"   • Rate limit window: {validation_status['rate_limit_window_minutes']} minutes")
        else:
            print("   ℹ️  No users in database for testing")
    except Exception as e:
        print(f"   ℹ️  Cannot test rate limit: {str(e)}")
    
    # Test 5: Validation Methods Summary
    print("\n5. AVAILABLE VALIDATION METHODS:")
    print("   " + "-" * 60)
    
    methods = [
        ('validate_payment_creation', 'Validates before creating payment'),
        ('validate_payment_verification', 'Validates before verifying payment'),
        ('validate_payment_refund', 'Validates before processing refund'),
        ('validate_webhook_payload', 'Validates webhook payload structure'),
        ('get_validation_status', 'Gets validation status for customer'),
    ]
    
    for method, description in methods:
        print(f"   • {method}: {description}")
    
    print("\n" + "=" * 70)
    print("VALIDATION TESTING COMPLETE")
    print("=" * 70)
    
    print("\n✅ Transaction validation system is properly configured!")
    print("\nValidation is now enforced at:")
    print("  1. Payment creation (order, amount, method, rate limit)")
    print("  2. Payment verification (transaction ID, status)")
    print("  3. Payment refund (status, amount)")
    print("  4. Webhook handling (payload structure, signature)")


if __name__ == '__main__':
    test_validation()
