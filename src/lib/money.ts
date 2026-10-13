const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })

/** The largest amount Annex accepts: ₱99,999,999.99. */
export const MAX_CENTAVOS = 9_999_999_999

const AMOUNT_PATTERN = /^(\d*)(?:\.(\d{0,2}))?$/

/** Formats integer centavos for display: 125050 → "₱1,250.50". */
export function formatAmount(centavos: number): string {
  return peso.format(centavos / 100)
}

/**
 * Parses what the user typed into integer centavos: "1,250.50" → 125050.
 * Returns null unless it's a positive amount with at most 2 decimals.
 */
export function parseAmount(input: string): number | null {
  const match = AMOUNT_PATTERN.exec(input.replace(/[₱,\s]/g, ''))
  if (!match) return null

  const [, pesos, cents = ''] = match
  if (pesos === '' && cents === '') return null

  const centavos = Number(pesos || '0') * 100 + Number(cents.padEnd(2, '0'))
  return centavos > 0 && centavos <= MAX_CENTAVOS ? centavos : null
}

/** Integer centavos as plain input text, for editing: 125050 → "1250.50". */
export function toAmountInput(centavos: number): string {
  return `${Math.floor(centavos / 100)}.${String(centavos % 100).padStart(2, '0')}`
}
