# 💳 Architecture des Paiements Mobiles — NIATALA

## Vue d'ensemble

NIATALA est préparé pour intégrer les paiements mobiles Wave et Orange Money. L'architecture est conçue pour fonctionner d'abord en mode prototype (localStorage), puis évoluer vers une API backend réelle.

**IMPORTANT:** Les secrets API ne sont JAMAIS stockés dans le frontend. Préparez un backend pour gérer les authentifications réelles.

---

## 1. Services de Paiement

### `src/services/paymentService.ts`
Gère tous les paiements (Wave, Orange Money, etc.)

**Fonctions:**
- `createPayment()` - Crée une demande de paiement
- `getPaymentById(id)` - Récupère un paiement
- `getPaymentsBySaleId(saleId)` - Tous les paiements pour une vente
- `updatePaymentStatus(id, status)` - Met à jour le statut
- `getTotalAmountByMethod(method)` - Montant total par méthode

**Statuts possibles:**
- `PENDING` - En attente de confirmation
- `SUCCESS` - Confirmé
- `FAILED` - Échoué
- `CANCELLED` - Annulé
- `REFUNDED` - Remboursé

---

## 2. Services Spécifiques aux Prestataires

### `src/services/waveService.ts`
Intégration Wave

**Fonctions:**
- `connectWaveAccount(merchantNumber, merchantName)` - Connecte un compte marchand
- `disconnectWaveAccount()` - Déconnecte le compte
- `requestPayment(saleId, amount, phoneNumber)` - Crée une demande de paiement
- `simulatePaymentConfirmation(paymentId)` - Simule la confirmation (webhook en prod)
- `simulatePaymentFailed(paymentId)` - Simule un échec
- `simulateRefund(paymentId)` - Simule un remboursement
- `simulatePayout(recipientPhone)` - Simule un transfert de fonds

### `src/services/orangeMoneyService.ts`
Intégration Orange Money (même interface que Wave)

---

## 3. Gestion des Dettes Clients

### `src/services/debtService.ts`
**IMPORTANT:** Une dette client est DIFFÉRENTE d'un paiement

Exemple:
```
Vente: 20 000 FCFA
Paiement Wave: 5 000 FCFA
Crédit (dette): 15 000 FCFA
```

**Fonctions:**
- `recordDebtPayment(clientId, amount, method)` - Enregistre un paiement de dette
- `getDebtPaymentsByClient(clientId)` - Tous les paiements de dette d'un client
- `getTotalDebtPaymentsByClient(clientId)` - Montant total remboursé

---

## 4. Retraits et Transferts

### `src/services/payoutService.ts`
Gère les retraits/transferts de fonds

**Fonctions:**
- `createPayout(provider, amount, recipientName, recipientPhone, reason, adminId)` - Crée un payout
- `getPayoutsByProvider(provider)` - Tous les payouts pour un prestataire
- `getPayoutsByStatus(status)` - Filtre par statut
- `updatePayoutStatus(id, status)` - Met à jour le statut

**Permission requise:** `CREATE_PAYOUT` (admin seulement)

---

## 5. React Hook de Paiement

### `src/hooks/usePayments.ts`
Hook personnalisé pour gérer les paiements dans les composants

```typescript
const {
  requestWavePayment,
  requestOrangeMoneyPayment,
  confirmWavePayment,
  confirmOrangeMoneyPayment,
  recordClientDebtPayment,
  getPaymentBySaleId
} = usePayments()
```

---

## 6. Configuration dans l'Admin

### Nouvel onglet: "💳 Paiements mobiles"

**Localisation:** `src/screens/AdminScreen.tsx` onglet `payments`

**Interface:**
- Affiche le statut de Wave (CONNECTÉ / NON CONNECTÉ)
- Affiche le statut d'Orange Money
- Permet la connexion/déconnexion de comptes marchands
- Formulaires pour numéro marchand et nom du commerce

**Pas de vraies clés API en frontend** ✅

---

## 7. Composants Modaux de Paiement

### `src/components/WavePaymentModal.tsx`
Modal pour demander un paiement Wave à la caisse

**Props:**
- `amount` - Montant à payer
- `onRequest(phoneNumber)` - Callback demande de paiement
- `onScanQR()` - Callback scan QR

**Affiche:**
- Montant
- Champ téléphone client
- Boutons: DEMANDER LE PAIEMENT, SCANNER QR
- État: 🟡 PAIEMENT EN ATTENTE

### `src/components/OrangeMoneyPaymentModal.tsx`
Même interface pour Orange Money

### `src/components/PaymentStatusModal.tsx`
Modal pour afficher l'état du paiement

**États:**
- ⏳ PAIEMENT EN ATTENTE (spinner)
- ✅ PAIEMENT CONFIRMÉ
- ❌ PAIEMENT ÉCHOUÉ
- ⛔ PAIEMENT ANNULÉ

