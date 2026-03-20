import { detectReportType, extractDocumentId, deriveTicker } from './detect-report.ts'
import { classifyValue, classifyVacancy, type Signal, type VacancyLevel } from './highlighter.ts'

const COLORS = {
  positive: '#34D399', negative: '#F87171', neutral: '#FFA028',
  blue: '#38BDF8', purple: '#8B5CF6', pink: '#F472B6',
  indigo: '#818CF8', teal: '#2DD4BF',
}

const parseBrNum = (v: string): number =>
  parseFloat(v.replace(/\./g, '').replace(',', '.')) || 0

const fmtBrl = (n: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)

const fmtCompact = (n: number): string => {
  if (n >= 1e9) return `R$ ${(n / 1e9).toFixed(1).replace('.', ',')} bi`
  if (n >= 1e6) return `R$ ${(n / 1e6).toFixed(1).replace('.', ',')} mi`
  if (n >= 1e3) return `R$ ${(n / 1e3).toFixed(1).replace('.', ',')} mil`
  return fmtBrl(n)
}

const fmtInt = (n: number): string =>
  new Intl.NumberFormat('pt-BR').format(Math.round(n))

const fmtPct = (n: number): string =>
  `${n.toFixed(4).replace('.', ',')}%`

// --- DOM helpers on the ORIGINAL html ---
const getValue = (rowNum: string): string => {
  for (const row of document.querySelectorAll('table tr')) {
    const fc = row.querySelector('td')
    if (fc?.textContent?.trim() === rowNum)
      return row.querySelector('.dado-valores')?.textContent?.trim() ?? ''
  }
  return ''
}

const getHeaderValue = (label: string): string => {
  for (const span of document.querySelectorAll('.titulo-dado')) {
    if (span.textContent?.trim().startsWith(label)) {
      const next = span.parentElement?.nextElementSibling
      if (next) return next.textContent?.trim() ?? ''
    }
  }
  return ''
}

const getShareholderVal = (label: string): number => {
  for (const row of document.querySelectorAll('table tr')) {
    const fc = row.querySelector('td')
    if (fc?.textContent?.trim().includes(label)) {
      const vs = row.querySelector('.dado-valores')
      if (vs) return parseBrNum(vs.textContent?.trim() ?? '')
    }
  }
  return 0
}

// --- Extract all data ---
const extractData = () => {
  const classificationText = (() => {
    for (const span of document.querySelectorAll('.titulo-dado')) {
      if (span.textContent?.trim().startsWith('Classificação autorregulação')) {
        return span.parentElement?.nextElementSibling?.textContent ?? ''
      }
    }
    return ''
  })()

  return {
    fundName: getHeaderValue('Nome do Fundo/Classe') || getHeaderValue('Nome do Fundo'),
    cnpj: getHeaderValue('CNPJ do Fundo/Classe') || getHeaderValue('CNPJ do Fundo'),
    isin: getHeaderValue('Código ISIN'),
    inceptionDate: getHeaderValue('Data de Funcionamento'),
    administrator: getHeaderValue('Nome do Administrador'),
    adminCnpj: getHeaderValue('CNPJ do Administrador'),
    classification: classificationText,
    competencia: getHeaderValue('Competência'),
    site: getHeaderValue('Site'),
    email: getHeaderValue('E-mail'),
    phone: getHeaderValue('Telefones'),

    totalAssets: parseBrNum(getValue('1')),
    netEquity: parseBrNum(getValue('2')),
    totalShares: parseBrNum(getValue('3')),
    shareValue: parseBrNum(getValue('4')),
    adminFee: parseBrNum(getValue('5').replace('%', '')),
    monthlyReturn: parseBrNum(getValue('7').replace('%', '')),
    capitalAppreciation: parseBrNum(getValue('7.1').replace('%', '')),
    dividendYield: parseBrNum(getValue('7.2').replace('%', '')),

    // Assets
    liquidity: parseBrNum(getValue('9')),
    totalInvested: parseBrNum(getValue('10')),
    realEstate: parseBrNum(getValue('10.1')),
    companyShares: parseBrNum(getValue('10.13')),
    cri: parseBrNum(getValue('10.16')),
    fii: parseBrNum(getValue('10.8')),
    receivables: parseBrNum(getValue('11')),

    // Liabilities
    distributable: parseBrNum(getValue('12')),
    adminFeePay: parseBrNum(getValue('13')),
    perfFeePay: parseBrNum(getValue('14')),
    propAcquisitions: parseBrNum(getValue('15')),
    otherPayables: parseBrNum(getValue('21')),
    totalLiabilities: (() => {
      for (const row of document.querySelectorAll('table tr')) {
        if (row.textContent?.includes('Total dos Passivos')) {
          const vs = row.querySelector('.dado-valores')
          return parseBrNum(vs?.textContent?.trim() ?? '')
        }
      }
      return 0
    })(),

    // Shareholders
    shareholdersTotal: getShareholderVal('Número de cotistas'),
    shareholdersIndiv: getShareholderVal('Pessoa física'),
    shareholdersFii: getShareholderVal('Fundos de investimento imobiliário'),
  }
}

