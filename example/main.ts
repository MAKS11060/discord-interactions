#!/usr/bin/env -S deno run -A --env-file --watch-hmr

import {interactionHandler} from '#adapter/web.ts'
import {serve} from '#serve'
import {Logger} from './_utils.ts'
import {app} from './app.ts'

serve(async (req) => {
  const logger = new Logger(req)
  const url = new URL(req.url)

  if (req.method === 'POST' && url.pathname === '/api/discord/interactions') {
    const response = await interactionHandler(req, app, {
      logger: console.log.bind(this),
    })
    return logger.log(response)
  }

  return logger.log(new Response('Not Found', {status: 404}))
})
