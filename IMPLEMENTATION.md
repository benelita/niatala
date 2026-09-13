# NIATALA — Implémentation Version 1.0

## 🎯 Objectifs complétés

### Phase 1 : Écran de caisse ✅
- Interface professionnelle et intuitive
- Panier fonctionnel avec modification des quantités
- 4 modes de paiement : Espèces, Wave, Carte, Crédit
- Design responsive (desktop, tablette, mobile)

### Phase 2 : Historique des ventes ✅
- Enregistrement automatique de chaque vente
- Filtrage par mode de paiement
- Filtrage par statut de paiement
- Filtrage par période (jour, semaine, mois)
- Recherche par numéro de vente ou nom de client
- Affichage détaillé avec tous les produits vendus

### Phase 3 : Gestion des clients ✅
- Création de clients
- Fiche client avec informations complètes
- Historique des opérations (achats et paiements)
- Suivi de la dette actuelle en temps réel
- Recherche par nom ou téléphone

### Phase 4 : Ventes à crédit ✅
- Sélection d'un client existant au moment de la vente
- Création immédiate d'un nouveau client si nécessaire
- Paiement partiel, total, ou aucun paiement à la vente
- Enregistrement automatique de la dette
- Distinction entre : montant de la vente, montant payé, montant dû

### Phase 5 : Carnet de crédits ✅
- Vue globale des créances totales
- Liste des clients avec dette
- Enregistrement de paiements partiels
- Boutons rapides (5K, 10K, 25K, TOTAL)
- Calcul automatique de la nouvelle dette
- Passage au statut "RÉGLÉ" quand la dette = 0

### Phase 6 : Tableau de bord ✅
- Chiffre d'affaires du jour (valeur commerciale)
- Montant réellement encaissé (liquidités)
- Créances clients restantes
- Ventilation par mode de paiement
- Distinction entre ventes et encaissements

### Phase 7 : Persistance ✅
- localStorage pour sauvegarder toutes les données
- Données persistantes après actualisation
- Données persistantes après fermeture du navigateur
- Structure propre permettant migration vers une BDD

---

## 📁 Architecture du projet

```
niatala/
├── src/
│   ├── types/
│   │   └── index.ts           # Types TypeScript globaux
│   ├── hooks/
│   │   ├── useStorage.ts      # Gestion localStorage
│   │   ├── useSales.ts        # Logique ventes
│   │   └── useClients.ts      # Logique clients + dettes
│   ├── screens/
│   │   ├── CashierScreen.tsx  # Écran de caisse
│   │   ├── SalesScreen.tsx    # Historique ventes
│   │   ├── ClientsScreen.tsx  # Gestion clients
│   │   ├── CreditsScreen.tsx  # Carnet de crédits
│   │   └── DashboardScreen.tsx # Tableau de bord
│   ├── styles/
│   │   ├── CashierScreen.css
│   │   ├── SalesScreen.css
│   │   ├── ClientsScreen.css
│   │   ├── CreditsScreen.css
│   │   └── DashboardScreen.css
│   ├── App.tsx                # Navigation principale
│   ├── App.css                # Styles globaux
│   └── main.tsx
├── index.html
├── package.json
└── README.md
```

---

## 🔑 Points clés de l'implémentation

### 1. Types TypeScript stricts
```typescript
interface Sale {
  id: string
  saleNumber: string
  date: number
  items: SaleItem[]
  total: number
  paymentMethod: PaymentMethod
  clientId?: string
  paidAmount: number
  remainingAmount: number
  status: SaleStatus
}
```

### 2. Hooks réutilisables
- `useSales()` : Crée et récupère les ventes
- `useClients()` : Gère clients et opérations de dette
- `useStorage()` : Wrapper localStorage sécurisé

### 3. Distinction clé : Vente vs Encaissement

