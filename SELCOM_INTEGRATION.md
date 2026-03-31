# Selcom API Integration Guide

Complete guide for M-Pesa, Tigo Pesa, and Airtel Money integration via Selcom payment gateway.

## Overview

Selcom is Tanzania's leading payment gateway supporting multiple mobile money services:
- **M-Pesa** (Vodacom)
- **Tigo Pesa** (Tigo)
- **Airtel Money** (Airtel)

## Architecture

```
Mobile App (React Native)
    ↓
API Endpoint: POST /api/payments/<order_id>/pay/
    ↓
Payment View → SelcomPaymentService
    ↓
Selcom API (initiates payment)
    ↓
Customer's Phone (M-Pesa/Tigo/Airtel prompt)
    ↓
Customer enters PIN
    ↓
Selcom Webhook → Callback Handler
    ↓
Order Status Updated
```

## Setup Instructions

### 1. Create Selcom Account

1. Visit [Selcom.net](https://selcom.net)
2. Sign up for a merchant account
3. Verify your business details
4. Get API credentials from dashboard:
   - Merchant ID
   - API Key
   - API Secret

### 2. Configure Environment Variables

Add to `.env`:

```env
# Selcom Configuration
SELCOM_MERCHANT_ID=your_merchant_id
SELCOM_API_KEY=your_api_key_here
SELCOM_API_SECRET=your_api_secret_here
SELCOM_CALLBACK_URL=http://localhost:8000/api/payments/webhook/selcom/
```

For production (Railway):
```env
SELCOM_CALLBACK_URL=https://yourdomain.railway.app/api/payments/webhook/selcom/
```

### 3. Update Django Settings

Already configured in `msosi_backend/settings.py`:

```python
SELCOM_MERCHANT_ID = config('SELCOM_MERCHANT_ID', default='')
SELCOM_API_KEY = config('SELCOM_API_KEY', default='')
SELCOM_API_SECRET = config('SELCOM_API_SECRET', default='')
SELCOM_CALLBACK_URL = config('SELCOM_CALLBACK_URL', default='...')
```

### 4. Register Webhook URL in Selcom Dashboard

1. Login to Selcom dashboard
2. Go to Settings → Webhooks
3. Add webhook URL: `https://yourdomain.railway.app/api/payments/webhook/selcom/`
4. Select events: `payment.completed`, `payment.failed`
5. Test webhook connection

## API Endpoints

### 1. Create Payment (Initiate Transaction)

**Endpoint**: `POST /api/payments/<order_id>/pay/`

**Auth**: Required (Bearer token)

**Request Body**:
```json
{
  "payment_method": "mpesa"
}
```

**Valid payment methods**:
- `mpesa` - M-Pesa
- `tigo_pesa` - Tigo Pesa
- `airtel_money` - Airtel Money
- `card` - Stripe (for credit/debit cards)

**Response (201 Created)**:
```json
{
  "id": 1,
  "order": 101,
  "customer": 1,
  "amount": "75000.00",
  "payment_method": "mpesa",
  "status": "pending",
  "transaction_id": "STN123456789",
  "selcom_reference": "REF-101",
  "error_message": null,
  "created_at": "2024-03-31T15:30:00Z",
  "updated_at": "2024-03-31T15:30:00Z"
}
```

**Flow**:
1. Request sent to Selcom
2. M-Pesa prompt appears on customer's phone
3. Customer enters PIN
4. Webhook notification received from Selcom
5. Payment status updated

### 2. Verify Payment Status

**Endpoint**: `POST /api/payments/<id>/verify/`

**Auth**: Required

**Description**: Manually check payment status with Selcom

**Response**:
```json
{
  "id": 1,
  "status": "completed",
  "transaction_id": "STN123456789"
}
```

### 3. Refund Payment

**Endpoint**: `POST /api/payments/<id>/refund/`

**Auth**: Required

**Request Body** (optional):
```json
{
  "amount": "75000.00",
  "reason": "Customer request"
}
```

**Response**:
```json
{
  "id": 1,
  "status": "refunded",
  "amount": "75000.00"
}
```

### 4. List Payments

**Endpoint**: `GET /api/payments/`

**Auth**: Required

**Response**:
```json
{
  "count": 5,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "order": 101,
      "status": "completed",
      "amount": "75000.00",
      "created_at": "2024-03-31T15:30:00Z"
    }
  ]
}
```

### 5. Webhook Endpoint (Auto)

**Endpoint**: `POST /api/payments/webhook/selcom/`

**Auth**: Not required (signature validation instead)

**Headers Expected**:
```
X-SELCOM-SIGNATURE: <HMAC-SHA256-signature>
```

**Payload** (from Selcom):
```json
{
  "transaction_id": "STN123456789",
  "order_id": 101,
  "status": "completed",
  "amount": 75000.00,
  "error_message": null
}
```

## Implementation Details

### SelcomPaymentService Class

Location: `payments/selcom_service.py`

**Key Methods**:

```python
# Initiate payment
success, response = SelcomPaymentService.initiate_payment(
    phone_number="255712345678",
    amount=Decimal("75000.00"),
    order_id=101,
    payment_method="mpesa",
    customer_email="john@example.com",
    customer_name="John Doe"
)

# Verify payment status
success, data = SelcomPaymentService.verify_payment(transaction_id="STN123456789")

# Refund payment
success, response = SelcomPaymentService.refund_payment(
    transaction_id="STN123456789",
    amount=Decimal("75000.00"),
    reason="Refund requested"
)

# Validate webhook signature
is_valid = SelcomPaymentService.validate_webhook(payload, signature)
```

### Payment Status Flow

```
pending/processing → completed
                  → failed
completed        → refunded
```

## Phone Number Format

The service automatically formats phone numbers to Tanzania format (255...):

**Supported Input Formats**:
- `255712345678` ✅
- `+255712345678` ✅
- `0712345678` ✅ (converted to 255712345678)
- `712345678` ✅ (converted to 255712345678)

## Testing & Development

### Local Testing with Sandbox

Use Selcom sandbox environment:

```env
DEBUG=True  # Uses sandbox URL automatically
SELCOM_API_KEY=sandbox_key
SELCOM_API_SECRET=sandbox_secret
```

Service automatically switches to sandbox when `DEBUG=True`.

### Test Credentials

For sandbox testing:
- API URL: `https://sandbox-apigw.selcom.net/api/v1`
- Use test merchant ID from Selcom dashboard
- Test phone numbers provided in Selcom docs

### Mock Testing

```python
from unittest.mock import patch
from payments.selcom_service import SelcomPaymentService

@patch('payments.selcom_service.SelcomPaymentService.initiate_payment')
def test_payment_flow(mock_selcom):
    mock_selcom.return_value = (True, {
        'status': 'success',
        'transaction_id': 'STN123456789',
        'reference_id': 'REF-101'
    })
    
    # Your test code
```

## Error Handling

### Common Error Responses

**Invalid Phone Number**:
```json
{
  "error": "Invalid phone number format",
  "status": "failed"
}
```

**Insufficient Funds**:
```json
{
  "error": "Insufficient funds in account",
  "status": "failed"
}
```

**Network Timeout**:
```json
{
  "error": "Failed to connect to payment gateway",
  "message": "Connection timeout after 10s"
}
```

### Error Logging

All errors are logged to `logs/django.log`:

```python
import logging
logger = logging.getLogger('payments')
logger.error(f"Payment {payment.id} failed: {error_message}")
```

## Security Considerations

### 1. API Key Protection

- ✅ Stored in `.env` (not in code)
- ✅ Not logged or displayed
- ✅ Different keys for dev/prod
- ✅ Rotate keys regularly

### 2. Webhook Security

- ✅ Signature validation on every webhook
- ✅ HMAC-SHA256 hash verification
- ✅ Idempotency (safe to process duplicate webhooks)
- ✅ No auth required (signature suffices)

### 3. PCI Compliance

- ✅ No card data stored locally
- ✅ Stripe handles card payments securely
- ✅ HTTPS for all API calls
- ✅ Transactions logged (not sensitive data)

## Performance Optimization

### Request Timeouts
- API calls: 10 seconds (configurable)
- Webhook processing: Async tasks (future enhancement)

### Rate Limiting
- Payment endpoints: 10 requests/minute
- Webhook: Unlimited (required by Selcom)

### Caching
- Payment status cached for 5 minutes
- Reduces Selcom API calls

## Troubleshooting

### Payment Initiated but No Prompt on Phone

**Causes**:
- Invalid phone number format
- Phone not registered with M-Pesa/Tigo/Airtel
- Merchant not active in Selcom

**Solution**:
1. Verify phone number format (must be 255712345678)
2. Check phone is active with service provider
3. Check Selcom merchant status

### Webhook Not Being Received

**Causes**:
- URL not registered in Selcom dashboard
- Firewall blocking Selcom IPs
- Signature verification failing

**Solution**:
1. Test webhook URL: `POST /api/payments/webhook/selcom/`
2. Check logs: `tail -f logs/django.log`
3. Verify signature validation in code
4. Whitelist Selcom IPs in firewall

### Payment Timeout

**Causes**:
- Network connectivity issues
- Selcom API overload
- Request took >10 seconds

**Solution**:
1. Check network connection
2. Retry after 30 seconds
3. Implement exponential backoff

## Next Steps

### Phase 1 (Current)
✅ M-Pesa, Tigo Pesa, Airtel Money integration
✅ Webhook handling
✅ Error logging

### Phase 2 (Future)
- [ ] Async payment verification (Celery)
- [ ] Payment reconciliation report
- [ ] Refund management UI
- [ ] Multi-currency support

### Phase 3 (Enhancement)
- [ ] Recurring/subscription payments
- [ ] Split payments (restaurant + platform)
- [ ] Payment analytics dashboard
- [ ] SMS notifications

## Support & Documentation

- **Selcom API Docs**: https://selcom.net/developers
- **Status Page**: https://status.selcom.net
- **Support Email**: support@selcom.net
- **Phone**: +255 xxx xxx xxxx

## Code Examples

### Complete Payment Flow

```python
# Step 1: Customer orders food
order = Order.objects.create(
    customer=user,
    delivery_address="123 Main St",
    total_price=Decimal("75000.00"),
    status='pending'
)

# Step 2: Initiate payment
payment_data = {
    "payment_method": "mpesa"
}

# POST to /api/payments/101/pay/
response = requests.post(
    "http://localhost:8000/api/payments/101/pay/",
    json=payment_data,
    headers={"Authorization": f"Bearer {access_token}"}
)

# Response:
# {
#   "id": 1,
#   "status": "pending",
#   "transaction_id": "STN123456789"
# }

# Step 3: Customer enters M-Pesa PIN on phone
# → Payment completes

# Step 4: Webhook received
# → Order status → confirmed
# → Payment status → completed
```

## Conclusion

The Selcom integration provides seamless mobile money payments for Msosi Faster customers. Handle errors gracefully and monitor logs for issues.

For questions, contact the development team or Selcom support.