**Actions possibles:**
- Recharger l'état du paiement
- Confirmer le paiement
- Annuler et recommencer
- Réessayer en cas d'échec

---

## 8. Type Definitions

### Types dans `src/types/index.ts`

```typescript
// Paiement
interface Payment {
  id: string
  saleId: string
  amount: number
  method: PaymentMethodType  // 'wave' | 'orange_money' | 'cash' | 'card'
  status: PaymentStatus      // PENDING | SUCCESS | FAILED | CANCELLED | REFUNDED
  reference?: string         // Référence du prestataire
  date: number
  cashierId?: string
  phoneNumber?: string
  metadata?: Record<string, unknown>
}

// Paiement de dette client
interface DebtPayment {
  id: string
  clientId: string
  amount: number
  method: PaymentMethodType
  status: PaymentStatus
  reference?: string
  date: number
  cashierId?: string
}

// Configuration du prestataire
interface PaymentProvider {
  id: 'wave' | 'orange_money'
  name: string
  status: 'CONNECTED' | 'DISCONNECTED'
  merchantNumber?: string
  merchantName?: string
  connectedAt?: number
}

// Payout (retrait)
interface Payout {
  id: string
  provider: 'wave' | 'orange_money'
  amount: number
  recipientName: string
  recipientPhone: string
  reason: string
  status: PaymentStatus
  reference?: string
  date: number
  adminId: string
}
```

---

## 9. Audit Logging

Toutes les opérations de paiement doivent être loggées:

```typescript
logAction(
  session.userId,
  session.username,
  session.role,
  'PAYMENT_WAVE',  // ou PAYMENT_ORANGE, DEBT_PAYMENT, REFUND, PAYOUT
  {
    reference: payment.id,
    amount: payment.amount,
    details: {
      method: payment.method,
      phoneNumber: payment.phoneNumber,
      status: payment.status
    }
  }
)
```

---

## 10. Pour une Intégration Réelle (Backend)

### Étapes nécessaires:

1. **Backend sécurisé** pour stocker les clés API
2. **Endpoints:**
   - `POST /api/payments/wave/connect` - Authentifier compte Wave
   - `POST /api/payments/wave/request` - Créer demande de paiement
   - `POST /api/payments/wave/confirm` - Confirmer paiement (webhook)
   - `POST /api/payments/wave/refund` - Rembourser
   - Mêmes endpoints pour Orange Money

3. **Webhooks:**
   - Wave appelle votre backend pour confirmer les paiements
   - Orange Money idem
   - Backend met à jour le statut dans niatala_payments

4. **Réconciliation:**
   - Comparer les paiements niatala_payments vs. historique réel du prestataire
   - Écran admin pour afficher les discrepances

---

## 11. Flux de Paiement en Production

```
Caissier → Choisit WAVE
         → Entrée téléphone client
         → APP crée Payment(status=PENDING)
         → Demande envoyée à backend
         → Backend appelle API Wave
         
Client → Reçoit notification
       → Confirme sur son téléphone
       
Wave → Envoie webhook au backend
     → Backend met à jour Payment(status=SUCCESS)
     → Frontend affiche ✅ CONFIRMÉ
     
Caissier → Clique PAIEMENT CONFIRMÉ
         → Vente finalisée
```

---

## 12. Statuts de Paiement et Logique

### PENDING
- Demande créée
- En attente de confirmation du client
- Frontend affiche spinner
- Pas d'encaissement validé
- ❌ NE PAS finaliser la vente

### SUCCESS
- Confirmé par le prestataire
- Argent encaissé
- ✅ Finaliser la vente
- Mettre à jour `sale.paidAmount`

### FAILED
- Prestataire a refusé
- Pas d'argent débité
- ❌ NE PAS finaliser la vente
- Proposer RÉESSAYER

### REFUNDED
- Remboursement effectué
- Réduire les encaissements
- Mettre à jour la vente

---

## 13. Distinction: Crédit vs. Paiement Partiel

### Paiement partiel avec crédit:

```
Vente = 20 000 FCFA
Client paie Wave = 5 000 FCFA (paymentStatus=SUCCESS)
Reste = 15 000 FCFA en crédit

Créer:
✅ Payment(amount=5000, status=SUCCESS, method=wave)
✅ Crédit client de 15 000 FCFA

NE PAS créer deux Payment de 5000 chacun.
```

### Paiement de dette plus tard:

```
Client revient et paie 15 000 par Wave

Créer:
✅ DebtPayment(clientId, amount=15000, method=wave, status=SUCCESS)

NE PAS créer une nouvelle Sale.
NE PAS mélanger avec Payment.
```

---

## 14. Permissions

### Permissions existantes étendues:

