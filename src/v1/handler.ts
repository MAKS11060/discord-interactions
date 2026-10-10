import {
  type APIInteraction,
  type APIInteractionResponse,
  ApplicationCommandType,
  InteractionType,
} from 'discord-api-types/v10'
import type {
  ApplicationCommandAutocompleteContext,
  ApplicationCommandContextChatInput,
  ApplicationCommandContextMessage,
  ApplicationCommandContextUser,
  deferredResponse,
  MessageComponentContext,
  ModalSubmitContext,
} from './context.ts'
import type {CommandSchema, CommandToHandler, MaybePromise} from './types.ts'

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
  chatInput?(): {
    command(ctx: ApplicationCommandContextChatInput): MaybePromise<APIInteractionResponse | {[deferredResponse]: APIInteractionResponse}>
    commandAutocomplete?(ctx: ApplicationCommandAutocompleteContext): MaybePromise<APIInteractionResponse>
    messageComponent?(ctx: MessageComponentContext): MaybePromise<APIInteractionResponse>
    modalSubmit?(ctx: ModalSubmitContext): MaybePromise<APIInteractionResponse>
  }
  user?(b: ApplicationCommandContextUser): MaybePromise<APIInteractionResponse>
  message?(c: ApplicationCommandContextMessage): MaybePromise<APIInteractionResponse>
  primaryEntryPoint?(c: string): void
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
