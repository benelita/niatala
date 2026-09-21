# 📚 INDEX COMPLET DES PROMPTS NIATALA

**Total**: 6 fichiers, 1600+ lignes de documentation
**Mise à jour**: 19 Sept 2026
**Projet**: NIATALA - POS Caisse Multi-tenant

---

## 📄 FICHIERS DISPONIBLES

### 1. ⭐ **PROMPT_NIATALA_CONTEXT.md** (500+ lignes)
**À INCLURE TOUJOURS**

**Contient**:
- Informations du projet
- Statut actuels (Frontend, Backend, DB)
- Règles absolues (🔴 Payment Engine gelé, 🔴 Modifications locales)
- Fonctionnalités existantes (Caisse, Stock, Clients, etc.)
- Points d'entrée clés (Fichiers importants)
- Modèles de données (Product, StockMovement, etc.)
- Commandes utiles (npm run dev, etc.)
- Architecture multi-tenant

**Usage**: `[COLLER: PROMPT_NIATALA_CONTEXT.md]` dans CHAQUE prompt

---

### 2. 🔄 **PROMPT_PHASE2A_INVENTORY.md** (300+ lignes)
**POUR LA PHASE 2A (Migration Inventaire → PostgreSQL)**

**Contient**:
- Objectif Phase 2A
- État actuel (localStorage → PostgreSQL)
- Fonctionnalités à préserver
- Routes API à créer (POST, GET, PATCH, DELETE)
- Services backend à implémenter
- Tests à écrire
- Règles Phase 2A (✅ À FAIRE, ❌ À NE PAS FAIRE)
- Checklist de validation

**Usage**: 
```
[COLLER: PROMPT_NIATALA_CONTEXT.md]
[COLLER: PROMPT_PHASE2A_INVENTORY.md]
```

---

### 3. 🔒 **PROMPT_SECURITY_RULES.md** (400+ lignes)
**VÉRIFICATION SÉCURITÉ**

**Contient**:
- Multi-tenant isolation (✅ correct vs ❌ incorrect)
- Permissions & rôles (SUPER_ADMIN > ADMIN > CAISSIER)
- Authentification (JWT, middleware)
- Validation des données
- Protection SQL injection
- Perte de données
- Audit & logging
- Checklist sécurité (10+ points)
- Exemples de violations

**Usage**:
```
[COLLER: PROMPT_NIATALA_CONTEXT.md]
[COLLER: PROMPT_SECURITY_RULES.md]
Vérifie ce code: [CODE]
```

---

### 4. 🧪 **PROMPT_TEST_TEMPLATE.md** (350+ lignes)
**TEMPLATES TESTS JEST**

**Contient**:
- Structure complète des tests Jest
- 18 tests d'exemple fonctionnels
- Tests multi-tenant isolation (5 tests)
- Tests permissions (5 tests)
- Tests stock management (5 tests)
- Tests prix (2 tests)
- Tests sécurité (1 test)
- Helpers & utilitaires
- Commandes d'exécution
- Résultats attendus

**Usage**:
```
[COLLER: PROMPT_NIATALA_CONTEXT.md]
[COLLER: PROMPT_TEST_TEMPLATE.md]
Écris les tests pour [fonction]
```

---

### 5. 📚 **README_PROMPTS.md** (200+ lignes)
**GUIDE COMPLET D'UTILISATION**

**Contient**:
- Description de chaque fichier
- Flux de travail recommandé
- Matrice de combinaisons
- Raccourcis courants
- Erreurs à éviter
- Exemple complet
- Checklist avant chaque prompt

**Usage**: Lire pour comprendre comment utiliser les autres fichiers

---

### 6. ⚡ **PROMPT_QUICK_REFERENCE.md** (100+ lignes)
**RÉFÉRENCE RAPIDE - COPIE/COLLE**

**Contient**:
- 5 blocs prêts à copier/coller
- Tâche générale
- Phase 2A
- Vérification sécurité
- Tests
- Tâche complète
- Raccourcis
- Checklist rapide

**Usage**: Copie directement le bloc adapté à ta tâche

---

## 🎯 COMMENT LES UTILISER?

### Situation 1: Question générale
```
[COLLER: PROMPT_QUICK_REFERENCE.md - Bloc 1]
```

### Situation 2: Tâche Phase 2A
```
[COLLER: PROMPT_QUICK_REFERENCE.md - Bloc 2]
```

