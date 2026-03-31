# Payment Testing Guide

Complete guide for testing payment endpoints locally, with sandbox, and in production.

## Environment Setup for Testing

First, install test dependencies:

```bash
pip install pytest pytest-django pytest-mock requests-mock coverage
```

Update `requirements.txt`:

```
pytest==7.4.3
pytest-django==4.7.0
pytest-mock==3.12.0
requests-mock==1.11.0
coverage==7.3.2
```

## Local Testing

### Setup Test Database

```bash
# Create test configuration
python manage.py test --help

# Run tests
python manage.py test payments.tests
```

### Test Configuration

Create `payments/tests.py`:

```python
from django.test import TestCase
from django.contrib.auth import get_user_model
from orders.models import Order
from payments.models import Payment
from payments.selcom_service import SelcomPaymentService
from decimal import Decimal
from unittest.mock import patch, MagicMock
import json

User = get_user_model()

class PaymentModelTests(TestCase):
    """Test Payment model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            phone_number='255712345678'
        )
        
        self.restaurant = User.objects.create_user(
            email='rest@example.com',
            password='restpass123',
            phone_number='255712345679',
            is_restaurant_owner=True
        )
        
        self.order = Order.objects.create(
            customer=self.user,
            restaurant=self.restaurant,
            total_price=Decimal('75000.00'),
            status='pending'
        )
    
    def test_payment_creation(self):
        """Test creating a payment record"""
        payment = Payment.objects.create(
            order=self.order,
            customer=self.user,
            amount=Decimal('75000.00'),
            payment_method='mpesa',
            status='pending'
        )
        
        self.assertEqual(payment.amount, Decimal('75000.00'))
        self.assertEqual(payment.status, 'pending')
        self.assertTrue(payment.is_pending)
        self.assertFalse(payment.is_completed)
    
    def test_payment_status_transitions(self):
        """Test valid status transitions"""
        payment = Payment.objects.create(
            order=self.order,
            customer=self.user,
            amount=Decimal('75000.00'),
            status='processing'
        )
        
        # Mark as completed
        payment.status = 'completed'
        payment.save()
        
        self.assertTrue(payment.is_completed)
        self.assertFalse(payment.is_failed)
    
    def test_payment_with_error_message(self):
        """Test payment with error tracking"""
        payment = Payment.objects.create(
            order=self.order,
            customer=self.user,
            amount=Decimal('75000.00'),
            status='failed',
            error_message='Insufficient funds'
        )
        
        self.assertTrue(payment.is_failed)
        self.assertEqual(payment.error_message, 'Insufficient funds')


class SelcomServiceTests(TestCase):
    """Test Selcom payment service"""
    
    @patch('payments.selcom_service.requests.post')
    def test_initiate_payment_success(self, mock_post):
        """Test successful payment initiation"""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            'status': 'success',
            'transaction_id': 'STN123456789',
            'reference_id': 'REF-101'
        }
        mock_post.return_value = mock_response
        
        success, data = SelcomPaymentService.initiate_payment(
            phone_number='255712345678',
            amount=Decimal('75000.00'),
            order_id=101,
            payment_method='mpesa'
        )
        
        self.assertTrue(success)
        self.assertEqual(data['transaction_id'], 'STN123456789')
        mock_post.assert_called_once()
    
    @patch('payments.selcom_service.requests.post')
    def test_initiate_payment_failure(self, mock_post):
        """Test failed payment initiation"""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            'status': 'error',
            'error_message': 'Invalid phone number'
        }
        mock_post.return_value = mock_response
        
        success, data = SelcomPaymentService.initiate_payment(
            phone_number='invalid',
            amount=Decimal('75000.00'),
            order_id=101,
            payment_method='mpesa'
        )
        
        self.assertFalse(success)
    
    @patch('payments.selcom_service.requests.post')
    def test_verify_payment(self, mock_post):
        """Test payment verification"""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            'status': 'completed',
            'transaction_id': 'STN123456789'
        }
        mock_post.return_value = mock_response
        
        success, data = SelcomPaymentService.verify_payment(
            transaction_id='STN123456789'
        )
        
        self.assertTrue(success)
        self.assertEqual(data['status'], 'completed')
    
    def test_phone_number_formatting(self):
        """Test phone number format conversion"""
        test_cases = [
            ('255712345678', '255712345678'),
            ('+255712345678', '255712345678'),
            ('0712345678', '255712345678'),
            ('712345678', '255712345678'),
        ]
        
        for input_phone, expected in test_cases:
            result = SelcomPaymentService._format_phone_number(input_phone)
            self.assertEqual(result, expected)
    
    def test_webhook_signature_validation(self):
        """Test webhook signature validation"""
        payload = {
            'transaction_id': 'STN123456789',
            'order_id': '101',
            'status': 'completed',
            'amount': '75000.00'
        }
        
        # Generate valid signature
        import hmac
        import hashlib
        from django.conf import settings
        
        message = json.dumps(payload, sort_keys=True)
        signature = hmac.new(
            settings.SELCOM_API_SECRET.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        
        is_valid = SelcomPaymentService.validate_webhook(payload, signature)
        self.assertTrue(is_valid)
    
    def test_webhook_invalid_signature(self):
        """Test invalid webhook signature rejection"""
        payload = {'transaction_id': 'STN123456789'}
        invalid_signature = 'invalid_signature_hash'
        
        is_valid = SelcomPaymentService.validate_webhook(payload, invalid_signature)
        self.assertFalse(is_valid)


class PaymentAPITests(TestCase):
    """Test Payment API endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            phone_number='255712345678',
            is_customer=True
        )
        
        self.restaurant = User.objects.create_user(
            email='rest@example.com',
            password='restpass123',
            is_restaurant_owner=True
        )
        
        self.order = Order.objects.create(
            customer=self.user,
            restaurant=self.restaurant,
            total_price=Decimal('75000.00'),
            status='pending'
        )
        
        self.client.force_authenticate(user=self.user)
    
    @patch('payments.selcom_service.SelcomPaymentService.initiate_payment')
    def test_payment_create_endpoint(self, mock_selcom):
        """Test POST /api/payments/<order_id>/pay/"""
        mock_selcom.return_value = (True, {
            'transaction_id': 'STN123456789',
            'status': 'pending'
        })
        
        response = self.client.post(
            f'/api/payments/{self.order.id}/pay/',
            {
                'payment_method': 'mpesa'
            },
            format='json'
        )
        
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['status'], 'processing')
        self.assertEqual(response.data['payment_method'], 'mpesa')
    
    def test_payment_list_endpoint(self):
        """Test GET /api/payments/"""
        Payment.objects.create(
            order=self.order,
            customer=self.user,
            amount=Decimal('75000.00'),
            status='completed'
        )
        
        response = self.client.get('/api/payments/')
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_payment_detail_endpoint(self):
        """Test GET /api/payments/<id>/"""
        payment = Payment.objects.create(
            order=self.order,
            customer=self.user,
            amount=Decimal('75000.00'),
            status='completed'
        )
        
        response = self.client.get(f'/api/payments/{payment.id}/')
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['id'], payment.id)
    
    @patch('payments.selcom_service.SelcomPaymentService.verify_payment')
    def test_payment_verify_endpoint(self, mock_verify):
        """Test POST /api/payments/<id>/verify/"""
        payment = Payment.objects.create(
            order=self.order,
            customer=self.user,
            amount=Decimal('75000.00'),
            status='processing',
            transaction_id='STN123456789'
        )
        
        mock_verify.return_value = (True, {'status': 'completed'})
        
        response = self.client.post(f'/api/payments/{payment.id}/verify/')
        
        self.assertEqual(response.status_code, 200)
    
    @patch('payments.selcom_service.SelcomPaymentService.refund_payment')
    def test_payment_refund_endpoint(self, mock_refund):
        """Test POST /api/payments/<id>/refund/"""
        payment = Payment.objects.create(
            order=self.order,
            customer=self.user,
            amount=Decimal('75000.00'),
            status='completed',
            transaction_id='STN123456789'
        )
        
        mock_refund.return_value = (True, {'status': 'refunded'})
        
        response = self.client.post(
            f'/api/payments/{payment.id}/refund/',
            {
                'reason': 'Customer request',
                'amount': '75000.00'
            },
            format='json'
        )
        
        self.assertEqual(response.status_code, 200)
    
    def test_payment_unauthorized_access(self):
        """Test unauthorized access to payment endpoints"""
        self.client.force_authenticate(user=None)
        
        response = self.client.get('/api/payments/')
        
        self.assertEqual(response.status_code, 401)


class WebhookTests(TestCase):
    """Test webhook endpoint"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        
        self.restaurant = User.objects.create_user(
            email='rest@example.com',
            is_restaurant_owner=True
        )
        
        self.order = Order.objects.create(
            customer=self.user,
            restaurant=self.restaurant,
            total_price=Decimal('75000.00')
        )
        
        self.payment = Payment.objects.create(
            order=self.order,
            customer=self.user,
            amount=Decimal('75000.00'),
            status='processing',
            transaction_id='STN123456789'
        )
    
    @patch('payments.selcom_service.SelcomPaymentService.validate_webhook')
    def test_webhook_payment_completed(self, mock_validate):
        """Test webhook handling for completed payment"""
        mock_validate.return_value = True
        
        payload = {
            'transaction_id': 'STN123456789',
            'order_id': str(self.order.id),
            'status': 'completed',
            'amount': '75000.00'
        }
        
        response = self.client.post(
            '/api/payments/webhook/selcom/',
            json.dumps(payload),
            content_type='application/json',
            HTTP_X_SELCOM_SIGNATURE='valid_signature'
        )
        
        self.assertEqual(response.status_code, 200)
        
        # Verify payment updated
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, 'completed')
        
        # Verify order updated
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'confirmed')
    
    def test_webhook_invalid_signature(self):
        """Test webhook rejection with invalid signature"""
        payload = {
            'transaction_id': 'STN123456789',
            'status': 'completed'
        }
        
        response = self.client.post(
            '/api/payments/webhook/selcom/',
            json.dumps(payload),
            content_type='application/json',
            HTTP_X_SELCOM_SIGNATURE='invalid_signature'
        )
        
        self.assertEqual(response.status_code, 400)


# Run all tests with coverage
# python manage.py test payments.tests --verbosity=2
```

