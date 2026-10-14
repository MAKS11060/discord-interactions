import {serve as _serve} from '@hono/node-server'
import {readFileSync} from 'node:fs'
import {createSecureServer as createServer} from 'node:http2'

const CERT = process.env['CERT']!
const KEY = process.env['KEY']!
const IS_TLS = CERT && KEY
const PORT = Number(process.env['PORT']) || (IS_TLS ? 443 : 80)
const HOST = '0.0.0.0'

export const serve = async (handler: (req: Request) => Promise<Response> | Response) => {
  if (IS_TLS) {
    _serve({
      port: PORT,
      hostname: HOST,
      createServer,
      serverOptions: {
        key: readFileSync(KEY, 'utf8'),
        cert: readFileSync(CERT, 'utf8'),
        allowHTTP1: true,
      },
      fetch: handler,
    })
  } else {
    _serve({
      port: PORT,
      hostname: HOST,
      fetch: handler,
    })
  }

  console.log('Node Listen', new URL(`http${IS_TLS ? 's' : ''}://localhost:${PORT}`).toString())
}
