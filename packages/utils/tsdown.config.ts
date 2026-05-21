import { readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { defineConfig } from 'tsdown'

function collectEntries(dir: string): Record<string, string> {
  const entries: Record<string, string> = {}

  for (const name of readdirSync(dir)) {
    const absolutePath = join(dir, name)
    const stats = statSync(absolutePath)

    if (stats.isDirectory()) {
      Object.assign(entries, collectEntries(absolutePath))
      continue
    }

    if (!/\.(ts|tsx)$/.test(name)) {
      continue
    }

    const sourcePath = relative(process.cwd(), absolutePath)
    const entryName = sourcePath
      .replace(/^src\//, '')
      .replace(/\.(ts|tsx)$/, '')
    entries[entryName] = sourcePath
  }

  return entries
}

const entry = collectEntries('src')

export default defineConfig({
  entry,
  format: 'esm',
  outDir: 'dist',
  clean: true,
  sourcemap: false,
  dts: {
    sourcemap: true,
  },
  outExtensions() {
    return {
      js: '.js',
      dts: '.d.ts',
    }
  },
})
