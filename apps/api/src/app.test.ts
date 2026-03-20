import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { app } from './app.ts'

describe('API', () => {
  it('should return 200 on health check', async () => {
    const res = await app.request('/health')
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.equal(body.status, 'ok')
  })

  it('should return 404 for unknown routes', async () => {
    const res = await app.request('/unknown')
    assert.equal(res.status, 404)
  })

  it('should parse a monthly report via POST /reports/parse', async () => {
    const html = `
      <h2 align="center">Informe Mensal</h2>
      <table width="95%" align="center">
      <tbody>
      <tr><td><span class="titulo-dado">Nome do Fundo/Classe: </span></td><td><span class="dado-cabecalho">Test FII</span></td><td><span class="titulo-dado">CNPJ do Fundo/Classe: </span></td><td><span class="dado-cabecalho">12.345.678/0001-99</span></td></tr>
      <tr><td><span class="titulo-dado">Data de Funcionamento: </span></td><td><span class="dado-cabecalho">01/01/2020</span></td><td><span class="titulo-dado">Público Alvo: </span></td><td><span class="dado-cabecalho">Geral</span></td></tr>
      <tr><td><span class="titulo-dado">Código ISIN: </span></td><td><span class="dado-cabecalho">BRTEST0001</span></td><td></td><td></td></tr>
      <tr><td><span class="titulo-dado">Classificação autorregulação: </span></td><td><span class="dado-cabecalho"><b>Classificação: </b>Tijolo<b>Gestão: </b>Ativa</span></td><td></td><td></td></tr>
      <tr><td><span class="titulo-dado">Nome do Administrador: </span></td><td><span class="dado-cabecalho">Admin Test</span></td><td></td><td></td></tr>
      <tr><td><span class="titulo-dado">Competência: </span></td><td><span class="dado-cabecalho">03/2026</span></td><td></td><td></td></tr>
      </tbody></table>
      <table width="95%" align="center"><tbody>
      <tr><td align="center"><b>1</b></td><td><b>Ativo</b></td><td><span class="dado-valores">1.000,00</span></td></tr>
      <tr><td align="center"><b>2</b></td><td><b>PL</b></td><td><span class="dado-valores">900,00</span></td></tr>
      <tr><td align="center"><b>3</b></td><td><b>Cotas</b></td><td><span class="dado-valores">100,0000</span></td></tr>
      <tr><td align="center"><b>4</b></td><td><b>VP</b></td><td><span class="dado-valores">9,000000</span></td></tr>
      <tr><td align="center"><b>5</b></td><td><b>Admin</b></td><td><span class="dado-valores">0,1000%</span></td></tr>
      <tr><td align="center"><b>7</b></td><td><b>Rent</b></td><td><span class="dado-valores">1,5000%</span></td></tr>
      <tr><td align="right">7.1</td><td>RP</td><td><span class="dado-valores">0,8000%</span></td></tr>
      <tr><td align="right">7.2</td><td>DY</td><td><span class="dado-valores">0,7000%</span></td></tr>
      </tbody></table>
      <table width="95%" align="center"><tbody>
      <tr><td align="center"><b>9</b></td><td><b>Liquidez</b></td><td><b><span class="dado-valores">100,00</span></b></td></tr>
      <tr><td align="center"><b>10</b></td><td><b>Total investido</b></td><td><b><span class="dado-valores">900,00</span></b></td></tr>
      <tr><td align="right"><b>10.1</b></td><td>Imóveis</td><td><span class="dado-valores">500,00</span></td></tr>
      <tr><td align="right">10.13</td><td>Ações SPE</td><td><span class="dado-valores">300,00</span></td></tr>
      <tr><td align="right">10.16</td><td>CRI</td><td><span class="dado-valores">100,00</span></td></tr>
      </tbody></table>
      <table width="95%" align="center"><tbody>
      <tr><td align="center"><b>14</b></td><td><b>Performance</b></td><td><span class="dado-valores">10,00</span></td></tr>
      <tr><td align="center"><b>15</b></td><td><b>Aquisição</b></td><td><span class="dado-valores">20,00</span></td></tr>
      <tr><td align="center"><b>21</b></td><td><b>Outros</b></td><td><span class="dado-valores">5,00</span></td></tr>
      <tr><td align="center"><b></b></td><td><b>Total dos Passivos </b></td><td><span class="dado-valores"><b>35,00</b></span></td></tr>
      </tbody></table>
    `

    const res = await app.request('/reports/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html, documentId: '123', type: 'monthly' }),
    })

    assert.equal(res.status, 200)
    const body = await res.json()
    assert.equal(body.type, 'monthly')
    assert.equal(body.fii.cnpj, '12.345.678/0001-99')
    assert.equal(body.financials.totalAssets, 1000)
    assert.equal(body.financials.netEquity, 900)
    assert.equal(body.liabilities.total, 35)
  })
})
