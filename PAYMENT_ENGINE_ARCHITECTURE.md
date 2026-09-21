# NIATALA Payment Engine Architecture

## Overview

The Payment Engine is a centralized, provider-agnostic system for managing payments from multiple mobile money providers (Wave, Orange Money, Free Money) in NIATALA. It abstracts away provider-specific logic and offers a unified interface.

## Design Principles

1. **Single Responsibility**: Each provider implements its own business logic
2. **Provider Abstraction**: Consumers interact only with the PaymentEngine, not individual providers
3. **Extensibility**: New providers can be added without modifying existing code
4. **Type Safety**: Full TypeScript support with compile-time checking
5. **No Coupling**: Frontend components don't know about provider details

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│              React Components                       │
│              (CashierScreen, etc.)                  │
└────────────────────┬────────────────────────────────┘
                     │ usePaymentEngine()
                     ↓
┌─────────────────────────────────────────────────────┐
│           PaymentEngine (Orchestrator)              │
│  ┌──────────────────────────────────────────────┐   │
│  │ - createPayment()                            │   │
│  │ - getPaymentStatus()                         │   │
│  │ - confirmManualPayment()                     │   │
│  │ - cancelPayment()                            │   │
│  │ - refundPayment()                            │   │
│  │ - setProviderConfig()                        │   │
│  └──────────────────────────────────────────────┘   │
└────────┬────────────────┬─────────────────┬─────────┘
         │                │                 │
         ↓                ↓                 ↓
    ┌─────────┐    ┌────────────┐    ┌──────────┐
    │  Wave   │    │   Orange   │    │   Free   │
    │Provider │    │   Money    │    │  Money   │
    │         │    │  Provider  │    │ Provider │
    └────┬────┘    └─────┬──────┘    └────┬─────┘
         │                │                │
         └────────────────┴────────────────┘
                    ↓
         ┌──────────────────────┐
         │   localStorage       │
         │  (Payment Storage)   │
         └──────────────────────┘
```

## Core Components

### 1. Types (`src/services/paymentEngine/types.ts`)

Define the public contract:

- **PaymentProvider**: `WAVE | ORANGE_MONEY | FREE_MONEY`
- **PaymentMode**: `MANUAL | API`
- **PaymentStatus**: `PENDING | SUCCESS | FAILED | CANCELLED | REFUNDED | MANUAL_CONFIRMATION`
- **PaymentRequest**: Input for creating a payment
- **PaymentResponse**: Output from payment operations
- **RefundRequest/RefundResponse**: Refund operations

### 2. Provider Interface (`src/services/paymentEngine/providers/IPaymentProvider.ts`)

Contract that all providers must implement:

```typescript
interface IPaymentProvider {
  getProviderName(): string
  isConfigured(): boolean
  createPayment(request: PaymentRequest): Promise<PaymentResponse>
  getPaymentStatus(paymentId: string): Promise<PaymentStatus>
  confirmManualPayment(paymentId: string): Promise<PaymentResponse>
  cancelPayment(paymentId: string): Promise<PaymentResponse>
  refundPayment(request: RefundRequest): Promise<RefundResponse>
  setConfig(config: ProviderConfig): void
  getConfig(): ProviderConfig
}
```

### 3. Base Provider (`src/services/paymentEngine/providers/BasePaymentProvider.ts`)

Abstract base class providing common functionality:

- Payment storage in localStorage
- Default status checking
- Payment cancellation
- Validation
- Logging

Subclasses implement:
- `createPayment()` - Provider-specific creation logic
- `confirmManualPayment()` - Confirm manual payments
- `refundPayment()` - Handle refunds

### 4. Concrete Providers

- **WaveProvider** (`WaveProvider.ts`)
  - Implements Wave-specific payment flow
  - MANUAL mode: Shows QR code + account number
  - API mode: (Placeholder for real Wave API)

- **OrangeMoneyProvider** (`OrangeMoneyProvider.ts`)
  - Implements Orange Money-specific flow
  - MANUAL mode: Shows *144# instruction + QR code
  - API mode: (Placeholder for real Orange API)

- **FreeMoneyProvider** (`FreeMoneyProvider.ts`)
  - Implements Free Money-specific flow
  - MANUAL mode: Shows account + QR code
  - API mode: (Placeholder for real Free API)

### 5. Payment Engine (`src/services/paymentEngine/index.ts`)

Central orchestrator that:

- Manages provider instances
- Routes requests to appropriate provider
- Validates configuration
- Exposes public API via singleton pattern
- Provides provider management utilities

## Payment Modes

### MANUAL Mode

User workflow:
1. Customer initiates payment in NIATALA
2. Payment Engine creates payment with `MANUAL_CONFIRMATION` status
3. Display shows:
   - QR code (for mobile money app scanning)
   - Account number to send to
   - Instructions (provider-specific)
4. Admin/Cashier manually confirms payment once received
5. Status changes to `SUCCESS`

### API Mode

User workflow (future implementation):
1. Customer initiates payment
2. Payment Engine calls provider API (Wave, Orange, Free)
3. Provider returns payment link or redirect URL
4. Display shows payment interface or redirect
5. Customer completes payment with provider
6. Provider sends webhook confirmation
7. Status automatically updates to `SUCCESS`

## Consumer Usage

### In React Components

```typescript
import { usePaymentEngine } from '../hooks/usePaymentEngine'
import { PaymentProvider, PaymentMode } from '../services/paymentEngine'

