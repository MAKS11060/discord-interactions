import {importPublicKey} from '#/lib/crypto.ts'
import {getRequiredEnv} from '#/lib/utils.ts'

export const publicKey = await importPublicKey(getRequiredEnv('CLIENT_PUBLIC_KEY'))
