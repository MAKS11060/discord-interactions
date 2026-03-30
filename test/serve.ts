#!/usr/bin/env -S bun

import {interactionHandler} from '#adapter/web.ts'
import {getRuntimeKey} from 'hono/adapter'
import {app1} from './main.ts'

// --- ENV ---
const CERT = process.env['CERT']!
const KEY = process.env['KEY']!

// --- RUNTIME ---
const runtimeKey = getRuntimeKey()

if (import.meta.main) {
  if (runtimeKey === 'bun') {
    Bun.serve({
      fetch: (req) => interactionHandler(req, app1),
      port: 443,
      tls: {key: Bun.file(KEY), cert: Bun.file(CERT)},
    })
  }

  if (runtimeKey === 'deno') {
    Deno.serve(
      {port: 443, key: Deno.readTextFileSync(KEY), cert: Deno.readTextFileSync(CERT)},
      (req) => interactionHandler(req, app1),
    )
  }
}
