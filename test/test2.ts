import {getEnvRequired} from '#env'
import * as discordRest from '#lib/api/discord/index.ts'
import {createDiscordOauth2, oauth2ClientCredentials, type OAuth2TokenResponse} from '@maks11060/oauth2'
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ApplicationIntegrationType,
  ChannelType,
  EntryPointCommandHandlerType,
  InteractionContextType,
  type RESTPutAPIApplicationCommandsJSONBody,
} from 'discord-api-types/v10'
import test from 'node:test'
import {InteractionBuilder as InteractionBuilder} from '../src/builder2.ts'
import {printSchema} from '../src/helper.ts'

let token: OAuth2TokenResponse
const getToken = async () => {
  token ??= await oauth2ClientCredentials(createDiscordOauth2({
    clientId: getEnvRequired('CLIENT_ID'),
    clientSecret: getEnvRequired('CLIENT_SECRET'),
    scope: ['identify', 'applications.commands.update'],
    redirectUri: '',
  }))

  return token
}

test('app info', async (t) => {
  const {data, error} = await discordRest.getMyOauth2Authorization({
    auth: (await getToken()).access_token,
  })

  console.log({
    user: {
      id: data?.user?.id,
      username: data?.user?.username,
    },
    application: data?.application,
    scopes: data?.scopes,
    expires: data?.expires,
  })
})

test('Print remote commands', async (t) => {
  const {data, error} = await discordRest.listApplicationCommands({
    auth: (await getToken()).access_token,
    path: {application_id: getEnvRequired('CLIENT_ID')},
  })

  printSchema(data, {showOptions: true})
})

