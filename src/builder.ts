import type {RESTPostAPIChatInputApplicationCommandsJSONBody} from 'discord-api-types/rest/v10'
import {
  type APIApplicationCommandOption,
  type APIApplicationCommandOptionChoice,
  type APIInteractionResponse,
  ApplicationCommandOptionType,
  ApplicationCommandType,
} from 'discord-api-types/v10'
import type {
  ApplicationCommandAutocompleteContext,
  ApplicationCommandContextChatInput,
  ApplicationCommandContextMessage,
  ApplicationCommandContextUser,
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

export type Arg<
  K extends OptionKind = OptionKind,
  V extends Primitive = Primitive,
  R extends boolean = boolean,
> = {
  type: K
  description: string
  required: R extends true ? true : false | undefined
  autocomplete?: boolean
  value?: V
}

type AnyArg = Arg<OptionKind, Primitive>

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
  <K extends OptionKind, const R extends boolean = false>(
    options: BuilderCommandOptions & {type: K; required?: R},
  ): Arg<K, OptionValue<K>, R>
  string<const R extends boolean = false>(options: BuilderCommandOptions & {required?: R}): Arg<'String', string, R>
  integer<const R extends boolean = false>(options: BuilderCommandOptions & {required?: R}): Arg<'Integer', number, R>
  boolean<const R extends boolean = false>(options: BuilderCommandOptions & {required?: R}): Arg<'Boolean', boolean, R>
  user<const R extends boolean = false>(options: BuilderCommandOptions & {required?: R}): Arg<'User', string, R>
  channel<const R extends boolean = false>(options: BuilderCommandOptions & {required?: R}): Arg<'Channel', string, R>
  role<const R extends boolean = false>(options: BuilderCommandOptions & {required?: R}): Arg<'Role', string, R>
  mentionable<const R extends boolean = false>(
    options: BuilderCommandOptions & {required?: R},
  ): Arg<'Mentionable', string, R>
  number<const R extends boolean = false>(options: BuilderCommandOptions & {required?: R}): Arg<'Number', number, R>
  attachment<const R extends boolean = false>(
    options: BuilderCommandOptions & {required?: R},
  ): Arg<'Attachment', string, R>
}

interface BuilderCommandOptions {
  description: string
  autocomplete?: boolean
}

type SlashResult<Ctx extends object, O extends Record<string, AnyArg>> = {
  name: string
  description?: string
  options?: O
  resolve?: SlashCommandDefinition<Ctx, O>['resolve']
  autocomplete?(
    context: ApplicationCommandAutocompleteContext,
    ctx: Ctx,
    options: ResolvedOptions<O>,
  ): APIApplicationCommandOptionChoice[] | Promise<APIApplicationCommandOptionChoice[]>
  commands?: Array<CommandResult | CommandDefinition>
}

type SlashResultWithOptions<Ctx extends object, O extends Record<string, AnyArg>> =
  & {options: { [K in keyof O]: O[K] }}
  & Omit<SlashResult<Ctx, O>, 'options'>

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

  toJSON(): RESTPostAPIChatInputApplicationCommandsJSONBody[] {
    return this.#commands.map((command) => this.#toApplicationCommand(command))
  }

  /** Used by DiscordInteraction; command lookup is intentionally kept outside this builder. */
  get commands(): readonly CommandDefinition[] {
    return this.#commands
  }

  slashCommand<const O extends Record<string, AnyArg>>(
    builder: (t: CommandBuilder<Ctx>) => SlashResultWithOptions<Ctx, O> | SlashCommandDefinition<Ctx, O>,
  ): CommandResult
  slashCommand(
    builder: (t: CommandBuilder<Ctx>) => SlashResult<Ctx, Record<never, never>>,
  ): CommandResult
  slashCommand(
    builder: (t: CommandBuilder<Ctx>) => SlashResult<Ctx, Record<string, AnyArg>>,
  ): CommandResult {
    const result = this.#registerSlash(builder, 'command')
    this.#commands.push(result)
    return this.#publicResult(result)
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
    builder: (
      t: CommandBuilder<Ctx>,
    ) => {name: string; resolve?: (context: ApplicationCommandContextMessage, ctx: Ctx) => APIInteractionResponse},
  ): CommandResult {
    const result = builder(this.#tools())
    const definition: CommandDefinition = {
      name: result.name,
      description: '',
      type: 'command',
      resolve: result.resolve
        ? ({context, ctx}) => result.resolve!(context as ApplicationCommandContextMessage, ctx as Ctx)
        : undefined,
    }
    this.#commands.push(definition)
    return this.#publicResult(definition)
  }

  user(
    builder: (
      t: CommandBuilder,
    ) => {name: string; resolve?: (context: ApplicationCommandContextUser, ctx: Ctx) => APIInteractionResponse},
  ) {
    const result = builder(this.#tools())
    const definition: CommandDefinition = {
      name: result.name,
      description: '',
      type: 'command',
      resolve: result.resolve
        ? ({context, ctx}) => result.resolve!(context as ApplicationCommandContextUser, ctx as Ctx)
        : undefined,
    }
    this.#commands.push(definition)
    return this.#publicResult(definition)
  }

  #registerSlash<const O extends Record<string, AnyArg>>(
    builder: (t: CommandBuilder<Ctx>) => SlashResult<Ctx, O>,
    type: CommandDefinition['type'],
  ): CommandDefinition {
    const result = builder(this.#tools())
    const definition: CommandDefinition = {
      name: result.name,
      description: result.description ?? result.name,
      type,
      options: Object.entries(result.options ?? {}).map(([name, option]) => ({
        type: optionType(option.type),
        name,
        description: option.description,
        required: option.required,
        autocomplete: option.autocomplete,
      } as APIApplicationCommandOption)),
      resolve: result.resolve
        ? ({context, ctx}) => result.resolve!(context as ApplicationCommandContextWithOptions<O>, ctx as Ctx)
        : undefined,
      autocomplete: result.autocomplete
        ? ({context, ctx, options}) => result.autocomplete!(context, ctx as Ctx, options as ResolvedOptions<O>)
        : undefined,
      children: result.commands?.map((command) => this.#definition(command)),
    }
    return definition
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

  #toApplicationCommand(command: CommandDefinition): RESTPostAPIChatInputApplicationCommandsJSONBody {
    return {
      type: command.type === 'command' && command.children?.length
        ? ApplicationCommandType.ChatInput
        : ApplicationCommandType.ChatInput,
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
    const makeOption = <K extends OptionKind>(options: BuilderCommandOptions & {type: K}) =>
      options as Arg<K, OptionValue<K>>
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
