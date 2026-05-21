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