interface PropertyData {
  name: string
  address: string
  area: number
  units: number
  vacancy: number
  defaultRate: number
  revenuePct: number
}

interface IncomeStatement {
  rentalIncome: number
  financialIncome: number
  adminExpense: number
  realEstateResult: number
  netResult: number
}

interface ContractMaturity {
  period: string
  pct: number
}

interface IndexerDistribution {
  name: string
  pct: number
}

const extractProperties = (): PropertyData[] => {
  const properties: PropertyData[] = []
  let inPropertySection = false

  for (const row of document.querySelectorAll('table tr')) {
    const firstCell = row.querySelector('td')
    const text = firstCell?.textContent?.trim() ?? ''

    if (text === '1.1.2.1.1') {
      inPropertySection = true
      continue
    }

    if (inPropertySection) {
      const cells = row.querySelectorAll('td')
      if (cells.length < 4) {
        if (text.match(/^1\.\d/) && text !== '1.1.2.1.1') inPropertySection = false
        continue
      }

      const firstCellText = cells[0]?.textContent?.trim() ?? ''
      if (!firstCellText || firstCellText.match(/^[\d.]+$/)) {
        if (firstCellText.match(/^1\.\d/)) inPropertySection = false
        continue
      }

      const lines = firstCellText.split('\n').map(l => l.trim()).filter(Boolean)
      const name = lines[0] ?? ''
      const address = lines.slice(1, -1).join(', ')
      const areaMatch = firstCellText.match(/([\d.,]+)\s*m/)
      const area = areaMatch ? parseBrNum(areaMatch[1]) : 0
      const unitsMatch = firstCellText.match(/(\d+)\s*unidade/i)
      const units = unitsMatch ? parseInt(unitsMatch[1], 10) : 0

      const valCells = row.querySelectorAll('.dado-valores')
      const vacancy = parseBrNum((valCells[0]?.textContent?.trim() ?? '').replace('%', '').replace(',', ','))
      const defaultRate = parseBrNum((valCells[1]?.textContent?.trim() ?? '').replace('%', ''))
      const revenuePct = parseBrNum((valCells[2]?.textContent?.trim() ?? '').replace('%', ''))

      if (name) {
        properties.push({ name, address, area, units, vacancy, defaultRate, revenuePct })
      }
    }
  }

  return properties
}

const extractIncomeStatement = (): IncomeStatement => {
  const result: IncomeStatement = { rentalIncome: 0, financialIncome: 0, adminExpense: 0, realEstateResult: 0, netResult: 0 }

  for (const row of document.querySelectorAll('table tr')) {
    const text = row.textContent?.trim() ?? ''
    const cells = row.querySelectorAll('td')
    // Income statement has 3 cells: label, contábil, financeiro — we want contábil (index 1)
    const contabilCell = cells.length >= 3 ? cells[1]?.textContent?.trim() ?? '' : cells[cells.length - 1]?.textContent?.trim() ?? ''
    const val = parseBrNum(contabilCell)

    if (text.includes('Receitas de aluguéis das propriedades para investimento')) {
      result.rentalIncome = val
    } else if (text.includes('Receitas de juros de aplicações financeiras')) {
      result.financialIncome = val
    } else if (text.includes('Taxa de administração') && text.startsWith('(-)')) {
      result.adminExpense = Math.abs(val)
    } else if (text.includes('Resultado líquido de imóveis para renda')) {
      result.realEstateResult = val
    } else if (text.includes('Resultado contábil/financeiro trimestral líquido')) {
      result.netResult = val
    }
  }

  return result
}

