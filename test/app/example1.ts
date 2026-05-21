import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  InteractionContextType,
  type Snowflake,
} from 'discord-api-types/v10'
import {discord} from '../../src/-mod.ts'

export const hello = discord.slashCommand({
  name: 'hello',
  description: 'Hello World!',
})

export const test2 = discord.slashCommand({
  name: 'test2',
  description: `Test 2`,
  options: [
    {type: ApplicationCommandOptionType.String, name: 'string', description: 'String option'},
    {type: ApplicationCommandOptionType.Integer, name: 'integer', description: 'Integer option'},
    {type: ApplicationCommandOptionType.Boolean, name: 'boolean', description: 'Boolean option'},
    {type: ApplicationCommandOptionType.User, name: 'user', description: 'User option'},
    {type: ApplicationCommandOptionType.Channel, name: 'channel', description: 'Channel option'},
    {type: ApplicationCommandOptionType.Role, name: 'role', description: 'Role option'},
    {type: ApplicationCommandOptionType.Mentionable, name: 'mentionable', description: 'Mentionable option'},
    {type: ApplicationCommandOptionType.Attachment, name: 'attachment', description: 'Attachment option'},
  ],
})

export const test3 = discord.slashCommand({
  name: 'test3',
  description: `Test 3`,
  options: [
    {type: ApplicationCommandOptionType.Subcommand, name: 'test3s1', description: 'Test3 sub 1'},
    {type: ApplicationCommandOptionType.Subcommand, name: 'test3s2', description: 'Test3 sub 2'},
  ],
})

export const test4 = discord.slashCommand({
  name: 'test4',
  description: `Test 4`,
  options: [
    {
      type: ApplicationCommandOptionType.SubcommandGroup,
      name: 'test4sg1',
      description: 'Test4 sub group 1',
      options: [
        {type: ApplicationCommandOptionType.Subcommand, name: 'sub1', description: 'sub 1'},
        {type: ApplicationCommandOptionType.Subcommand, name: 'sub2', description: 'sub 2'},
      ],
    },
    {
      type: ApplicationCommandOptionType.SubcommandGroup,
      name: 'test4sg2',
      description: 'Test4 sub group 2',
      options: [
        {type: ApplicationCommandOptionType.Subcommand, name: 'sub3', description: 'sub 3'},
        {type: ApplicationCommandOptionType.Subcommand, name: 'sub4', description: 'sub 4'},
      ],
    },
  ],
})

export const test5 = discord.slashCommand({
  name: 'test5',
  description: `Test 5`,
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: 'autocomplete1',
      description: 'autocomplete1 Test',
      autocomplete: true,
    },
    {
      type: ApplicationCommandOptionType.String,
      name: 'choice',
      description: 'autocomplete1 Test',
      choices: [
        {name: 'A', value: 'a'},
        {name: 'B', value: 'B'},
        {name: 'AB', value: 'ab'},
      ],
    },
    {
      type: ApplicationCommandOptionType.String,
      name: 'choice',
      description: 'autocomplete1 Test',
    },
  ],
})

//
export const tagUser = discord.userCommand({
  name: 'tag user',
})

//
export const hashMessage = discord.messageCommand({
  name: 'hash-message',
})

// --- Implementation handlers ---
discord.handler(hello, (t) => t.reply('Hello'))

/*

commands.ts {
  export const hello = slashCommand({name: 'hello'})
}

// PUSH
[
  {id: ID_1, name: 'hello'}
]

*/

interface DiscordRegistry {
  applications: {
    '1097172825292406814': {
      'id': '1097172825292406814'
      'name': 'Ai'
      'icon': '774c1c119a7b9bfc8c4f197c7d39621c'
      'verify_key': '1edaa9599ddd9e75b3204d1b148d619596bd9341e7a0f41264067696ad10a787'
    }
  }
  commands: [
    {
      'id': '1462026903924768843'
      'application_id': '1097172825292406814'
      'version': '1462054980344221921'
      'default_member_permissions': null
      'type': 1
      'name': 'hello'
      'description': 'Say \'world!\''
      'dm_permission': true
      'contexts': null
      'integration_types': [
        0,
        1,
      ]
      'nsfw': false
    },
    {
      'id': '1462122821995073755'
      'application_id': '1097172825292406814'
      'version': '1462122821995073756'
      'default_member_permissions': null
      'type': 1
      'name': 'test2'
      'description': 'Test 2'
      'dm_permission': true
      'contexts': null
      'integration_types': [
        0,
        1,
      ]
      'options': [
        {
          'type': 3
          'name': 'string'
          'description': 'String option'
        },
        {
          'type': 4
          'name': 'integer'
          'description': 'Integer option'
        },
        {
          'type': 5
          'name': 'boolean'
          'description': 'Boolean option'
        },
        {
          'type': 6
          'name': 'user'
          'description': 'User option'
        },
        {
          'type': 7
          'name': 'channel'
          'description': 'Channel option'
        },
        {
          'type': 8
          'name': 'role'
          'description': 'Role option'
        },
        {
          'type': 9
          'name': 'mentionable'
          'description': 'Mentionable option'
        },
        {
          'type': 11
          'name': 'attachment'
          'description': 'Attachment option'
        },
      ]
      'nsfw': false
    },
    {
      'id': '1462123651641114685'
      'application_id': '1097172825292406814'
      'version': '1462123651641114686'
      'default_member_permissions': null
      'type': 1
      'name': 'test3'
      'description': 'Test 3'
      'dm_permission': true
      'contexts': null
      'integration_types': [
        0,
        1,
      ]
      'options': [
        {
          'type': 1
          'name': 'test3s1'
          'description': 'Test3 sub 1'
        },
        {
          'type': 1
          'name': 'test3s2'
          'description': 'Test3 sub 2'
        },
      ]
      'nsfw': false
    },
    {
      'id': '1462123651641114685'
      'application_id': '1097172825292406814_'
      'name': 'test4'
      'description': 'Test 4'
    },
  ]
}

type T = DiscordRegistry['commands'][number]['id']

// app -> name -> command id
type T2 = {
  [appId in keyof DiscordRegistry['applications']]: DiscordRegistry['commands'][number] extends {application_id: appId}
    ? DiscordRegistry['commands'][number]
    : never
}

type T3 = T2['1097172825292406814']['name']
