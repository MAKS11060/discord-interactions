import {concat} from '@std/bytes/concat'
import {InteractionError} from '../errors.ts'
import type {DiscordInteraction} from '../interactions.ts'
import {
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
 *   publicKey: await importPublicKey(getEnvRequired('DISCORD_PUBLIC_KEY')),
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
 *   return Response.json('Not Found')
 * })
 * ```
 */
export const interactionHandler = async (
  request: Request,
  app: DiscordInteraction,
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

  const body = await request.clone().bytes()
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
      await app.execute(
        await request.json(),
      ),
    )
  } catch (e) {
    if (e instanceof InteractionError) {
      return Response.json({error: e.name, message: e.message}, {status: e.status})
    }
    return Response.json(ERROR_ExecuteFailed, {status: 500})
  }
}
