# 🚀 Déploiement Render - NIATALA BETA

## Architecture

```
Frontend (React/Vite) → API (Express/Node) → PostgreSQL
  :3000                  :3001              Managed
```

## Configuration rapide

### 1. Connecter le repo GitHub à Render

1. Va sur [render.com](https://render.com)
2. Crée un nouveau **Web Service** (pas besoin de créer manuellement!)
3. Relie ton repo `benelita/niatala` (branche `main` pour la BETA)
4. **Render détectera automatiquement `render.yaml`** et créera:
   - Service Frontend (niatala-beta)
   - Service API (niatala-api)
   - Base de données PostgreSQL (niatala-db)

### 2. Configuration automatique via render.yaml
✅ Tout est configuré! Le fichier `render.yaml` inclut:
- **Frontend**: Vite preview server (port 3000)
- **API**: Express server (port 3001)
- **Database**: PostgreSQL gratuit (100MB)
- **Variables d'env**: Autorisées via Render

### 3. JWT Secret & clés sensibles
⚠️ **IMPORTANT**: Avant de déployer:
1. Va dans Render Dashboard → Chaque service
2. Ajoute les variables sensibles:
   - `JWT_SECRET` → Génère une clé forte
   - `WAVE_API_KEY`, `ORANGE_API_KEY`, etc → Utilise tes vraies clés

### 4. Deploy
- Render va déployer automatiquement quand tu pushs sur `main`
- Les deux services (API + Frontend) se lancent
- La DB se crée automatiquement
- Les migrations Prisma se lancent via `npm run build`

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

- ✅ `render.yaml` configuré (frontend + backend + database)
- ✅ `package.json` scripts: `build`, `start`, `migrate`
- ✅ `.env` NOT committed
- ✅ Prisma migrations en place
- ✅ JWT_SECRET défini (pas default)
- ✅ Payment API keys configurées (Wave, Orange, Free)
- ✅ Tests locaux passent

## URLs Finales

Après deploy:
- **Frontend**: https://niatala-beta.onrender.com
- **API**: https://niatala-api.onrender.com
- **Database**: Managed by Render (PostgreSQL)

## Support Render

- Logs: Render Dashboard → Logs
- Redeploy: Click "Deploy" button
- Rollback: Click "Previous Deploys"
