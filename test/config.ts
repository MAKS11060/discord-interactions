import {importPublicKey} from '../src/lib/crypto.ts'
import {getRequiredEnv} from '../src/lib/utils.ts'

export const publicKey = await importPublicKey(getRequiredEnv('CLIENT_PUBLIC_KEY'))
