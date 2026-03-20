import { describe, it, expect } from 'vitest'
import { formatBrl, formatPercent, formatCompact, formatChange } from '../src/lib/format.ts'

describe('formatBrl', () => {
  it('should format number as BRL currency', () => {
    expect(formatBrl(327580707.82)).toBe('R$\u00a0327.580.707,82')
  })

  it('should format zero', () => {
    expect(formatBrl(0)).toBe('R$\u00a00,00')
  })
})

describe('formatPercent', () => {
  it('should format percentage with comma decimal', () => {
    expect(formatPercent(2.2528)).toBe('2,25%')
  })

  it('should format zero percentage', () => {
    expect(formatPercent(0)).toBe('0,00%')
  })
})

describe('formatCompact', () => {
  it('should format millions', () => {
    expect(formatCompact(327580707.82)).toBe('R$ 327,6 mi')
  })

  it('should format billions', () => {
    expect(formatCompact(1500000000)).toBe('R$ 1,5 bi')
  })

  it('should format thousands', () => {
    expect(formatCompact(5021.85)).toBe('R$ 5,0 mil')
  })
})

describe('formatChange', () => {
  it('should format positive change', () => {
    const result = formatChange(310, 300)
    expect(result.text).toBe('+3,33%')
    expect(result.direction).toBe('up')
  })

  it('should format negative change', () => {
    const result = formatChange(290, 300)
    expect(result.text).toBe('-3,33%')
    expect(result.direction).toBe('down')
  })

  it('should handle zero previous value', () => {
    const result = formatChange(100, 0)
    expect(result.text).toBe('--')
    expect(result.direction).toBe('flat')
  })

  it('should handle no change', () => {
    const result = formatChange(100, 100)
    expect(result.text).toBe('0,00%')
    expect(result.direction).toBe('flat')
  })
})
