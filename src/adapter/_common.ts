import type {DiscordInteractionsApp} from '#app'

// Constants
export const HEADER_SIGNATURE = 'X-Signature-Ed25519'
export const HEADER_SIGNATURE_TS = 'X-Signature-Timestamp'

// errors
export const ERROR_BadRequestSignature = {error: 'Bad request signature'}
export const ERROR_MethodNotAllowed = {error: 'Method Not Allowed'}
export const ERROR_ExecuteFailed = {error: 'Failed to execute handler'}

// Key cache
export const publicKeyCache = new WeakMap<DiscordInteractionsApp, CryptoKey>()
