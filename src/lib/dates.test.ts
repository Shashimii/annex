import { describe, expect, it } from 'vitest'
import { formatDay, formatMonth, isValidDate, monthKey, shiftMonth, todayLocal } from '@/lib/dates'

describe('todayLocal', () => {
  it('uses the local calendar day, not UTC', () => {
    // 7:30 AM local on Oct 1 is still Sep 30 in UTC when the offset is positive (e.g. UTC+8).
    expect(todayLocal(new Date(2026, 9, 1, 7, 30))).toBe('2026-10-01')
    expect(todayLocal(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })
})

describe('monthKey', () => {
  it('pads the month', () => {
    expect(monthKey(new Date(2026, 0, 31))).toBe('2026-01')
    expect(monthKey(new Date(2026, 11, 1))).toBe('2026-12')
  })
})

describe('shiftMonth', () => {
  it('moves across year boundaries', () => {
    expect(shiftMonth('2026-12', 1)).toBe('2027-01')
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
    expect(shiftMonth('2026-10', 3)).toBe('2027-01')
  })
})

describe('isValidDate', () => {
  it.each(['2026-10-13', '2024-02-29', '2026-12-31'])('accepts %s', (value) => {
    expect(isValidDate(value)).toBe(true)
  })

  it.each(['2026-02-29', '2026-13-01', '2026-04-31', '2026-1-5', '13/10/2026', ''])('rejects %j', (value) => {
    expect(isValidDate(value)).toBe(false)
  })
})

describe('formatting', () => {
  it('formats months and days', () => {
    expect(formatMonth('2026-10')).toBe('October 2026')
    expect(formatDay('2026-10-13')).toBe('Tue, Oct 13')
  })
})
