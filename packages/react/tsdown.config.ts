import { defineConfig } from 'tsdown'

const entry = {
  index: 'src/index.ts',
}

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
