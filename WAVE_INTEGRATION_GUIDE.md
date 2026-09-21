# Wave Business Integration Guide

## Overview

NIATALA now supports Wave Business API for payment processing. This guide explains:
- Architecture and security model
- How to configure Wave credentials
- How to test without real credentials
- How to integrate in production

---

## 🏗️ Architecture

### Secure Backend Design

```
┌──────────────────────────────┐
│  NIATALA Frontend (React)    │
│  ├─ Wave Payment UI          │
│  ├─ usePaymentEngine()       │
│  └─ NO API KEYS              │
└────────────────┬─────────────┘
                 │
         HTTPS (secure)
                 │
                 ▼
┌──────────────────────────────────────┐
│  NIATALA Backend (Node.js/Express)   │
│  ├─ API Key Management (from .env)   │
│  ├─ Wave API Communication          │
│  ├─ Webhook Handling                │
│  ├─ Transaction Storage             │
│  └─ Idempotency Management          │
└────────────────┬─────────────────────┘
                 │
         HTTPS (to Wave)
                 │
                 ▼
┌──────────────────────────────┐
│  Wave Business API           │
│  ├─ Payment Creation         │
│  ├─ Status Checking          │
│  ├─ Refund Processing        │
│  └─ Webhook Confirmations    │
└──────────────────────────────┘
```

### Key Security Principles

✅ **API Keys NEVER in Frontend**
- Stored only in backend `.env` file
- Never exposed to browser
- Never logged or displayed

✅ **Idempotency**
- Same payment request twice = same result
- Prevents duplicate transactions
- Uses idempotency keys

✅ **Webhook Verification**
- All Wave webhooks have HMAC signatures
- Backend verifies before processing
- Prevents spoofed payments

✅ **Status Tracking**
- PENDING until confirmed
- Can't skip to SUCCESS without proof
- Webhook or manual confirmation required

---

## 📋 Configuration

### Backend Setup

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Create `.env` from template**
   ```bash
   cp .env.example .env
   ```

3. **Add Wave credentials to `.env`**
   ```
   WAVE_API_KEY=your_wave_api_key_here
   WAVE_API_SECRET=your_wave_api_secret_here
   WAVE_MERCHANT_ID=your_wave_merchant_id_here
   WAVE_ENVIRONMENT=staging  # or production
   WAVE_WEBHOOK_SECRET=your_webhook_secret_here
   ```

4. **Add other required variables**
   ```
   NODE_ENV=development
   PORT=3001
   FRONTEND_URL=http://localhost:5174
   ```

5. **Start backend**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Create `.env.local` from template**
   ```bash
   cp .env.example .env.local
   ```

2. **Configure backend URL**
   ```
   VITE_API_URL=http://localhost:3001
   ```

   For production:
   ```
   VITE_API_URL=https://api.niatala.com
   ```

---

## 🧪 Testing Without Wave Credentials

### Simulation Mode

If Wave credentials aren't configured, the backend automatically enters **SIMULATION MODE**:

```
✓ Payments can be created
✓ Status can be checked
✓ Webhooks can be tested
✓ No real transactions occur
✓ No money is charged
```

### Test Workflow

1. **Start backend in simulation mode** (without Wave credentials)
   ```bash
   cd backend
   npm run dev
   # No WAVE_API_KEY in .env → Simulation mode active
   ```

2. **Create a test payment** (from browser console or test script)
   ```bash
   const response = await fetch('http://localhost:3001/api/payments/create', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       provider: 'WAVE',
       amount: 5000,
       saleId: 'VTE-001',
       description: 'Test payment'
     })
   })
   const payment = await response.json()
   console.log(payment)
   // Returns: { id, status: "PENDING", transactionId, ... }
   ```

3. **Check payment status**
   ```bash
   const statusResponse = await fetch(
     'http://localhost:3001/api/payments/' + payment.id + '/status'
   )
   const status = await statusResponse.json()
   console.log(status.status) // "PENDING"
   ```

4. **Simulate webhook confirmation**
   ```bash
   const webhookResponse = await fetch('http://localhost:3001/api/webhooks/test/wave', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       paymentId: payment.id,
       status: 'completed'  // or 'failed'
     })
   })
   ```

