import {defineConfig} from '@hey-api/openapi-ts'

/**
 * Unified OpenAPI → TypeScript generation (@hey-api/openapi-ts).
 *
 * Run all:
 *   pnpm openapi-ts
 *
 * @see https://heyapi.dev/openapi-ts/configuration
 */

export default defineConfig({
  input: 'https://raw.githubusercontent.com/discord/discord-api-spec/main/specs/openapi.json',
  output: {
    path: 'src/lib/api/discord',
    module: {extension: '.ts' as const},
    postProcess: [{command: 'dprint', args: ['fmt', '{{path}}']}],
  },
  plugins: [
    {name: '@hey-api/typescript', enums: 'javascript'},
    {name: '@hey-api/sdk'},
  ],
  parser: {
    filters: {
      orphans: true,
      operations: {
        include: [
          '/^[A-Z]+ \/oauth2*/',
          '/^[A-Z]+ \/applications\/*/',
          '/^[A-Z]+ \/webhook\/*/',
        ],
      },
    },
  },
})
