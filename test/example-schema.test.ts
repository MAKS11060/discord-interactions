import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  type RESTPutAPIApplicationCommandsJSONBody,
} from 'discord-api-types/v10'
import assert from 'node:assert/strict'
import test from 'node:test'
import {schema} from '../example/builder.ts'
import '../example/commands/activity.ts'
import '../example/commands/message.ts'
import '../example/commands/slash.ts'
import '../example/commands/user.ts'
import {InteractionBuilder} from '../src/builder.ts'

test('example commands build the complete REST command schema', () => {
  const commands = schema.toJSON()
  assert.deepEqual(
    commands.map((command) => command.name).sort(),
    [
      'all-options',
      'activity',
      'command-tree',
      'hello',
      'message-context',
      'user-context',
    ].sort(),
  )

  const allOptions = commands.find((command) => command.name === 'all-options')
  assert.ok(allOptions)
  assert.equal(allOptions.type, ApplicationCommandType.ChatInput)
  if (allOptions.type !== ApplicationCommandType.ChatInput) return

  const integer = allOptions.options?.find((option) => option.name === 'integer')
  assert.equal(integer?.type, ApplicationCommandOptionType.Integer)
  if (integer?.type === ApplicationCommandOptionType.Integer) {
    assert.equal(integer.min_value, 1)
    assert.equal(integer.max_value, 10)
    assert.deepEqual(integer.choices?.map(({value}) => value), [1, 2])
  }

  const string = allOptions.options?.find((option) => option.name === 'string')
  assert.equal(string?.type, ApplicationCommandOptionType.String)
  if (string?.type === ApplicationCommandOptionType.String) {
    assert.equal(string.min_length, 1)
    assert.equal(string.max_length, 100)
    assert.deepEqual(string.choices?.map(({value}) => value), ['val-1', 'val-2'])
  }

  const number = allOptions.options?.find((option) => option.name === 'number')
  assert.equal(number?.type, ApplicationCommandOptionType.Number)
  if (number?.type === ApplicationCommandOptionType.Number) {
    assert.equal(number.autocomplete, true)
    assert.equal(number.min_value, 0)
    assert.equal(number.max_value, 100)
  }

  const channel = allOptions.options?.find((option) => option.name === 'channel')
  assert.equal(channel?.type, ApplicationCommandOptionType.Channel)
  if (channel?.type === ApplicationCommandOptionType.Channel) {
    assert.deepEqual(channel.channel_types, [0, 2])
    assert.equal('autocomplete' in channel, false)
  }

  const boolean = allOptions.options?.find((option) => option.name === 'boolean')
  assert.equal(boolean?.type, ApplicationCommandOptionType.Boolean)
  assert.equal(boolean && 'autocomplete' in boolean, false)

  const attachment = allOptions.options?.find((option) => option.name === 'attachment')
  assert.equal(attachment?.type, ApplicationCommandOptionType.Attachment)
  if (attachment?.type === ApplicationCommandOptionType.Attachment) {
    assert.deepEqual(attachment.file_types, ['image', '.pdf'])
  }

  const tree = commands.find((command) => command.name === 'command-tree')
  assert.ok(tree?.type === ApplicationCommandType.ChatInput)
  assert.deepEqual(tree.options?.map((option) => option.type), [
    ApplicationCommandOptionType.Subcommand,
    ApplicationCommandOptionType.SubcommandGroup,
    ApplicationCommandOptionType.SubcommandGroup,
  ])
  const group = tree.options?.find((option) => option.name === 'manage')
  assert.equal(group?.type, ApplicationCommandOptionType.SubcommandGroup)
  if (group?.type === ApplicationCommandOptionType.SubcommandGroup) {
    assert.deepEqual(group.options?.map((option) => option.name), ['create', 'delete'])
  }

  assert.equal(commands.find((command) => command.name === 'user-context')?.type, ApplicationCommandType.User)
  assert.equal(commands.find((command) => command.name === 'message-context')?.type, ApplicationCommandType.Message)
  assert.equal(commands.find((command) => command.name === 'activity')?.type, ApplicationCommandType.PrimaryEntryPoint)
})

test('argument builder restricts fields to supported option types', () => {
  const builder = new InteractionBuilder()
  builder.slashCommands((t) => [t.command({
    name: 'invalid',
    args: {
      // @ts-expect-error Boolean options do not support autocomplete.
      boolean: t.arg.boolean({autocomplete: true}),
      // @ts-expect-error User options do not support choices.
      user: t.arg.user({choices: [{name: 'Ada', value: 'ada'}]}),
      // @ts-expect-error Channel options do not support autocomplete.
      channel: t.arg.channel({autocomplete: true}),
      // @ts-expect-error String choices must use string values.
      string: t.arg.string({choices: [{name: 'one', value: 1}]}),
    },
  })])
})