5. **Verify payment is now successful**
   ```bash
   const finalStatus = await fetch(
     'http://localhost:3001/api/payments/' + payment.id + '/status'
   )
   const final = await finalStatus.json()
   console.log(final.status) // "SUCCESS"
   ```

---

## 🔄 Payment Flow

### MANUAL Mode (Small Merchants)

```
1. Cashier initiates payment
   ↓
2. Frontend shows QR code + account number
   ↓
3. Customer scans QR / sends money
   ↓
4. Admin confirms payment received
   ↓
5. Backend marks as SUCCESS
   ↓
6. Sale finalized
```

### API Mode (Connected Merchants)

```
1. Cashier initiates payment
   ↓
2. Frontend calls /api/payments/create
   ↓
3. Backend creates Wave payment session
   ↓
4. Frontend redirects to Wave payment page
   ↓
5. Customer completes payment on Wave
   ↓
6. Wave confirms via webhook
   ↓
7. Backend updates transaction status
   ↓
8. Frontend notified (polling or WebSocket)
   ↓
9. Sale finalized automatically
```

---

## 📡 Endpoints Reference

### Create Payment

```
POST /api/payments/create

Body:
{
  provider: "WAVE",
  amount: 5000,
  saleId: "VTE-001",
  clientId: "optional",
  description: "Payment for sale"
}

Response:
{
  id: "WAVE-1694595...",
  provider: "WAVE",
  status: "PENDING" | "SUCCESS" | "FAILED",
  amount: 5000,
  saleId: "VTE-001",
  transactionId: "WAVE_TXN_123",
  redirectUrl: "https://pay.wave.com/...",
  createdAt: 1694595123456
}
```

### Get Payment Status

```
GET /api/payments/{paymentId}/status

Response:
{
  id: "WAVE-1694595...",
  status: "PENDING",
  amount: 5000,
  saleId: "VTE-001",
  transactionId: "WAVE_TXN_123",
  updatedAt: 1694595123456
}
```

### Get Payment by Sale

```
GET /api/payments/sale/{saleId}

Response:
{
  id: "WAVE-1694595...",
  status: "SUCCESS",
  amount: 5000,
  saleId: "VTE-001",
  updatedAt: 1694595123456
}
```

### Confirm Manual Payment (Admin)

```
POST /api/payments/{paymentId}/confirm

Response:
{
  id: "WAVE-1694595...",
  status: "SUCCESS",
  saleId: "VTE-001"
}
```

### Cancel Payment

```
POST /api/payments/{paymentId}/cancel

Response:
{
  id: "WAVE-1694595...",
  status: "CANCELLED",
  saleId: "VTE-001"
}
```

### Refund Payment

```
POST /api/payments/{paymentId}/refund

Body:
{
  amount: 2500,  // optional, full refund if omitted
  reason: "Customer request"
}

Response:
{
  id: "WAVE-1694595...",
  status: "REFUNDED",
  amount: 2500
}
```

### Wave Webhook

```
POST /api/webhooks/wave

Headers:
X-Wave-Signature: hmac-sha256-signature

Body:
{
  event: "payment.completed" | "payment.failed",
  paymentId: "WAVE-1694595...",
  transactionId: "WAVE_TXN_123",
  status: "completed" | "failed",
  amount: 5000,
  timestamp: 1694595123456
}

Response:
{
  success: true,
  paymentId: "WAVE-1694595...",
  status: "SUCCESS"
}
```

### Test Webhook (Development Only)

```
POST /api/webhooks/test/wave

Body:
{
  paymentId: "WAVE-1694595...",
  status: "completed" | "failed"
}

Response:
{
  success: true,
  paymentId: "WAVE-1694595...",
  status: "SUCCESS",
  note: "This is a test webhook. Use only in development."
}
```

---

## 🔒 Security Checklist

### Before Production

- [ ] Wave API credentials configured in backend `.env`
- [ ] Frontend NEVER has access to credentials
- [ ] HTTPS enabled on all endpoints
- [ ] Webhook signature verification enabled
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] Database backup configured
- [ ] Error logging configured
- [ ] Monitoring/alerts configured

### Environment Variables

**Backend (.env)** - KEEP SECURE, NEVER COMMIT
```
WAVE_API_KEY=xxxxxxxxxxxx
WAVE_API_SECRET=xxxxxxxxxxxx
WAVE_MERCHANT_ID=xxxxxxxxxxxx
WAVE_WEBHOOK_SECRET=xxxxxxxxxxxx
```

