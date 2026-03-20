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
  web/          # Astro dashboard
packages/
  parser/       # FNET HTML → structured data
  types/        # Shared TypeScript types
```

## Extension
- Content script injects on `fnet.bmfbovespa.com.br/fnet/publico/exibirDocumento*`
- Supports monthly (Informe Mensal) and quarterly (Informe Trimestral) reports
- Dark Bloomberg-inspired theme with Inter + JetBrains Mono fonts
- Ticker derived from ISIN: `BR{XXXX}CTF{NNN}` → `XXXX11`
- Toggle button (bottom-right) switches between Kowalski and original view
- Build: `cd apps/extension && node build.ts` → outputs to `dist/`
- Load in Chrome: chrome://extensions → Developer mode → Load unpacked → select `apps/extension/dist`

## Key quarterly-only data
- Property vacancy rates (% de Vacância) and default rates (% de Inadimplência)
- Income statement (Demonstrações Trimestrais) with Contábil and Financeiro columns
- Contract maturity distribution
- Indexer distribution (IGP-M, IPCA, etc.)

## Commands
- `pnpm test` — run all tests via turbo
- `pnpm dev` — start all dev servers
- `node --test src/**/*.test.ts` — run tests in individual packages
