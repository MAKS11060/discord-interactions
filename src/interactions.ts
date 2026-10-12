import {
  type APIApplicationCommandAutocompleteInteraction,
  type APIApplicationCommandInteraction,
  type APIApplicationCommandInteractionDataOption,
  type APIInteraction,
  type APIInteractionResponse,
  ApplicationCommandType,
  InteractionResponseType,
  InteractionType,
} from 'discord-api-types/v10'
import {type Arg, type CommandDefinition, InteractionBuilder, type ResolvedOption} from './builder.ts'
import {
  ApplicationCommandAutocompleteContext,
  ApplicationCommandContextChatInput,
  ApplicationCommandContextMessage,
  ApplicationCommandContextUser,
  MessageComponentContext,
  ModalSubmitContext,
} from './context.ts'
import {InteractionError} from './errors.ts'

export type DiscordInteractionOptions<Ctx extends object = object> = {
  publicKey: CryptoKey
  clientId?: string
  schema: InteractionBuilder<Ctx>
}

export class DiscordInteraction<Ctx extends object = object> {
  readonly publicKey: CryptoKey
  readonly clientId?: string
  readonly schema: InteractionBuilder<Ctx>

  constructor(options: DiscordInteractionOptions<Ctx>) {
    if (
      options.publicKey.type !== 'public'
      || options.publicKey.algorithm.name !== 'Ed25519'
      || !options.publicKey.usages.includes('verify')
    ) {
      throw new InteractionError('Invalid publicKey format')
    }
    this.publicKey = options.publicKey
    this.clientId = options.clientId
    this.schema = options.schema
  }

  async execute(interaction: APIInteraction, ctx?: Ctx): Promise<APIInteractionResponse> {
    // console.dir(interaction, {depth: null})

    if (interaction.type === InteractionType.Ping) {
      return {type: InteractionResponseType.Pong}
    }

    if (interaction.type === InteractionType.ApplicationCommand) {
      const command = this.#findCommand(interaction)
      if (!command) {
        return new ApplicationCommandContextChatInput(interaction as never)
          .replyEphemeral('The handler for the command was not found')
      }

      if (interaction.data.type === ApplicationCommandType.ChatInput) {
        const options = flattenOptions(interaction.data.options ?? [])
        const context = new ApplicationCommandContextChatInput(interaction, options)
        if (!command.resolve) {
          return context.replyEphemeral('The handler for the command was not found')
        }
        return await command.resolve({context, ctx, options})
      }

      if (interaction.data.type === ApplicationCommandType.User) {
        const context = new ApplicationCommandContextUser(interaction)
        if (command.resolve) return await command.resolve({context: context as never, ctx, options: {}})
      }

      if (interaction.data.type === ApplicationCommandType.Message) {
        const context = new ApplicationCommandContextMessage(interaction)
        if (command.resolve) return await command.resolve({context: context as never, ctx, options: {}})
      }

      return new ApplicationCommandContextChatInput(interaction)
        .replyEphemeral('The handler for the command was not found')
    }

    if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
      const command = this.#findCommand(interaction)
      const context = new ApplicationCommandAutocompleteContext(interaction)
      if (command?.autocomplete) {
        const options = flattenOptions(interaction.data.options ?? [])
        return {
          type: InteractionResponseType.ApplicationCommandAutocompleteResult,
          data: {choices: await command.autocomplete({context, ctx, options})},
        }
      }
      return {
        type: InteractionResponseType.ApplicationCommandAutocompleteResult,
        data: {choices: []},
      }
    }
    if (interaction.type === InteractionType.MessageComponent) {
      const ctx = new MessageComponentContext(interaction)
    }
    if (interaction.type === InteractionType.ModalSubmit) {
      const ctx = new ModalSubmitContext(interaction)
    }

    throw new InteractionError('Unknown Discord command', 404)
  }

  #findCommand(
    interaction: APIApplicationCommandInteraction | APIApplicationCommandAutocompleteInteraction,
  ): CommandDefinition | undefined {
    const root = this.schema.commands.find((command) => command.name === interaction.data.name)
    if (!root || interaction.data.type !== ApplicationCommandType.ChatInput) return root

    let command = root
    let options = interaction.data.options ?? []
    while (command.children?.length && options.length) {
      const childOption = options[0]
      if (!childOption || !('options' in childOption)) break
      const child = command.children.find((candidate) => candidate.name === childOption.name)
      if (!child) return undefined
      command = child
      options = childOption.options ?? []
    }
    return command
  }
}

export class DiscordInteractions<Ctx extends object = object> {
  readonly #apps: Map<string, DiscordInteraction<Ctx>>

  constructor(apps: Iterable<DiscordInteractionOptions<Ctx> & {clientId: string}>) {
    this.#apps = new Map()
    for (const options of apps) {
      if (this.#apps.has(options.clientId)) {
        throw new InteractionError(`Duplicate Discord application clientId: ${options.clientId}`)
      }
      this.#apps.set(options.clientId, new DiscordInteraction(options))
    }
  }

  get(clientId: string): DiscordInteraction<Ctx> | undefined {
    return this.#apps.get(clientId)
  }
}

const flattenOptions = (
  options: APIApplicationCommandInteractionDataOption[],
): Record<string, ResolvedOption<Arg>> => {
  const result: Record<string, ResolvedOption<Arg>> = {}
  for (const option of options) {
    if ('value' in option) result[option.name] = {value: option.value, __resolvedOption: true}
    if ('options' in option && option.options) Object.assign(result, flattenOptions(option.options))
  }
  return result
}