**Frontend (.env.local)** - Can be public
```
VITE_API_URL=https://api.niatala.com
```

---

## 🚀 Production Deployment

### 1. Obtain Wave Business Credentials

Contact Wave to get:
- API Key
- API Secret
- Merchant ID
- Webhook Secret

### 2. Configure Backend

Update `backend/.env`:
```
NODE_ENV=production
WAVE_ENVIRONMENT=production
WAVE_API_KEY=<your_key>
WAVE_API_SECRET=<your_secret>
WAVE_MERCHANT_ID=<your_id>
WAVE_WEBHOOK_SECRET=<your_secret>
FRONTEND_URL=https://niatala.app
API_URL=https://api.niatala.app
```

### 3. Deploy Backend

```bash
# Build
npm run build

# Deploy to server (Docker, Heroku, etc.)
# Ensure environment variables are set in production environment
npm start
```

### 4. Configure Frontend

Update `.env.local`:
```
VITE_API_URL=https://api.niatala.app
```

### 5. Configure Wave Webhooks

In Wave dashboard:
- Set webhook URL: `https://api.niatala.app/api/webhooks/wave`
- Copy webhook secret to `WAVE_WEBHOOK_SECRET` in backend `.env`
- Test webhook delivery

### 6. Enable HTTPS

- Get SSL certificate (Let's Encrypt, AWS, etc.)
- Configure HTTPS on both frontend and backend
- Update CORS configuration if needed

---

## 🐛 Troubleshooting

### Payment Stuck in PENDING

**Cause**: Webhook not received or API credentials invalid

**Solution**:
1. Check backend logs
2. Verify Wave credentials in `.env`
3. Check webhook configuration in Wave dashboard
4. Test webhook manually: `POST /api/webhooks/test/wave`

### "Backend API error" on Payment Creation

**Cause**: Backend not running or unreachable

**Solution**:
1. Check backend is running: `curl http://localhost:3001/api/health`
2. Verify `VITE_API_URL` in frontend `.env.local`
3. Check CORS headers in browser console
4. Verify backend URL is correct for your environment

### Duplicate Payment Transactions

**Cause**: Idempotency key collision or webhook processed twice

**Solution**:
1. Check idempotency key generation (should include timestamp)
2. Verify webhook signature validation is enabled
3. Clear expired transactions: `POST /api/admin/cleanup`

### Webhook Signature Verification Fails

**Cause**: `WAVE_WEBHOOK_SECRET` doesn't match Wave dashboard

**Solution**:
1. Copy exact webhook secret from Wave dashboard
2. Update `WAVE_WEBHOOK_SECRET` in backend `.env`
3. Restart backend
4. Test webhook again

---

## 📊 Monitoring

### Health Check

```bash
curl http://localhost:3001/api/health

# Response:
{
  "status": "ok",
  "environment": "development",
  "services": {
    "wave": {
      "configured": true,
      "mode": "PRODUCTION"  # or "SIMULATION"
    }
  }
}
```

### Server Status

```bash
curl http://localhost:3001/api/status

# Response:
{
  "uptime": 3600,
  "environment": "development",
  "transactions": {
    "active": 5,
    "total": 42
  }
}
```

### View All Transactions (Debug)

```bash
curl http://localhost:3001/api/payments/debug/all

# Response:
{
  "count": 5,
  "transactions": [...]
}
```

---

## 📚 Related Documentation

- [Payment Engine Architecture](./PAYMENT_ENGINE_ARCHITECTURE.md)
- [Payment Engine Implementation](./PAYMENT_ENGINE_IMPLEMENTATION.md)
- [Wave Business API Docs](https://docs.wave.com/business-api)

---

## Next Steps

1. ✅ Backend structure created
2. ✅ Wave service implemented (simulation mode)
3. ✅ Payment endpoints created
4. ✅ Webhook handling implemented
5. ⏳ Integrate in CashierScreen (upcoming)
6. ⏳ Integrate in AdminScreen (upcoming)
7. ⏳ Get Wave Business credentials
8. ⏳ Deploy to production

---

**Last Updated**: 2026-09-13
