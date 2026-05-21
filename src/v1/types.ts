import type {APIInteraction, APIInteractionResponse} from 'discord-api-types/v10'

export interface DiscordInteractionsApp {
  execute(interaction: APIInteraction): Promise<APIInteractionResponse>

}
