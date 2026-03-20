# Kowalski

Chrome extension that transforms ugly FNET/CVM reports for Brazilian FIIs (Fundos de Investimento Imobiliário) into a modern, readable dashboard.

## Monthly Reports

**Before** — raw FNET tables with dense, hard-to-read data:

![Monthly Raw](docs/monthly-raw.png)

**After** — Kowalski extracts KPIs, highlights what matters, and presents data visually:

![Monthly Kowalski](docs/monthly-kowalski.png)

## Quarterly Reports

**Before** — pages of nested tables with property data, contracts, and financial statements:

![Quarterly Raw](docs/quarterly-raw.png)

**After** — vacancy rates, rental income, property grid, contract maturity bars, and indexer distribution at a glance:

![Quarterly Kowalski](docs/quarterly-kowalski.png)

![Quarterly Properties](docs/quarterly-properties.png)

![Quarterly Contracts](docs/quarterly-contracts.png)

## Features

- **Ticker derivation** from ISIN code (e.g., `BRVISCCTF005` becomes `VISC11`)
- **Monthly reports**: dividend yield, rentabilidade, taxa admin, PL, caixa (cash), cotistas bar chart, passivos breakdown, asset allocation chart
- **Quarterly reports**: vacancy and default rates per property, rental income, net result, property grid, contract maturity distribution, indexer split (IGP-M, IPCA, etc.)
- **Toggle switch** to flip between beautified and original view
- **Dark theme** inspired by Bloomberg Terminal — Inter + JetBrains Mono, high contrast, color-coded signals

## Install

```bash
# Clone and build
git clone https://github.com/geeksilva97/kowalski.git
cd kowalski
pnpm install
cd apps/extension && node build.ts
```

Then load in Chrome:

1. Go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select `apps/extension/dist`
5. Navigate to any report on [FNET](https://fnet.bmfbovespa.com.br)

## Stack

| Layer | Tech |
|---|---|
| Extension | TypeScript + esbuild (Manifest V3) |
| API | Hono on Node.js |
| Web | Astro |
| Parser | linkedom (shared between extension & API) |
| Monorepo | Turborepo + pnpm |
| Tests | node:test + Vitest (85 tests) |
| Runtime | Node.js 24+ with native TypeScript |

## Project Structure

```
apps/
  extension/   Chrome extension (content script + CSS)
  api/         Hono API server
  web/         Astro dashboard
packages/
  parser/      FNET HTML → structured data
  types/       Shared TypeScript interfaces
```
