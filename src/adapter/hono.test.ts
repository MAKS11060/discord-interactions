#!/usr/bin/env -S deno run -A --env-file --watch-hmr

import {Hono} from 'hono'
import {logger} from 'hono/logger'
import { interactionHono } from './hono.ts';
import { publicKey } from '../../test/config.ts';

const app = new Hono()
app.use(logger())
app.post('/discord/interactions', interactionHono(publicKey, interaction))

if (Deno.env.has('KEY') && Deno.env.has('CERT')) {
  const key = Deno.readTextFileSync(Deno.env.get('KEY')!)
  const cert = Deno.readTextFileSync(Deno.env.get('CERT')!)
  Deno.serve({port: 443, key, cert}, app.fetch)
} else {
  Deno.serve({port: 80}, app.fetch)
}
