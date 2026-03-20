# Kowalski

FII (Fundos de Investimento Imobiliário) report analyzer — Chrome extension + web platform.

## Stack
- **Node.js 24+** with native TypeScript (no flags)
- **Turborepo** + **pnpm** monorepo
- **Hono** for API (apps/api)
- **Astro** for web dashboard (apps/web)
- **Chrome Extension** Manifest V3 (apps/extension)
- **esbuild** for extension bundling

## Testing
- `node:test` + `node:assert/strict` for all packages except web
- **Vitest** for apps/web (Astro needs Vite transform pipeline)
- TDD approach: write tests first, then implement

## Structure
```
apps/
  api/          # Hono API server
  extension/    # Chrome extension (content script + CSS)
    icons/      # Extension icons (16/32/48/128px)
    store-assets/ # Chrome Web Store screenshots
  web/          # Astro dashboard
packages/
  parser/       # FNET HTML → structured data
  types/        # Shared TypeScript types
scripts/
  generate-logo.ts  # Logo generation via Gemini 2.5 Flash Image
```

## Extension
- Content script injects on `fnet.bmfbovespa.com.br/fnet/publico/exibirDocumento*`
- Supports monthly (Informe Mensal) and quarterly (Informe Trimestral) reports
- Dark Bloomberg-inspired theme with Inter + JetBrains Mono fonts
- Ticker derived from ISIN: `BR{XXXX}CTF{NNN}` → `XXXX11`
- Toggle switch (bottom-right) switches between Kowalski and original view
- Logo: penguin body forming the letter K (v5 from logo generation)

## Extension build
```bash
cd apps/extension
node build.ts          # build to dist/
node build.ts --zip    # build + create kowalski-v{version}.zip at project root
```
- Load in Chrome: chrome://extensions → Developer mode → Load unpacked → select `apps/extension/dist`
- Version is read from manifest.json for the zip filename

## Monthly report data (numbered rows 1-25)
- Financial summary: total assets, net equity, shares, share value, admin fee, monthly return, DY
- Asset composition (rows 9-11): liquidity, invested, receivables
- Liabilities (rows 12-22): admin fees, performance fees, property acquisitions
- Shareholders: total, individuals, FIIs

## Quarterly report data (Informe Trimestral de FII)
- NO numbered financial summary rows, NO shareholders, NO liabilities
- Property vacancy rates (% de Vacância) and default rates (% de Inadimplência) per property
- Income statement (Demonstrações Trimestrais) with TWO columns: Contábil and Financeiro — use Contábil (index 1)
- Contract maturity distribution (section 1.1.2.1.2)
- Indexer distribution (section 1.1.2.1.3, e.g. IGP-M, IPCA)
- Header labels differ: "Nome do Fundo" instead of "Nome do Fundo/Classe"

## Commands
- `pnpm test` — run all tests via turbo
- `pnpm dev` — start all dev servers
- `node --test src/**/*.test.ts` — run tests in individual packages

## Chrome Web Store
- Store assets in `apps/extension/store-assets/` (screenshots 1280x800, promo tile 440x280)
- Privacy policy: `PRIVACY.md` — no data collected, all processing local
- Build zip: `cd apps/extension && node build.ts --zip`
