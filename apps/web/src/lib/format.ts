export const formatBrl = (value: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

export const formatPercent = (value: number): string =>
  `${value.toFixed(2).replace('.', ',')}%`

export const formatCompact = (value: number): string => {
  if (value >= 1_000_000_000) return `R$ ${(value / 1_000_000_000).toFixed(1).replace('.', ',')} bi`
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1).replace('.', ',')} mi`
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(1).replace('.', ',')} mil`
  return formatBrl(value)
}

export const formatChange = (current: number, previous: number): { text: string; direction: 'up' | 'down' | 'flat' } => {
  if (previous === 0) return { text: '--', direction: 'flat' }
  const change = ((current - previous) / previous) * 100
  if (Math.abs(change) < 0.01) return { text: '0,00%', direction: 'flat' }
  return {
    text: `${change > 0 ? '+' : ''}${change.toFixed(2).replace('.', ',')}%`,
    direction: change > 0 ? 'up' : 'down',
  }
}
