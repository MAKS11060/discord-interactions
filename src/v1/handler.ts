import type {CommandSchema, InteractionContext} from '#app'
import {
  type APIInteraction,
  type APIInteractionResponse,
  ApplicationCommandType,
  InteractionType,
} from 'discord-api-types/v10'

type T1 = Partial<
  Record<
    InteractionType,
    Partial<
      Record<
        ApplicationCommandType,
        Record<string, any>
      >
    >
  >
>

export const commandsAST: T1 = {}

export const commandMapRegistry = new Map<CommandSchema, {
  chatInput(c: InteractionContext): APIInteractionResponse
}>()

export const handler = <T extends CommandSchema>(command: T, handler: CommandToHandler<T>) => {
  commandMapRegistry.set(command, handler)

  // to AST
  const c = command.command

  commandsAST[InteractionType.ApplicationCommand] ??= {}
  const a = commandsAST[InteractionType.ApplicationCommand]

  a[c.type || ApplicationCommandType.ChatInput] ??= {}
  const b = a[c.type || ApplicationCommandType.ChatInput]

  b![c.name] ??= command.command
}

type CommandToHandler<T extends CommandSchema> = //
  T['command']['type'] extends (undefined | ApplicationCommandType.ChatInput) //
    ? {chatInput(c: InteractionContext): APIInteractionResponse}
    : T['command']['type'] extends ApplicationCommandType.User //
      ? {user(c: InteractionContext): APIInteractionResponse}
    : T['command']['type'] extends ApplicationCommandType.Message //
      ? {message(c: InteractionContext): APIInteractionResponse}
    : never

//
