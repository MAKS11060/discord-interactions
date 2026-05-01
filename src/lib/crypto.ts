import {concat} from '@std/bytes/concat'

const encoder = new TextEncoder()

/**
 * Imports a public key from a hexadecimal string and returns a CryptoKey object.
 *
 * @param publicKey - The public key in hexadecimal format.
 * @returns A promise that resolves to a CryptoKey object representing the imported public key.
 */
export const importPublicKey = (publicKey: string): Promise<CryptoKey> => {
  return crypto.subtle.importKey(
    'raw',
    Uint8Array.fromHex(publicKey),
    'Ed25519',
    false,
    ['verify'],
  )
}

/**
 * Verifies the signature of a {@linkcode request} using a {@linkcode CryptoKey} object.
 *
 * The function checks the `X-Signature-Ed25519` and `X-Signature-Timestamp` headers of the request,
 * and verifies the signature using the provided CryptoKey object. If the signature is invalid,
 * the function returns a Response object with a 401 status code and an error message.
 *
 * @param request - The request object to verify the signature of.
 * @param key - The CryptoKey object representing the public key to use for verification.
 * @returns A promise that resolves to a Response object with an error message if the signature is invalid, or null if the signature is valid.
 */
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