## cURL Testing Guide

### 1. Create Payment

```bash
# Login first to get token
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'

# Response:
# {"access":"eyJ0eXAiOiJKV1QiLCJhbGc...","refresh":"eyJ0eXAiOiJKV1QiLCJhbGc..."}

# Create payment
curl -X POST http://localhost:8000/api/payments/101/pay/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..." \
  -d '{"payment_method":"mpesa"}'
```

### 2. Verify Payment

```bash
curl -X POST http://localhost:8000/api/payments/1/verify/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..."
```

### 3. List Payments

```bash
curl -X GET http://localhost:8000/api/payments/ \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..."
```

### 4. Refund Payment

```bash
curl -X POST http://localhost:8000/api/payments/1/refund/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..." \
  -d '{
    "amount": "75000.00",
    "reason": "Customer request"
  }'
```

### 5. Test Webhook

```bash
# Generate HMAC signature
python -c "
import hmac
import hashlib
import json

payload = {
    'transaction_id': 'STN123456789',
    'order_id': '101',
    'status': 'completed',
    'amount': '75000.00'
}

message = json.dumps(payload, sort_keys=True)
signature = hmac.new(
    b'your_api_secret',
    message.encode(),
    hashlib.sha256
).hexdigest()

print(signature)
"

# Send webhook
curl -X POST http://localhost:8000/api/payments/webhook/selcom/ \
  -H "Content-Type: application/json" \
  -H "X-SELCOM-SIGNATURE: <signature_from_above>" \
  -d '{
    "transaction_id": "STN123456789",
    "order_id": "101",
    "status": "completed",
    "amount": "75000.00"
  }'
```

