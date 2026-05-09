"""
Test script for Azam Payment API integration
Run with: python test_azam_api.py
"""

import os
import sys
import django
from decimal import Decimal

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'msosi_backend.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from payments.azam_service import AzamPaymentService
from django.conf import settings


def test_azam_api():
    """Test Azam Payment API"""
    
    print("=" * 60)
    print("AZAM PAYMENT API TEST")
    print("=" * 60)
    
    # Test 1: Check environment configuration
    print("\n1. Checking Azam Configuration...")
    azam_client_id = getattr(settings, 'AZAM_CLIENT_ID', None)
    azam_client_secret = getattr(settings, 'AZAM_CLIENT_SECRET', None)
    azam_api_key = getattr(settings, 'AZAM_API_KEY', None)
    azam_callback = getattr(settings, 'AZAM_CALLBACK_URL', None)
    
    print(f"   - AZAM_CLIENT_ID: {'✓ Set' if azam_client_id and azam_client_id != 'YOUR_AZAM_CLIENT_ID' else '✗ Not Set'}")
    print(f"   - AZAM_CLIENT_SECRET: {'✓ Set' if azam_client_secret and azam_client_secret != 'YOUR_AZAM_CLIENT_SECRET' else '✗ Not Set'}")
    print(f"   - AZAM_API_KEY: {'✓ Set' if azam_api_key and azam_api_key != 'YOUR_AZAM_API_KEY' else '✗ Not Set'}")
    print(f"   - AZAM_CALLBACK_URL: {azam_callback}")
    
    # Test 2: Payment Methods
    print("\n2. Testing Payment Methods...")
    for method_key, method_name in AzamPaymentService.PAYMENT_METHODS.items():
        print(f"   - {method_key.upper()}: {method_name} ✓")
    
    # Test 3: Phone Number Formatting
    print("\n3. Testing Phone Number Formatting...")
    test_phones = [
        '0654321098',
        '+255654321098',
        '255654321098',
        '654321098',
    ]
    for phone in test_phones:
        formatted = AzamPaymentService._format_phone_number(phone)
        print(f"   - {phone} → {formatted}")
    
    # Test 4: Initiate Payment (Mock Mode)
    print("\n4. Testing Payment Initiation (Mock Mode)...")
    print("   Initiating test payment...")
    
    success, response = AzamPaymentService.initiate_payment(
        phone_number='0654321098',
        amount=Decimal('50000.00'),
        order_id=123,
        payment_method='mpesa',
        customer_email='test@example.com',
        customer_name='John Doe'
    )
    
    if success:
        print(f"   ✓ Payment initiated successfully!")
        print(f"     - Status: {response.get('status')}")
        print(f"     - Transaction ID: {response.get('transaction_id')}")
        print(f"     - Reference ID: {response.get('reference_id')}")
        print(f"     - Message: {response.get('message')}")
    else:
        print(f"   ✗ Payment initiation failed!")
        print(f"     - Error: {response.get('error')}")
    
    # Test 5: URL Endpoints
    print("\n5. Testing API Endpoints...")
    print(f"   - Base URL: {AzamPaymentService._get_base_url()}")
    print(f"   - Debug Mode: {settings.DEBUG}")
    
    # Test 6: Test with real credentials (if available)
    print("\n6. Test Result Summary...")
    if (azam_client_id and azam_client_id != 'YOUR_AZAM_CLIENT_ID' and 
        azam_client_secret and azam_client_secret != 'YOUR_AZAM_CLIENT_SECRET'):
        print("   ⚠️  Real credentials detected - API test available")
        print("   To test with real API:")
        print("   1. Ensure network connectivity to Azam API")
        print("   2. Check your Azam account status")
        print("   3. Verify API credentials are correct")
    else:
        print("   ℹ️  Running in Mock Mode (placeholder credentials)")
        print("   To enable real API calls:")
        print("   1. Update .env with real Azam credentials")
        print("   2. Reload Django settings")
        print("   3. Re-run this test")
    
    print("\n" + "=" * 60)
    print("TEST COMPLETED")
    print("=" * 60)


if __name__ == '__main__':
    test_azam_api()
