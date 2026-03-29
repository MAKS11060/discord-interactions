<h1 align="center">Discord Interactions</h1>
<div align="center">
  <a href="https://jsr.io/@maks11060/discord-interactions">
    <img src="https://jsr.io/badges/@maks11060/discord-interactions">
  </a>
  <a href="https://github.com/MAKS11060/discord-interactions/actions/workflows/ci.yml">
    <img src="https://github.com/MAKS11060/discord-interactions/actions/workflows/ci.yml/badge.svg">
  </a>
</div>

### Library for handling **Discord Interactions**.

Handle slash command, user and chat command.
[Overview of Interactions](https://discord.com/developers/docs/interactions/overview)

## Quick Start

1. Create a new application on the [Discord Developer Portal](https://discord.com/developers/applications).
2. Add your application to your Discord server by visiting the following URL and replacing `your_client_id` with your
   actual client ID:
   - `https://discord.com/oauth2/authorize?client_id=your_client_id`
3. Copy the `PUBLIC KEY` from your application's settings page and add it to your `.env` file.
4. Copy the `CLIENT_ID` and `CLIENT_SECRET` from the OAuth2 page of your application's settings and add them to your
   `.env` file.

### `.env` file:

```env
# Discord application settings
# CLIENT_ID=        # Required for deploying commands
# CLIENT_SECRET=    # Required for deploying commands
CLIENT_PUBLIC_KEY=  # Required for verifying requests
```

## Install from [JSR](https://jsr.io/@maks11060/discord-interactions)

```powershell
deno add jsr:@maks11060/discord-interactions
deno add npm:discord-api-types
```

## Install CLI

```powershell
deno install -Arfgn deploy-discord --unstable-kv jsr:@maks11060/discord-interactions/cli
```

## Usage

Define commands:

```ts
// ./src/commands.ts
import {defineCommand, Format} from '@maks11060/discord-interactions'

const hello = defineCommand({
  name: 'hello',
  description: 'says hi',
}).createHandler({
  hello: () => ({
    command: (c) => {
      return c.reply({
        content: `Hello ${Format.user(c.user.id)}`,
      })
    },
  }),
})

export const commands = [hello]

// or use
// export default [hello]
```

Run **[CLI](#install-cli)**:

```powershell
deploy-discord ./src/commands.ts
# or use help
deploy-discord -h
```

### Use [Hono](https://hono.dev)

```ts
// main.ts
import {
  discordInteraction,
  importKeyRaw,
} from '@maks11060/discord-interactions/hono'
import {Hono} from 'hono'
import {commands} from './src/commands.ts'

const app = new Hono()
const key = await importKeyRaw(Deno.env.get('CLIENT_PUBLIC_KEY')!)

app.post('/interaction', ...await discordInteraction(key, commands))

Deno.serve(app.fetch)
```

### Use web standards api

```ts
// main.ts
import {discordInteraction, importKeyRaw} from '@maks11060/discord-interactions'
import {commands} from './src/commands.ts'

const key = await importKeyRaw(Deno.env.get('CLIENT_PUBLIC_KEY')!)
const interaction = await discordInteraction(key, commands)

Deno.serve((req) => {
  const uri = new URL(req.url)
  if (req.method === 'POST' && uri.pathname === '/interaction') {
    return interaction(req)
  }
  return new Response('404 Not found', {status: 404})
})
```

## Features

- [x] ApplicationCommandContext
  - [x] getter for options
  - [x] reply/replyUpdate
  - [x] deferredReply
- [x] ApplicationCommandAutocompleteContext
  - [x] get[string/integer/number]
  - [x] autocomplete()
  - [x] pass() return empty autocomplete
- [x] MessageComponentContext
  - [x] getter(type/customId)
  - [x] deferredReplyUpdate (DeferredMessageUpdate)
  - [x] optional response support
  - [x] optional. Support for manual call handling
- [x] ModalContext
  - [x] reply
  - [x] deferredReply
- [x] MenuCommandContext
  - [x] reply
  - [x] UserMenuCommandContext
    - [x] getUser
    - [x] getMember(guild only)
  - [x] MessageMenuCommandContext
    - [x] getMessage
- [x] CLI
  - [x] resolve imports in deno.json[c]
  -
    - [ ] resolve deps in package.json

\* Maybe it works

### Problems

1. Run the application to cache types from `discord-api-types/v10`

```ts
// ./src/commands.ts
import {defineCommand} from '@maks11060/discord-interactions' // or 'jsr:@maks11060/discord-interactions'
import {ApplicationCommandType} from 'discord-api-types/v10' // or 'npm:discord-api-types/v10'

const test = defineCommand({
  type: ApplicationCommandType.ChatInput,
  name: 'test',
  description: 'autocomplete',
}).createHandler({
  test: () => ({
    command(c) {
      return c.reply({content: 'ok'})
    },
  }),
})
```

|                         Supported Runtime                         |                        Tested                        |
| :---------------------------------------------------------------: | :--------------------------------------------------: |
|                        Deno / Deno Deploy                         |                          ✓                           |
|                         CloudFlare worker                         |                          ?                           |
|                                Bun                                | x / [bug](https://github.com/oven-sh/bun/pull/12473) |
| Node + [@hono/node-server](https://github.com/honojs/node-server) |                          ?                           |
