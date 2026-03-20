export const parseBrNumber = (value: string): number => {
  const trimmed = value.trim()
  if (!trimmed) return 0
  const normalized = trimmed.replace(/\./g, '').replace(',', '.')
  return parseFloat(normalized) || 0
}

export const parseBrPercentage = (value: string): number => {
  const cleaned = value.replace('%', '').trim()
  return parseBrNumber(cleaned)
}
