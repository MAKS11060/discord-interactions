import {z} from 'zod'

export const DISCORD_CONFIG_SCHEMA_URL =
  'https://raw.githubusercontent.com/MAKS11060/discord-interaction/main/schema/discord.schema.json'
export const DISCORD_CONFIG_PATH = '.discord.json'

export const discordApplicationConfigSchema = z.object({
  schema: z.string().min(1),
  clientId: z.string().min(1).optional(),
  clientSecret: z.string().min(1).optional(),
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

export type DiscordApplicationConfig = z.infer<typeof discordApplicationConfigSchema>
export type DiscordConfig = z.infer<typeof discordConfigSchema>