const extractContractMaturity = (): ContractMaturity[] => {
  const items: ContractMaturity[] = []
  let inSection = false

  for (const row of document.querySelectorAll('table tr')) {
    const first = row.querySelector('td')?.textContent?.trim() ?? ''
    if (first === '1.1.2.1.2') { inSection = true; continue }
    if (first.startsWith('1.1.2.1.3')) { inSection = false; continue }
    if (inSection) {
      const cells = row.querySelectorAll('td')
      const period = cells[0]?.textContent?.trim() ?? ''
      const pct = parseBrNum((cells[1]?.textContent?.trim() ?? '').replace('%', ''))
      if (period && pct > 0) items.push({ period, pct })
    }
  }

  return items
}

const extractIndexers = (): IndexerDistribution[] => {
  const items: IndexerDistribution[] = []
  let inSection = false

  for (const row of document.querySelectorAll('table tr')) {
    const first = row.querySelector('td')?.textContent?.trim() ?? ''
    if (first === '1.1.2.1.3') { inSection = true; continue }
    if (first.startsWith('1.1.2.1.4')) { inSection = false; continue }
    if (inSection) {
      const cells = row.querySelectorAll('td')
      const name = cells[0]?.textContent?.trim() ?? ''
      const pct = parseBrNum((cells[1]?.textContent?.trim() ?? '').replace('%', ''))
      if (name && pct > 0) items.push({ name, pct })
    }
  }

  return items
}

