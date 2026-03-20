import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { parseMonthlyReport } from './monthly-report.ts'
import type { MonthlyReport } from '@kowalski/types'

describe('parseMonthlyReport', () => {
  let html: string
  let report: MonthlyReport

  before(async () => {
    const fixturesDir = new URL('../fixtures/', import.meta.url)
    html = await readFile(new URL('monthly-report.html', fixturesDir), 'utf-8')
    report = parseMonthlyReport(html, '1116679')
  })

  it('should detect report type as monthly', () => {
    assert.equal(report.type, 'monthly')
  })

  it('should parse the document id', () => {
    assert.equal(report.documentId, '1116679')
  })

  it('should parse the reference date from competência', () => {
    assert.equal(report.referenceDate, '2026-01')
  })

  describe('fii info', () => {
    it('should parse fund name', () => {
      assert.match(report.fii.name, /BTG PACTUAL YOU INC/)
    })

    it('should parse CNPJ', () => {
      assert.equal(report.fii.cnpj, '54.645.216/0001-33')
    })

    it('should parse ISIN', () => {
      assert.equal(report.fii.isin, 'BRBTYUCTF004')
    })

    it('should parse administrator', () => {
      assert.match(report.fii.administrator, /BTG PACTUAL/)
    })

    it('should parse category', () => {
      assert.equal(report.fii.category, 'tijolo')
    })

    it('should parse subcategory', () => {
      assert.equal(report.fii.subcategory, 'hibrido')
    })

    it('should parse management type', () => {
      assert.equal(report.fii.managementType, 'ativo')
    })

    it('should parse inception date', () => {
      assert.equal(report.fii.inceptionDate, '2024-04-17')
    })
  })

  describe('shareholders', () => {
    it('should parse total shareholders', () => {
      assert.equal(report.shareholders?.total, 597)
    })

    it('should parse individual shareholders', () => {
      assert.equal(report.shareholders?.individuals, 591)
    })

    it('should parse FII shareholders', () => {
      assert.equal(report.shareholders?.fiis, 6)
    })
  })

  describe('financials', () => {
    it('should parse total assets', () => {
      assert.equal(report.financials.totalAssets, 327580707.82)
    })

    it('should parse net equity', () => {
      assert.equal(report.financials.netEquity, 303877179.03)
    })

    it('should parse total shares', () => {
      assert.equal(report.financials.totalShares, 30000000)
    })

    it('should parse share value', () => {
      assert.equal(report.financials.shareValue, 10.129239)
    })

    it('should parse administration fee', () => {
      assert.equal(report.financials.administrationFee, 0.108)
    })

    it('should parse monthly return', () => {
      assert.equal(report.financials.monthlyReturn, 2.2528)
    })

    it('should parse capital appreciation', () => {
      assert.equal(report.financials.capitalAppreciation, 1.1572)
    })

    it('should parse dividend yield', () => {
      assert.equal(report.financials.dividendYield, 1.0956)
    })
  })

  describe('assets', () => {
    it('should parse liquidity reserves', () => {
      assert.equal(report.assets.liquidityReserves, 13194055.15)
    })

    it('should parse real estate investments', () => {
      assert.equal(report.assets.realEstateInvestments, 177803183.38)
    })

    it('should parse real estate receivables (CRI)', () => {
      assert.equal(report.assets.realEstateReceivables, 9378447.44)
    })

    it('should parse company shares', () => {
      assert.equal(report.assets.companyShares, 127200000)
    })
  })

  describe('liabilities', () => {
    it('should parse performance fees', () => {
      assert.equal(report.liabilities.performanceFees, 719991.29)
    })

    it('should parse property acquisitions', () => {
      assert.equal(report.liabilities.propertyAcquisitions, 10049749.19)
    })

    it('should parse total liabilities', () => {
      assert.equal(report.liabilities.total, 23703528.79)
    })
  })
})
