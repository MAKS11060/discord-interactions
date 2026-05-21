import {
  type APIInteraction,
  type APIInteractionResponse,
  type APIInteractionResponseCallbackData,
  type APIInteractionResponseChannelMessageWithSource,
  InteractionResponseType,
  InteractionType,
  MessageFlags,
} from 'discord-api-types/v10'

export class InteractionContext {
  readonly signal!: AbortSignal
  readonly interaction: APIInteraction

  constructor(options: {
    readonly interaction: APIInteraction
  }) {
    this.interaction = options.interaction
  }

  reply(content: string): APIInteractionResponseChannelMessageWithSource
  reply(data: APIInteractionResponseCallbackData): APIInteractionResponseChannelMessageWithSource
  reply(data: string | APIInteractionResponseCallbackData): APIInteractionResponse {
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: typeof data === 'string' ? {content: data} : data,
    }
  }

  replyEphemeral(content: string): APIInteractionResponseChannelMessageWithSource
  replyEphemeral(data: APIInteractionResponseCallbackData): APIInteractionResponseChannelMessageWithSource
  replyEphemeral(data: string | APIInteractionResponseCallbackData): APIInteractionResponse {
    const res = typeof data === 'string' ? {content: data} : data
    res.flags = MessageFlags.Ephemeral

    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: res,
    }
  }
}
