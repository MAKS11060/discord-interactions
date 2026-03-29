#!/usr/bin/env -S bun

import {importPublicKey} from '#/lib/crypto.ts'
import {interactionHandler} from '#adapter/web.ts'
import {getRuntimeKey} from 'hono/adapter'

// --- ENV ---
const CLIENT_PUBLIC_KEY = process.env['CLIENT_PUBLIC_KEY']!
const CERT = process.env['CERT']!
const KEY = process.env['KEY']!

// --- RUNTIME ---
const runtimeKey = getRuntimeKey()
const publicKey = await importPublicKey(CLIENT_PUBLIC_KEY)

if (import.meta.main) {
  if (runtimeKey === 'bun') {
    Bun.serve({
      fetch: (req) => interactionHandler(req, publicKey),
      port: 443,
      tls: {key: Bun.file(KEY), cert: Bun.file(CERT)},
    })
  }

  if (runtimeKey === 'deno') {
    Deno.serve(
      {port: 443, key: Deno.readTextFileSync(KEY), cert: Deno.readTextFileSync(CERT)},
      (req) => interactionHandler(req, publicKey),
    )
  }
}