test('upload test commands', async (t) => {
  const commands: RESTPutAPIApplicationCommandsJSONBody = [
    {
      type: ApplicationCommandType.ChatInput,
      name: 'all-options',
      name_localizations: {'en-US': 'all-options'},
      description: 'Test every chat input option field',
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
      options: [
        {
          type: ApplicationCommandOptionType.Integer,
          name: 'integer',
          description: 'Integer with choices and range',
          required: true,
          autocomplete: false,
          min_value: 1,
          max_value: 10,
          choices: [
            {name: 'one', value: 1},
            {name: 'two', value: 2},
          ],
        },
        {
          type: ApplicationCommandOptionType.String,
          name: 'string',
          name_localizations: {'en-US': 'string'},
          description: 'String with choices and length constraints',
          description_localizations: {'en-US': 'String option'},
          required: false,
          autocomplete: false,
          min_length: 1,
          max_length: 100,
          choices: [
            {name: 'val 1', value: 'val-1'},
            {name: 'val 2', value: 'val-2'},
          ],
        },
        {
          type: ApplicationCommandOptionType.Number,
          name: 'number',
          description: 'Number with range',
          required: false,
          autocomplete: true,
          min_value: 0,
          max_value: 100,
        },
        {
          type: ApplicationCommandOptionType.Boolean,
          name: 'boolean',
          description: 'Boolean option',
          required: false,
        },
        {
          type: ApplicationCommandOptionType.User,
          name: 'user',
          description: 'User option',
          required: false,
        },
        {
          type: ApplicationCommandOptionType.Channel,
          name: 'channel',
          description: 'Channel option restricted by channel type',
          required: false,
          channel_types: [ChannelType.GuildText, ChannelType.GuildVoice],
        },
        {
          type: ApplicationCommandOptionType.Role,
          name: 'role',
          description: 'Role option',
          required: false,
        },
        {
          type: ApplicationCommandOptionType.Mentionable,
          name: 'mentionable',
          description: 'Mentionable option',
          required: false,
        },
        {
          type: ApplicationCommandOptionType.Attachment,
          name: 'attachment',
          description: 'Attachment option with file type restrictions',
          required: false,
          file_types: ['image', '.pdf'],
        },
      ],
    },
    {
      type: ApplicationCommandType.ChatInput,
      name: 'command-tree',
      description: 'Valid subcommand and subcommand-group structure',
      options: [
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'direct',
          description: 'Direct subcommand',
          options: [
            {
              type: ApplicationCommandOptionType.String,
              name: 'value',
              description: 'Subcommand value',
              required: true,
            },
          ],
        },
        {
          type: ApplicationCommandOptionType.SubcommandGroup,
          name: 'manage',
          description: 'Management subcommands',
          options: [
            {
              type: ApplicationCommandOptionType.Subcommand,
              name: 'create',
              description: 'Create an item',
              options: [
                {
                  type: ApplicationCommandOptionType.Integer,
                  name: 'amount',
                  description: 'Amount to create',
                  required: true,
                },
              ],
            },
            {
              type: ApplicationCommandOptionType.Subcommand,
              name: 'delete',
              description: 'Delete an item',
              options: [
                {
                  type: ApplicationCommandOptionType.String,
                  name: 'id',
                  description: 'Item identifier',
                  required: true,
                },
              ],
            },
          ],
        },
        {
          type: ApplicationCommandOptionType.SubcommandGroup,
          name: 'inspect',
          description: 'Inspection subcommands',
          options: [
            {
              type: ApplicationCommandOptionType.Subcommand,
              name: 'show',
              description: 'Show an item',
              options: [
                {
                  type: ApplicationCommandOptionType.String,
                  name: 'id',
                  description: 'Item identifier',
                  required: true,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: ApplicationCommandType.User,
      name: 'user-context',
      name_localizations: {'en-US': 'user-context'},
      default_member_permissions: null,
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
    },
    {
      type: ApplicationCommandType.Message,
      name: 'message-context',
      name_localizations: {'en-US': 'message-context'},
      default_member_permissions: '8',
      dm_permission: false,
      default_permission: false,
      nsfw: true,
      integration_types: [ApplicationIntegrationType.GuildInstall],
      contexts: [InteractionContextType.Guild],
    },
    {
      type: ApplicationCommandType.PrimaryEntryPoint,
      name: 'activity',
      name_localizations: {'en-US': 'activity'},
      description: 'Launch the activity',
      description_localizations: {'en-US': 'Launch the activity'},
      default_member_permissions: null,
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
      handler: EntryPointCommandHandlerType.AppHandler,
    },
  ]

  // printSchema(commands, {showOptions: true})

  const {data, error} = await discordRest.bulkSetApplicationCommands({
    auth: (await getToken()).access_token,
    path: {application_id: getEnvRequired('CLIENT_ID')},
    body: commands as any,
    headers: {},
  })
  console.dir(error, {depth: null})
  console.log(data)

  printSchema(data, {showOptions: true})
})

test('Test 291904', async (t) => {
  const interactionBuilder = new InteractionBuilder()

  // interactionBuilder.slashSubcommand((t) => ({
  //   name: 'subcommand',
  //   commands: [],
  // }))
})

test('Test 697872', async (t) => {
  const interactionBuilder = new InteractionBuilder()

  interactionBuilder.slashCommand((t) =>
    t.command({
      name: 'name',
      description: 'description',
      args: {
        string1: t.arg({type: 'String'}),
        string2: t.arg.string(),
        count: t.arg({type: 'Integer', required: true}),
        flag: t.arg.boolean({required: true}),
      },
    }).resolve((c, args) => {
      args.string1 satisfies string | undefined
      args.string2 satisfies string | undefined
      args.count satisfies number
      args.flag satisfies boolean

      // return c.reply(`${Date.now()}`)
    })
  )
})

test('Test 790442', async (t) => {
  const slashCommand = <
    const Args extends Record<string, unknown>,
  >(config: {
    name: string
    args: Args
    resolve: (args: Args) => void
  }) => {
  }

  slashCommand({
    name: '',
    args: {
      a: '1',
    },
    resolve: (args) => {
      args
    },
  })
})
