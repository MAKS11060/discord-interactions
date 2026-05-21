import {concat} from '@std/bytes/concat'
import {type APIInteractionResponse, type APIPingInteraction, InteractionType} from 'discord-api-types/v10'
import {test} from 'node:test'
import {interactionHandler} from './web.ts'

const encoder = new TextEncoder()

export const signRequest = async (request: Request, privateKey: CryptoKey): Promise<Request> => {
  const body = await request.clone().bytes()
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const signature = await crypto.subtle.sign(
    'Ed25519',
    privateKey,
    concat([encoder.encode(timestamp), body]), // (timestamp + body)
  )

  const signedRequest = new Request(request)
  signedRequest.headers.set('X-Signature-Ed25519', new Uint8Array(signature).toHex())
  signedRequest.headers.set('X-Signature-Timestamp', timestamp)
  return signedRequest
}

const readableStreamFromText = (data: string | Uint8Array<ArrayBuffer>): ReadableStream<Uint8Array<ArrayBuffer>> => {
  const blob = new Blob([data])
  return blob.stream()
}

test('Test 033437', async (t) => {
  const {privateKey, publicKey} = await crypto.subtle.generateKey(
    {name: 'Ed25519'},
    false,
    ['sign', 'verify'],
  ) as CryptoKeyPair

  // sign request
  const req = await signRequest(
    // create request
    new Request('https://localhost/api/discord-interactions', {
      ...({duplex: 'half' as any}), // for node
      method: 'POST',
      body: readableStreamFromText(JSON.stringify(
        {
          type: InteractionType.Ping,
          id: '1',
          application_id: '1',
          app_permissions: '',
          attachment_size_limit: 1,
          authorizing_integration_owners: {},
          entitlements: [],
          token: 'token',
          version: 1,
        } satisfies APIPingInteraction,
      )),
    }),
    privateKey,
  )

  // verify
  const res = await interactionHandler(req, {publicKey, schema: {}})
  const interactionRes = await res.json() as APIInteractionResponse
  console.log(interactionRes)
  // TODO: write test
})
