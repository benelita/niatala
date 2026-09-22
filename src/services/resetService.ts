export function resetApplication() {
  // Réinitialiser toutes les données du localStorage
  const keysToReset = [
    'users',
    'sales',
    'clients',
    'products',
    'categories',
    'payments',
    'debts',
    'auditLogs',
    'freeAmounts',
    'inventory',
    'paymentSettings',
    'settings',
    'session',
  ]

  for (const key of keysToReset) {
    localStorage.removeItem(key)
  }

  // Recharger l'application pour reinitialiser l'état
  window.location.reload()
}

export function resetApplicationKeepProducts() {
  try {
    // Sauvegarder les produits et catégories
    const products = localStorage.getItem('products')
    const categories = localStorage.getItem('categories')
    const waveAccount = localStorage.getItem('waveAccount')
    const orangeAccount = localStorage.getItem('orangeAccount')
    const freeAccount = localStorage.getItem('freeAccount')

    // Vider le localStorage complètement
    localStorage.clear()

    // Restaurer SEULEMENT les produits et catégories
    if (products) localStorage.setItem('products', products)
    if (categories) localStorage.setItem('categories', categories)

    // Restaurer les comptes de paiement
    if (waveAccount) localStorage.setItem('waveAccount', waveAccount)
    if (orangeAccount) localStorage.setItem('orangeAccount', orangeAccount)
    if (freeAccount) localStorage.setItem('freeAccount', freeAccount)

    // Créer un inventaire vide
    localStorage.setItem('inventory', '{}')

    // Recharger l'application
    window.location.reload()
  } catch (e) {
    alert('Erreur lors de la réinitialisation: ' + (e instanceof Error ? e.message : 'Erreur inconnue'))
  }
}
