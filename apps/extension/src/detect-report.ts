import type { ReportType } from '@kowalski/types'

export const detectReportType = (title: string): ReportType | null => {
  const lower = title.toLowerCase().trim()
  if (lower.includes('informe mensal')) return 'monthly'
  if (lower.includes('informe trimestral')) return 'quarterly'
  if (lower.includes('informe anual')) return 'annual'
  return null
}

export const deriveTicker = (isin: string): string | null => {
  if (!isin || isin.length < 12 || !isin.startsWith('BR')) return null
  return isin.slice(2, 6) + '11'
}

export const extractDocumentId = (url: string): string | null => {
  try {
    const parsed = new URL(url)
    return parsed.searchParams.get('id')
  } catch {
    return null
  }
}
