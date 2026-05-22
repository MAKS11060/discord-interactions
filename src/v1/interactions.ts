import {
  type APIInteraction,
  type APIInteractionResponse,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  InteractionResponseType,
  InteractionType,
  MessageFlags,
} from 'discord-api-types/v10'
import {InteractionContext} from './context.ts'
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

    // wrap
    const interactionContext = new InteractionContext({interaction})

    // from ast
    console.dir(commandsAST, {depth: null})

    if (interaction.type === InteractionType.ApplicationCommand) {
      const b = commandsAST[interaction.type]?.[interaction.data.type]

      console.log(b)
    }

    if (interaction.type === InteractionType.ApplicationCommand) {
      if (interaction.data.type === ApplicationCommandType.ChatInput) {
        // find command
        for (const [{command}, handler] of commandMapRegistry) {
          // console.log(command.name)
          if (interaction.data.type === command.type) { // match type
            if (interaction.data.name === command.name) { // match name
              const options = interaction.data.options ?? []

              const isSubcommand = options.some((v) => v.type === ApplicationCommandOptionType.Subcommand)
              const isSubcommandGroup = options.some((v) => v.type === ApplicationCommandOptionType.Subcommand)

              for (const option of interaction.data.options ?? []) {}

              return handler.chatInput(interactionContext)
            }
          }
        }
      }

      if (interaction.data.type === ApplicationCommandType.User) {
        interaction.data.resolved.users
        interaction.data.resolved.members
      }

      if (interaction.data.type === ApplicationCommandType.Message) {
                  if (interaction.data.type === command.type) { // match type
            if (interaction.data.name === command.name) { // match name
            }}
      }
    }

    console.log(interaction.id, interaction.data)
    return interactionContext.replyEphemeral('The handler for the command was not found')
    // return {
    //   type: InteractionResponseType.ChannelMessageWithSource,
    //   data: {content: 'The handler for the command was not found', flags: MessageFlags.Ephemeral},
    // }
  }
  onInteract(handler: (ctx: InteractionContext) => MaybePromise<unknown>) {
  }
}
