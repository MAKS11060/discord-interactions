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

### Environment

For local development. Run for init `.env` file

```sh
cp .env.example .env
```

```env
# Discord application settings
# CLIENT_ID=        # Required for deploying commands
# CLIENT_SECRET=    # Required for deploying commands
CLIENT_PUBLIC_KEY=  # Required for verifying requests
```

## Install from [JSR](https://jsr.io/@maks11060/discord-interactions)

```sh
pnpm add @maks11060/discord-interactions
```

## Usage

use `interactionHandler` from `/web` to use any server based on [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) / [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response)

```ts
// main.ts
import {serve} from '#serve'
import {interactionHandler} from '@maks11060/discord-interactions/web'
import {app} from './app.ts'

serve(async (req: Request): Promise<Response> => {
  const url = new URL(req.url)

  if (req.method === 'POST' && url.pathname === '/api/discord/interactions') {
    const response = await interactionHandler(req, app)
    return response
  }

  return new Response('Not Found', {status: 404})
})
```

Init interaction app

```ts
// app.ts
import {DiscordInteraction, importPublicKey} from '#app'
import {getEnvRequired} from '#env'
import {schema} from './builder.ts'

import './schema.ts' // load schema

export const app = new DiscordInteraction({
  publicKey: await importPublicKey(getEnvRequired('CLIENT_PUBLIC_KEY')),
  schema,
})
```

Init schema builder for commands

```ts
// builder.ts
import {InteractionBuilder} from '#app'

export const schema = new InteractionBuilder()
```

Use `schema` for define **slashCommand** / **userCommand** / **messageCommand**

```ts
// schema.ts
import {schema} from './builder.ts'

schema // TODO
```
