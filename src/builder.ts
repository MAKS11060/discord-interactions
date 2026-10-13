import type {RESTPostAPIApplicationCommandsJSONBody} from 'discord-api-types/rest/v10'
import {
  type APIApplicationCommandOption,
  type APIApplicationCommandOptionChoice,
  type APIInteractionResponse,
  type ApplicationCommandOptionAllowedChannelType,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  type ApplicationIntegrationType,
  type EntryPointCommandHandlerType,
  type FileUploadType,
  type InteractionContextType,
  type LocalizationMap,
} from 'discord-api-types/v10'
import type {
  APIAttachment,
  APIInteractionDataResolvedChannel,
  APIInteractionResponseChannelMessageWithSource,
  APIInteractionResponseDeferredChannelMessageWithSource,
  APIInteractionResponseDeferredMessageUpdate,
  APIInteractionResponseLaunchActivity,
  APIInteractionResponseUpdateMessage,
  APIModalInteractionResponse,
  APIRole,
  APIUser,
} from 'discord-api-types/v10'
import type {
  ApplicationCommandAutocompleteContext,
  ApplicationCommandContextChatInput,
  ApplicationCommandContextMessage,
  ApplicationCommandContextUser,
  MaybePromise,
  MessageComponentContext,
} from './context.ts'

type Primitive = string | number | boolean
type OptionKind =
  | 'String'
  | 'Integer'
  | 'Boolean'
  | 'User'
  | 'Channel'
  | 'Role'
  | 'Mentionable'
  | 'Number'
  | 'Attachment'

type OptionValue<K extends OptionKind> = K extends 'String' ? string
  : K extends 'Integer' | 'Number' ? number
  : K extends 'Boolean' ? boolean
  : string

type ChoiceFields<Value> =
  | {autocomplete: true; choices?: never}
  | {autocomplete?: false; choices?: readonly APIApplicationCommandOptionChoice<Value>[]}

type OptionSpecificFields<K extends OptionKind> = K extends 'String'
  ? ChoiceFields<string> & {min_length?: number; max_length?: number}
  : K extends 'Integer' | 'Number' ? ChoiceFields<number> & {min_value?: number; max_value?: number}
  : K extends 'Channel' ? {channel_types?: readonly ApplicationCommandOptionAllowedChannelType[]}
  : K extends 'Attachment' ? {file_types?: readonly FileUploadType[]}
  : {}

export type Arg<
  K extends OptionKind = OptionKind,
  V extends Primitive = Primitive,
  R extends boolean = boolean,
  Name extends string | undefined = undefined,
  Fields extends object = {},
> = {
  type: K
  name?: Name
  description?: string
  required: R extends true ? true : false | undefined
  value?: V
} & Fields

type AnyArg = Arg<OptionKind, Primitive, boolean, string | undefined, OptionSpecificFields<OptionKind>>

export type ResolvedOption<A extends AnyArg> = {
  value: A['required'] extends true ? NonNullable<A['value']> : A['value'] | undefined
  readonly __resolvedOption: true
}

type ResolvedOptions<O extends Record<string, AnyArg>> = {
  [K in keyof O]-?: ResolvedOption<NonNullable<O[K]>>
}

export type ApplicationCommandContextWithOptions<O extends Record<string, AnyArg>> =
  & ApplicationCommandContextChatInput
  & {readonly options: ResolvedOptions<O>}

export type InteractionHandlerContext = {
  context: ApplicationCommandContextChatInput | ApplicationCommandContextUser | ApplicationCommandContextMessage
  ctx: unknown
  options: Record<string, ResolvedOption<AnyArg>>
}

export type CommandDefinition = {
  name: string
  description: string
  applicationType?: ApplicationCommandType
  name_localizations?: LocalizationMap | null
  description_localizations?: LocalizationMap | null
  default_member_permissions?: string | null
  dm_permission?: boolean
  default_permission?: boolean
  nsfw?: boolean
  integration_types?: ApplicationIntegrationType[]
  contexts?: InteractionContextType[]
  handler?: EntryPointCommandHandlerType
  options?: APIApplicationCommandOption[]
  resolve?: (data: InteractionHandlerContext) => APIInteractionResponse | Promise<APIInteractionResponse>
  autocomplete?: (data: {
    context: ApplicationCommandAutocompleteContext
    ctx: unknown
    options: Record<string, ResolvedOption<AnyArg>>
  }) => APIApplicationCommandOptionChoice[] | Promise<APIApplicationCommandOptionChoice[]>
  children?: CommandDefinition[]
  type: 'command' | 'subcommand' | 'group'
}

