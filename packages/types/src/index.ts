export type ReportType = 'monthly' | 'quarterly' | 'annual'

export type FiiCategory = 'tijolo' | 'papel' | 'hibrido' | 'fof'

export type FiiSubcategory =
  | 'lajes-corporativas'
  | 'logistica'
  | 'shoppings'
  | 'residencial'
  | 'hospitalar'
  | 'educacional'
  | 'hotel'
  | 'hibrido'
  | 'outros'

export interface Fii {
  ticker: string
  name: string
  cnpj: string
  isin?: string
  administrator: string
  category: FiiCategory
  subcategory?: FiiSubcategory
  managementType: 'ativo' | 'passivo'
  inceptionDate: string
}

export interface ShareholderComposition {
  total: number
  individuals: number
  corporates: number
  institutionals: number
  fiis: number
}

export interface FinancialSummary {
  totalAssets: number
  netEquity: number
  shareValue: number
  totalShares: number
  monthlyReturn?: number
  capitalAppreciation?: number
  dividendYield?: number
  administrationFee: number
}

export interface AssetComposition {
  liquidityReserves: number
  realEstateInvestments: number
  realEstateReceivables: number
  companyShares: number
  otherAssets: number
}

export interface Liabilities {
  performanceFees: number
  propertyAcquisitions: number
  otherPayables: number
  total: number
}

export interface DividendDistribution {
  baseDate: string
  paymentDate: string
  valuePerShare: number
}

export interface MonthlyReport {
  type: 'monthly'
  fii: Fii
  referenceDate: string
  documentId: string
  shareholders?: ShareholderComposition
  financials: FinancialSummary
  assets: AssetComposition
  liabilities: Liabilities
  dividends?: DividendDistribution
}

export interface QuarterlyReport {
  type: 'quarterly'
  fii: Fii
  referenceDate: string
  documentId: string
  shareholders: ShareholderComposition
  financials: FinancialSummary
  assets: AssetComposition
  liabilities: Liabilities
  dividends?: DividendDistribution
  revenueBreakdown?: RevenueBreakdown
  occupancyRate?: number
  defaultRate?: number
}

export interface RevenueBreakdown {
  rentalIncome: number
  financialIncome: number
  otherIncome: number
  total: number
}

export type Report = MonthlyReport | QuarterlyReport

export interface ReportComparison {
  current: Report
  previous: Report
  changes: ReportChanges
}

export interface ReportChanges {
  netEquityChange: number
  netEquityChangePercent: number
  shareValueChange: number
  shareValueChangePercent: number
  dividendYieldChange?: number
  totalAssetsChange: number
  totalAssetsChangePercent: number
}
