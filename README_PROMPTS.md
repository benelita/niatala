# 📚 GUIDE DES PROMPTS NIATALA

## 📋 Documents de Référence

Ce dossier contient des documents que tu peux coller dans les prompts GPT pour assurer la cohérence et la qualité du travail.

### 1️⃣ **PROMPT_NIATALA_CONTEXT.md** ⭐ À TOUJOURS INCLURE

**Utilisation**: Colle ce document dans **CHAQUE** prompt GPT

**Contient**:
- ✅ Informations du projet
- ✅ Statut actuel
- ✅ Règles absolues (Payment Engine, modifications locales)
- ✅ Fonctionnalités existantes
- ✅ Points d'entrée clés
- ✅ Modèles de données
- ✅ Commandes utiles
- ✅ Architecture multi-tenant

**Exemple de prompt**:
```
[COLLER: PROMPT_NIATALA_CONTEXT.md]

Je veux créer les routes API pour l'inventaire. 
Voici ce que je veux faire: ...
```

---

### 2️⃣ **PROMPT_PHASE2A_INVENTORY.md** 

**Utilisation**: Colle ce document pour tout travail lié à la PHASE 2A

**Contient**:
- ✅ Objectif de la Phase 2A
- ✅ Fonctionnalités à préserver
- ✅ Routes API à créer
- ✅ Services à implémenter
- ✅ Tests à écrire
- ✅ Checklist de validation

**Exemple de prompt**:
```
[COLLER: PROMPT_NIATALA_CONTEXT.md]
[COLLER: PROMPT_PHASE2A_INVENTORY.md]

Je dois créer les routes API d'inventaire. Voici mon plan:
...
```

---

### 3️⃣ **PROMPT_SECURITY_RULES.md**

**Utilisation**: Colle ce document avant de demander une revue de sécurité

**Contient**:
- ✅ Multi-tenant isolation (✅ correct, ❌ incorrect)
- ✅ Permissions & rôles
- ✅ Authentification
- ✅ Validation des données
- ✅ Protection SQL injection
- ✅ Perte de données
- ✅ Audit & logging
- ✅ Checklist de sécurité
- ✅ Exemples de violations

**Exemple de prompt**:
```
[COLLER: PROMPT_NIATALA_CONTEXT.md]
[COLLER: PROMPT_SECURITY_RULES.md]

J'ai écrit les routes API pour les produits. 
Peux-tu vérifier la sécurité? Voici le code: ...
```

---

### 4️⃣ **PROMPT_TEST_TEMPLATE.md**

**Utilisation**: Colle ce document pour écrire/vérifier les tests

**Contient**:
- ✅ Structure complète des tests Jest
- ✅ Exemples de 18 tests fonctionnels
- ✅ Tests multi-tenant
- ✅ Tests permissions
- ✅ Tests stock & calculs
- ✅ Tests prix
- ✅ Tests sécurité
- ✅ Checklist avant commit
- ✅ Résultats attendus

**Exemple de prompt**:
```
[COLLER: PROMPT_NIATALA_CONTEXT.md]
[COLLER: PROMPT_TEST_TEMPLATE.md]

Écris les tests Jest pour les routes API de l'inventaire. 
Utilise le template fourni...
```

---

## 🔄 FLUX DE TRAVAIL RECOMMANDÉ

### Étape 1: Lancer une tâche
```
[COLLER: PROMPT_NIATALA_CONTEXT.md]

Je veux [décrire la tâche]
```

### Étape 2: Lancer une tâche spécifique à une phase
```
[COLLER: PROMPT_NIATALA_CONTEXT.md]
[COLLER: PROMPT_PHASE2A_INVENTORY.md]

Je veux [décrire la tâche] pour la Phase 2A
```

### Étape 3: Vérifier la sécurité
```
[COLLER: PROMPT_NIATALA_CONTEXT.md]
[COLLER: PROMPT_SECURITY_RULES.md]

Vérifie la sécurité de ce code: [CODE]
```

### Étape 4: Écrire/Vérifier les tests
```
[COLLER: PROMPT_NIATALA_CONTEXT.md]
[COLLER: PROMPT_TEST_TEMPLATE.md]

Écris les tests pour [cette fonction]
```

---

## 📊 MATRICE DE COMBINAISONS

| Tâche | Context | Phase | Security | Tests |
|---|---|---|---|---|
| Créer une route API | ✅ | ✅ (2A) | ✅ | ✅ |
| Corriger un bug | ✅ | — | — | ✅ |
| Audit du code | ✅ | — | ✅ | ✅ |
| Implémenter feature | ✅ | ✅ (relevant) | ✅ | ✅ |
| Revue sécurité | ✅ | — | ✅ | — |
| Question générale | ✅ | — | — | — |

---

## ⚡ RACCOURCIS COURANTS