## Postman Testing

1. **Create Postman Collection**
   - Import: [Payment API Postman Collection](payment_api_collection.json)

2. **Environment Variables**
   ```
   {{base_url}} = http://localhost:8000
   {{token}} = <jwt_access_token>
   {{order_id}} = 101
   {{payment_id}} = 1
   ```

3. **Test Sequence**
   ```
   Login → Create Payment → Verify Payment → List Payments → Refund → Webhook
   ```

## Running Tests

### Run All Tests

```bash
python manage.py test payments.tests
```

### Run Specific Test Class

```bash
python manage.py test payments.tests.PaymentModelTests
```

### Run with Coverage Report

```bash
coverage run --source='payments' manage.py test payments.tests
coverage report -m
coverage html  # Generate HTML report in htmlcov/
```

### Run with Verbose Output

```bash
python manage.py test payments.tests --verbosity=2
```

### Run with Debug on Failure

```bash
python manage.py test payments.tests --debug-mode
```

## Sandbox Testing with Selcom

### 1. Setup Sandbox Credentials

```env
DEBUG=True
SELCOM_MERCHANT_ID=sandbox_merchant_id
SELCOM_API_KEY=sandbox_api_key
SELCOM_API_SECRET=sandbox_secret
```

### 2. Use Sandbox Phone Numbers

