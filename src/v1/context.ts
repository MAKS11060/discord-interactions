import {
  type APIInteraction,
  type APIInteractionResponse,
  type APIInteractionResponseCallbackData,
  type APIInteractionResponseChannelMessageWithSource,
  InteractionResponseType,
  InteractionType,
  MessageFlags,
} from 'discord-api-types/v10'

type MaybePromise<T> = Promise<T> | T

export class DiscordInteraction {
  readonly client: {
    publicKey: string | CryptoKey
    applicationId?: string
  }

  constructor(options: {
    publicKey: string | CryptoKey
    applicationId?: string
  }) {
    // validate public key
    if (typeof options.publicKey === 'string') {
      if (options.publicKey.length !== 32) {
        throw new Error('The publicKey must contain 32 characters in hex encoding')
      }
    } else if (options.publicKey instanceof CryptoKey) {
      if (options.publicKey.algorithm.name !== 'Ed25519') {
        throw new Error('The publicKey must be in the Ed25519 format')
      }
    }

    this.client = options
  }

  async execute(interaction: APIInteraction): Promise<APIInteractionResponse> {
    if (interaction.type === InteractionType.Ping) {
      return {type: InteractionResponseType.Pong}
    }

    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {content: 'Command handler is not defined'},
    }
  }

  onInteract(handler: (ctx: InteractionContext) => MaybePromise<unknown>) {}
}

export class InteractionContext {
  readonly signal!: AbortSignal

  constructor(options: {
    signal: AbortSignal
  }) {
    this.signal = options.signal
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
