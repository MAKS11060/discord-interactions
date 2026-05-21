import type {APIInteraction, APIInteractionResponse} from 'discord-api-types/v10'

export type MaybePromise<T> = Promise<T> | T

export interface DiscordInteractionsApp {
  readonly client: {
    publicKey: string | CryptoKey
    applicationId?: string
  }

  execute(interaction: APIInteraction): Promise<APIInteractionResponse>
}
