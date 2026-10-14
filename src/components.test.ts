import {ComponentType, MessageFlags, SelectMenuDefaultValueType} from 'discord-api-types/v10'
import assert from 'node:assert/strict'
import {test} from 'node:test'
import {message} from './components.ts'
import {ComponentBuilderError} from './errors.ts'
import {Fmt} from './fmt.ts'

test('message builds a Components V2 message tree', () => {
  const built = message((t) => [
    t.container((t) => [
      t.text`Hello ${Fmt.mention('123')}!`,
      t.separator({spacing: 'large', divider: true}),
      t.section((t) => ({
        text: t.text`**Balance:** ${123}`,
        accessory: t.button.secondary({id: 'refresh', label: '↻'}),
      })),
      t.row((r) => [
        r.button.primary({id: 'ok', label: 'OK'}),
        r.button.danger({id: 'cancel', label: 'Cancel'}),
      ]),
    ]),
  ])

  assert.equal(built.flags, MessageFlags.IsComponentsV2)
  assert.deepEqual(built.components, [{
    type: ComponentType.Container,
    components: [
      {type: ComponentType.TextDisplay, content: 'Hello <@123>!'},
      {type: ComponentType.Separator, spacing: 2, divider: true},
      {
        type: ComponentType.Section,
        components: [{type: ComponentType.TextDisplay, content: '**Balance:** 123'}],
        accessory: {type: ComponentType.Button, style: 2, label: '↻', custom_id: 'refresh'},
      },
      {
        type: ComponentType.ActionRow,
        components: [
          {type: ComponentType.Button, style: 1, label: 'OK', custom_id: 'ok'},
          {type: ComponentType.Button, style: 4, label: 'Cancel', custom_id: 'cancel'},
        ],
      },
    ],
  }])
})

test('message exposes top-level Components V2 elements and supports selects', () => {
  const built = message((t) => [
    t.text`**Choose a member:** ${'member * name'}`,
    t.row((r) => [r.userSelect({id: 'member', defaultValues: ['123']})]),
  ])

  assert.deepEqual(built.components, [
    {type: ComponentType.TextDisplay, content: '**Choose a member:** member \\* name'},
    {
      type: ComponentType.ActionRow,
      components: [{
        type: ComponentType.UserSelect,
        custom_id: 'member',
        default_values: [{id: '123', type: SelectMenuDefaultValueType.User}],
      }],
    },
  ])
})

test('message rejects empty or overfull component collections', () => {
  assert.throws(() => message(() => []), /message must have at least one component/)
  assert.throws(
    () => message((t) => [t.container(() => [])]),
    /container must have children/,
  )
  assert.throws(
    () =>
      message((t) => [
        t.container((t) => Array.from({length: 11}, () => t.text('item'))),
      ]),
    /container supports at most 10 children/,
  )
})

test('buttons and action rows validate Discord component constraints', () => {
  assert.throws(() => message((t) => [t.row((r) => [r.button.primary({id: 'missing-label'})])]))
  assert.throws(() => message((t) => [t.row((r) => [r.button.link({label: 'link'})])]))
  assert.throws(() =>
    message((t) => [
      t.row((r) => [
        r.userSelect({id: 'user'}),
        r.button.primary({id: 'button', label: 'Button'}),
      ]),
    ]), /select menus must be the only component in a row/)
})

test('component builder errors are typed and logged before being rethrown', () => {
  const logged: unknown[][] = []
  const originalError = console.error
  console.error = (...args: unknown[]) => {
    logged.push(args)
  }

  try {
    assert.throws(
      () => message((t) => [t.row((r) => [r.button.primary({id: 'missing-label'})])]),
      (error) =>
        error instanceof ComponentBuilderError
        && error.status === 400
        && error.message === 'primary button requires a label or emoji',
    )
    assert.equal(logged.length, 1)
    assert.equal(logged[0]?.[0], 'Failed to build Components V2 message:')
    assert.ok(logged[0]?.[1] instanceof ComponentBuilderError)
  } finally {
    console.error = originalError
  }
})

test('errors thrown by the message callback are logged and rethrown unchanged', () => {
  const logged: unknown[][] = []
  const originalError = console.error
  const callbackError = new Error('callback failed')
  console.error = (...args: unknown[]) => {
    logged.push(args)
  }

  try {
    assert.throws(() =>
      message(() => {
        throw callbackError
      }), (error) => error === callbackError)
    assert.equal(logged.length, 1)
    assert.equal(logged[0]?.[1], callbackError)
  } finally {
    console.error = originalError
  }
})
