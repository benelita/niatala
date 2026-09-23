# 🚀 Déploiement Render - NIATALA BETA

## Configuration rapide

### 1. Connecter le repo GitHub à Render

1. Va sur [render.com](https://render.com)
2. Crée un nouveau **Web Service**
3. Relie ton repo `benelita/niatala` (branche `main` pour la BETA)
4. Render détectera automatiquement `render.yaml`

### 2. Configuration Render
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start`
- **Node Version**: 18+
- **Environment**: `production`

### 3. Variables d'environnement
Ajouter dans Render Dashboard:
```
NODE_ENV=production
VITE_API_URL=https://niatala-api.onrender.com
```

### 4. Deploy
- Render va déployer automatiquement quand tu pushs sur `main`
- Pour la branche `develop`: crée un second service pointant sur `develop`

## Branches

- **main** → BETA PRODUCTION (deploy automatique)
- **develop** → Testing/Dev (deploy optionnel)

## Contrôle de version

### Pour BETA (main):
```bash
git checkout main
# ... make changes ...
git push origin main
# Render auto-deploy
```

### Pour Development (develop):
```bash
git checkout develop
# ... make changes ...
git push origin develop
```

## Troubleshooting

### "Build failed"
- Vérifier les logs Render
- S'assurer que `npm run build` fonctionne localement
- Vérifier les variables d'env

### "Port 3000 not available"
- Render va trouver un port libre automatiquement
- Vérifier dans les logs du service

### Frontend ne charge pas
- Vérifier la URL VITE_API_URL
- Vérifier `dist/` est généré correctement
- Vérifier les CORS settings

## Production Checklist

- ✅ `render.yaml` configuré
- ✅ `package.json` a le script `start`
- ✅ `.env` NOT committed
- ✅ Backend API disponible (si utilisé)
- ✅ Tests locaux passent
