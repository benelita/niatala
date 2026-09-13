import { useStorage } from './useStorage'

interface AppSettings {
  enableInventory: boolean
}

const DEFAULT_SETTINGS: AppSettings = {
  enableInventory: true, // Activé par défaut pour la compatibilité
}

export function useSettings() {
  const [settings, setSettings] = useStorage<AppSettings>('niatala_settings', DEFAULT_SETTINGS)

  const toggleInventory = () => {
    setSettings({
      ...settings,
      enableInventory: !settings.enableInventory,
    })
  }

  return {
    settings,
    enableInventory: settings.enableInventory,
    toggleInventory,
    updateSettings: (newSettings: Partial<AppSettings>) => {
      setSettings({ ...settings, ...newSettings })
    },
  }
}
