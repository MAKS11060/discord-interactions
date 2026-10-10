import {defineConfig} from '@hey-api/openapi-ts'

/**
 * Unified OpenAPI → TypeScript generation (@hey-api/openapi-ts).
 *
 * Run all:
 *   pnpm openapi-ts
 *
 * @see https://heyapi.dev/openapi-ts/configuration
 */

const sharedOutput = (path: string) => ({
  path,
  module: {extension: '.ts' as const},
  postProcess: [{command: 'dprint', args: ['fmt', '{{path}}']}],
})

const sharedPlugins = [
  {name: '@hey-api/typescript' as const, enums: 'javascript' as const},
  {name: '@hey-api/sdk' as const},
]

export default defineConfig({
  input: 'https://raw.githubusercontent.com/discord/discord-api-spec/main/specs/openapi.json',
  output: sharedOutput('src/lib/api/discord'),
  plugins: sharedPlugins,
  parser: {
    filters: {
      orphans: true,
      operations: {
        include: [
          '/^[A-Z]+ \/oauth2*/',
          '/^[A-Z]+ \/applications\/*/',
        ],
      },
    },
  },
})