```typescript
type Permission = 
  | 'MANAGE_PRODUCTS'
  | 'CHANGE_PRICES'
  | 'VIEW_ALL_SALES'
  | 'VIEW_AUDIT'
  | 'MANAGE_CASHIERS'
  | 'REFUND_SALE'
  | 'MANAGE_SETTINGS'
  | 'VIEW_DASHBOARD'
  | 'CREATE_SALE'
  | 'CANCEL_SALE'
  | 'VIEW_OWN_SALES'
  | 'MANAGE_CUSTOMER_CREDIT'
  | 'CREATE_PAYOUT'      // ← NOUVEAU
  | 'CONFIGURE_PAYMENTS'  // ← NOUVEAU
```

---

## 15. Tests à Effectuer

### ✅ Test 1: Configuration des paiements
```
1. Login comme ADMIN
2. Administration → Paiements mobiles
3. Connecter compte Wave (numéro marchand test)
4. Vérifier le statut passe à CONNECTÉ
5. Déconnecter
6. Vérifier le statut passe à NON CONNECTÉ
```

### ✅ Test 2: Paiement PENDING
```
1. À la caisse, créer une vente de 5000 FCFA
2. Choisir WAVE
3. Entrer +221771234567
4. Vérifier Payment(status=PENDING) créé
5. Afficher l'état: 🟡 PAIEMENT EN ATTENTE
6. Spinner tourne
```

### ✅ Test 3: Paiement SUCCESS
```
1. Admin simule confirmation du paiement
2. Payment(status=SUCCESS)
3. Afficher ✅ PAIEMENT CONFIRMÉ
4. Caissier clique CONFIRMER
5. Vente finalisée
6. Vérifier dans historique ventes
```

### ✅ Test 4: Dettes vs Paiements
```
1. Vente 20 000, client paie 5 000 Wave
2. Vérifier:
   - 1 Payment(5000, wave)
   - Crédit client de 15 000
   - NE PAS créer 2 Payment
3. Client revient, paie 15 000
4. Vérifier:
   - 1 DebtPayment(15000, wave)
   - NE PAS créer une nouvelle Sale
   - Dette réduite à 0
```

### ✅ Test 5: Orange Money
```
Mêmes tests que Wave avec Orange Money
```

### ✅ Test 6: Audit
```
1. Effectuer un paiement Wave
2. Admin → Journal d'audit
3. Vérifier log PAYMENT_WAVE:
   - reference = paymentId
   - amount = 5000
   - details = { method, phoneNumber, status }
```

---

## 16. Ce qui est PRÊT

✅ Services de paiement (Wave, Orange Money)  
✅ Gestion des dettes clients  
✅ Service de payout  
✅ Interface de configuration (Admin)  
✅ Modals de paiement (caisse)  
✅ Hook React usePayments  
✅ Types TypeScript complets  
✅ Architecture sans clés API en frontend  
✅ Journalisation complète (audit)  

---

## 17. Ce qui nécessite un BACKEND

❌ Authentification réelle avec Wave API  
❌ Authentification réelle avec Orange Money API  
❌ Webhooks de confirmation de paiement  
❌ Réconciliation des transactions  
❌ Gestion sécurisée des clés API  
❌ Intégration de QR codes réels  
❌ Historique des transactions du prestataire  
❌ Vérification du solde du compte marchand  

---

## 18. Prochaines Étapes

1. **Backend:**
   - Créer endpoints /api/payments/wave/*
   - Créer endpoints /api/payments/orange/*
   - Implémenter webhooks
   - Gérer les clés API en variables d'environnement

2. **Frontend:**
   - Intégrer les calls API réels
   - Remplacer les `simulate*` par des appels backend
   - Implémenter QR code scanner
   - Créer écran de réconciliation des paiements

3. **Testing:**
   - Tester avec comptes test Wave/Orange
   - Tester les webhooks
   - Tester les remboursements
   - Tester les payouts

---

## 19. Questions Fréquentes

**Q: Pourquoi pas d'API Wave en localStorage?**  
R: Les clés API ne doivent JAMAIS être en frontend. Une clé expirerait ou se ferait voler.

**Q: Comment gérer les paiements PENDING?**  
R: Avec des webhooks. Wave appelle votre backend quand le client confirme. Le backend met à jour la DB.

**Q: Peut-on avoir un paiement sans vente?**  
R: Non. Chaque Payment est lié à une Sale via saleId. Sauf pour DebtPayment.

**Q: Différence Payment et DebtPayment?**  
R: Payment = paiement lié à une nouvelle vente. DebtPayment = paiement d'une dette existante.

**Q: Qui peut faire un PAYOUT?**  
R: Seulement ADMIN avec permission CREATE_PAYOUT.

---

**Status:** 🟢 Architecture prête pour intégration backend  
**Date:** 2026-09-13  
**Version:** 1.0