function CashierScreen() {
  const { createPayment, confirmManualPayment } = usePaymentEngine()

  const handleWavePayment = async () => {
    const response = await createPayment({
      provider: PaymentProvider.WAVE,
      mode: PaymentMode.MANUAL,
      amount: 5000,
      saleId: 'VTE-001',
    })

    // Display QR code and account info
    console.log(response.displayInfo?.qrCode)
    console.log(response.displayInfo?.accountNumber)

    // Later, when payment is confirmed:
    await confirmManualPayment(PaymentProvider.WAVE, response.id)
  }
}
```

### Direct Engine Access

```typescript
import { getPaymentEngine, PaymentProvider, PaymentMode } from '../services/paymentEngine'

const engine = getPaymentEngine()

// Create payment
const payment = await engine.createPayment({
  provider: PaymentProvider.ORANGE_MONEY,
  mode: PaymentMode.MANUAL,
  amount: 3000,
  saleId: 'VTE-002',
})

// Get status
const status = await engine.getPaymentStatus(PaymentProvider.ORANGE_MONEY, payment.id)

// Confirm
await engine.confirmManualPayment(PaymentProvider.ORANGE_MONEY, payment.id)

// Refund
await engine.refundPayment(PaymentProvider.ORANGE_MONEY, {
  paymentId: payment.id,
  amount: 1500,
})
```

## Storage

Payments are stored in localStorage under `niatala_payments` key:

```typescript
{
  id: string                    // Unique payment ID
  provider: PaymentProvider     // WAVE, ORANGE_MONEY, or FREE_MONEY
  mode: PaymentMode             // MANUAL or API
  status: PaymentStatus         // Current payment status
  amount: number                // Amount in FCFA
  saleId: string                // Linked sale ID
  createdAt: number             // Creation timestamp
  updatedAt: number             // Last update timestamp
  transactionId?: string        // Provider transaction ID (for API mode)
  displayInfo?: PaymentDisplayInfo
  error?: string                // Error message if failed
}
```

## Logging

Payment Engine logs all actions to localStorage under `niatala_payment_engine_logs`:

```typescript
{
  provider: PaymentProvider
  action: string                // e.g., "CREATE", "CONFIRM", "REFUND"
  data: Record<string, unknown> // Action-specific data
  timestamp: number
}
```

Access logs via:
```typescript
import { getPaymentLogs } from '../services/paymentEngine/utils/paymentLogger'
const logs = getPaymentLogs()
```

## Testing

Run tests in browser console:

```javascript
// Available after app loads
await window.testPaymentEngine()
```

Tests cover:
- Engine initialization
- Provider discovery
- Payment creation (all modes)
- Payment status checking
- Manual confirmation
- Cancellation
- Refunds
- Configuration management
- Error handling

## Adding a New Provider

1. Create new class extending `BasePaymentProvider`:

```typescript
// src/services/paymentEngine/providers/NewProviderProvider.ts
import { BasePaymentProvider } from './BasePaymentProvider'
import type { PaymentRequest, PaymentResponse, RefundRequest, RefundResponse } from '../types'
import { PaymentProvider, PaymentMode, PaymentStatus } from '../types'

export class NewProviderProvider extends BasePaymentProvider {
  protected providerName = 'New Provider'
  protected provider: PaymentProvider = PaymentProvider.NEW_PROVIDER

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    // Implementation
  }

  async confirmManualPayment(paymentId: string): Promise<PaymentResponse> {
    // Implementation
  }

  async refundPayment(request: RefundRequest): Promise<RefundResponse> {
    // Implementation
  }
}
```

2. Add provider to PaymentProvider enum in `types.ts`
3. Register in PaymentEngine `initializeProviders()`
4. Export from `providers/index.ts`

## Future: API Mode Implementation

When integrating real APIs:

1. Add API endpoints to provider classes
2. Store API credentials in backend (`.env`)
3. Implement webhook handling for payment confirmations
4. Add retry logic and timeout management
5. Implement idempotency for payment creation
6. Add transaction database entries
7. Sync localStorage with backend database

## Security Considerations

- **API Keys**: Never exposed to frontend
  - Store in backend `.env` file
  - Backend routes call provider APIs
  - Frontend calls backend API, not provider APIs

- **Webhook Validation**: Sign webhooks from providers
  - Verify HMAC signatures
  - Implement webhook replay protection
  - Log all webhook events

- **Transaction Integrity**: Single source of truth
  - Backend database as primary storage
  - Frontend localStorage as cache
  - Reconciliation on startup

## State Transitions

```
PENDING
  ↓
[Admin confirms] → SUCCESS
  ↓
[Customer requests refund] → REFUNDED

OR

[Admin cancels] → CANCELLED

OR

[Payment fails] → FAILED
```

## Backwards Compatibility

The existing `paymentService.ts` and provider services (`waveService.ts`, etc.) remain unchanged. The PaymentEngine is additive and can coexist with existing code. Migration to PaymentEngine should be done screen-by-screen.

## Next Steps

1. ✅ Payment Engine architecture complete
2. ⏳ Integrate PaymentEngine in CashierScreen
3. ⏳ Integrate PaymentEngine in AdminScreen (settings)
4. ⏳ Create backend for API mode
5. ⏳ Implement real provider API calls
6. ⏳ Add webhook handling
7. ⏳ Database integration