// --- Build the UI ---
const buildUI = () => {
  const d = extractData()
  const h2 = document.querySelector('h2')
  if (!h2) return

  const reportType = detectReportType(h2.textContent ?? '')
  const docId = extractDocumentId(window.location.href)

  const ticker = deriveTicker(d.isin)
  const isQuarterly = reportType === 'quarterly'
  const properties = isQuarterly ? extractProperties() : []
  const income = isQuarterly ? extractIncomeStatement() : null
  const maturity = isQuarterly ? extractContractMaturity() : []
  const indexers = isQuarterly ? extractIndexers() : []

  const avgVacancy = properties.length > 0
    ? properties.reduce((s, p) => s + p.vacancy, 0) / properties.length
    : 0
  const avgDefault = properties.length > 0
    ? properties.reduce((s, p) => s + p.defaultRate, 0) / properties.length
    : 0
  const longTermContracts = maturity.reduce((s, m) => {
    if (m.period.includes('Acima') || m.period.includes('indeterminado')) return s + m.pct
    return s
  }, 0)

  const dySignal = classifyValue('dividendYield', d.dividendYield)
  const retSignal = classifyValue('monthlyReturn', d.monthlyReturn)
  const feeSignal = classifyValue('administrationFee', d.adminFee)

  const signalClass = (s: Signal) =>
    s === 'positive' ? 'kowalski-color-positive' : s === 'negative' ? 'kowalski-color-negative' : 'kowalski-color-amber'

  const kpiHighlight = (s: Signal) =>
    s === 'positive' ? 'kowalski-kpi--positive' : s === 'negative' ? 'kowalski-kpi--negative' : ''

  const arrow = (s: Signal) => s === 'positive' ? ' ▲' : s === 'negative' ? ' ▼' : ''

  const vacancyClass = (level: VacancyLevel) =>
    level === 'good' ? 'kowalski-vacancy-good' : level === 'warn' ? 'kowalski-vacancy-warn' : 'kowalski-vacancy-bad'

  // Asset allocation data
  const allocItems = [
    { name: 'Imóveis', value: d.realEstate, color: COLORS.blue },
    { name: 'Ações SPE', value: d.companyShares, color: COLORS.purple },
    { name: 'CRI/CRA', value: d.cri, color: COLORS.pink },
    { name: 'FIIs', value: d.fii, color: COLORS.indigo },
    { name: 'Recebíveis', value: d.receivables, color: COLORS.teal },
  ].filter(i => i.value > 0)

  const allocTotal = allocItems.reduce((s, i) => s + i.value, 0) || 1

  // Liabilities
  const liabItems = [
    { name: 'Taxa de administração', value: d.adminFeePay },
    { name: 'Taxa de performance', value: d.perfFeePay },
    { name: 'Aquisição de imóveis', value: d.propAcquisitions },
    { name: 'Rendimentos a distribuir', value: d.distributable },
    { name: 'Outros a pagar', value: d.otherPayables },
  ]

  // Notes from original
  const notesTable = document.querySelector('h3')?.nextElementSibling
  const notes: string[] = []
  if (notesTable) {
    for (const row of notesTable.querySelectorAll('tr')) {
      const cells = row.querySelectorAll('td')
      if (cells.length >= 2) notes.push(cells[1].textContent?.trim() ?? '')
    }
  }

  // Fund info items
  const fundItems = [
    { label: 'CNPJ', value: d.cnpj },
    { label: 'ISIN', value: d.isin },
    { label: 'Início', value: d.inceptionDate },
    { label: 'Classificação', value: d.classification.replace(/\s+/g, ' ').trim() },
    { label: 'Administrador', value: d.administrator },
    { label: 'CNPJ Admin', value: d.adminCnpj },
    { label: 'Site', value: d.site },
    { label: 'Contato', value: d.email },
  ]

  const shareholdersOther = d.shareholdersTotal - d.shareholdersIndiv - d.shareholdersFii

  const ui = document.createElement('div')
  ui.className = 'kowalski-ui'
  ui.innerHTML = `
    <!-- Top bar -->
    <div class="kowalski-topbar">
      <div class="kowalski-topbar-left">
        <span class="kowalski-logo">Kowalski</span>
        <span class="kowalski-badge-type">${reportType ?? 'report'} ${d.competencia}</span>
      </div>
      <div class="kowalski-topbar-right">
        ${d.cnpj} · #${docId}
        <a href="javascript:window.print()" class="kowalski-print-btn">Imprimir</a>
      </div>
    </div>

    <!-- Fund name -->
    <div class="kowalski-fund-header">
      ${ticker ? `<div class="kowalski-ticker">${ticker}</div>` : ''}
      <div class="kowalski-fund-name">${d.fundName}</div>
    </div>

    <!-- KPI Cards -->
    <div class="kowalski-kpis">
      ${isQuarterly && properties.length > 0 ? `
      <div class="kowalski-kpi kowalski-kpi--${classifyVacancy(avgVacancy) === 'good' ? 'positive' : classifyVacancy(avgVacancy) === 'warn' ? 'highlight' : 'negative'}">
        <div class="kowalski-kpi-label">Vacância Média</div>
        <div class="kowalski-kpi-value ${vacancyClass(classifyVacancy(avgVacancy))}">${avgVacancy.toFixed(2).replace('.', ',')}%</div>
        <div class="kowalski-kpi-sub">${properties.length} imóveis</div>
      </div>
      <div class="kowalski-kpi ${avgDefault > 5 ? 'kowalski-kpi--negative' : avgDefault > 0 ? 'kowalski-kpi--highlight' : 'kowalski-kpi--positive'}">
        <div class="kowalski-kpi-label">Inadimplência</div>
        <div class="kowalski-kpi-value ${avgDefault > 5 ? 'kowalski-color-negative' : avgDefault > 0 ? 'kowalski-color-amber' : 'kowalski-color-positive'}">${avgDefault.toFixed(2).replace('.', ',')}%</div>
        <div class="kowalski-kpi-sub">média do portfólio</div>
      </div>
      ` : ''}
      ${d.dividendYield > 0 ? `
      <div class="kowalski-kpi ${kpiHighlight(dySignal)}">
        <div class="kowalski-kpi-label">Dividend Yield</div>
        <div class="kowalski-kpi-value ${signalClass(dySignal)}">${fmtPct(d.dividendYield)}${arrow(dySignal)}</div>
        <div class="kowalski-kpi-sub">mensal</div>
      </div>
      ` : ''}
      ${d.monthlyReturn > 0 ? `
      <div class="kowalski-kpi ${kpiHighlight(retSignal)}">
        <div class="kowalski-kpi-label">Rentabilidade</div>
        <div class="kowalski-kpi-value ${signalClass(retSignal)}">${fmtPct(d.monthlyReturn)}${arrow(retSignal)}</div>
        <div class="kowalski-kpi-sub">${fmtPct(d.capitalAppreciation)} patrimonial</div>
      </div>
      ` : ''}
      ${isQuarterly && income ? `
      <div class="kowalski-kpi kowalski-kpi--positive">
        <div class="kowalski-kpi-label">Receita Aluguéis</div>
        <div class="kowalski-kpi-value kowalski-color-positive">${fmtCompact(income.rentalIncome)}</div>
        <div class="kowalski-kpi-sub">trimestral</div>
      </div>
      <div class="kowalski-kpi ${income.netResult >= 0 ? 'kowalski-kpi--positive' : 'kowalski-kpi--negative'}">
        <div class="kowalski-kpi-label">Resultado Líquido</div>
        <div class="kowalski-kpi-value ${income.netResult >= 0 ? 'kowalski-color-positive' : 'kowalski-color-negative'}">${income.netResult < 0 ? '- ' : ''}${fmtCompact(Math.abs(income.netResult))}</div>
        <div class="kowalski-kpi-sub">contábil trimestral</div>
      </div>
      ` : ''}
      ${d.adminFee > 0 ? `
      <div class="kowalski-kpi ${kpiHighlight(feeSignal)}">
        <div class="kowalski-kpi-label">Taxa Admin</div>
        <div class="kowalski-kpi-value ${signalClass(feeSignal)}">${fmtPct(d.adminFee)}</div>
        <div class="kowalski-kpi-sub">sobre PL mensal</div>
      </div>
      ` : ''}
      ${d.netEquity > 0 ? `
      <div class="kowalski-kpi">
        <div class="kowalski-kpi-label">Patrimônio Líquido</div>
        <div class="kowalski-kpi-value kowalski-color-amber">${fmtCompact(d.netEquity)}</div>
        <div class="kowalski-kpi-sub">ativo ${fmtCompact(d.totalAssets)}</div>
      </div>
      ` : ''}
      ${d.liquidity > 0 ? `
      <div class="kowalski-kpi kowalski-kpi--cash">
        <div class="kowalski-kpi-label">Caixa</div>
        <div class="kowalski-kpi-value kowalski-color-blue">${fmtCompact(d.liquidity)}</div>
        <div class="kowalski-kpi-sub">${((d.liquidity / d.totalAssets) * 100).toFixed(1).replace('.', ',')}% do ativo</div>
      </div>
      ` : ''}
    </div>

    ${d.shareholdersTotal > 0 || d.totalLiabilities > 0 ? `
    <div class="kowalski-grid-2">
      ${d.shareholdersTotal > 0 ? `
      <!-- Shareholders -->
      <div class="kowalski-section">
        <div class="kowalski-section-header">
          <span class="kowalski-section-title">Cotistas</span>
        </div>
        <div class="kowalski-shareholders">
          <div class="kowalski-shareholders-total">
            <div class="kowalski-shareholders-total-num">${fmtInt(d.shareholdersTotal)}</div>
            <div class="kowalski-shareholders-total-label">cotistas</div>
          </div>
          <div class="kowalski-shareholders-bar">
            <div class="kowalski-bar-row">
              <span class="kowalski-bar-label">Pessoa Física</span>
              <div class="kowalski-bar-track">
                <div class="kowalski-bar-fill kowalski-bar-fill--primary" style="width: ${(d.shareholdersIndiv / d.shareholdersTotal * 100).toFixed(1)}%"></div>
              </div>
              <span class="kowalski-bar-count">${fmtInt(d.shareholdersIndiv)}</span>
            </div>
            <div class="kowalski-bar-row">
              <span class="kowalski-bar-label">FIIs</span>
              <div class="kowalski-bar-track">
                <div class="kowalski-bar-fill kowalski-bar-fill--secondary" style="width: ${(d.shareholdersFii / d.shareholdersTotal * 100).toFixed(1)}%"></div>
              </div>
              <span class="kowalski-bar-count">${fmtInt(d.shareholdersFii)}</span>
            </div>
            ${shareholdersOther > 0 ? `
            <div class="kowalski-bar-row">
              <span class="kowalski-bar-label">Outros</span>
              <div class="kowalski-bar-track">
                <div class="kowalski-bar-fill" style="width: ${(shareholdersOther / d.shareholdersTotal * 100).toFixed(1)}%; background: #5C5E6A;"></div>
              </div>
              <span class="kowalski-bar-count">${fmtInt(shareholdersOther)}</span>
            </div>
            ` : ''}
          </div>
        </div>
      </div>
      ` : ''}

      ${d.totalLiabilities > 0 ? `
      <!-- Liabilities -->
      <div class="kowalski-section">
        <div class="kowalski-section-header">
          <span class="kowalski-section-title">Passivos</span>
          <span class="kowalski-section-value">${fmtCompact(d.totalLiabilities)}</span>
        </div>
        <div class="kowalski-liabilities-list">
          ${liabItems.map(l => `
            <div class="kowalski-liability-row">
              <span class="kowalski-liability-name">${l.name}</span>
              <span class="kowalski-liability-value ${l.value === 0 ? 'kowalski-liability-value--zero' : ''}">${l.value === 0 ? '—' : fmtBrl(l.value)}</span>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}
    </div>
    ` : ''}

    ${allocItems.length > 0 ? `
    <!-- Asset allocation -->
    <div class="kowalski-section">
      <div class="kowalski-section-header">
        <span class="kowalski-section-title">Composição do Ativo</span>
        <span class="kowalski-section-value">${fmtCompact(d.totalInvested)}</span>
      </div>
      <div class="kowalski-allocation">
        <div class="kowalski-alloc-chart">
          ${allocItems.map(i => `
            <div class="kowalski-alloc-segment" style="width: ${(i.value / allocTotal * 100).toFixed(1)}%; background: ${i.color};" title="${i.name}: ${fmtCompact(i.value)}"></div>
          `).join('')}
        </div>
        <div class="kowalski-alloc-legend">
          ${allocItems.map(i => `
            <div class="kowalski-alloc-item">
              <div class="kowalski-alloc-dot" style="background: ${i.color};"></div>
              <div class="kowalski-alloc-info">
                <div class="kowalski-alloc-name">${i.name}</div>
                <div class="kowalski-alloc-amount">${fmtCompact(i.value)}</div>
              </div>
              <span class="kowalski-alloc-pct">${(i.value / allocTotal * 100).toFixed(1)}%</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
    ` : ''}

    ${isQuarterly && properties.length > 0 ? `
    <!-- Properties -->
    <div class="kowalski-section">
      <div class="kowalski-section-header">
        <span class="kowalski-section-title">Imóveis do Portfólio</span>
        <span class="kowalski-section-value">${properties.length} imóveis</span>
      </div>
      <div class="kowalski-property-grid">
        ${properties.map(p => {
          const vLevel = classifyVacancy(p.vacancy)
          const vClass = vacancyClass(vLevel)
          return `
          <div class="kowalski-property">
            <div class="kowalski-property-header">
              <span class="kowalski-property-name">${p.name}</span>
              <span class="kowalski-property-vacancy ${vClass}">${p.vacancy.toFixed(1).replace('.', ',')}%</span>
            </div>
            <div class="kowalski-property-stats">
              ${p.area > 0 ? `<span>${fmtInt(p.area)} m²</span>` : ''}
              ${p.units > 0 ? `<span>${p.units} unidades</span>` : ''}
              ${p.defaultRate > 0 ? `<span class="kowalski-color-negative">Inadimpl. ${p.defaultRate.toFixed(1).replace('.', ',')}%</span>` : ''}
            </div>
          </div>`
        }).join('')}
      </div>
    </div>
    ` : ''}

    ${isQuarterly && maturity.length > 0 ? `
    <!-- Contracts & Indexers side by side -->
    <div class="kowalski-grid-2">
      <div class="kowalski-section">
        <div class="kowalski-section-header">
          <span class="kowalski-section-title">Vencimento dos Contratos</span>
          <span class="kowalski-section-value">${longTermContracts.toFixed(0)}% longo prazo</span>
        </div>
        <div class="kowalski-maturity-list">
          ${maturity.map(m => `
            <div class="kowalski-maturity-row">
              <span class="kowalski-maturity-label">${m.period.replace(/De \d+ meses e 1 dia a /, '').replace(' meses', 'm')}</span>
              <div class="kowalski-bar-track" style="flex:1">
                <div class="kowalski-bar-fill kowalski-bar-fill--primary" style="width:${m.pct.toFixed(1)}%"></div>
              </div>
              <span class="kowalski-maturity-pct">${m.pct.toFixed(1)}%</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="kowalski-section">
        <div class="kowalski-section-header">
          <span class="kowalski-section-title">Indexadores</span>
        </div>
        <div class="kowalski-indexer-chart">
          <div class="kowalski-alloc-chart">
            ${indexers.map((ix, i) => `<div class="kowalski-alloc-segment" style="width:${ix.pct.toFixed(1)}%;background:${[COLORS.blue, COLORS.purple, COLORS.pink, COLORS.teal, COLORS.indigo, '#FFA028', '#8B8D98'][i % 7]}" title="${ix.name}: ${ix.pct.toFixed(1)}%"></div>`).join('')}
          </div>
          <div class="kowalski-indexer-legend">
            ${indexers.map((ix, i) => `
              <div class="kowalski-indexer-item">
                <div class="kowalski-alloc-dot" style="background:${[COLORS.blue, COLORS.purple, COLORS.pink, COLORS.teal, COLORS.indigo, '#FFA028', '#8B8D98'][i % 7]}"></div>
                <span class="kowalski-indexer-name">${ix.name}</span>
                <span class="kowalski-indexer-pct">${ix.pct.toFixed(1)}%</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
    ` : ''}

    <!-- Fund details -->
    <div class="kowalski-section">
      <div class="kowalski-section-header">
        <span class="kowalski-section-title">Dados do Fundo</span>
      </div>
      <div class="kowalski-fund-grid">
        ${fundItems.map(i => `
          <div class="kowalski-fund-item">
            <div class="kowalski-fund-label">${i.label}</div>
            <div class="kowalski-fund-value">${i.value || '—'}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Notes -->
    <details class="kowalski-section kowalski-notes">
      <summary>Notas e definições</summary>
      <div class="kowalski-notes-content">
        ${notes.map(n => `<p>${n}</p>`).join('')}
      </div>
    </details>
  `

  return ui
}

const init = () => {
  const h2 = document.querySelector('h2')
  if (!h2) return

  const reportType = detectReportType(h2.textContent ?? '')
  if (!reportType) return

  // Activate dark theme
  document.documentElement.classList.add('kowalski-active')
  document.body.classList.add('kowalski-active')

  // Wrap original content
  const originalContent = document.body.innerHTML
  const wrapper = document.createElement('div')
  wrapper.className = 'kowalski-original'
  wrapper.innerHTML = originalContent

  // Build new UI
  const ui = buildUI()
  if (!ui) return

  // Replace body
  document.body.innerHTML = ''
  document.body.appendChild(ui)
  document.body.appendChild(wrapper)

  // Add toggle button
  const toggle = document.createElement('button')
  toggle.className = 'kowalski-toggle'
  toggle.innerHTML = '<div class="kowalski-toggle-track"><div class="kowalski-toggle-thumb"></div></div> Kowalski'
  toggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('kowalski-raw')
    document.body.classList.toggle('kowalski-raw')
  })
  document.body.appendChild(toggle)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
