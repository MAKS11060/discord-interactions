import {z} from 'zod'

export const DISCORD_CONFIG_SCHEMA_URL =
  'https://raw.githubusercontent.com/MAKS11060/discord-interaction/main/schema/discord.schema.json'
export const DISCORD_SECRET_SCHEMA_URL =
  'https://raw.githubusercontent.com/MAKS11060/discord-interaction/main/schema/discord-secret.schema.json'
export const DISCORD_CONFIG_PATH = '.discord.json'
export const DISCORD_SECRET_PATH = '.discord.secret.json'

export const discordApplicationConfigSchema = z.object({
  schema: z.string().min(1).optional(),
  clientId: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  publicKey: z.string().min(1).optional(),
}).strict()

export const discordConfigSchema = z.object({
  $schema: z.string().default(DISCORD_CONFIG_SCHEMA_URL),
  // $schema: z.union([
  //   z.literal(DISCORD_CONFIG_SCHEMA_URL),
  //   z.literal('./schema/discord.schema.json'),
  // ]),
  applications: z.array(discordApplicationConfigSchema),
}).strict()

export const discordSecretConfigSchema = z.object({
  $schema: z.string().default(DISCORD_SECRET_SCHEMA_URL),
  secrets: z.record(z.string().min(1), z.string().min(1)),
}).strict()

export type DiscordApplicationConfig = z.infer<typeof discordApplicationConfigSchema>
export type DiscordConfig = z.infer<typeof discordConfigSchema>
export type DiscordSecretConfig = z.infer<typeof discordSecretConfigSchema>
