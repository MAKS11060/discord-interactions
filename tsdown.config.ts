import {defineConfig} from 'tsdown'

export default defineConfig([
  {
    entry: [
      './src/index.ts',
      './src/fmt.ts',
      './src/adapter/hono.ts',
      './src/adapter/web.ts',
    ],
    unbundle: true,
    dts: true,
  },
  {
    entry: {
      'cli': './cli/index.ts',
    },
  },
])
