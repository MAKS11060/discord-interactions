import {defineCommand} from '#/mod.ts'
import {ApplicationCommandOptionType, type ApplicationCommandType} from 'discord-api-types/v10'

export default defineCommand({
  command: {
    name: 'test2',
    description: `Test 2`,
    options: [
      // {type: ApplicationCommandOptionType.Subcommand}
      // {type: ApplicationCommandOptionType.SubcommandGroup}
      {type: ApplicationCommandOptionType.String, name: 'string', description: 'String option'},
      {type: ApplicationCommandOptionType.Integer, name: 'integer', description: 'Integer option'},
      {type: ApplicationCommandOptionType.Boolean, name: 'boolean', description: 'Boolean option'},
      {type: ApplicationCommandOptionType.User, name: 'user', description: 'User option'},
      {type: ApplicationCommandOptionType.Channel, name: 'channel', description: 'Channel option'},
      {type: ApplicationCommandOptionType.Role, name: 'role', description: 'Role option'},
      {type: ApplicationCommandOptionType.Mentionable, name: 'mentionable', description: 'Mentionable option'},
      {type: ApplicationCommandOptionType.Attachment, name: 'attachment', description: 'Attachment option'},
    ],
  },
})

defineHandler({})

/*
[
  {
    "id": "1462122821995073755",
    "application_id": "1097172825292406814",
    "version": "1462122821995073756",
    "default_member_permissions": null,
    "type": 1,
    "name": "test2",
    "description": "Test 2",
    "dm_permission": true,
    "contexts": null,
    "integration_types": [
      0,
      1
    ],
    "options": [
      {
        "type": 3,
        "name": "string",
        "description": "String option"
      },
      {
        "type": 4,
        "name": "integer",
        "description": "Integer option"
      },
    ],
    "nsfw": false
  }
]
*/
