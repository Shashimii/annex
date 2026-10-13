const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })

/** Formats integer centavos for display: 125050 → "₱1,250.50". */
export function formatAmount(centavos: number): string {
  return peso.format(centavos / 100)
}
