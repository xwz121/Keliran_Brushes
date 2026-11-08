import { defineConfig } from 'vitest/config'
import path from 'node:path'
export default defineConfig({
  resolve: { alias: { '@': path.resolve('src'), '@payload-config': path.resolve('src/payload.config.ts') } },
  test: { include: ['tests/**/*.test.ts'] },
})
