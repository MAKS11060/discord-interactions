import type {
  APIInteraction,
  APIInteractionResponse,
  RESTPostAPIApplicationCommandsJSONBody,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  RESTPostAPIContextMenuApplicationCommandsJSONBody,
} from 'discord-api-types/v10'

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
