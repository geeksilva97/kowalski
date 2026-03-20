import { GoogleGenAI } from '@google/genai'
import { writeFile, mkdir } from 'node:fs/promises'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
if (!GEMINI_API_KEY) {
  console.error('Set GEMINI_API_KEY env var')
  process.exit(1)
}

const ai = new GoogleGenAI({ vertexai: true, apiKey: GEMINI_API_KEY })

const outputDir = new URL('../docs/logo-variations/', import.meta.url).pathname
await mkdir(outputDir, { recursive: true })

const prompts = [
  {
    name: 'v1-penguin-head',
    prompt: 'Penguin head logo, flat vector illustration. Simple cartoon style with bold shapes. White face, black head, small orange beak, two round eyes. Dark navy circle background. Centered, symmetrical. Favicon and app icon usage. No text.',
  },
  {
    name: 'v2-glasses',
    prompt: 'Cartoon penguin face wearing small round glasses. Flat design, clean lines, minimal detail. Confident friendly expression. Black and white penguin with orange beak accent. Solid dark background. Icon format, square crop. No text.',
  },
  {
    name: 'v3-silhouette',
    prompt: 'Penguin head silhouette in white on dark navy background. Single bright blue dot for the eye. Ultra minimal, two colors plus accent. Works at 16x16 pixels. No text.',
  },
  {
    name: 'v4-badge',
    prompt: 'Penguin face filling a rounded square. Flat illustration, soft edges, friendly expression. Uses only dark navy, white, light gray, and orange. Similar style to Duolingo or Notion app icons. No text.',
  },
  {
    name: 'v5-K-penguin',
    prompt: 'A bold letter K logo where the K is stylized to resemble a penguin. The vertical stroke of the K forms the penguin body, the diagonal strokes form flippers. Black and white with a small orange accent for the beak. Dark navy background, rounded square frame. Modern tech logo. No other text.',
  },
  {
    name: 'v6-K-minimal',
    prompt: 'The letter K in a dark rounded square. The K is white, bold, geometric sans-serif. A tiny penguin head replaces the top junction of the K letter. Minimal, clean, app icon style. Dark navy (#0F1117) background. No other text.',
  },
]

const INITIAL_BACKOFF_MS = 5_000

const isRateLimitError = (err: unknown): boolean => {
  const text = err instanceof Error ? err.message : String(err)
  return text.includes('429') || text.includes('RESOURCE_EXHAUSTED')
}

const generateImage = async (prompt: string, retries = 4): Promise<Buffer | null> => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseModalities: ['IMAGE'],
        },
      })

      const imagePart = response.candidates?.[0]?.content?.parts?.find(
        (p: any) => p.inlineData,
      )
      if (!imagePart?.inlineData?.data) return null
      return Buffer.from(imagePart.inlineData.data, 'base64')
    } catch (err) {
      if (isRateLimitError(err) && attempt < retries) {
        const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt)
        console.log(`    Rate limited, waiting ${backoff / 1000}s...`)
        await new Promise(r => setTimeout(r, backoff))
        continue
      }
      throw err
    }
  }
  return null
}

console.log(`Generating ${prompts.length} logo variations...\n`)

for (const { name, prompt } of prompts) {
  console.log(`Generating: ${name}...`)
  try {
    const buffer = await generateImage(prompt)
    if (buffer) {
      const filePath = `${outputDir}/${name}.png`
      await writeFile(filePath, buffer)
      console.log(`  Saved: ${filePath} (${(buffer.length / 1024).toFixed(0)}KB)`)
    } else {
      console.log(`  No image returned`)
    }
  } catch (err: any) {
    console.error(`  Error: ${err.message}`)
  }
}

console.log('\nDone! Check docs/logo-variations/')
