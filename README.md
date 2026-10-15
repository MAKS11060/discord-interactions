# Discord Interactions

A TypeScript library for Discord application commands, message components, and interactions.

## Install

```sh
npm install @maks11060/discord-interactions
```

For the Hono adapter, install `hono` as well.

## Quick start

Create an application in the [Discord Developer Portal](https://discord.com/developers/applications) and configure its
HTTPS interactions endpoint. Use the application's public key to verify requests:

```ts
import {DiscordInteraction, importPublicKey, InteractionBuilder} from '@maks11060/discord-interactions'
import {interactionHandler} from '@maks11060/discord-interactions/web'

const schema = new InteractionBuilder()
schema.slashCommands((t) => [
  t.command({
    name: 'hello',
    description: 'Say hello',
    args: {name: t.arg.string({required: true})},
    resolve: (context, args) => context.reply(`Hello, ${args.name}!`),
  }),
])

const publicKey = process.env.CLIENT_PUBLIC_KEY
if (!publicKey) throw new Error('CLIENT_PUBLIC_KEY is required')

const app = new DiscordInteraction({
  publicKey: await importPublicKey(publicKey),
  schema,
})

export const handleRequest = (request: Request) => interactionHandler(request, app)
```

Register commands with Discord using the CLI's `push` command; defining them in a schema alone does not publish them.

## Context

Declare a typed context in the schema. Pass a value or a factory as the adapter's final argument. Factories run once per
request:

```ts
type Context = {logger: typeof console.log}

const schema = new InteractionBuilder((t) => ({
  Context: t.$type<Context>(),
  CustomId: {delete: 'global:delete'},
}))

interactionHandler(request, app, () => ({logger: console.log}))
```

When a default context is supplied, the adapter argument is optional and the schema default is used:

```ts
const schema = new InteractionBuilder((t) => ({
  Context: t.$type<Context>({logger: console.log}),
}))
```

## Message components

Register component handlers on the builder. Match a custom ID exactly, against a list, or with a predicate:

```ts
schema.messageComponents((t) => [
  t.component({
    customId: schema.customIds.delete,
    resolve: (context) =>
      context.deferUpdate(async (deferred) => {
        await deferred.deleteFollowup()
      }),
  }),
  t.component({
    customId: (id) => id.startsWith('reply:'),
    resolve: (context) => context.reply('Button pressed'),
  }),
])
```

Handlers are global to the schema, so they work for components on reply and follow-up messages too.

For runtimes that may stop work after sending the interaction response, pass `waitUntil` as the second argument to
`deferReply()` or `deferUpdate()`. The deferred context also forwards a custom `fetch` and `signal` to REST requests:

```ts
context.deferUpdate(async (deferred) => {
  await deferred.deleteFollowup()
}, {
  waitUntil: (promise) => executionContext.waitUntil(promise),
  fetch: envFetch,
  signal: request.signal,
})
```

## Adapters

The `/web` entry point handles standard `Request` and `Response` objects (Node.js, Deno, or Bun):

```ts
import {interactionHandler} from '@maks11060/discord-interactions/web'
const response = await interactionHandler(request, app)
```

The `/hono` entry point returns Hono middleware:

```ts
import {interactionHandler} from '@maks11060/discord-interactions/hono'
hono.post('/api/discord/interactions', interactionHandler(discordApp))
```

## Package entry points

| Import path                            | Contents                                                              |
| -------------------------------------- | --------------------------------------------------------------------- |
| `@maks11060/discord-interactions`      | Builder, interaction handlers, message builder, and public-key helper |
| `@maks11060/discord-interactions/fmt`  | `Fmt` formatting utilities                                            |
| `@maks11060/discord-interactions/web`  | Web `Request`/`Response` adapter                                      |
| `@maks11060/discord-interactions/hono` | Hono middleware adapter                                               |

## CLI

In a checkout of this repository, run the CLI with `pnpm discord`. It reads credentials from `.env` and application
settings from `.discord.json`:

```sh
pnpm discord init --schema ./src/schema.ts
pnpm discord push --all
pnpm discord push --name hello
```

Use `pnpm discord --help` for the available commands and options.
