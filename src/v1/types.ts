import {
  type APIApplicationCommand,
  type APIApplicationCommandBasicOption,
  type APIApplicationCommandInteraction,
  type APIApplicationCommandOption,
  type APIInteraction,
  type APIInteractionResponse,
  type APIUser,
  type ApplicationCommandType,
  InteractionType,
  type RESTPostAPIApplicationCommandsJSONBody,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  type RESTPostAPIContextMenuApplicationCommandsJSONBody,
} from 'discord-api-types/v10'
import type {ApplicationCommandAutocompleteContext, ApplicationCommandContext} from './context.ts'

export type MaybePromise<T> = Promise<T> | T

export interface DiscordInteractionsApp {
  readonly client: {
    publicKey: string | CryptoKey
    applicationId?: string
  }

  execute(interaction: APIInteraction): Promise<APIInteractionResponse>
}

// builder
export type SlashCommandSchema<T extends RESTPostAPIChatInputApplicationCommandsJSONBody> = CommandSchema<T>
export type UserCommandSchema<T extends RESTPostAPIContextMenuApplicationCommandsJSONBody> = CommandSchema<T>
export type MessageCommandSchema<T extends RESTPostAPIContextMenuApplicationCommandsJSONBody> = CommandSchema<T>

export interface CommandSchema<
  T extends RESTPostAPIApplicationCommandsJSONBody = RESTPostAPIApplicationCommandsJSONBody,
> {
  command: T
}

// Helpers

/**
 * `{} | {} => {} & {}`
 */
export type UnionToIntersection<U> = (U extends any ? (arg: U) => void : never) extends (
  arg: infer R,
) => void ? R
  : never

/**
 * Array To Union
 *
 * `unknown[] => {} | {}`
 */
export type Unpack<T extends unknown[] | undefined> = T extends Array<infer O> ? O : never

export type EmptyArray<T> = T extends [] ? never : T

export type isRequiredOption<T extends APIApplicationCommandBasicOption> = T extends {
  required: true
} ? T
  : T | null

export type OptionToObject<T extends APIApplicationCommandOption> = {
  [K in T['name']]: T extends {name: K} ? T : never
}

// context
export type GetOptionsName<T> = {}

// handler
export type CommandToHandler<
  T extends CommandSchema,
> = Pick<
  {
    chatInput(): {
      command(
        ctx: ApplicationCommandContext<
          Unpack<T['command']['options']>
        >,
      ): MaybePromise<void>
      commandAutocomplete?(ctx: ApplicationCommandAutocompleteContext): MaybePromise<void>
      messageComponent?(ctx: ApplicationCommandAutocompleteContext): MaybePromise<void>
      modalSubmit?(ctx: ApplicationCommandAutocompleteContext): MaybePromise<void>
    }

    user(b: string): void
    message(c: string): void
    primaryEntryPoint(c: string): void // TODO: impl
  },
  T['command']['type'] extends undefined | ApplicationCommandType.ChatInput ? 'chatInput'
    : T['command']['type'] extends ApplicationCommandType.User ? 'user'
    : T['command']['type'] extends ApplicationCommandType.Message ? 'message'
    : T['command']['type'] extends ApplicationCommandType.PrimaryEntryPoint ? 'primaryEntryPoint'
    : never
>

InteractionType.ApplicationCommand
InteractionType.ApplicationCommandAutocomplete
InteractionType.MessageComponent
InteractionType.ModalSubmit
