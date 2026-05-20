import { defineConfig } from 'tsdown'

const entry = {
  index: 'src/index.ts',
  'create-greeting': 'src/create-greeting.ts',
}

export default defineConfig([
  {
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
  },
  {
    entry,
    format: 'cjs',
    outDir: 'dist',
    clean: false,
    sourcemap: false,
    dts: true,
    outExtensions() {
      return {
        js: '.cjs',
      }
    },
  },
])
