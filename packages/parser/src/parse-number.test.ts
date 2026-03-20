import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { parseBrNumber, parseBrPercentage } from './parse-number.ts'

describe('parseBrNumber', () => {
  it('should parse Brazilian number format (dot as thousands, comma as decimal)', () => {
    assert.equal(parseBrNumber('327.580.707,82'), 327580707.82)
  })

  it('should parse number with no thousands separator', () => {
    assert.equal(parseBrNumber('10,129239'), 10.129239)
  })

  it('should parse zero', () => {
    assert.equal(parseBrNumber('0,00'), 0)
  })

  it('should parse number with many decimal places', () => {
    assert.equal(parseBrNumber('30.000.000,0000'), 30000000)
  })

  it('should handle whitespace', () => {
    assert.equal(parseBrNumber('  327.580.707,82  '), 327580707.82)
  })

  it('should return 0 for empty string', () => {
    assert.equal(parseBrNumber(''), 0)
  })
})

describe('parseBrPercentage', () => {
  it('should parse percentage with % sign', () => {
    assert.equal(parseBrPercentage('0,1080%'), 0.108)
  })

  it('should parse percentage without % sign', () => {
    assert.equal(parseBrPercentage('2,2528'), 2.2528)
  })

  it('should parse zero percentage', () => {
    assert.equal(parseBrPercentage('0,0000%'), 0)
  })
})
