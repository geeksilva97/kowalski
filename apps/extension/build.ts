import { build } from 'esbuild'
import { copyFile } from 'node:fs/promises'

await build({
  entryPoints: ['src/content.ts'],
  bundle: true,
  outdir: 'dist',
  format: 'iife',
  target: 'chrome120',
})

await copyFile('src/content.css', 'dist/content.css')
await copyFile('manifest.json', 'dist/manifest.json')

console.log('Extension built to dist/')