export type SlashCommandDefinition<Ctx extends object, O extends Record<string, AnyArg>> = {
  name: string
  description?: string
  options: O
  resolve?(
    context: ApplicationCommandContextWithOptions<O>,
    ctx: Ctx,
  ): APIInteractionResponse | Promise<APIInteractionResponse>
  autocomplete?(
    context: ApplicationCommandAutocompleteContext,
    ctx: Ctx,
    options: ResolvedOptions<O>,
  ): APIApplicationCommandOptionChoice[] | Promise<APIApplicationCommandOptionChoice[]>
}

type SlashSubcommandDefinition = {
  name: string
  description?: string
  commands: Array<CommandResult | CommandDefinition>
}

export interface CommandBuilder<Ctx extends object = object> {
  <const O extends Record<string, AnyArg>>(
    definition: SlashCommandDefinition<Ctx, O>,
  ): SlashCommandDefinition<Ctx, O>
  option: OptionFactory
  autocomplete: () => true
}

type OptionFactory = {
  <
    K extends OptionKind,
    const R extends boolean = false,
    const Name extends string | undefined = undefined,
  >(
    options: BuilderCommandOptions & {type: K; required?: R; name?: Name} & OptionSpecificFields<K>,
  ): Arg<K, OptionValue<K>, R, Name, OptionSpecificFields<K>>
  string<const R extends boolean = false, const Name extends string | undefined = undefined>(
    options: BuilderCommandOptions & {required?: R; name?: Name} & OptionSpecificFields<'String'>,
  ): Arg<'String', string, R, Name, OptionSpecificFields<'String'>>
  integer<const R extends boolean = false, const Name extends string | undefined = undefined>(
    options: BuilderCommandOptions & {required?: R; name?: Name} & OptionSpecificFields<'Integer'>,
  ): Arg<'Integer', number, R, Name, OptionSpecificFields<'Integer'>>
  boolean<const R extends boolean = false, const Name extends string | undefined = undefined>(
    options: BuilderCommandOptions & {required?: R; name?: Name},
  ): Arg<'Boolean', boolean, R, Name>
  user<const R extends boolean = false, const Name extends string | undefined = undefined>(
    options: BuilderCommandOptions & {required?: R; name?: Name},
  ): Arg<'User', string, R, Name>
  channel<const R extends boolean = false, const Name extends string | undefined = undefined>(
    options: BuilderCommandOptions & {required?: R; name?: Name} & OptionSpecificFields<'Channel'>,
  ): Arg<'Channel', string, R, Name, OptionSpecificFields<'Channel'>>
  role<const R extends boolean = false, const Name extends string | undefined = undefined>(
    options: BuilderCommandOptions & {required?: R; name?: Name},
  ): Arg<'Role', string, R, Name>
  mentionable<const R extends boolean = false, const Name extends string | undefined = undefined>(
    options: BuilderCommandOptions & {required?: R; name?: Name},
  ): Arg<'Mentionable', string, R, Name>
  number<const R extends boolean = false, const Name extends string | undefined = undefined>(
    options: BuilderCommandOptions & {required?: R; name?: Name} & OptionSpecificFields<'Number'>,
  ): Arg<'Number', number, R, Name, OptionSpecificFields<'Number'>>
  attachment<const R extends boolean = false, const Name extends string | undefined = undefined>(
    options: BuilderCommandOptions & {required?: R; name?: Name} & OptionSpecificFields<'Attachment'>,
  ): Arg<'Attachment', string, R, Name, OptionSpecificFields<'Attachment'>>
}

interface BuilderCommandOptions {
  description?: string
}

type CommandMetadata = {
  name_localizations?: LocalizationMap | null
  description_localizations?: LocalizationMap | null
  default_member_permissions?: string | null
  dm_permission?: boolean
  default_permission?: boolean
  nsfw?: boolean
  integration_types?: ApplicationIntegrationType[]
  contexts?: InteractionContextType[]
}

type SlashCommandsCommand = CommandMetadata & {
  name: string
  description?: string
}

