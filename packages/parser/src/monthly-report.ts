import { parseHTML } from 'linkedom'
import { parseBrNumber, parseBrPercentage } from './parse-number.ts'
import type { MonthlyReport, Fii, FiiCategory, FiiSubcategory, ShareholderComposition, FinancialSummary, AssetComposition, Liabilities } from '@kowalski/types'

const getHeaderValue = (doc: Document, label: string): string => {
  const spans = doc.querySelectorAll('.titulo-dado')
  for (const span of spans) {
    if (span.textContent?.trim().startsWith(label)) {
      const next = span.parentElement?.nextElementSibling
      if (next) {
        return next.textContent?.trim() ?? ''
      }
    }
  }
  return ''
}

const getValueByRowNumber = (doc: Document, rowNum: string): string => {
  const tables = doc.querySelectorAll('table')
  for (const table of tables) {
    const rows = table.querySelectorAll('tr')
    for (const row of rows) {
      const firstCell = row.querySelector('td')
      if (firstCell && firstCell.textContent?.trim() === rowNum) {
        const valueSpan = row.querySelector('.dado-valores')
        if (valueSpan) return valueSpan.textContent?.trim() ?? ''
      }
    }
  }
  return ''
}

const parseBrDate = (dateStr: string): string => {
  const parts = dateStr.split('/')
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
  }
  return dateStr
}

const parseCompetencia = (value: string): string => {
  const parts = value.split('/')
  if (parts.length === 2) {
    return `${parts[1]}-${parts[0].padStart(2, '0')}`
  }
  return value
}

const parseCategory = (text: string): FiiCategory => {
  const lower = text.toLowerCase()
  if (lower.includes('tijolo')) return 'tijolo'
  if (lower.includes('papel')) return 'papel'
  if (lower.includes('fof') || lower.includes('fundo de fundos')) return 'fof'
  return 'hibrido'
}

const parseSubcategory = (text: string): FiiSubcategory | undefined => {
  const lower = text.toLowerCase()
  if (lower.includes('lajes') || lower.includes('corporativas')) return 'lajes-corporativas'
  if (lower.includes('logística') || lower.includes('logistica')) return 'logistica'
  if (lower.includes('shopping')) return 'shoppings'
  if (lower.includes('residencial')) return 'residencial'
  if (lower.includes('hospitalar')) return 'hospitalar'
  if (lower.includes('educacional')) return 'educacional'
  if (lower.includes('hotel')) return 'hotel'
  if (lower.includes('híbrido') || lower.includes('hibrido')) return 'hibrido'
  return 'outros'
}

const parseManagementType = (text: string): 'ativo' | 'passivo' => {
  return text.toLowerCase().includes('ativa') ? 'ativo' : 'passivo'
}

const parseFii = (doc: Document): Fii => {
  const classificationCell = (() => {
    const spans = doc.querySelectorAll('.titulo-dado')
    for (const span of spans) {
      if (span.textContent?.trim().startsWith('Classificação autorregulação')) {
        return span.parentElement?.nextElementSibling?.textContent ?? ''
      }
    }
    return ''
  })()

  return {
    ticker: '',
    name: getHeaderValue(doc, 'Nome do Fundo/Classe'),
    cnpj: getHeaderValue(doc, 'CNPJ do Fundo/Classe'),
    isin: getHeaderValue(doc, 'Código ISIN') || undefined,
    administrator: getHeaderValue(doc, 'Nome do Administrador'),
    category: parseCategory(classificationCell),
    subcategory: parseSubcategory(classificationCell),
    managementType: parseManagementType(classificationCell),
    inceptionDate: parseBrDate(getHeaderValue(doc, 'Data de Funcionamento')),
  }
}

const parseShareholders = (doc: Document): ShareholderComposition | undefined => {
  const totalStr = getShareholderValue(doc, 'Número de cotistas')
  if (!totalStr) return undefined

  return {
    total: parseBrNumber(totalStr),
    individuals: parseBrNumber(getShareholderValue(doc, 'Pessoa física')),
    corporates: parseBrNumber(getShareholderValue(doc, 'Pessoa jurídica não financeira')),
    institutionals: 0,
    fiis: parseBrNumber(getShareholderValue(doc, 'Fundos de investimento imobiliário')),
  }
}

const getShareholderValue = (doc: Document, label: string): string => {
  const tables = doc.querySelectorAll('table')
  for (const table of tables) {
    const rows = table.querySelectorAll('tr')
    for (const row of rows) {
      const firstCell = row.querySelector('td')
      if (firstCell && firstCell.textContent?.trim().includes(label)) {
        const valueSpan = row.querySelector('.dado-valores')
        if (valueSpan) return valueSpan.textContent?.trim() ?? ''
      }
    }
  }
  return ''
}

const parseFinancials = (doc: Document): FinancialSummary => ({
  totalAssets: parseBrNumber(getValueByRowNumber(doc, '1')),
  netEquity: parseBrNumber(getValueByRowNumber(doc, '2')),
  totalShares: parseBrNumber(getValueByRowNumber(doc, '3')),
  shareValue: parseBrNumber(getValueByRowNumber(doc, '4')),
  administrationFee: parseBrPercentage(getValueByRowNumber(doc, '5')),
  monthlyReturn: parseBrPercentage(getValueByRowNumber(doc, '7')),
  capitalAppreciation: parseBrPercentage(getValueByRowNumber(doc, '7.1')),
  dividendYield: parseBrPercentage(getValueByRowNumber(doc, '7.2')),
})

const parseAssets = (doc: Document): AssetComposition => ({
  liquidityReserves: parseBrNumber(getValueByRowNumber(doc, '9')),
  realEstateInvestments: parseBrNumber(getValueByRowNumber(doc, '10.1')),
  realEstateReceivables: parseBrNumber(getValueByRowNumber(doc, '10.16')),
  companyShares: parseBrNumber(getValueByRowNumber(doc, '10.13')),
  otherAssets: 0,
})

const parseLiabilities = (doc: Document): Liabilities => {
  const performanceFees = parseBrNumber(getValueByRowNumber(doc, '14'))
  const propertyAcquisitions = parseBrNumber(getValueByRowNumber(doc, '15'))

  const totalStr = (() => {
    const tables = doc.querySelectorAll('table')
    for (const table of tables) {
      const rows = table.querySelectorAll('tr')
      for (const row of rows) {
        const cells = row.querySelectorAll('td')
        for (const cell of cells) {
          if (cell.textContent?.trim() === 'Total dos Passivos') {
            const valueSpan = row.querySelector('.dado-valores')
            if (valueSpan) return valueSpan.textContent?.trim() ?? ''
          }
        }
      }
    }
    return ''
  })()

  return {
    performanceFees,
    propertyAcquisitions,
    otherPayables: parseBrNumber(getValueByRowNumber(doc, '21')),
    total: parseBrNumber(totalStr),
  }
}

export const parseMonthlyReport = (html: string, documentId: string): MonthlyReport => {
  const { document: doc } = parseHTML(html)

  return {
    type: 'monthly',
    documentId,
    referenceDate: parseCompetencia(getHeaderValue(doc, 'Competência')),
    fii: parseFii(doc as unknown as Document),
    shareholders: parseShareholders(doc as unknown as Document),
    financials: parseFinancials(doc as unknown as Document),
    assets: parseAssets(doc as unknown as Document),
    liabilities: parseLiabilities(doc as unknown as Document),
  }
}
