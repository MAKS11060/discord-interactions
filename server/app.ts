import { sValidator } from '@hono/standard-validator'
import { kvModel } from '@maks11060/kv'
import { Hono } from 'hono'
import { z } from 'zod'

const kv = await Deno.openKv(':memory:')

const userSchema = z.object({
  id: z.string(),
  username: z.string(),
})

const registerSchema = z.object({
  username: z.string(),
})

const userModel = kvModel(kv, userSchema, {
  prefix: 'user',
  primaryKey: 'id',
  index: {
    username: {
      key: (v) => v.username,
    },
  },
})

export const app = new Hono() //
  // .get('/test', (c) => {
  //   return c.json({
  //     a: crypto.randomUUID(),
  //   })
  // })
  //
  .post('/api/register', sValidator('json', registerSchema), async (c) => {
    const {username} = c.req.valid('json')
    const user = await userModel.create({username})

    return c.json({
      user,
      // user: user as z.input<typeof userSchema>,
    })
  })

export type AppType = typeof app
