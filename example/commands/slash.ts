import {ApplicationIntegrationType, ChannelType, InteractionContextType} from 'discord-api-types/v10'
import {schema} from '../builder.ts'

schema.slashCommands((t) => ({
  'all-options': t.command({
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
      integer: t.arg.integer({
        required: true,
        description: 'Integer with choices and range',
        autocomplete: false,
        min_value: 1,
        max_value: 10,
        choices: [{name: 'one', value: 1}, {name: 'two', value: 2}],
      }),
      string: t.arg.string({
        name: 'string',
        description: 'String with choices and length constraints',
        required: false,
        autocomplete: false,
        min_length: 1,
        max_length: 100,
        choices: [{name: 'val 1', value: 'val-1'}, {name: 'val 2', value: 'val-2'}],
      }),
      number: t.arg.number({
        description: 'Number with range and autocomplete',
        required: false,
        autocomplete: true,
        min_value: 0,
        max_value: 100,
      }),
      boolean: t.arg.boolean({description: 'Boolean option', required: false}),
      user: t.arg.user({description: 'User option', required: false}),
      channel: t.arg.channel({
        description: 'Channel option restricted by channel type',
        required: false,
        channel_types: [ChannelType.GuildText, ChannelType.GuildVoice],
      }),
      role: t.arg.role({description: 'Role option', required: false}),
      mentionable: t.arg.mentionable({description: 'Mentionable option', required: false}),
      attachment: t.arg.attachment({
        description: 'Attachment option with file type restrictions',
        required: false,
        file_types: ['image', '.pdf'],
      }),
    },
    resolve: (context, args) => {
      return context.reply(`Received ${args.integer}`)
    },
  }),
  'command-tree': t.command({
    name: 'command-tree',
    description: 'Valid subcommand and subcommand-group structure',
    commands: [
      t.subcommand({
        name: 'direct',
        description: 'Direct subcommand',
        args: {
          value: t.arg.string({description: 'Subcommand value', required: true}),
        },
        resolve: (context, args) => context.reply(`Direct: ${args.value}`),
      }),
      t.group({
        name: 'manage',
        description: 'Management subcommands',
        commands: [
          t.subcommand({
            name: 'create',
            description: 'Create an item',
            args: {
              amount: t.arg.integer({description: 'Amount to create', required: true}),
            },
            resolve: (context, args) => context.reply(`Create ${args.amount}`),
          }),
          t.subcommand({
            name: 'delete',
            description: 'Delete an item',
            args: {
              id: t.arg.string({description: 'Item identifier', required: true}),
            },
            resolve: (context, args) => context.reply(`Delete ${args.id}`),
          }),
        ],
      }),
      t.group({
        name: 'inspect',
        description: 'Inspection subcommands',
        commands: [
          t.subcommand({
            name: 'show',
            description: 'Show an item',
            args: {
              id: t.arg.string({description: 'Item identifier', required: true}),
            },
            resolve: (context, args) => context.reply(`Show ${args.id}`),
          }),
        ],
      }),
    ],
    resolve: (context) => context.reply('Choose a subcommand'),
  }),
}))
