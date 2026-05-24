import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@base-ui-study\/utils\/(.+)$/,
        replacement: `${resolve(__dirname, '../utils/src')}/$1.ts`,
      },
      {
        find: '@base-ui-study/utils',
        replacement: resolve(__dirname, '../utils/src/index.ts'),
      },
    ],
    conditions: ['@repo/source'],
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
