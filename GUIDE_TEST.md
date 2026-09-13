# Guide de test NIATALA - Version 1.0

## Démarrage

L'application fonctionne sur `http://localhost:5173`

## Fonctionnalités implémentées

### ✅ 1. Écran Caisse (🛒)
- Recherche de produits
- Filtrage par catégories
- Ajout au panier
- Modification des quantités
- Suppression d'articles
- Calcul dynamique du total
- 4 modes de paiement : ESPÈCES, WAVE, CARTE, CRÉDIT

### ✅ 2. Gestion des clients (👥)
- Création de clients
- Visualisation de la liste des clients
- Fiche client détaillée
- Historique des opérations (achats et paiements)
- Suivi de la dette actuelle

### ✅ 3. Ventes à crédit (📒 Crédit)
- Sélection d'un client existant
- Création d'un nouveau client à la vente
- Paiement partiel ou complet à la vente
- Enregistrement automatique de la dette
- Suivi du montant dû

### ✅ 4. Historique des ventes (🧾)
- Liste de toutes les ventes
- Filtrage par mode de paiement
- Filtrage par statut (PAYÉ, CRÉDIT, CRÉDIT PARTIEL, RÉGLÉ)
- Filtrage par période (aujourd'hui, cette semaine, ce mois)
- Recherche par numéro de vente ou nom de client
- Affichage détaillé de chaque vente

### ✅ 5. Carnet de crédits (📒 Crédits)
- Vue globale des créances totales
- Nombre de clients débiteurs
- Liste des clients avec dette
- Enregistrement de paiements partiels
- Boutons rapides pour 5K, 10K, 25K FCFA
- Bouton TOTAL pour payer la dette complète

### ✅ 6. Tableau de bord (📊)
- Chiffre d'affaires du jour
- Montant effectivement encaissé
- Créances clients restantes
- Ventilation par mode de paiement
- Analyse des crédits

### ✅ 7. Persistance des données (localStorage)
- Les ventes sont sauvegardées
- Les clients sont sauvegardés
- Les dettes sont sauvegardées
- Les paiements sont enregistrés
- Tout persiste après actualisation de la page

---

## Scénario de test complet

### Étape 1-2 : Créer un client et une vente

1. Allez dans **👥 Clients**
2. Cliquez sur **➕ Nouveau client**
3. Remplissez :
   - Nom : **Amadou Ndiaye**
   - Téléphone : **77123456**
   - Adresse : (facultatif)
4. Cliquez sur **Créer le client**
5. Vérifiez qu'Amadou Ndiaye apparaît dans la liste

### Étape 3-4 : Créer une vente de 20 000 FCFA

6. Allez dans **🛒 Caisse**
7. Ajouter des produits pour atteindre 20 000 FCFA. Exemple :
   - Huile 1L (1 500 FCFA) × 10 = 15 000
   - Riz 1kg (1 000 FCFA) × 5 = 5 000
   - **Total : 20 000 FCFA**

### Étape 5-7 : Vente à crédit avec paiement partiel

8. Cliquez sur **📒 CRÉDIT**
9. Une fenêtre modale s'ouvre
10. Cliquez sur l'onglet **Client existant**
11. Tapez dans la recherche : **Amadou** ou **77123456**
12. Cliquez sur **Amadou Ndiaye**
13. Dans **Montant payé maintenant**, entrez ou cliquez le bouton **5 000** (5K)
14. Vérifiez que **Montant restant dû** affiche **15 000 FCFA**
15. Cliquez sur **Valider la vente**
16. Une alerte confirme : "Vente enregistrée : VTE-1001"

### Étape 8-9 : Vérifier la vente et la dette

17. Allez dans **🧾 Ventes**
18. Vous devez voir une ligne avec :
    - N° vente : **VTE-1001**
    - Client : **Amadou Ndiaye**
    - Montant : **20 000 FCFA**
    - Paiement : **📒 CRÉDIT**
    - Statut : **CRÉDIT PARTIEL** (car 5K payés, 15K restants)

19. Allez dans **👥 Clients**
20. Cliquez sur **Amadou Ndiaye** (ou cherchez-le)
21. Vérifiez :
    - **Dette actuelle : 15 000 FCFA**
    - Dans l'historique, vous devez voir une ligne :
      - Date : aujourd'hui
      - Type : **Achat à crédit** (badge rouge)
      - Montant : **+15 000 FCFA**
      - Solde : **15 000 FCFA**

### Étape 10-11 : Enregistrer des paiements

22. Allez dans **📒 Crédits**
23. Vous devez voir :
    - **CRÉANCES TOTALES : 15 000 FCFA**
    - **CLIENTS DÉBITEURS : 1**
    - Amadou Ndiaye dans la liste avec **Dette : 15 000 FCFA**

24. Cliquez sur le bouton **💰** (paiement) sur la ligne d'Amadou
25. Une fenêtre s'ouvre
26. Cliquez sur le bouton **10 000** (ou 10K)
27. Vérifiez que **Nouvelle dette : 5 000 FCFA**
28. Cliquez sur **Valider le paiement**
29. Un message s'affiche : "Paiement de 10 000 FCFA enregistré. Nouvelle dette: 5 000 FCFA"

### Étape 12 : Paiement final

30. Cliquez à nouveau sur le bouton **💰** pour Amadou
31. Cliquez sur le bouton **TOTAL**
32. Vérifiez que le montant est **5 000 FCFA**
33. Vérifiez que **Nouvelle dette : 0 FCFA**
34. Cliquez sur **Valider le paiement**
35. Message : "Paiement de 5 000 FCFA enregistré. Nouvelle dette: 0 FCFA"

### Étape 13 : Vérification du statut RÉGLÉ

36. Allez dans **👥 Clients**
37. Cliquez sur **Amadou Ndiaye**
38. Vérifiez :
    - **Dette actuelle : 0 FCFA**
    - Dans l'historique, vous voyez maintenant 3 lignes :
      1. Achat à crédit : +15 000 | Solde : 15 000
      2. Paiement : -10 000 | Solde : 5 000
      3. Paiement : -5 000 | Solde : 0

39. Allez dans **📒 Crédits**
40. Vérifiez :
    - **CRÉANCES TOTALES : 0 FCFA**
    - **CLIENTS DÉBITEURS : 0**
    - Amadou ne devrait plus apparaître dans la liste

### Étape 14 : Persistance des données

41. **Actualiser la page** (F5 ou Ctrl+R)
42. Allez dans **🧾 Ventes**
43. Vérifiez que **VTE-1001** est toujours présente avec les mêmes informations
44. Allez dans **👥 Clients**
45. Vérifiez qu'**Amadou Ndiaye** est toujours présent avec **Dette : 0 FCFA**
46. Allez dans **📒 Crédits**
47. Vérifiez qu'**Amadou n'apparaît pas** (dette = 0)
48. Allez dans **📊 Tableau de bord**
49. Vérifiez les statistiques du jour

---

## Résumé des fichiers créés

### Fichiers créés :
- `src/types/index.ts` — Types TypeScript globaux
- `src/hooks/useStorage.ts` — Gestion du localStorage
- `src/hooks/useSales.ts` — Gestion des ventes
- `src/hooks/useClients.ts` — Gestion des clients et dettes
- `src/screens/CashierScreen.tsx` — Écran caisse
- `src/screens/SalesScreen.tsx` — Historique des ventes
- `src/screens/ClientsScreen.tsx` — Gestion des clients
- `src/screens/CreditsScreen.tsx` — Carnet de crédits
- `src/screens/DashboardScreen.tsx` — Tableau de bord
- `src/styles/CashierScreen.css` — Style caisse
- `src/styles/SalesScreen.css` — Style ventes
- `src/styles/ClientsScreen.css` — Style clients
- `src/styles/CreditsScreen.css` — Style crédits
- `src/styles/DashboardScreen.css` — Style dashboard

### Fichiers modifiés :
- `src/App.tsx` — Navigation entre écrans
- `src/App.css` — Layout global
- `index.html` — Titre et langue

---

## Structure de stockage (localStorage)

Les données sont stockées en JSON :
- `niatala_sales` — Array de sales
- `niatala_sale_counter` — Compteur pour numéros de vente
- `niatala_clients` — Array de clients avec opérations

---

## Points importants à tester

✅ **Paiements** : Espèces, Wave, Carte, Crédit  
✅ **Clients** : Création, recherche, fiche détaillée  
✅ **Dettes** : Enregistrement, paiements, historique  
✅ **Ventes** : Création, filtrage, affichage détaillé  
✅ **Calcul** : Totaux, dettes, créances  
✅ **Persistance** : Actualisation, relance  
✅ **Responsivité** : Bureau, tablette, mobile  
✅ **Texte** : Aucun texte coupé, lisibilité  

---

## Erreurs possibles à ignorer

Si vous voyez dans la console :
- `localStorage quota exceeded` — Trop de données. Nettoyer : 
  ```javascript
  localStorage.clear()
  ```
  Puis actualiser la page.

---

## Support

Pour tester sur mobile/tablette :
- Sur PC : Ouvrir DevTools (F12) → Mode responsive → Choisir "iPad" ou "Mobile"
- Sur téléphone : Accéder à `http://<IP_DE_VOTRE_PC>:5173` (remplacer l'IP)

