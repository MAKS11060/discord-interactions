import type {APIAttachment, APIInteractionDataResolvedChannel, APIRole, APIUser} from 'discord-api-types/v10'
import {ApplicationCommandOptionType, ApplicationCommandType} from 'discord-api-types/v10'
import assert from 'node:assert/strict'
import {test} from 'node:test'
import {InteractionBuilder} from './builder.ts'
import {ApplicationCommandContextChatInput} from './context.ts'

test('Test 607811', async (t) => {
  const interactionBuilder = new InteractionBuilder()

  interactionBuilder.slashCommands((t) => [t.command({
    name: 'hello',
    description: 'say hello to',
    args: {
      text: t.arg.string({name: 'user', required: true}),
      count: t.arg.integer({required: false}),
      number: t.arg.number({required: false}),
      flag: t.arg.boolean({required: true}),
      target: t.arg.user({name: 'member', required: true}),
      channel: t.arg.channel({required: false}),
      role: t.arg.role({required: false}),
      mentionable: t.arg.mentionable({required: false}),
      file: t.arg.attachment({required: false}),
    },
    resolve: (c, args) => {
      args.text satisfies string
      args.count satisfies number | null
      args.number satisfies number | null
      args.flag satisfies boolean
      args.target satisfies APIUser
      args.channel satisfies APIInteractionDataResolvedChannel | null
      args.role satisfies APIRole | null
      args.mentionable satisfies APIUser | APIRole | null
      args.file satisfies APIAttachment | null
      assert.equal(args.count, null)
      assert.equal(args.number, 4.5)
      assert.equal(args.flag, true)
      assert.equal(args.target.id, 'target')
      assert.equal(args.channel?.id, 'channel')
      assert.equal(args.role?.id, 'role')
      assert.equal(args.mentionable?.id, 'mention')
      assert.equal(args.file?.id, 'attachment')

      c.getString('user') satisfies string
      c.getInteger('count') satisfies number | null
      c.getNumber('number') satisfies number | null
      c.getBoolean('flag') satisfies boolean
      c.getUser('member') satisfies APIUser
      c.getChannel('channel') satisfies APIInteractionDataResolvedChannel | null
      c.getRole('role') satisfies APIRole | null
      c.getMentionable('mentionable') satisfies APIUser | APIRole | null
      c.getAttachment('file') satisfies APIAttachment | null
      // @ts-expect-error The getter name must refer to an option of the matching type.
      c.getInteger('user')

      return c.reply(`User ${c.from.user.global_name} say: Hello ${args.text}`)
    },
  })])

  const [command] = interactionBuilder.toJSON()
  assert.equal(command?.name, 'hello')
  assert.ok(command?.type === ApplicationCommandType.ChatInput)
  if (command?.type !== ApplicationCommandType.ChatInput) return
  assert.deepEqual(
    command.options?.map((option) => [option.type, option.name]),
    [[3, 'user'], [4, 'count'], [10, 'number'], [5, 'flag'], [6, 'member'], [7, 'channel'], [8, 'role'], [
      9,
      'mentionable',
    ], [11, 'file']],
  )

  const targetUser = {id: 'target', username: 'Target'}
  const mentionableUser = {id: 'mention', username: 'Mention'}
  const channel = {id: 'channel'}
  const role = {id: 'role'}
  const attachment = {id: 'attachment'}
  const context = new ApplicationCommandContextChatInput({
    data: {
      type: ApplicationCommandType.ChatInput,
      options: [
        {type: ApplicationCommandOptionType.String, name: 'user', value: 'Ada'},
        {type: ApplicationCommandOptionType.Number, name: 'number', value: 4.5},
        {type: ApplicationCommandOptionType.Boolean, name: 'flag', value: true},
        {type: ApplicationCommandOptionType.User, name: 'member', value: 'target'},
        {type: ApplicationCommandOptionType.Channel, name: 'channel', value: 'channel'},
        {type: ApplicationCommandOptionType.Role, name: 'role', value: 'role'},
        {type: ApplicationCommandOptionType.Mentionable, name: 'mentionable', value: 'mention'},
        {type: ApplicationCommandOptionType.Attachment, name: 'file', value: 'attachment'},
      ],
      resolved: {
        users: {target: targetUser, mention: mentionableUser},
        channels: {channel},
        roles: {role},
        attachments: {attachment},
      },
    },
    user: {id: 'initiator', username: 'Ada', global_name: 'Ada'},
  } as never)
  const result = await interactionBuilder.commands[0]?.resolve?.({
    context,
    ctx: undefined,
    options: {},
  })
  assert.deepEqual(result, {type: 4, data: {content: 'User Ada say: Hello Ada'}})
  assert.equal(context.getNumber('number'), 4.5)
})

test('declared slash commands can be registered in multiple builders', () => {
  type Context = {label: string}
  const declarationBuilder = new InteractionBuilder<Context>()
  const reusable = declarationBuilder.declareCommand({
    name: 'reusable',
    args: {
      label: declarationBuilder.arg.string({required: true}),
    },
    resolve: (context, args, ctx) => {
      args.label satisfies string
      ctx.label satisfies string
      return context.reply(ctx.label)
    },
  })

  const first = new InteractionBuilder<Context>()
  const second = new InteractionBuilder<Context>()
  first.slashCommands([reusable])
  second.slashCommands(() => [reusable])

  assert.deepEqual(first.toJSON(), second.toJSON())
  assert.equal(first.toJSON()[0]?.name, 'reusable')
  assert.equal(second.toJSON()[0]?.name, 'reusable')
})

test('slash argument getters run only when resolve reads the argument', async () => {
  const builder = new InteractionBuilder()
  const command = builder.declareCommand({
    name: 'lazy-args',
    args: {
      count: builder.arg.integer({required: true}),
      user: builder.arg.user({required: false}),
    },
    resolve: (_context, args) => {
      assert.equal(args.count, 3)
      assert.equal(args.count, 3)
      return {type: 4, data: {content: 'done'}}
    },
  })

  let integerCalls = 0
  let userCalls = 0
  builder.slashCommands([command])
  const definition = builder.commands[0]
  assert.ok(definition?.resolve)

  await definition.resolve({
    context: {
      getInteger() {
        integerCalls += 1
        return 3
      },
      getUser() {
        userCalls += 1
        throw new Error('Unused argument getter should not run')
      },
    } as never,
    ctx: undefined,
    options: {},
  })
  assert.equal(integerCalls, 1)
  assert.equal(userCalls, 0)
})

test('Context menu commands accept flat definitions', () => {
  const declarations = new InteractionBuilder()
  const interactionBuilder = new InteractionBuilder()
  const userCommand = declarations.declareUser({
    name: 'user-context',
    resolve: (context) => context.reply(context.to.user.username),
  })
  const messageCommand = declarations.declareMessage({
    name: 'message-context',
    resolve: (context) => context.reply('message selected'),
  })
  const primaryEntryPoint = declarations.declarePrimaryEntryPoint({
    name: 'activity',
    description: 'Launch the activity',
  })

  interactionBuilder.user(userCommand)
  interactionBuilder.message(messageCommand)
  interactionBuilder.primaryEntryPoint(primaryEntryPoint)
  assert.deepEqual(interactionBuilder.toJSON().map((command) => [command.type, command.name]), [
    [ApplicationCommandType.User, 'user-context'],
    [ApplicationCommandType.Message, 'message-context'],
    [ApplicationCommandType.PrimaryEntryPoint, 'activity'],
  ])
})
