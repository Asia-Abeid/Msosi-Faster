# Selcom Payment Integration - Quick Reference

Fast reference for implementing and using Selcom payment integration in Msosi Faster.

## Quick Start (5 minutes)

### 1. Environment Setup

```bash
# Copy .env.example to .env
cp .env.example .env

# Add Selcom credentials
# Edit .env and add:
SELCOM_MERCHANT_ID=your_merchant_id
SELCOM_API_KEY=your_api_key
SELCOM_API_SECRET=your_api_secret
SELCOM_CALLBACK_URL=http://localhost:8000/api/payments/webhook/selcom/
```

### 2. Run Server

```bash
python manage.py runserver
```

### 3. Test Endpoint

```bash
# Get JWT token
curl -X POST http://localhost:8000/api/auth/login/ \
  -d '{"email":"test@example.com","password":"pass"}' \
  -H "Content-Type: application/json"

# Create payment (use token from above)
curl -X POST http://localhost:8000/api/payments/101/pay/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"payment_method":"mpesa"}' \
  -H "Content-Type: application/json"

# Expected response:
# {
#   "id": 1,
#   "order": 101,
#   "status": "processing",
#   "transaction_id": "STN123456789",
#   "selcom_reference": "REF-101"
# }
```

## API Endpoints

### Payment Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/payments/<order_id>/pay/` | ✅ Required | Create payment |
| GET | `/api/payments/` | ✅ Required | List payments |
| GET | `/api/payments/<id>/` | ✅ Required | Get payment |
| POST | `/api/payments/<id>/verify/` | ✅ Required | Verify status |
| POST | `/api/payments/<id>/refund/` | ✅ Required | Refund payment |
| POST | `/api/payments/webhook/selcom/` | ❌ No auth | Selcom callback |

### Payload Examples

**Create Payment**:
```json
POST /api/payments/101/pay/

{
  "payment_method": "mpesa"
}

Response (201):
{
  "id": 1,
  "order": 101,
  "amount": "75000.00",
  "status": "processing",
  "transaction_id": "STN123456789",
  "payment_method": "mpesa"
}
```

**Verify Payment**:
```json
POST /api/payments/1/verify/

Response (200):
{
  "id": 1,
  "status": "completed"
}
```

**Refund Payment**:
```json
POST /api/payments/1/refund/

{
  "amount": "75000.00",
  "reason": "Customer request"
}

Response (200):
{
  "id": 1,
  "status": "refunded"
}
```

**Webhook (from Selcom)**:
```json
POST /api/payments/webhook/selcom/

Headers:
X-SELCOM-SIGNATURE: <HMAC-SHA256-signature>

{
  "transaction_id": "STN123456789",
  "order_id": "101",
  "status": "completed",
  "amount": "75000.00"
}

Response (200):
{
  "status": "success"
}
```

## Payment Status Flow

```
pending → processing → completed
                    → failed
                    → cancelled
        
completed → refunded
```

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| `Invalid phone number` | Format: 255712345678 (not 0712...) |
| `Webhook not received` | Register URL in Selcom dashboard |
| `Signature validation failed` | Check SELCOM_API_SECRET in .env |
| `Connection timeout` | Check internet connection, API status |
| `Merchant inactive` | Verify merchant status in Selcom dashboard |

## Key Files

| File | Purpose | Key Code |
|------|---------|----------|
| `payments/selcom_service.py` | Payment gateway service | `SelcomPaymentService` class |
| `payments/models.py` | Payment data model | `Payment` model with status tracking |
| `payments/views.py` | API endpoints | 5 views + webhook handler |
| `payments/urls.py` | URL routing | Payment routes configuration |
| `msosi_backend/settings.py` | Django configuration | Selcom/Stripe settings |
| `.env` | Environment variables | API credentials (not in git) |

## Testing Commands

```bash
# Run all payment tests
python manage.py test payments.tests

# Run specific test
python manage.py test payments.tests.PaymentAPITests.test_payment_create_endpoint

# Check with coverage
coverage run --source='payments' manage.py test payments.tests
coverage report -m

# View logs
tail -f logs/django.log

# Check Django configuration
python manage.py check
```

## Code Snippets

### Initiate Payment (Frontend)

```javascript
// React Native / JavaScript
const response = await fetch(
  'http://localhost:8000/api/payments/101/pay/',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      payment_method: 'mpesa'
    })
  }
);

const payment = await response.json();
console.log(`Payment initiated: ${payment.transaction_id}`);
console.log(`Please enter M-Pesa PIN on your phone`);

// Poll status (or wait for webhook)
const status = await checkPaymentStatus(payment.id);
if (status === 'completed') {
  console.log('Payment successful!');
}
```

