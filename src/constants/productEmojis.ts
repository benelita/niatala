import { PRODUCT_EMOJIS_BAR } from './productEmojisBar'
import { PRODUCT_EMOJIS_EPICERIE } from './productEmojisEpicerie'
import { PRODUCT_EMOJIS_QUINCAILLERIE } from './productEmojisQuincaillerie'

// Banques d'illustrations par type
export const EMOJI_BANKS = {
  bar: PRODUCT_EMOJIS_BAR,
  epicerie: PRODUCT_EMOJIS_EPICERIE,
  quincaillerie: PRODUCT_EMOJIS_QUINCAILLERIE,
}

// Défaut: Épicerie
export const PRODUCT_EMOJIS = PRODUCT_EMOJIS_EPICERIE

// Pour la compatibilité avec ancien code
export { PRODUCT_EMOJIS_BAR, PRODUCT_EMOJIS_EPICERIE, PRODUCT_EMOJIS_QUINCAILLERIE }
