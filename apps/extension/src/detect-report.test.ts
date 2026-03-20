import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { detectReportType, extractDocumentId, deriveTicker } from './detect-report.ts'

describe('detectReportType', () => {
  it('should detect monthly report from h2 title', () => {
    assert.equal(detectReportType('Informe Mensal'), 'monthly')
  })

  it('should detect quarterly report from h2 title', () => {
    assert.equal(detectReportType('Informe Trimestral'), 'quarterly')
  })

  it('should detect annual report from h2 title', () => {
    assert.equal(detectReportType('Informe Anual'), 'annual')
  })

  it('should return null for unknown report type', () => {
    assert.equal(detectReportType('Something Else'), null)
  })
})

describe('extractDocumentId', () => {
  it('should extract document id from FNET URL', () => {
    const url = 'https://fnet.bmfbovespa.com.br/fnet/publico/exibirDocumento?id=1116679&cvm=true'
    assert.equal(extractDocumentId(url), '1116679')
  })

  it('should extract document id without cvm param', () => {
    const url = 'https://fnet.bmfbovespa.com.br/fnet/publico/exibirDocumento?id=999999'
    assert.equal(extractDocumentId(url), '999999')
  })

  it('should return null for invalid URL', () => {
    assert.equal(extractDocumentId('https://example.com'), null)
  })
})

describe('deriveTicker', () => {
  it('should derive VISC11 from BRVISCCTF005', () => {
    assert.equal(deriveTicker('BRVISCCTF005'), 'VISC11')
  })

  it('should derive BTYU11 from BRBTYUCTF004', () => {
    assert.equal(deriveTicker('BRBTYUCTF004'), 'BTYU11')
  })

  it('should derive HGLG11 from BRHGLGCTF008', () => {
    assert.equal(deriveTicker('BRHGLGCTF008'), 'HGLG11')
  })

  it('should derive XPML11 from BRXPMLCTF006', () => {
    assert.equal(deriveTicker('BRXPMLCTF006'), 'XPML11')
  })

  it('should return null for non-BR ISIN', () => {
    assert.equal(deriveTicker('US0378331005'), null)
  })

  it('should return null for empty string', () => {
    assert.equal(deriveTicker(''), null)
  })

  it('should return null for ISIN shorter than 12 chars', () => {
    assert.equal(deriveTicker('BRVISC'), null)
  })
})
