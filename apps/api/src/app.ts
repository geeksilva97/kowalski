import { Hono } from 'hono'
import { parseMonthlyReport } from '@kowalski/parser'

export const app = new Hono()

app.get('/health', (c) => c.json({ status: 'ok' }))

app.post('/reports/parse', async (c) => {
  const { html, documentId, type } = await c.req.json()

  if (type === 'monthly') {
    const report = parseMonthlyReport(html, documentId)
    return c.json(report)
  }

  return c.json({ error: 'Unsupported report type' }, 400)
})
