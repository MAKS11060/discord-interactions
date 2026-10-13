<h1 align="center">Discord Interactions</h1>
<div align="center">
  <a href="https://www.npmjs.com/package/@maks11060/discord-interactions">
    <img src="https://img.shields.io/npm/v/@maks11060/discord-interactions">
  </a>
  <a href="https://github.com/MAKS11060/discord-interactions/actions/workflows/ci.yml">
    <img src="https://github.com/MAKS11060/discord-interactions/actions/workflows/ci.yml/badge.svg">
  </a>
</div>

A TypeScript library for handling Discord slash commands, user and message context menu commands, and interactions.
See Discord's [Interactions overview](https://discord.com/developers/docs/interactions/overview).

## Quick Start

1. Create an application in the [Discord Developer Portal](https://discord.com/developers/applications).
2. In **General Information**, copy the application ID and public key. In **OAuth2**, copy the client secret.
3. Configure an HTTPS interactions endpoint in the Developer Portal.
4. Add the credentials to your environment:

```env
CLIENT_ID=your-application-id
CLIENT_SECRET=your-client-secret
CLIENT_PUBLIC_KEY=your-application-public-key
```

5. Create a command schema and interaction handler:

```ts
import {DiscordInteraction, importPublicKey, InteractionBuilder} from '@maks11060/discord-interactions'
import {interactionHandler} from '@maks11060/discord-interactions/web'

const schema = new InteractionBuilder()
const clientPublicKey = process.env.CLIENT_PUBLIC_KEY

if (!clientPublicKey) throw new Error('CLIENT_PUBLIC_KEY is required')

schema.slashCommands((t) => [
  t.command({
    name: 'hello',
    description: 'Say hello',
    args: {
      name: t.arg.string({description: 'Who to greet', required: true}),
    },
    resolve: (context, args) => context.reply(`Hello, ${args.name}!`),
  }),
])

const discordApp = new DiscordInteraction({
  publicKey: await importPublicKey(clientPublicKey),
  schema,
})

export const handleRequest = (request: Request) => interactionHandler(request, discordApp)
```

Route Discord's interactions URL to `handleRequest` using your server framework. The handler verifies Discord's request
signature before executing a command. Your endpoint must be publicly reachable over HTTPS.

The schema defines handlers, but commands must also be registered with Discord to appear in the client. Use the CLI's
`push` command to register and update application commands.

## Install from npm

```sh
npm install @maks11060/discord-interactions
```

The package also provides framework adapters:

```ts
import {interactionHandler} from '@maks11060/discord-interactions/web'
```

Use the `/web` adapter with a `Request`/`Response` server such as Node.js, Deno, or Bun. Use `/hono` to mount a handler
as Hono middleware:

```ts
import {interactionHandler} from '@maks11060/discord-interactions/hono'

app.post('/api/discord/interactions', interactionHandler(discordApp))
```

## Define commands

Use an `InteractionBuilder` to define commands and combine them into a schema. Argument types are inferred in the
`resolve` callback. Declarations can be kept separate from registration and reused across schemas:

```ts
const schema = new InteractionBuilder()

const ping = schema.declareCommand({
  name: 'ping',
  description: 'Check whether the bot is responding',
  resolve: (context) => context.reply('Pong!'),
})

schema.slashCommands([ping])
```

The builder also supports subcommands, subcommand groups, context menu commands, and primary entry point commands.
Inside `slashCommands`, options are built with `t.arg.string()`, `t.arg.integer()`, `t.arg.user()`, and the other Discord
option helpers. For reusable declarations, use `schema.arg`.

## CLI

In this repository, the CLI loads credentials from `.env`:

```sh
pnpm cli -- init --schema ./example/builder.ts
pnpm cli -- push --all
pnpm cli -- push --name ping
pnpm cli -- me
pnpm cli -- list
pnpm cli -- list --guild 123456789012345678
```

`me` checks the application credentials and confirms that `CLIENT_PUBLIC_KEY` matches Discord. `list` displays registered
global commands; `--guild <id>` lists commands for a server. `init` creates `.discord.json` without overwriting an
existing file. Its optional `--schema` value is stored as an application schema path; `CLIENT_ID`,
`CLIENT_PUBLIC_KEY`, and `CLIENT_SECRET` are copied into that entry when both the ID and public key are set.

The config contains an `applications` array and a `$schema` URL. Each application can define `schema`, `clientId`,
`clientSecret`, and `publicKey`. `push` lists the configured applications and, when run interactively, lets you select
an application and either all commands or selected commands. Use `--all` for bulk synchronization (commands missing
from the schema are removed from Discord) or repeat `--name <name>` to upsert selected commands without removing the
others. `--schema <path>` overrides the configured schema path. Credentials can come from the config or `.env`;
`CLIENT_ID` and `CLIENT_SECRET` are required to push. The checked-in JSON Schema is generated from the Zod config schema
with `pnpm generate:discord-schema`. `ls`, `whoami`, and `login` are aliases.

## Examples

The [example directory](./example) contains a complete server setup, command definitions for all option types, context
menu commands, and command groups.
