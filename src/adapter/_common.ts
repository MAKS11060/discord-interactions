// Constants
export const HEADER_SIGNATURE = 'X-Signature-Ed25519'
export const HEADER_SIGNATURE_TS = 'X-Signature-Timestamp'

// errors
export const ERROR_BadRequestSignature = {error: 'Bad request signature'}
export const ERROR_MethodNotAllowed = {error: 'Method Not Allowed'}
export const ERROR_ExecuteFailed = {error: 'Failed to execute handler'}

export function concat(buffers: readonly Uint8Array[]): Uint8Array<ArrayBuffer> {
  let length = 0
  for (const buffer of buffers) {
    length += buffer.length
  }
  const output = new Uint8Array(length)
  let index = 0
  for (const buffer of buffers) {
    output.set(buffer, index)
    index += buffer.length
  }

  return output
}