### Check Payment Status

```javascript
const checkPaymentStatus = async (paymentId) => {
  const response = await fetch(
    `http://localhost:8000/api/payments/${paymentId}/`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );
  
  const payment = await response.json();
  return payment.status; // pending, processing, completed, failed
};
```

### Handle Webhook (Backend Auto-handled)

Already implemented in `payments/views.py`:
- Validates Selcom signature
- Updates Payment status
- Updates Order status
- Logs all transactions

## Phone Number Formats

All formats automatically converted to `255712345678`:

| Format | Example | Converted |
|--------|---------|-----------|
| Tanzania format | `255712345678` | ✅ `255712345678` |
| With + | `+255712345678` | ✅ `255712345678` |
| Local format | `0712345678` | ✅ `255712345678` |
| Without country | `712345678` | ✅ `255712345678` |

## Security Checklist

- [ ] API keys in `.env` (not in code)
- [ ] HTTPS enabled in production
- [ ] Webhook signature validation enabled
- [ ] CSRF protection on login endpoint
- [ ] JWT tokens validated on protected endpoints
- [ ] Payment amount verified before processing
- [ ] Error messages don't expose sensitive data
- [ ] Rate limiting on payment endpoints (optional)
- [ ] Database transactions use atomic operations
- [ ] Webhook idempotency (safe to resend)

## Production Deployment

### Before Deployment

```bash
# 1. Update .env with production credentials
SELCOM_MERCHANT_ID=prod_merchant_id
SELCOM_API_KEY=prod_api_key
SELCOM_API_SECRET=prod_secret
SELCOM_CALLBACK_URL=https://yourdomain.railway.app/api/payments/webhook/selcom/

# 2. Update Selcom dashboard
# Register webhook URL: https://yourdomain.railway.app/api/payments/webhook/selcom/
# Change from sandbox to production API

# 3. Verify settings
DEBUG=False
ALLOWED_HOSTS=yourdomain.railway.app

# 4. Update CORS
CORS_ALLOWED_ORIGINS=https://yourdomain.railway.app,https://app.yourdomain.com

# 5. Run migrations
python manage.py migrate

# 6. Check configuration
python manage.py check --deploy

# 7. Collect static files
python manage.py collectstatic --noinput

# 8. Run tests
python manage.py test payments.tests
```

### Deployment Commands

```bash
# Using Railway CLI
railway up

# Using Docker
docker-compose -f docker-compose.yml up -d

# Verify deployment
curl https://yourdomain.railway.app/api/payments/
# Should return 401 Unauthorized (not 404)
```

## Monitoring

### Logs to Check

```bash
# Check for errors
grep "ERROR" logs/django.log

# Check payment transactions
grep "Payment\|Selcom" logs/django.log

# Check webhook processing
grep "webhook\|Selcom" logs/django.log

# Real-time monitoring
tail -f logs/django.log
```

### Metrics to Track

- Total payments created per day
- Successful vs failed payment ratio
- Average payment completion time
- Webhook delivery success rate
- API response time

## Support & Resources

### Documentation
- [Selcom Integration Guide](SELCOM_INTEGRATION.md)
- [Payment Testing Guide](PAYMENT_TESTING_GUIDE.md)
- [API Documentation](API_DOCUMENTATION.md)
- [Selcom API Docs](https://selcom.net/developers)

### Contact
- Selcom Support: support@selcom.net
- Documentation issues: Check GitHub issues
- Code questions: Contact development team

## Frequently Asked Questions

**Q: How long does payment take?**
A: Usually 5-10 seconds. Customer enters M-Pesa PIN, Selcom processes, webhook notifies.

**Q: Can I test with real numbers?**
A: No, use sandbox phone numbers provided by Selcom first. Production needs real account.

**Q: What if webhook doesn't arrive?**
A: Implement polling with `/verify/` endpoint. Check logs, verify URL in Selcom dashboard.

**Q: How to refund payments?**
A: POST to `/api/payments/<id>/refund/` endpoint. Full or partial refunds supported.

**Q: Are test phone numbers available?**
A: Yes, Selcom provides sandbox numbers: 255712345670 (M-Pesa), 255655000000 (Tigo).

**Q: How to handle payment errors?**
A: Check `error_message` field in Payment model. All errors logged in `logs/django.log`.

---

**Last Updated**: 2024-03-31
**Status**: ✅ Production Ready
**Version**: 1.0
