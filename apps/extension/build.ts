import { build } from 'esbuild'
import { copyFile, mkdir, readdir } from 'node:fs/promises'

await build({
  entryPoints: ['src/content.ts'],
  bundle: true,
  outdir: 'dist',
  format: 'iife',
  target: 'chrome120',
})

await copyFile('src/content.css', 'dist/content.css')
await copyFile('manifest.json', 'dist/manifest.json')

await mkdir('dist/icons', { recursive: true })
const icons = await readdir('icons')
for (const icon of icons) {
  await copyFile(`icons/${icon}`, `dist/icons/${icon}`)
}

console.log('Extension built to dist/')
