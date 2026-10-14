import assert from 'node:assert/strict'
import test from 'node:test'
import {printSchema} from './helper.ts'

test('printSchema shows command categories and nested commands by default', () => {
  const output = printSchema([
    {
      type: 1,
      name: 'manage',
      description: 'Manage items',
      nsfw: true,
      options: [
        {
          type: 1,
          name: 'create',
          description: 'Create an item',
          options: [
            {type: 3, name: 'name', description: 'Item name', required: true, autocomplete: true},
          ],
        },
        {
          type: 2,
          name: 'items',
          description: 'Item operations',
          options: [
            {type: 1, name: 'delete', description: 'Delete an item'},
          ],
        },
      ],
    },
    {type: 2, name: 'user-info'},
    {type: 3, name: 'message-info'},
  ])

  assert.match(output, /slash-command/)
  assert.match(output, /manage.*Manage items.*nsfw/)
  assert.match(output, /nsfw: true/)
  assert.match(output, /subcommand.*create/)
  assert.match(output, /group.*items/)
  assert.match(output, /subcommand.*delete/)
  assert.doesNotMatch(output, /String.*name/)
  assert.match(output, /user-info/)
  assert.match(output, /message-info/)
  assert.match(output, /\u001b\[36m/)
})

test('printSchema optionally shows parameters and filters command categories', () => {
  const output = printSchema([
    {
      type: 1,
      name: 'search',
      description: 'Search',
      options: [
        {type: 3, name: 'query', description: 'Search query', required: true},
      ],
    },
    {type: 2, name: 'user-info'},
    {type: 3, name: 'message-info'},
  ], {showOptions: true, showUser: false, showMessage: false})

  assert.match(output, /String.*query.*required: true/)
  assert.match(output, /\u001b\[32mrequired: true\u001b\[0m/)
  assert.doesNotMatch(output, /required: false/)
  assert.doesNotMatch(output, /user-info|message-info/)
})

test('printSchema can show false and default boolean values in red', () => {
  const output = printSchema([{
    type: 1,
    name: 'search',
    description: 'Search',
    dm_permission: false,
    options: [
      {type: 3, name: 'query', description: 'Search query', required: false, autocomplete: false},
    ],
  }], {showOptions: true, showFalse: true, showDefaults: true})

  assert.match(output, /\u001b\[31mrequired: false\u001b\[0m/)
  assert.match(output, /\u001b\[31mautocomplete: false\u001b\[0m/)
  assert.match(output, /\u001b\[31mdm_permission: false\u001b\[0m/)
})
