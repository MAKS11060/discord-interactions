import type {APIInteraction, APIInteractionResponse} from 'discord-api-types/v10'

export interface InteractionHandler {
  execute(interaction: APIInteraction): Promise<APIInteractionResponse>
}

// --- 12 ---
export interface InteractionCommand {
  toJSON(): {}
}

