import type {CommandSchema, MessageCommandSchema, SlashCommandSchema, UserCommandSchema} from '#app'
import type {
  RESTPostAPIApplicationCommandsJSONBody,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  RESTPostAPIContextMenuApplicationCommandsJSONBody,
} from 'discord-api-types/rest'
import {ApplicationCommandType} from 'discord-api-types/v10'

export const defineCommand = <
  const T extends RESTPostAPIApplicationCommandsJSONBody,
>(command: T): CommandSchema<T> => {
  return {command}
}

export const slashCommand = <
  const T extends Omit<RESTPostAPIChatInputApplicationCommandsJSONBody, 'type'>,
>(command: T): SlashCommandSchema<T & {type: ApplicationCommandType.ChatInput}> => {
  return defineCommand({
    type: ApplicationCommandType.ChatInput,
    ...command,
  })
}

export const userCommand = <
  const T extends Omit<RESTPostAPIContextMenuApplicationCommandsJSONBody, 'type'>,
>(command: T): UserCommandSchema<T & {type: ApplicationCommandType.User}> => {
  return defineCommand({
    type: ApplicationCommandType.User,
    ...command,
  })
}

export const messageCommand = <
  const T extends Omit<RESTPostAPIContextMenuApplicationCommandsJSONBody, 'type'>,
>(command: T): MessageCommandSchema<T & {type: ApplicationCommandType.Message}> => {
  return defineCommand({
    type: ApplicationCommandType.Message,
    ...command,
  })
}
