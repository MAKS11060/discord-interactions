import {ApplicationIntegrationType, ChannelType, InteractionContextType} from 'discord-api-types/v10'
import {Fmt, t} from '../../src/fmt.ts'
import {schema} from '../builder.ts'

const allOptions = schema.declareCommand({
  name: 'all-options',
  description: 'Test every chat input option field',
  name_localizations: {'en-US': 'all-options'},
  description_localizations: {'en-US': 'Test every option field'},
  default_member_permissions: '8',
  dm_permission: true,
  default_permission: true,
  nsfw: false,
  integration_types: [
    ApplicationIntegrationType.GuildInstall,
    ApplicationIntegrationType.UserInstall,
  ],
  contexts: [
    InteractionContextType.Guild,
    InteractionContextType.BotDM,
    InteractionContextType.PrivateChannel,
  ],
  args: {
    integer: schema.arg.integer({
      required: true,
      description: 'Integer with choices and range',
      autocomplete: false,
      min_value: 1,
      max_value: 10,
      choices: [{name: 'one', value: 1}, {name: 'two', value: 2}],
    }),
    string: schema.arg.string({
      name: 'string',
      description: 'String with choices and length constraints',
      required: false,
      autocomplete: false,
      min_length: 1,
      max_length: 100,
      choices: [{name: 'val 1', value: 'val-1'}, {name: 'val 2', value: 'val-2'}],
    }),
    number: schema.arg.number({
      description: 'Number with range and autocomplete',
      required: false,
      autocomplete: true,
      min_value: 0,
      max_value: 100,
    }),
    boolean: schema.arg.boolean({description: 'Boolean option', required: false}),
    user: schema.arg.user({description: 'User option', required: false}),
    channel: schema.arg.channel({
      description: 'Channel option restricted by channel type',
      required: false,
      channel_types: [ChannelType.GuildText, ChannelType.GuildVoice],
    }),
    role: schema.arg.role({description: 'Role option', required: false}),
    mentionable: schema.arg.mentionable({description: 'Mentionable option', required: false}),
    attachment: schema.arg.attachment({
      description: 'Attachment option with file type restrictions',
      required: false,
      file_types: ['image', '.pdf'],
    }),
  },
  resolve: (c, args) => {
    // console.dir(c.interaction, {depth: null})
    const text = Fmt.join([
      t`hello`.bold(),
      Fmt.mention(c.from.user),

      t`at`,
      Fmt.timestamp(Date.now(), 'relative'),

      t`\n`,
      t`const timeString = \`${new Date().toISOString()}\``.code('ts'),

      t`\n`,
      t`${JSON.stringify(args, null, 2)}`.code('json'),
    ])

    return c.reply(text)
  },

  autocomplete: (c) => {
    console.log(c.interaction.data)
    const values = new Array(30).entries().map((v) => v[0] + 1 as number).toArray()
    return c.suggest(values)
  },
})

const hello = schema.declareCommand({
  name: 'hello',
  resolve: (context) => context.reply('Hi!'),
})

const direct = schema.declareSubcommand({
  name: 'direct',
  description: 'Direct subcommand',
  args: {
    value: schema.arg.string({description: 'Subcommand value', required: true}),
  },
  resolve: (context, args) => context.reply(`Direct: ${args.value}`),
})

const manage = schema.declareSubcommandGroup({
  name: 'manage',
  description: 'Management subcommands',
}, (t) => [
  t.declareSubcommand({
    name: 'create',
    description: 'Create an item',
    args: {
      amount: t.arg.integer({description: 'Amount to create', required: true}),
    },
    resolve: (context, args) => {
      // console.log(context.getInteger('amount'))
      console.dir(context, {depth: null})
      return context.reply(`Create ${args.amount}`)
    },
  }),
  schema.declareSubcommand({
    name: 'delete',
    description: 'Delete an item',
    args: {
      id: schema.arg.string({description: 'Item identifier', required: true}),
    },
    resolve: (context, args) => context.reply(`Delete ${args.id}`),
  }),
])

const inspect = schema.declareSubcommandGroup({
  name: 'inspect',
  description: 'Inspection subcommands',
}, (t) => [
  t.declareSubcommand({
    name: 'show',
    description: 'Show an item',
    args: {
      id: t.arg.string({description: 'Item identifier', required: true}),
    },
    resolve: (context, args) => context.reply(`Show ${args.id}`),
  }),
])

const commandTree = schema.declareCommand({
  name: 'command-tree',
  description: 'Valid subcommand and subcommand-group structure',
  resolve: (context) => context.reply('Choose a subcommand'),
}, () => [direct, manage, inspect])

schema.slashCommands([allOptions, hello, commandTree])
