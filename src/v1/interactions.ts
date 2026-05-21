import {
  type APIInteraction,
  type APIInteractionResponse,
  InteractionResponseType,
  InteractionType,
  MessageFlags,
} from 'discord-api-types/v10'
import {int} from 'zod'
import {InteractionContext} from './context.ts'
import type {DiscordInteractionsApp, MaybePromise} from './types.ts'

export class DiscordInteraction implements DiscordInteractionsApp {
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
      if (options.publicKey.length !== 64) {
        throw new Error('The publicKey must contain 64 characters in hex encoding')
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

    // wrap
    const interactionContext = new InteractionContext({interaction})

    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {content: 'The handler for the command was not found', flags: MessageFlags.Ephemeral},
    }
  }
  onInteract(handler: (ctx: InteractionContext) => MaybePromise<unknown>) {
  }
}
