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