**Vente de 20K avec 5K payés :**
- Valeur de la vente : 20 000 FCFA (chiffre d'affaires)
- Montant encaissé : 5 000 FCFA (liquidités)
- Montant dû : 15 000 FCFA (créances)

Cette distinction est respectée partout :
- Dashboard : affiche les trois valeurs séparément
- Ventes : enregistre transaction complète
- Clients : suit la dette uniquement

### 4. Historique d'opérations

Chaque client a un historique chronologique :
```
[
  { date, type: 'PURCHASE', amount: 15000, balance: 15000 },
  { date, type: 'PAYMENT', amount: 10000, balance: 5000 },
  { date, type: 'PAYMENT', amount: 5000, balance: 0 }
]
```

L'historique n'est jamais modifié, seulement augmenté.

---

## 🔄 Flux de données

### Vente à crédit complète
```
1. Caissier ajoute produits au panier
   ↓
2. Sélectionne "CRÉDIT"
   ↓
3. Choisit/crée un client
   ↓
4. Paie 0, 5K, 10K, ou le total
   ↓
5. addSale() enregistre la vente
   ↓
6. Si montant_dû > 0:
   - addDebtOperation() crée l'opération PURCHASE
   - Client.totalDebt augmente
   ↓
7. Dans Ventes : transaction visible
8. Dans Clients : opération visible dans historique
9. Dans Crédits : client apparaît avec sa dette
```

### Paiement d'une dette
```
1. Utilisateur clique "💰" dans Crédits
2. Entre montant (ou clique bouton rapide)
3. addDebtOperation() enregistre le PAYMENT
4. Client.totalDebt diminue
5. Si totalDebt = 0 → statut passe à "RÉGLÉ"
6. Historique du client mis à jour
7. Dashboard recalcule les créances totales
```

---

## 📊 Statuts des ventes

| Statut | Condition |
|--------|-----------|
| PAID | Paiement espèces/wave/carte (montant_payé = total) |
| CREDIT | Paiement crédit sans acompte (montant_payé = 0) |
| PARTIAL_CREDIT | Paiement crédit avec acompte (0 < montant_payé < total) |
| SETTLED | Crédit entièrement remboursé |

---

## 🎨 Design

### Principes
- Design minimaliste et professionnel
- Boutons suffisamment grands pour tablette
- Pas de texte coupé, hiérarchie claire
- Responsive (min 320px, max illimité)
- Thème clair par défaut, thème sombre supporté

### Palette
- Accent : Bleu (#3b82f6)
- Succès : Vert (#10b981)
- Danger : Rouge (#ef4444)
- Text principal : Gris foncé (#1f2937)
- Fond : Blanc (#ffffff)

---

## 💾 Persistance des données

### localStorage keys
- `niatala_sales` → Array[Sale]
- `niatala_sale_counter` → number
- `niatala_clients` → Array[Client & { operations: [] }]

### Avantages
✅ Aucun backend requis pour MVP
✅ Données sauvegardées automatiquement
✅ Pas de latence réseau
✅ Fonctionne hors ligne

### Limitations
- Limite ~5MB par domaine
- Pas de synchronisation multi-onglets
- Données locales à la machine

### Migration future
Structure de données conçue pour migration vers PostgreSQL/MongoDB.
Clés immuables (IDs UUID, timestamps absolus).

---

## ✅ Règles métier implémentées

1. ✅ **Vente ≠ Encaissement** : Distingués partout
2. ✅ **Paiement > Crédit** : Impossible de payer plus que la dette
3. ✅ **Clients uniques** : Pas de doublons
4. ✅ **Historique immuable** : Jamais modifié, seulement augmenté
5. ✅ **Ventes immutables** : Impossible de modifier une vente (v1)
6. ✅ **Numéro séquentiel** : VTE-1001, VTE-1002, etc.
7. ✅ **FCFA par défaut** : Devise fixe dans l'interface
8. ✅ **Timestamp absolu** : Chaque opération date exacte/heure

---

## 🚀 Prêt pour

- ✅ Utilisation locale (petit commerçant)
- ✅ Présentation/démo
- ✅ Tests utilisateurs
- ✅ Migration données vers backend
- ✅ Ajout d'authentification
- ✅ Intégration Wave/carte réelle

---

## 📝 Version suivante (v2)

Idées pour améliorations futures :
- Authentification utilisateur
- Intégration paiement Wave réelle
- Backup/export données en CSV/PDF
- Gestion des stocks
- Réductions/promotions
- Modèles de clients (VVIP, VIP, régulier)
- Rappels de paiement
- Analytics avancée

