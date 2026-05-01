#!/usr/bin/env -S bun

import {getRuntimeKey} from 'hono/adapter'

// --- ENV ---
const CERT = process.env['CERT']!
const KEY = process.env['KEY']!
const IS_TLS = CERT && KEY
const PORT = Number(process.env['PORT']) || (IS_TLS ? 443 : 80)

// --- RUNTIME ---
const runtimeKey = getRuntimeKey()

export const serve = async (handler: (req: Request) => Promise<Response> | Response) => {
  if (runtimeKey === 'bun') {
    Bun.serve({
      fetch: handler,
      port: PORT,
      ...(IS_TLS && {
        tls: {
          key: Bun.file(KEY),
          cert: Bun.file(CERT),
        },
      }),
    })
  }

  if (runtimeKey === 'deno') {
    Deno.serve({
      port: PORT,
      ...(IS_TLS && {
        key: Deno.readTextFileSync(KEY),
        cert: Deno.readTextFileSync(CERT),
      }),
    }, handler)
  }

  if (runtimeKey === 'node') {
    const {serve} = await import('@hono/node-server')

    if (IS_TLS) {
      const {createSecureServer} = await import('node:http2')
      const {readFile} = await import('node:fs/promises')

      console.log(new URL(`https://localhost:${PORT}`).toString())
      serve({
        port: PORT,
        createServer: createSecureServer,
        serverOptions: {
          key: await readFile(KEY, 'utf8'),
          cert: await readFile(CERT, 'utf8'),
        },
        fetch: handler,
      })
    } else {
      console.log(new URL(`http://localhost:${PORT}`).toString())
      serve({port: PORT, fetch: handler})
    }
  }
}
