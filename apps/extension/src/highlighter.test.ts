import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { classifyValue, classifyChange, classifyVacancy } from './highlighter.ts'

describe('classifyValue', () => {
  it('should classify high dividend yield as positive', () => {
    assert.equal(classifyValue('dividendYield', 1.0), 'positive')
  })

  it('should classify low dividend yield as neutral', () => {
    assert.equal(classifyValue('dividendYield', 0.3), 'neutral')
  })

  it('should classify high admin fee as negative', () => {
    assert.equal(classifyValue('administrationFee', 0.3), 'negative')
  })

  it('should classify low admin fee as positive', () => {
    assert.equal(classifyValue('administrationFee', 0.05), 'positive')
  })
})

describe('classifyChange', () => {
  it('should classify positive net equity change as positive', () => {
    assert.equal(classifyChange('netEquity', 5), 'positive')
  })

  it('should classify negative net equity change as negative', () => {
    assert.equal(classifyChange('netEquity', -5), 'negative')
  })

  it('should classify zero change as neutral', () => {
    assert.equal(classifyChange('netEquity', 0), 'neutral')
  })

  it('should classify increased vacancy (negative occupancy change) as negative', () => {
    assert.equal(classifyChange('occupancyRate', -3), 'negative')
  })
})

describe('classifyVacancy', () => {
  it('should classify 0% vacancy as good', () => {
    assert.equal(classifyVacancy(0), 'good')
  })

  it('should classify 3% vacancy as good', () => {
    assert.equal(classifyVacancy(3), 'good')
  })

  it('should classify 5% vacancy as warn', () => {
    assert.equal(classifyVacancy(5), 'warn')
  })

  it('should classify 8% vacancy as warn', () => {
    assert.equal(classifyVacancy(8), 'warn')
  })

  it('should classify 10% vacancy as warn', () => {
    assert.equal(classifyVacancy(10), 'warn')
  })

  it('should classify 15% vacancy as bad', () => {
    assert.equal(classifyVacancy(15), 'bad')
  })

  it('should classify 100% vacancy as bad', () => {
    assert.equal(classifyVacancy(100), 'bad')
  })
})