type SlashArgsCommand<Ctx extends object, O extends Record<string, AnyArg>> = SlashCommandsCommand & {
  /**
   * @example
   * ```ts
   * schema.slashCommands(t => [
   *   t.command({
   *     name: 'hello',
   *     description: 'say hello to',
   *     args: { // define the args/options that will get into the handler
   *       text: t.arg.string({name: 'user', required: true}),
   *     },
   *     resolve: (c, args) => {
   *       return c.reply(`User ${Fmt.mention(c.from)} say: Hello ${args.text}`)
   *     }
   *   })
   * ])
   * ```
   */
  args?: O
  commands?: CommandResult[]

  /**
   * The main command handler
   * @example
   * ```ts
   * // sending plain or formatted text
   * resolve: (c) => {
   *   return c.reply(`Hello ${Fmt.mention(c.from.user)}`)
   * }
   * ```
   * @example
   * ```ts
   * // use the message() function to send a message to the v2 component.
   * resolve: (c) => {
   *   return c.reply(message(t => [
   *     t.text
   *   ]))
   * }
   * ```
   */
  resolve?: (
    context: ApplicationCommandContextChatInput<SlashCommandContextOption<O>>,
    args: SlashCommandArgs<O>,
    ctx: Ctx,
  ) => MaybePromise<APIInteractionResponse>

  /**
   * @example
   * ```ts
   * autocomplete: (c) => {
   *   return c.suggest(['One', 'Two'])
   * }
   * ```
   */
  autocomplete?: (
    context: ApplicationCommandAutocompleteContext,
    ctx: Ctx,
    args: SlashCommandArgs<O>,
  ) => MaybePromise<APIApplicationCommandOptionChoice[]>

  messageComponent?: (
    context: MessageComponentContext,
  ) => MaybePromise<
    | APIInteractionResponseChannelMessageWithSource
    | APIInteractionResponseDeferredChannelMessageWithSource
    | APIInteractionResponseDeferredMessageUpdate
    | APIInteractionResponseLaunchActivity
    | APIInteractionResponseUpdateMessage
    | APIModalInteractionResponse
  >
}

type SlashCommandArgs<O extends Record<string, AnyArg>> = {
  [K in keyof O]: O[K]['required'] extends true ? SlashCommandArgValue<O[K]>
    : SlashCommandArgValue<O[K]> | null
}

type SlashCommandArgValue<A extends AnyArg> = A['type'] extends 'String' ? string
  : A['type'] extends 'Integer' | 'Number' ? number
  : A['type'] extends 'Boolean' ? boolean
  : A['type'] extends 'User' ? APIUser
  : A['type'] extends 'Channel' ? APIInteractionDataResolvedChannel
  : A['type'] extends 'Role' ? APIRole
  : A['type'] extends 'Mentionable' ? APIUser | APIRole
  : A['type'] extends 'Attachment' ? APIAttachment
  : never

type ArgOptionTypes = {
  String: ApplicationCommandOptionType.String
  Integer: ApplicationCommandOptionType.Integer
  Number: ApplicationCommandOptionType.Number
  Boolean: ApplicationCommandOptionType.Boolean
  User: ApplicationCommandOptionType.User
  Channel: ApplicationCommandOptionType.Channel
  Role: ApplicationCommandOptionType.Role
  Mentionable: ApplicationCommandOptionType.Mentionable
  Attachment: ApplicationCommandOptionType.Attachment
}

type ArgOptionType<A extends AnyArg> = ArgOptionTypes[A['type']]

type ArgDiscordName<A extends AnyArg, Key extends string> = [Extract<A['name'], string>] extends [never] ? Key
  : string extends Extract<A['name'], string> ? Key
  : Extract<A['name'], string>

type SlashCommandContextOptionForArg<Name extends string, A extends AnyArg> = A extends AnyArg
  ? {type: ArgOptionType<A>; name: Name; required: A['required']}
  : never

type SlashCommandContextOption<O extends Record<string, AnyArg>> = {
  [K in keyof O]: SlashCommandContextOptionForArg<
    ArgDiscordName<O[K], Extract<K, string>>,
    O[K]
  >
}[keyof O]

