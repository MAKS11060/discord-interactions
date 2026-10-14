import type {APIInteraction} from 'discord-api-types/v10'
import type {BuilderConfig} from '../builder.ts'
import {InteractionError} from '../errors.ts'
import {DiscordInteraction, DiscordInteractions} from '../interactions.ts'
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
 * Deno.serve(async (req) => {
 *   const url = new URL(req.url)
 *
 *   if (req.method === 'POST' && url.pathname === '/api/discord/interactions') {
 *     return await interactionHandler(req, discordApp)
 *   }
 *
 *   return new Response('Not Found', {status: 404})
 * })
 *
 * // For multiple applications, create the registry once:
 * const discordApps = new DiscordInteractions([
 *   {clientId: 'application-id', publicKey, schema},
 * ])
 * ```
 */
export const interactionHandler = async <
  Ctx extends object,
  Config extends BuilderConfig,
>(
  request: Request,
  apps: DiscordInteraction<Ctx, Config> | DiscordInteractions<Ctx, Config>,
): Promise<Response> => {
  if (request.method !== 'POST') {
    return Response.json(ERROR_MethodNotAllowed, {status: 405})
  }

  // verify
  const signature = request.headers.get(HEADER_SIGNATURE)
  const timestamp = request.headers.get(HEADER_SIGNATURE_TS)
  if (signature === null || timestamp === null) {
    return Response.json(ERROR_BadRequestSignature, {status: 401})
  }

  const blob = await request.blob()
  const body = await blob.bytes()
  let app: DiscordInteraction<Ctx, Config>
  let interaction: APIInteraction | undefined

  if (apps instanceof DiscordInteractions) {
    let payload: unknown
    try {
      payload = JSON.parse(await blob.text())
    } catch (error) {
      if (error instanceof SyntaxError) return Response.json(ERROR_BadRequestSignature, {status: 401})
      throw error
    }
    if (
      payload === undefined
      || typeof payload !== 'object'
      || payload === null
      || !('application_id' in payload)
      || typeof payload.application_id !== 'string'
    ) {
      return Response.json(ERROR_BadRequestSignature, {status: 401})
    }
    const selectedApp = apps.get(payload.application_id)
    if (!selectedApp) return Response.json(ERROR_BadRequestSignature, {status: 401})
    app = selectedApp
    interaction = payload as APIInteraction
  } else {
    app = apps
  }

  const valid = await crypto.subtle.verify(
    app.publicKey.algorithm,
    app.publicKey,
    Uint8Array.fromHex(signature),
    concat([encoder.encode(timestamp), body]), // (timestamp + body)
  )
  if (!valid) {
    return Response.json(ERROR_BadRequestSignature, {status: 401})
  }

  // execute
  try {
    return Response.json(
      await app.execute(interaction ?? JSON.parse(await blob.text()) as APIInteraction),
    )
  } catch (e) {
    if (e instanceof InteractionError) {
      return Response.json({error: e.name, message: e.message}, {status: e.status})
    }
    return Response.json(ERROR_ExecuteFailed, {status: 500})
  }
}
