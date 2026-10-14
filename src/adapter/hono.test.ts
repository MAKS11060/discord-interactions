import {Hono} from 'hono'
import {cors} from 'hono/cors'
import {logger} from 'hono/logger'
import {app} from '../../example/app.ts'
import {interactionHandler} from './hono.ts'

const appHono = new Hono()
  .use(cors())
  .use(logger())

appHono.post('/api/discord/interactions', interactionHandler(app, {}))