type SlashCommandsTools<Ctx extends object> = {
  arg: OptionFactory
  command<const O extends Record<string, AnyArg> = {}>(
    definition: SlashArgsCommand<Ctx, O>,
  ): CommandResult
  declareCommand<const O extends Record<string, AnyArg> = {}>(
    definition: SlashArgsCommand<Ctx, O>,
    children?: (tools: SlashCommandDeclarationTools<Ctx>) => CommandResult[],
  ): CommandResult
  subcommand<const O extends Record<string, AnyArg> = {}>(
    definition: SlashArgsCommand<Ctx, O>,
  ): CommandResult
  declareSubcommand<const O extends Record<string, AnyArg> = {}>(
    definition: SlashArgsCommand<Ctx, O>,
  ): CommandResult
  group(definition: {
    name: string
    description?: string
    commands: CommandResult[]
  }): CommandResult
  declareSubcommandGroup(
    definition: {name: string; description?: string},
    children: (tools: SlashCommandDeclarationTools<Ctx>) => CommandResult[],
  ): CommandResult
}

type SlashCommandDeclarationTools<Ctx extends object> = Pick<
  SlashCommandsTools<Ctx>,
  'arg' | 'declareCommand' | 'declareSubcommand' | 'declareSubcommandGroup'
>

export type CommandResult = {
  name: string
  description?: string
  commands?: Array<CommandResult | CommandDefinition>
  [commandDefinition]?: CommandDefinition
}

const commandDefinition = Symbol('commandDefinition')

const optionType = (kind: OptionKind): ApplicationCommandOptionType => {
  const types: Record<OptionKind, ApplicationCommandOptionType> = {
    String: ApplicationCommandOptionType.String,
    Integer: ApplicationCommandOptionType.Integer,
    Boolean: ApplicationCommandOptionType.Boolean,
    User: ApplicationCommandOptionType.User,
    Channel: ApplicationCommandOptionType.Channel,
    Role: ApplicationCommandOptionType.Role,
    Mentionable: ApplicationCommandOptionType.Mentionable,
    Number: ApplicationCommandOptionType.Number,
    Attachment: ApplicationCommandOptionType.Attachment,
  }
  return types[kind]
}

export class InteractionBuilder<Ctx extends object = object> {
  #commands: CommandDefinition[] = []

  toSchema(): this {
    return this
  }

  toJSON(): RESTPostAPIApplicationCommandsJSONBody[] {
    return this.#commands.map((command) => this.#toApplicationCommand(command))
  }

  /** Used by DiscordInteraction; command lookup is intentionally kept outside this builder. */
  get commands(): readonly CommandDefinition[] {
    return this.#commands
  }

  get arg(): OptionFactory {
    return this.#tools().option
  }

  slashCommands(
    commands:
      | readonly CommandResult[]
      | ((tools: SlashCommandsTools<Ctx>) => readonly CommandResult[]),
  ): CommandResult[] {
    const tools = this.#slashCommandsTools()
    const declared = typeof commands === 'function' ? commands(tools) : commands
    const registered = [...declared]
    for (const command of registered) {
      this.#registerSlashCommand(command)
    }
    return registered
  }

  declareCommand<const O extends Record<string, AnyArg> = {}>(
    config: SlashArgsCommand<Ctx, O>,
    children?: (tools: SlashCommandDeclarationTools<Ctx>) => CommandResult[],
  ): CommandResult {
    const childCommands = children?.(this.#slashCommandDeclarationTools())
    return this.#buildArgsCommand(
      childCommands ? {...config, commands: childCommands} : config,
      'command',
    )
  }

  declareSubcommand<const O extends Record<string, AnyArg> = {}>(
    config: SlashArgsCommand<Ctx, O>,
  ): CommandResult {
    return this.#buildArgsCommand(config, 'subcommand')
  }

