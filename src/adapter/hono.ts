import type {APIInteraction} from 'discord-api-types/v10'
import type {MiddlewareHandler} from 'hono'
import {createMiddleware} from 'hono/factory'
import type {BuilderConfig} from '../builder.ts'
import {InteractionError} from '../errors.ts'
import {type DiscordInteraction, DiscordInteractions, type InteractionContextArgs} from '../interactions.ts'
import {
  concat,
  ERROR_BadRequestSignature,
  ERROR_ExecuteFailed,
  ERROR_MethodNotAllowed,
  HEADER_SIGNATURE,
  HEADER_SIGNATURE_TS,
} from './_common.ts'

const encoder = new TextEncoder()

/**
 * @example
 * ```ts
 * const discordApp = new DiscordInteraction({
 *   publicKey: await importPublicKey(getEnvRequired('CLIENT_PUBLIC_KEY')),
 *   schema
 * })
 *
 * const app = new Hono()
 * app.post('/api/discord/interactions', interactionHandler(discordApp, {logger: console.log}))
 * ```
 */
export const interactionHandler = <Config extends BuilderConfig>(
  ...args: [
    apps: DiscordInteraction<Config> | DiscordInteractions<Config>,
    ...ctx: InteractionContextArgs<Config>,
  ]
): MiddlewareHandler => {
  const [apps, ctx] = args
  return createMiddleware(async (c, next) => {
    if (c.req.method !== 'POST') {
      return c.json(ERROR_MethodNotAllowed, {status: 405})
    }

    let app: DiscordInteraction<Config>
    let interaction: APIInteraction | undefined

    // multi apps
    if (apps instanceof DiscordInteractions) {
      const payload = await c.req.json()

      if (
        payload === undefined
        || typeof payload !== 'object'
        || payload === null
        || !('application_id' in payload)
        || typeof payload.application_id !== 'string'
      ) {
        return c.json(ERROR_BadRequestSignature, {status: 401})
      }
      const selectedApp = apps.get(payload.application_id)
      if (!selectedApp) return c.json(ERROR_BadRequestSignature, {status: 401})
      app = selectedApp
      interaction = payload as APIInteraction
    } else {
      app = apps
    }

    // verify
    const signature = c.req.header(HEADER_SIGNATURE)
    const timestamp = c.req.header(HEADER_SIGNATURE_TS)
    if (!signature || !timestamp) {
      return c.json(ERROR_BadRequestSignature, {status: 401})
    }

    const valid = await crypto.subtle.verify(
      app.publicKey.algorithm,
      app.publicKey,
      Uint8Array.fromHex(signature),
      concat([encoder.encode(timestamp), await c.req.bytes()]), // (timestamp + body)
    )
    if (!valid) {
      return c.json(ERROR_BadRequestSignature, {status: 401})
    }

    // execute
    try {
      return c.json(
        await app.execute(
          interaction ?? await c.req.json<APIInteraction>(),
          app.resolveContext(ctx),
        ) as unknown, // hono can't forward a large type
      )
    } catch (e) {
      if (e instanceof InteractionError) {
        return c.json({error: e.name, message: e.message}, {status: e.status as 400})
      }
      return c.json(ERROR_ExecuteFailed, {status: 500})
    }
  })
}
