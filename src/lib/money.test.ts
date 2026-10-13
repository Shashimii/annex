import { describe, expect, it } from 'vitest'
import { MAX_CENTAVOS, formatAmount, parseAmount, toAmountInput } from '@/lib/money'

describe('parseAmount', () => {
  it.each([
    ['1250.50', 125050],
    ['1,250.50', 125050],
    ['₱1,250.5', 125050],
    [' 100 ', 10000],
    ['0.01', 1],
    ['.5', 50],
    ['12.', 1200],
    ['99999999.99', MAX_CENTAVOS],
  ])('parses %j as %i centavos', (input, expected) => {
    expect(parseAmount(input)).toBe(expected)
  })

  it.each(['', ' ', '.', '₱', '0', '0.00', '-5', '1.234', 'abc', '1e3', '1.2.3', '100000000'])(
    'rejects %j',
    (input) => {
      expect(parseAmount(input)).toBeNull()
    },
  )

  it('never produces float error', () => {
    // 0.1 + 0.2 style inputs must land on exact integers.
    expect(parseAmount('0.29')).toBe(29)
    expect(parseAmount('1.15')).toBe(115)
    expect(parseAmount('4.35')).toBe(435)
  })
})

describe('formatAmount', () => {
  it('formats centavos as pesos', () => {
    expect(formatAmount(125050)).toBe('₱1,250.50')
    expect(formatAmount(0)).toBe('₱0.00')
    expect(formatAmount(-5000)).toBe('-₱50.00')
  })
})

describe('toAmountInput', () => {
  it('round-trips with parseAmount', () => {
    for (const centavos of [1, 50, 100, 125050, MAX_CENTAVOS]) {
      expect(parseAmount(toAmountInput(centavos))).toBe(centavos)
    }
    expect(toAmountInput(125005)).toBe('1250.05')
  })
})