  declareSubcommandGroup(
    config: {name: string; description?: string},
    children: (tools: SlashCommandDeclarationTools<Ctx>) => CommandResult[],
  ): CommandResult {
    return this.#publicResult({
      name: config.name,
      description: config.description ?? config.name,
      type: 'group',
      children: children(this.#slashCommandDeclarationTools()).map((command) => this.#definition(command)),
    })
  }

  #slashCommandDeclarationTools(): SlashCommandDeclarationTools<Ctx> {
    return {
      arg: this.arg,
      declareCommand: (config, children) => this.declareCommand(config, children),
      declareSubcommand: (config) => this.declareSubcommand(config),
      declareSubcommandGroup: (config, children) => this.declareSubcommandGroup(config, children),
    }
  }

  #slashCommandsTools(): SlashCommandsTools<Ctx> {
    return {
      arg: this.#tools().option,
      command: (definition) => this.#buildArgsCommand(definition),
      declareCommand: (definition, children) => this.declareCommand(definition, children),
      subcommand: (definition) => this.#buildArgsCommand(definition, 'subcommand'),
      declareSubcommand: (definition) => this.declareSubcommand(definition),
      group: ({name, description, commands}) =>
        this.#publicResult({
          name,
          description: description ?? name,
          type: 'group',
          children: commands.map((command) => this.#definition(command)),
        }),
      declareSubcommandGroup: (definition, children) => this.declareSubcommandGroup(definition, children),
    }
  }

  slashSubcommand(
    builder: (t: CommandBuilder<Ctx>) => SlashSubcommandDefinition,
  ): CommandResult
  slashSubcommand(
    builder: (t: CommandBuilder<Ctx>) => SlashSubcommandDefinition,
  ): CommandResult {
    const result = builder(this.#tools())
    return this.#publicResult({
      name: result.name,
      description: result.description ?? result.name,
      type: 'subcommand',
      children: result.commands.map((command) => this.#definition(command)),
    })
  }

  slashSubcommandGroup(
    builder: (
      t: CommandBuilder<Ctx>,
    ) => {name: string; description?: string; commands: Array<CommandResult | CommandDefinition>},
  ): CommandResult {
    const result = builder(this.#tools())
    const definition: CommandDefinition = {
      name: result.name,
      description: result.description ?? result.name,
      type: 'group',
      children: result.commands.map((command) => this.#definition(command)),
    }
    this.#commands.push(definition)
    return this.#publicResult(definition)
  }

  message(
    config: CommandMetadata & {
      name: string
      resolve?: (context: ApplicationCommandContextMessage, ctx: Ctx) => APIInteractionResponse
    },
  ): CommandResult
  message(command: CommandResult): CommandResult
  message(
    config:
      | CommandResult
      | (CommandMetadata & {
        name: string
        resolve?: (context: ApplicationCommandContextMessage, ctx: Ctx) => APIInteractionResponse
      }),
  ): CommandResult {
    const command = this.#isCommandResult(config) ? config : this.declareMessage(config)
    return this.#registerRootCommand(command, ApplicationCommandType.Message)
  }

  declareMessage(
    config: CommandMetadata & {
      name: string
      resolve?: (context: ApplicationCommandContextMessage, ctx: Ctx) => APIInteractionResponse
    },
  ): CommandResult {
    return this.#publicResult({
      name: config.name,
      description: '',
      type: 'command',
      applicationType: ApplicationCommandType.Message,
      ...this.#commandMetadata(config),
      resolve: config.resolve
        ? ({context, ctx}) => config.resolve!(context as ApplicationCommandContextMessage, ctx as Ctx)
        : undefined,
    })
  }

  user(
    config: CommandMetadata & {
      name: string
      resolve?: (context: ApplicationCommandContextUser, ctx: Ctx) => APIInteractionResponse
    },
  ): CommandResult
  user(command: CommandResult): CommandResult
  user(
    config:
      | CommandResult
      | (CommandMetadata & {
        name: string
        resolve?: (context: ApplicationCommandContextUser, ctx: Ctx) => APIInteractionResponse
      }),
  ): CommandResult {
    const command = this.#isCommandResult(config) ? config : this.declareUser(config)
    return this.#registerRootCommand(command, ApplicationCommandType.User)
  }

  declareUser(
    config: CommandMetadata & {
      name: string
      resolve?: (context: ApplicationCommandContextUser, ctx: Ctx) => APIInteractionResponse
    },
  ): CommandResult {
    return this.#publicResult({
      name: config.name,
      description: '',
      type: 'command',
      applicationType: ApplicationCommandType.User,
      ...this.#commandMetadata(config),
      resolve: config.resolve
        ? ({context, ctx}) => config.resolve!(context as ApplicationCommandContextUser, ctx as Ctx)
        : undefined,
    })
  }

  primaryEntryPoint(
    config: CommandMetadata & {
      name: string
      description?: string
      handler?: EntryPointCommandHandlerType
    },
  ): CommandResult
  primaryEntryPoint(command: CommandResult): CommandResult
  primaryEntryPoint(
    config:
      | CommandResult
      | (CommandMetadata & {
        name: string
        description?: string
        handler?: EntryPointCommandHandlerType
      }),
  ): CommandResult {
    const command = this.#isCommandResult(config) ? config : this.declarePrimaryEntryPoint(config)
    return this.#registerRootCommand(command, ApplicationCommandType.PrimaryEntryPoint)
  }

  declarePrimaryEntryPoint(
    config: CommandMetadata & {
      name: string
      description?: string
      handler?: EntryPointCommandHandlerType
    },
  ): CommandResult {
    return this.#publicResult({
      name: config.name,
      description: config.description ?? '',
      type: 'command',
      applicationType: ApplicationCommandType.PrimaryEntryPoint,
      handler: config.handler,
      ...this.#commandMetadata(config),
    })
  }

  #registerRootCommand(command: CommandResult, applicationType?: ApplicationCommandType): CommandResult {
    const definition = this.#definition(command)
    if (definition.type !== 'command' || definition.applicationType !== applicationType) {
      throw new Error(`Expected a ${applicationType ?? 'chat input'} root command`)
    }
    this.#commands.push(definition)
    return command
  }

  #registerSlashCommand(command: CommandResult): void {
    const definition = this.#definition(command)
    if (
      definition.type !== 'command'
      || (definition.applicationType !== undefined && definition.applicationType !== ApplicationCommandType.ChatInput)
    ) {
      throw new Error('slashCommands only accepts root chat input commands')
    }
    this.#validateSlashCommand(definition)
    this.#commands.push(definition)
  }

  #validateSlashCommand(command: CommandDefinition): void {
    if (command.children?.length && command.options?.length) {
      throw new Error(`Slash command "${command.name}" cannot have both options and subcommands`)
    }
    for (const child of command.children ?? []) {
      if (child.type === 'group') {
        if (
          child.options?.length || child.resolve
          || child.children?.some((nested) => nested.type !== 'subcommand' || nested.children?.length)
        ) {
          throw new Error(`Subcommand group "${child.name}" may only contain subcommands`)
        }
      } else if (child.type !== 'subcommand' || child.children?.length) {
        throw new Error(`Slash command "${command.name}" may only contain subcommands and groups`)
      }
    }
  }

  #isCommandResult(value: object): value is CommandResult {
    return commandDefinition in value && value[commandDefinition] !== undefined
  }

  #buildArgsCommand<const O extends Record<string, AnyArg>>(
    result: SlashArgsCommand<Ctx, O>,
    type: CommandDefinition['type'] = 'command',
  ): CommandResult {
    const args = result.args ?? {} as O
    const getArgs = <
      Option extends {type: ApplicationCommandOptionType; name: string; required?: boolean},
    >(context: ApplicationCommandContextChatInput<Option>) => {
      const values: Record<string, unknown> = {}
      for (const [key, arg] of Object.entries(args)) {
        const name = arg.name ?? key
        Object.defineProperty(values, key, {
          configurable: true,
          enumerable: true,
          get() {
            let value: unknown
            switch (arg.type) {
              case 'String':
                value = context.getString(name as never)
                break
              case 'Integer':
                value = context.getInteger(name as never)
                break
              case 'Number':
                value = context.getNumber(name as never)
                break
              case 'Boolean':
                value = context.getBoolean(name as never)
                break
              case 'User':
                value = context.getUser(name as never)
                break
              case 'Channel':
                value = context.getChannel(name as never)
                break
              case 'Role':
                value = context.getRole(name as never)
                break
              case 'Mentionable':
                value = context.getMentionable(name as never)
                break
              case 'Attachment':
                value = context.getAttachment(name as never)
                break
            }
            // cache result
            Object.defineProperty(values, key, {
              configurable: true,
              enumerable: true,
              value,
              writable: false,
            })
            return value
          },
        })
      }
      return values as SlashCommandArgs<O>
    }

    const definition: CommandDefinition = {
      name: result.name,
      description: result.description ?? result.name,
      type,
      ...this.#commandMetadata(result),
      options: Object.entries(args).map(([key, option]) => ({
        ...option,
        type: optionType(option.type),
        name: option.name ?? key,
        description: option.description ?? option.name ?? key,
      } as APIApplicationCommandOption)),
      resolve: result.resolve
        ? ({context, ctx}) => {
          const commandContext = context as unknown as ApplicationCommandContextChatInput<
            SlashCommandContextOption<O>
          >
          return result.resolve!(commandContext, getArgs(commandContext), ctx as Ctx)
        }
        : undefined,
      autocomplete: result.autocomplete
        ? ({context, ctx, options}) => {
          const rawArgs = Object.fromEntries(
            Object.entries(args).map(([key, arg]) => [key, options[arg.name ?? key]?.value]),
          )
          return result.autocomplete!(context, ctx as Ctx, rawArgs as SlashCommandArgs<O>)
        }
        : undefined,
      children: result.commands?.map((command) => this.#definition(command)),
    }

    return this.#publicResult(definition)
  }

  #commandMetadata(metadata: CommandMetadata): CommandMetadata {
    return {
      name_localizations: metadata.name_localizations,
      description_localizations: metadata.description_localizations,
      default_member_permissions: metadata.default_member_permissions,
      dm_permission: metadata.dm_permission,
      default_permission: metadata.default_permission,
      nsfw: metadata.nsfw,
      integration_types: metadata.integration_types,
      contexts: metadata.contexts,
    }
  }

  #definition(command: CommandResult | CommandDefinition): CommandDefinition {
    return commandDefinition in command && command[commandDefinition]
      ? command[commandDefinition]
      : command as CommandDefinition
  }

  #publicResult(definition: CommandDefinition): CommandResult {
    return {
      name: definition.name,
      description: definition.description,
      commands: definition.children,
      [commandDefinition]: definition,
    }
  }

  #toApplicationCommand(command: CommandDefinition): RESTPostAPIApplicationCommandsJSONBody {
    const metadata = this.#commandMetadata(command)
    if (
      command.applicationType === ApplicationCommandType.User
      || command.applicationType === ApplicationCommandType.Message
    ) {
      return {
        ...metadata,
        type: command.applicationType,
        name: command.name,
      }
    }

    if (command.applicationType === ApplicationCommandType.PrimaryEntryPoint) {
      return {
        ...metadata,
        type: ApplicationCommandType.PrimaryEntryPoint,
        name: command.name,
        description: command.description,
        handler: command.handler,
      }
    }

    return {
      ...metadata,
      type: ApplicationCommandType.ChatInput,
      name: command.name,
      description: command.description,
      ...(command.options?.length ? {options: command.options} : {}),
      ...(command.children?.length
        ? {
          options: command.children.map((child) => ({
            type: child.type === 'group'
              ? ApplicationCommandOptionType.SubcommandGroup
              : ApplicationCommandOptionType.Subcommand,
            name: child.name,
            description: child.description,
            ...(child.options?.length ? {options: child.options} : {}),
            ...(child.children?.length
              ? {
                options: child.children.map((nested) => ({
                  type: ApplicationCommandOptionType.Subcommand,
                  name: nested.name,
                  description: nested.description,
                  ...(nested.options?.length ? {options: nested.options} : {}),
                })),
              }
              : {}),
          } as APIApplicationCommandOption)),
        }
        : {}),
    }
  }

  #tools(): CommandBuilder<Ctx> {
    const makeOption = <K extends OptionKind>(options: BuilderCommandOptions & {type: K} & object) =>
      options as Arg<K, OptionValue<K>, boolean, string | undefined, object>
    const option = Object.assign(makeOption, {
      string: (options: BuilderCommandOptions) => makeOption({...options, type: 'String' as const}),
      integer: (options: BuilderCommandOptions) => makeOption({...options, type: 'Integer' as const}),
      boolean: (options: BuilderCommandOptions) => makeOption({...options, type: 'Boolean' as const}),
      user: (options: BuilderCommandOptions) => makeOption({...options, type: 'User' as const}),
      channel: (options: BuilderCommandOptions) => makeOption({...options, type: 'Channel' as const}),
      role: (options: BuilderCommandOptions) => makeOption({...options, type: 'Role' as const}),
      mentionable: (options: BuilderCommandOptions) => makeOption({...options, type: 'Mentionable' as const}),
      number: (options: BuilderCommandOptions) => makeOption({...options, type: 'Number' as const}),
      attachment: (options: BuilderCommandOptions) => makeOption({...options, type: 'Attachment' as const}),
    }) as OptionFactory
    const tools = ((definition: unknown) => definition) as CommandBuilder<Ctx>
    tools.option = option
    tools.autocomplete = () => true
    return tools
  }
}
