import {
  ApplicationCommandType,
  type RESTPostAPIApplicationCommandsJSONBody,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  type RESTPostAPIContextMenuApplicationCommandsJSONBody,
} from 'discord-api-types/v10'

export interface CommandSchema<
  T extends RESTPostAPIApplicationCommandsJSONBody = RESTPostAPIApplicationCommandsJSONBody,
> {
  command: T
}

export type SlashCommandSchema<T extends RESTPostAPIChatInputApplicationCommandsJSONBody> = CommandSchema<T>
export type UserCommandSchema<T extends RESTPostAPIContextMenuApplicationCommandsJSONBody> = CommandSchema<T>
export type MessageCommandSchema<T extends RESTPostAPIContextMenuApplicationCommandsJSONBody> = CommandSchema<T>

export interface DiscordInteraction<T extends Record<string, CommandSchema> = Record<string, CommandSchema>> {
  schema: T
  publicKey: CryptoKey | string
}

export const discordInteractions = <
  const T extends Record<string, CommandSchema<any>>,
>(config: {
  publicKey: CryptoKey | string
  schema: T
}): DiscordInteraction<T> => {
  return {
    schema: config.schema,
    publicKey: config.publicKey,
  }
}

// Command def
export const defCommand = <
  const T extends RESTPostAPIApplicationCommandsJSONBody,
>(command: T): CommandSchema<T> => {
  return {command}
}

export const slashCommand = <
  const T extends Omit<RESTPostAPIChatInputApplicationCommandsJSONBody, 'type'>,
>(command: T): SlashCommandSchema<T & {type: ApplicationCommandType.ChatInput}> => {
  return defCommand({
    type: ApplicationCommandType.ChatInput,
    ...command,
  })
}

export const userCommand = <
  const T extends Omit<RESTPostAPIContextMenuApplicationCommandsJSONBody, 'type'>,
>(command: T): UserCommandSchema<T & {type: ApplicationCommandType.User}> => {
  return defCommand({
    type: ApplicationCommandType.User,
    ...command,
  })
}

export const messageCommand = <
  const T extends Omit<RESTPostAPIContextMenuApplicationCommandsJSONBody, 'type'>,
>(command: T): MessageCommandSchema<T & {type: ApplicationCommandType.Message}> => {
  return defCommand({
    type: ApplicationCommandType.Message,
    ...command,
  })
}

// --- Handler ---
type HandlerCtx<T> = {
  reply(message: string): void
  reply(options: {data: string}): void
}

const handler = <T extends CommandSchema>(schema: T, handler: (t: HandlerCtx<T>) => void | Promise<void>) => {
  handler({
    reply(options) {
    },
  })
}

export const discord = {
  handler,
  command: defCommand,
  slashCommand,
  userCommand,
  messageCommand,
}
