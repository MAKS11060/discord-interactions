#!/usr/bin/env -S deno run -A --env-file --watch-hmr

import {publicKey} from '../../test/config.ts'
import {handler} from '../core/handler.ts'
import {interactionHandler} from './web.ts'

if (import.meta.main) {
  Deno.serve(async (req) => {
    return await interactionHandler(
      req,
      publicKey,
      handler,
    )
  })
}
