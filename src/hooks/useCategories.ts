import { useStorage } from './useStorage'

export function useCategories() {
  const [categories, setCategories] = useStorage<string[]>('niatala_categories', [
    'Boissons',
    'Alimentation',
    'Hygiène',
    'Maison',
    'Cosmétiques',
    'Électronique',
    'Vêtements',
    'Services',
    'Autres',
  ])

  const addCategory = (name: string) => {
    if (!categories.includes(name)) {
      setCategories([...categories, name])
    }
  }

  const removeCategory = (name: string) => {
    setCategories(categories.filter(c => c !== name))
  }

  const hasCategory = (name: string) => {
    return categories.includes(name)
  }

  return {
    categories,
    addCategory,
    removeCategory,
    hasCategory,
  }
}
