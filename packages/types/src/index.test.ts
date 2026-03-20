import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type {
  Fii,
  MonthlyReport,
  QuarterlyReport,
  ReportComparison,
  ReportChanges,
  FinancialSummary,
  AssetComposition,
  ShareholderComposition,
} from './index.ts'

describe('types', () => {
  const sampleFii: Fii = {
    ticker: 'XPLG11',
    name: 'XP Log Fundo de Investimento Imobiliário',
    cnpj: '26.502.794/0001-85',
    administrator: 'XP Investimentos',
    category: 'tijolo',
    subcategory: 'logistica',
    managementType: 'ativo',
    inceptionDate: '2018-01-01',
  }

  const sampleFinancials: FinancialSummary = {
    totalAssets: 327580000,
    netEquity: 303880000,
    shareValue: 10.13,
    totalShares: 30000000,
    monthlyReturn: 2.25,
    capitalAppreciation: 1.16,
    dividendYield: 1.10,
    administrationFee: 0.108,
  }

  const sampleAssets: AssetComposition = {
    liquidityReserves: 13190000,
    realEstateInvestments: 177800000,
    realEstateReceivables: 9380000,
    companyShares: 127200000,
    otherAssets: 0,
  }

  it('should create a valid Fii', () => {
    assert.equal(sampleFii.ticker, 'XPLG11')
    assert.equal(sampleFii.category, 'tijolo')
    assert.equal(sampleFii.managementType, 'ativo')
  })

  it('should create a valid MonthlyReport', () => {
    const report: MonthlyReport = {
      type: 'monthly',
      fii: sampleFii,
      referenceDate: '2026-01-31',
      documentId: '1116679',
      financials: sampleFinancials,
      assets: sampleAssets,
      liabilities: {
        performanceFees: 719991,
        propertyAcquisitions: 10050000,
        otherPayables: 12610000,
        total: 23379991,
      },
    }

    assert.equal(report.type, 'monthly')
    assert.equal(report.fii.ticker, 'XPLG11')
    assert.equal(report.financials.totalAssets, 327580000)
  })

  it('should create a valid QuarterlyReport with extra fields', () => {
    const report: QuarterlyReport = {
      type: 'quarterly',
      fii: sampleFii,
      referenceDate: '2025-12-31',
      documentId: '1111497',
      shareholders: {
        total: 597,
        individuals: 591,
        corporates: 0,
        institutionals: 0,
        fiis: 6,
      },
      financials: sampleFinancials,
      assets: sampleAssets,
      liabilities: {
        performanceFees: 719991,
        propertyAcquisitions: 10050000,
        otherPayables: 12610000,
        total: 23379991,
      },
      occupancyRate: 95.5,
      defaultRate: 2.1,
      revenueBreakdown: {
        rentalIncome: 5000000,
        financialIncome: 1200000,
        otherIncome: 300000,
        total: 6500000,
      },
    }

    assert.equal(report.type, 'quarterly')
    assert.equal(report.shareholders.total, 597)
    assert.equal(report.occupancyRate, 95.5)
    assert.ok(report.revenueBreakdown)
    assert.equal(report.revenueBreakdown.total, 6500000)
  })

  it('should create a valid ReportComparison', () => {
    const shareholders: ShareholderComposition = {
      total: 597,
      individuals: 591,
      corporates: 0,
      institutionals: 0,
      fiis: 6,
    }

    const liabilities = {
      performanceFees: 719991,
      propertyAcquisitions: 10050000,
      otherPayables: 12610000,
      total: 23379991,
    }

    const current: MonthlyReport = {
      type: 'monthly',
      fii: sampleFii,
      referenceDate: '2026-02-28',
      documentId: '1120000',
      financials: { ...sampleFinancials, netEquity: 310000000 },
      assets: sampleAssets,
      liabilities,
    }

    const previous: MonthlyReport = {
      type: 'monthly',
      fii: sampleFii,
      referenceDate: '2026-01-31',
      documentId: '1116679',
      financials: sampleFinancials,
      assets: sampleAssets,
      liabilities,
    }

    const changes: ReportChanges = {
      netEquityChange: 6120000,
      netEquityChangePercent: 2.01,
      shareValueChange: 0,
      shareValueChangePercent: 0,
      totalAssetsChange: 0,
      totalAssetsChangePercent: 0,
    }

    const comparison: ReportComparison = { current, previous, changes }

    assert.equal(comparison.changes.netEquityChange, 6120000)
    assert.equal(comparison.changes.netEquityChangePercent, 2.01)
  })
})