### "Je crée les routes API de l'inventaire"
```
[COLLER: PROMPT_NIATALA_CONTEXT.md]
[COLLER: PROMPT_PHASE2A_INVENTORY.md]
[COLLER: PROMPT_SECURITY_RULES.md]

Crée les routes API pour l'inventaire [descriptions détaillées]
```

### "J'ai écrit du code, vérife-le"
```
[COLLER: PROMPT_NIATALA_CONTEXT.md]
[COLLER: PROMPT_SECURITY_RULES.md]
[COLLER: PROMPT_TEST_TEMPLATE.md]

Voici mon code [CODE]. Vérife:
1. Sécurité (multi-tenant, permissions)
2. Correctness
3. Suggest des tests
```

### "Écris les tests"
```
[COLLER: PROMPT_NIATALA_CONTEXT.md]
[COLLER: PROMPT_TEST_TEMPLATE.md]

Écris les tests Jest pour [cette fonctionnalité]
```

---

## 🚫 ERREURS À ÉVITER

### ❌ Oublier le contexte
```
"Crée une route API pour les produits"
```

### ✅ Inclure le contexte
```
[COLLER: PROMPT_NIATALA_CONTEXT.md]
[COLLER: PROMPT_PHASE2A_INVENTORY.md]

Crée la route API POST /api/inventory/products
```

---

### ❌ Oublier les considérations de sécurité
```
"Écris la logique pour créer un produit"
```

### ✅ Vérifier la sécurité
```
[COLLER: PROMPT_NIATALA_CONTEXT.md]
[COLLER: PROMPT_SECURITY_RULES.md]

Écris la logique pour créer un produit en assurant:
- Multi-tenant isolation
- Permissions ADMIN only
- Validation des données
```

---

### ❌ Créer du code sans tests
```
"Crée cette fonction"
```

### ✅ Inclure les tests
```
[COLLER: PROMPT_NIATALA_CONTEXT.md]
[COLLER: PROMPT_TEST_TEMPLATE.md]

Crée cette fonction ET écris les tests Jest
```

---

## 📝 EXEMPLE COMPLET

### Prompt complet pour une tâche Phase 2A:

```markdown
[COLLER: PROMPT_NIATALA_CONTEXT.md]
[COLLER: PROMPT_PHASE2A_INVENTORY.md]
[COLLER: PROMPT_SECURITY_RULES.md]
[COLLER: PROMPT_TEST_TEMPLATE.md]

## TÂCHE: Implémenter les routes API d'inventaire

### Objectif
Créer `backend/src/routes/inventory.ts` avec les endpoints:
- POST /api/inventory/products
- GET /api/inventory/products
- GET /api/inventory/products/:id
- PATCH /api/inventory/products/:id
- DELETE /api/inventory/products/:id

### Exigences
1. Multi-tenant isolation stricte
2. Permissions: ADMIN/SUPER_ADMIN pour modifier
3. Validation des données
4. Audit logs
5. Tests Jest complets
6. Gestion des erreurs

### Livrabes
1. ✅ Routes implémentées
2. ✅ Services créés si besoin
3. ✅ Tests Jest (15+ tests)
4. ✅ Sécurité vérifiée
5. ✅ Pas de modification du Payment Engine
6. ✅ Fonctionnalités existantes préservées

### Validation
- [ ] npm test - tous les tests passent
- [ ] npm run type-check - pas d'erreurs TypeScript
- [ ] Pas de console.log()
- [ ] Multi-tenant isolation vérifiée
- [ ] Permissions vérifiées
```

---

## 📦 STOCKAGE

Ces fichiers sont sauvegardés dans le dossier du projet:
```
C:\Users\TanguyColin\niatala\
├── PROMPT_NIATALA_CONTEXT.md
├── PROMPT_PHASE2A_INVENTORY.md
├── PROMPT_SECURITY_RULES.md
├── PROMPT_TEST_TEMPLATE.md
└── README_PROMPTS.md  ← tu es ici
```

---

## 🔍 RECHERCHE RAPIDE

| Besoin | Fichier |
|---|---|
| Comprendre le projet | CONTEXT.md |
| Travailler Phase 2A | PHASE2A.md |
| Vérifier sécurité | SECURITY_RULES.md |
| Écrire tests | TEST_TEMPLATE.md |

---

## ✅ CHECKLIST AVANT CHAQUE PROMPT

- [ ] Ai-je inclus PROMPT_NIATALA_CONTEXT.md?
- [ ] Est-ce une tâche Phase spécifique? (inclure son fichier)
- [ ] Besoin de sécurité? (inclure SECURITY_RULES.md)
- [ ] Besoin de tests? (inclure TEST_TEMPLATE.md)
- [ ] Ma description est claire et détaillée?
- [ ] J'ai mentionné les livrables attendus?
- [ ] J'ai précisé les critères de validation?

---

**PRÊT À UTILISER! 🚀**

Copie le contenu d'un fichier + colle dans ton prompt GPT.
