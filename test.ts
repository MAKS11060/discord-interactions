import {test} from 'node:test'

test('Test 902218', async (t) => {
  const publicKey = process.env.CLIENT_PUBLIC_KEY!

  const a = Uint8Array.fromHex(publicKey)
  const b = Uint8Array.fromHex(publicKey)

  console.log(
    await new Blob([
      a.buffer,
      b.buffer,
    ]).bytes(),
  )
})

test('Test 443889', async (t) => {
  console.log(Uint8Array.from([
    ...crypto.getRandomValues(new Uint8Array(2)),
    ...crypto.getRandomValues(new Uint8Array(2)),
  ]))
})

test('Test 268093', async (t) => {
  console.log(
    new Uint8Array(
    Iterator.concat([
      ...crypto.getRandomValues(new Uint8Array(2)),
      ...crypto.getRandomValues(new Uint8Array(2)),
    ])),
  )
})

const encoder = new TextEncoder()

export const verifyRequestSignature = async (request: Request, key: CryptoKey): Promise<Response | null> => {
  const signature = request.headers.get('X-Signature-Ed25519')
  const timestamp = request.headers.get('X-Signature-Timestamp')
  const body = await request.clone().bytes()

  if (signature === null || timestamp === null) {
    return Response.json({error: 'Bad request signature'}, {status: 401})
  }

  const valid = await crypto.subtle.verify(
    key.algorithm,
    key,
    Uint8Array.fromHex(signature),
    concat([encoder.encode(timestamp), body]), // (timestamp + body)
  )
  if (!valid) {
    return Response.json({error: 'Bad request signature'}, {status: 401})
  }

  return null
}
