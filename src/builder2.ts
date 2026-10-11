import {ApplicationCommandOptionType} from 'discord-api-types/v10'

type OptionTypeName = Exclude<keyof typeof ApplicationCommandOptionType, 'Subcommand' | 'SubcommandGroup'>

interface ArgOptions {
  type: OptionTypeName
  description?: string
  required?: boolean
  [key: string]: any
}

interface ResolvedArg {
  type: OptionTypeName
  description?: string
  required?: boolean
}

type ArgValue<T extends OptionTypeName> = T extends 'String' ? string
  : T extends 'Integer' | 'Number' ? number
  : T extends 'Boolean' ? boolean
  : string

type ResolvedArgs<Args extends Record<string, ResolvedArg>> = {
  [K in keyof Args]: NonNullable<Args[K]['required']> extends true
    ? ArgValue<Args[K]['type']>
    : ArgValue<Args[K]['type']> | undefined
}

type ArgDefinition<Type extends OptionTypeName, Required extends boolean = false> = {
  type: Type
  description?: string
  required?: Required
}

type ArgFactory =
  & {
    <const Type extends OptionTypeName, const Required extends boolean = false>(
      options: Omit<Partial<ArgOptions>, 'type'> & {type: Type; required?: Required},
    ): ArgDefinition<Type, Required>
    <const Required extends boolean = false>(
      options?: Omit<Partial<ArgOptions>, 'type'> & {required?: Required},
    ): ArgDefinition<'String', Required>
  }
  & Pick<ArgBuilder<object>, 'string' | 'integer' | 'boolean' | 'user' | 'channel' | 'role' | 'mentionable' | 'number' | 'attachment'>

export class InteractionBuilder<T = object> {
  constructor() {}

  slashCommand<const Definition>(
    handler: (t: SlashCommandDefinition<T>) => Definition,
  ): Definition {
    return handler(new SlashCommandDefinition<T>())
  }
}

class SlashCommandDefinition<Types> {
  arg: ArgFactory & ArgBuilder<Types>

  constructor() {
    const builder = new ArgBuilder<Types>(this)
    const fn = builder.argBuilder.bind(builder)
    // Копируем свойства (string, integer, ...) на функцию
    Object.assign(fn, builder)
    this.arg = fn as any
  }

  command<const Args extends Record<string, ResolvedArg> = {}>(definition: {
    name: string
    description?: string
    args?: Args
  }) {
    return {
      resolve: <Result>(
        resolver: (ctx: Types, args: ResolvedArgs<Args>) => Result,
      ) => ({...definition, resolve: resolver}),
    }
  }
}

class ArgBuilder<T> {
  constructor(private def: SlashCommandDefinition<T>) {}

  string = this.helper('String')
  integer = this.helper('Integer')
  boolean = this.helper('Boolean')
  user = this.helper('User')
  channel = this.helper('Channel')
  role = this.helper('Role')
  mentionable = this.helper('Mentionable')
  number = this.helper('Number')
  attachment = this.helper('Attachment')

  argBuilder<const Type extends OptionTypeName, const Required extends boolean = false>(
    options: Omit<Partial<ArgOptions>, 'type'> & {type: Type; required?: Required},
  ): ArgDefinition<Type, Required>
  argBuilder<const Required extends boolean = false>(
    options?: Omit<Partial<ArgOptions>, 'type'> & {required?: Required},
  ): ArgDefinition<'String', Required>
  argBuilder(options?: Partial<ArgOptions>): ResolvedArg {
    return {
      type: options?.type ?? 'String',
      description: options?.description,
      required: options?.required,
    }
  }

  private helper<Type extends OptionTypeName>(type: Type) {
    return <const Required extends boolean = false>(
      options?: Omit<Partial<ArgOptions>, 'type'> & {required?: Required},
    ): ArgDefinition<Type, Required> => {
      return {
        type,
        description: options?.description,
        required: options?.required,
      }
    }
  }
}