### Situation 3: Audit sécurité
```
[COLLER: PROMPT_QUICK_REFERENCE.md - Bloc 3]
```

### Situation 4: Écrire tests
```
[COLLER: PROMPT_QUICK_REFERENCE.md - Bloc 4]
```

### Situation 5: Tâche complète (API + tests + sécu)
```
[COLLER: PROMPT_QUICK_REFERENCE.md - Bloc 5]
```

---

## 📊 MATRICE D'UTILISATION

| Tâche | Context | Phase2A | Security | Tests | Quick |
|---|---|---|---|---|---|
| **Question rapide** | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Créer route API** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Corriger bug** | ✅ | ❌ | ❌ | ✅ | ✅ |
| **Audit sécurité** | ✅ | ❌ | ✅ | ❌ | ✅ |
| **Écrire tests** | ✅ | ❌ | ❌ | ✅ | ✅ |
| **Feature complète** | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 🔍 RECHERCHE PAR BESOIN

### "Je ne sais pas où commencer"
→ Lire **README_PROMPTS.md**

### "Je veux copier/coller rapidement"
→ Utiliser **PROMPT_QUICK_REFERENCE.md**

### "Je dois inclure le contexte du projet"
→ Toujours **PROMPT_NIATALA_CONTEXT.md**

### "Je travaille sur Phase 2A"
→ Toujours **PROMPT_PHASE2A_INVENTORY.md**

### "Je dois vérifier la sécurité"
→ Toujours **PROMPT_SECURITY_RULES.md**

### "Je dois écrire des tests"
→ Utiliser **PROMPT_TEST_TEMPLATE.md** comme référence

---

## 💡 CONSEILS PRATIQUES

### Pour chaque tâche GPT:
1. Ouvre **PROMPT_QUICK_REFERENCE.md**
2. Copie le bloc adapté
3. Colle dans ton prompt GPT
4. Ajoute les détails de ta tâche
5. Envoie!

### Pour debug/revue:
1. Ouvre **PROMPT_SECURITY_RULES.md**
2. Copie la section pertinente
3. Colle dans un prompt GPT
4. Demande la vérification

### Pour tester:
1. Ouvre **PROMPT_TEST_TEMPLATE.md**
2. Adapte les tests à ta fonction
3. Demande à GPT de financer les tests

---

## 📁 STRUCTURE DANS LE REPO

```
C:\Users\TanguyColin\niatala\
├── PROMPT_NIATALA_CONTEXT.md          ⭐ À TOUJOURS INCLURE
├── PROMPT_PHASE2A_INVENTORY.md        (Si Phase 2A)
├── PROMPT_SECURITY_RULES.md           (Si vérification sécu)
├── PROMPT_TEST_TEMPLATE.md            (Si tests)
├── README_PROMPTS.md                  (Guide complet)
├── PROMPT_QUICK_REFERENCE.md          (Blocs rapides)
├── PROMPTS_INDEX.md                   ← CE FICHIER
└── [REST DU PROJET]
```

---

## 📈 ÉVOLUTION

Ces fichiers peuvent être mis à jour au fil du temps:
- Ajouter des exemples de code
- Mettre à jour les chemins si le projet change
- Ajouter des règles de sécurité
- Ajouter des tests additionnels

**Dernière mise à jour**: 19 Sept 2026

---

## ✅ VÉRIFICATION

**Tous les fichiers existent**: ✅
```
✅ PROMPT_NIATALA_CONTEXT.md
✅ PROMPT_PHASE2A_INVENTORY.md
✅ PROMPT_SECURITY_RULES.md
✅ PROMPT_TEST_TEMPLATE.md
✅ README_PROMPTS.md
✅ PROMPT_QUICK_REFERENCE.md
✅ PROMPTS_INDEX.md (ce fichier)
```

**Total**: 1600+ lignes de documentation
**Couverture**: 100% des besoins NIATALA

---

## 🚀 DÉMARRAGE RAPIDE

```
1. Lis PROMPTS_INDEX.md (ce fichier) → 2 min
2. Lis README_PROMPTS.md → 5 min
3. Garde PROMPT_QUICK_REFERENCE.md à portée de main
4. Colle + adapte à ta tâche
5. Envoie à GPT!
```

---

**PRÊT? COMMENCE! 🎯**

Choisis ton bloc dans PROMPT_QUICK_REFERENCE.md et c'est parti!