Selcom provides test phone numbers:
- M-Pesa: `255712345670`
- Tigo Pesa: `255655000000`
- Airtel Money: `255783000000`

### 3. Test Payment Flow

```bash
# Step 1: Create payment
curl -X POST http://localhost:8000/api/payments/101/pay/ \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"payment_method":"mpesa"}'

# Step 2: Simulate Selcom callback
curl -X POST http://localhost:8000/api/payments/webhook/selcom/ \
  -H "X-SELCOM-SIGNATURE: $SIGNATURE" \
  -d '{
    "transaction_id": "STN123456789",
    "order_id": "101",
    "status": "completed",
    "amount": "75000.00"
  }'

# Step 3: Verify payment status
curl -X GET http://localhost:8000/api/payments/ \
  -H "Authorization: Bearer $TOKEN"
```

## Performance Testing

### Load Test with Locust

Create `locustfile.py`:

```python
from locust import HttpUser, task, between
import json

class PaymentUser(HttpUser):
    wait_time = between(1, 3)
    
    @task
    def create_payment(self):
        self.client.post(
            '/api/payments/101/pay/',
            json={'payment_method': 'mpesa'},
            headers={'Authorization': f'Bearer {self.token}'}
        )
    
    @task
    def list_payments(self):
        self.client.get(
            '/api/payments/',
            headers={'Authorization': f'Bearer {self.token}'}
        )
```

Run: `locust -f locustfile.py -u 100 -r 10 -t 1h`

## Monitoring & Logging

### View Logs

```bash
tail -f logs/django.log
```

### Payment Operation Logs

```bash
grep "Payment" logs/django.log
grep "ERROR" logs/django.log
grep "Selcom" logs/django.log
```

## Checklist

Before deploying to production:

- [ ] All unit tests passing (`python manage.py test`)
- [ ] Code coverage > 80% (`coverage report`)
- [ ] Webhook signature validation working
- [ ] Phone number formatting handles all formats
- [ ] Error messages logged properly
- [ ] API endpoints return correct status codes
- [ ] Unauthorized access blocked (401)
- [ ] Payment status transitions correct
- [ ] Refund logic tested
- [ ] Database migrations applied

## Next Steps

1. ✅ Complete unit test suite
2. [ ] Integration tests with real Selcom sandbox
3. [ ] Performance/load testing
4. [ ] Security testing (penetration test)
5. [ ] Frontend integration testing
6. [ ] Production deployment verification

---

**For questions or issues, check logs and run tests with `--debug-mode` for detailed output.**
