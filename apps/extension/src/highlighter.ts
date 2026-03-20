export type Signal = 'positive' | 'negative' | 'neutral'

const thresholds: Record<string, { positive: number; negative: number }> = {
  dividendYield: { positive: 0.6, negative: 0 },
  administrationFee: { positive: 0.1, negative: 0.2 },
  monthlyReturn: { positive: 1.0, negative: 0 },
}

export const classifyValue = (metric: string, value: number): Signal => {
  const threshold = thresholds[metric]
  if (!threshold) return 'neutral'

  if (metric === 'administrationFee') {
    if (value <= threshold.positive) return 'positive'
    if (value >= threshold.negative) return 'negative'
    return 'neutral'
  }

  if (value >= threshold.positive) return 'positive'
  if (value <= threshold.negative) return 'negative'
  return 'neutral'
}

export type VacancyLevel = 'good' | 'warn' | 'bad'

export const classifyVacancy = (vacancy: number): VacancyLevel => {
  if (vacancy < 5) return 'good'
  if (vacancy <= 10) return 'warn'
  return 'bad'
}

export const classifyChange = (metric: string, changePercent: number): Signal => {
  if (changePercent === 0) return 'neutral'

  const invertedMetrics = ['administrationFee', 'defaultRate']
  const isInverted = invertedMetrics.includes(metric)

  if (isInverted) {
    return changePercent < 0 ? 'positive' : 'negative'
  }

  return changePercent > 0 ? 'positive' : 'negative'
}
