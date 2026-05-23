import {
  type APIInteraction,
  type APIInteractionResponse,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  InteractionResponseType,
  InteractionType,
  MessageFlags,
} from 'discord-api-types/v10'
import {ApplicationCommandContext, MenuCommandContext} from './context.ts'
import {commandMapRegistry, commandsAST} from './handler.ts'
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

    if (interaction.type === InteractionType.ApplicationCommand) {
      const applicationCommandContext = new ApplicationCommandContext(interaction)

      if (interaction.data.type === ApplicationCommandType.ChatInput) {
        // find command
        for (const [{command}, handler] of commandMapRegistry) {
          if (interaction.data.type === command.type) { // match type
            if (interaction.data.name === command.name) { // match name
              // const options = interaction.data.options ?? []

              // const isSubcommand = options.some((v) => v.type === ApplicationCommandOptionType.Subcommand)
              // const isSubcommandGroup = options.some((v) => v.type === ApplicationCommandOptionType.Subcommand)

              // for (const option of interaction.data.options ?? []) {}

              return await handler.chatInput?.().command?.(applicationCommandContext)!
            }
          }
        }
      }

      if (interaction.data.type === ApplicationCommandType.User) {
        const ctx = new MenuCommandContext(interaction)

        // find command
        for (const [{command}, handler] of commandMapRegistry) {
          if (interaction.data.type === command.type) { // match type
            if (interaction.data.name === command.name) { // match name
              return await handler.user?.(ctx)!
            }
          }
        }
      }

      if (interaction.data.type === ApplicationCommandType.Message) {
        const ctx = new MenuCommandContext(interaction)

        // find command
        for (const [{command}, handler] of commandMapRegistry) {
          if (interaction.data.type === command.type) { // match type
            if (interaction.data.name === command.name) { // match name
              return handler.message?.(ctx)!
            }
          }
        }
      }

      console.log(interaction.id, InteractionType[interaction.type], interaction.data)
      return applicationCommandContext.replyEphemeral('The handler for the command was not found')
    }

    if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {}
    if (interaction.type === InteractionType.MessageComponent) {}
    if (interaction.type === InteractionType.ModalSubmit) {}

    //
    console.log(interaction.id, InteractionType[interaction.type], interaction.data)
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {content: 'error', flags: MessageFlags.Ephemeral},
    }
  }
}
