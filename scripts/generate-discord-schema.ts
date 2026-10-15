#!/usr/bin/env -S deno run -A --env-file

import {writeFile} from 'node:fs/promises'
import {resolve} from 'node:path'
import {fileURLToPath, pathToFileURL} from 'node:url'
import {z} from 'zod'
import {discordConfigSchema, discordSecretConfigSchema} from './discord-config-schema.ts'

export const discordConfigJsonSchema = z.toJSONSchema(discordConfigSchema)
export const discordSecretJsonSchema = z.toJSONSchema(discordSecretConfigSchema)

export async function writeDiscordConfigJsonSchema(
  path = fileURLToPath(new URL('../schema/discord.schema.json', import.meta.url)),
): Promise<void> {
  await writeFile(path, `${JSON.stringify(discordConfigJsonSchema, null, 2)}\n`, 'utf8')
}

export async function writeDiscordSecretJsonSchema(
  path = fileURLToPath(new URL('../schema/discord-secret.schema.json', import.meta.url)),
): Promise<void> {
  await writeFile(path, `${JSON.stringify(discordSecretJsonSchema, null, 2)}\n`, 'utf8')
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await writeDiscordConfigJsonSchema()
  await writeDiscordSecretJsonSchema()
}
