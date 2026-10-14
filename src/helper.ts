export const CHAT_INPUT_NAME_RE = /^[-_\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32}$/u

export const isValidChatInputName = (name: string) => CHAT_INPUT_NAME_RE.test(name)

const ANSI_COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
}

export interface PrintSchemaOptions {
  showOptions?: boolean
  showSlash?: boolean
  showUser?: boolean
  showMessage?: boolean
  /** Include false boolean fields; false values are hidden by default. */
  showFalse?: boolean
  /** Include boolean fields set to their Discord defaults. */
  showDefaults?: boolean
}

type SchemaOption = {
  type?: number | string
  name: string
  description?: string
  required?: boolean
  autocomplete?: boolean
  options?: SchemaOption[]
  children?: SchemaCommand[]
}

type SchemaCommand = {
  type?: number | string
  name: string
  description?: string
  options?: SchemaOption[]
  children?: SchemaCommand[]
  nsfw?: boolean
  dm_permission?: boolean
  default_permission?: boolean
}

type SchemaContainer = {
  toJSON?: () => unknown
  commands?: unknown
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isSchemaCommand = (value: unknown): value is SchemaCommand => isRecord(value) && typeof value.name === 'string'

const getSchemaCommands = (schema: unknown): SchemaCommand[] => {
  let commands: unknown = schema

  if (!Array.isArray(commands) && isRecord(schema)) {
    const container = schema as SchemaContainer
    if (typeof container.toJSON === 'function') {
      commands = container.toJSON()
    } else if (Array.isArray(container.commands)) {
      commands = container.commands
    }
  }

  if (!Array.isArray(commands) || !commands.every(isSchemaCommand)) {
    throw new TypeError('Expected an array of application commands or a schema with toJSON()/commands')
  }

  return commands
}

const getCommandCategory = (type: SchemaCommand['type']): 'slash' | 'user' | 'message' => {
  if (type === 2 || type === 'User' || type === 'user') return 'user'
  if (type === 3 || type === 'Message' || type === 'message') return 'message'
  return 'slash'
}

const getOptionKind = (type: SchemaOption['type']): 'subcommand' | 'group' | 'option' => {
  if (type === 1 || type === 'Subcommand' || type === 'subcommand') return 'subcommand'
  if (type === 2 || type === 'SubcommandGroup' || type === 'group') return 'group'
  return 'option'
}

const optionTypeLabels: Record<number, string> = {
  3: 'String',
  4: 'Integer',
  5: 'Boolean',
  6: 'User',
  7: 'Channel',
  8: 'Role',
  9: 'Mentionable',
  10: 'Number',
  11: 'Attachment',
}

export const printSchema = (schema: unknown, options: PrintSchemaOptions = {}): string => {
  const {
    showOptions = false,
    showSlash = true,
    showUser = true,
    showMessage = true,
    showFalse = false,
    showDefaults = false,
  } = options
  const enabled = {slash: showSlash, user: showUser, message: showMessage}
  const commands = getSchemaCommands(schema)
  const lines: string[] = []

  const colorize = (color: string, text: string) => `${color}${text}${ANSI_COLORS.reset}`
  const renderBooleanFlags = (
    values: Partial<
      Record<'required' | 'autocomplete' | 'nsfw' | 'dm_permission' | 'default_permission', boolean>
    >,
    depth: number,
  ) => {
    const defaults = {
      required: false,
      autocomplete: false,
      nsfw: false,
      dm_permission: true,
      default_permission: true,
    } as const
    const flags = (Object.keys(defaults) as Array<keyof typeof defaults>).flatMap((name) => {
      const value = values[name]
      if (value === undefined) return []
      if (!showFalse && !value) return []
      if (!showDefaults && value === defaults[name] && !(showFalse && !value)) return []

      const color = value ? ANSI_COLORS.green : ANSI_COLORS.red
      return [colorize(color, `${name}: ${value}`)]
    })

    return flags.length ? `${' '.repeat(depth)}${flags.join(' | ')}` : ''
  }

  const renderOption = (option: SchemaOption, depth: number) => {
    const kind = getOptionKind(option.type)
    if (kind === 'option' && !showOptions) return

    const indent = '  '.repeat(depth)
    const flags = renderBooleanFlags(option, 0)
    const suffix = flags ? ` ${flags}` : ''
    const description = option.description ? colorize(ANSI_COLORS.dim, ` (${option.description})`) : ''
    const label = kind === 'group'
      ? 'group'
      : kind === 'subcommand'
      ? 'subcommand'
      : typeof option.type === 'number'
      ? optionTypeLabels[option.type] ?? `type:${option.type}`
      : option.type ?? 'option'

    lines.push(
      `${indent}${colorize(ANSI_COLORS.magenta, String(label))} ${
        colorize(ANSI_COLORS.green, option.name)
      }${description}${suffix}`,
    )
    option.options?.forEach((child) => renderOption(child, depth + 1))
    option.children?.forEach((child) =>
      renderOption({
        type: child.type === 'group' ? 'group' : 'subcommand',
        name: child.name,
        description: child.description,
        options: child.options,
        children: child.children,
      }, depth + 1)
    )
  }

  for (const category of ['slash', 'user', 'message'] as const) {
    if (!enabled[category]) continue

    const categoryCommands = commands.filter((command) => getCommandCategory(command.type) === category)
    if (categoryCommands.length === 0) continue

    const categoryName = category === 'slash' ? 'slash-command' : category
    lines.push(colorize(ANSI_COLORS.cyan, categoryName))

    for (const command of categoryCommands) {
      const description = command.description ? colorize(ANSI_COLORS.dim, ` (${command.description})`) : ''
      const flags = renderBooleanFlags(command, 0)
      const suffix = flags ? ` ${flags}` : ''

      lines.push(`  ${colorize(ANSI_COLORS.green, command.name)}${description}${suffix}`)
      command.options?.forEach((option) => renderOption(option, 2))
      command.children?.forEach((child) =>
        renderOption({
          type: child.type === 'group' ? 'group' : 'subcommand',
          name: child.name,
          description: child.description,
          options: child.options,
          children: child.children,
        }, 2)
      )
    }
  }

  const output = lines.join('\n')
  if (output) console.log(output)
  return output
}
