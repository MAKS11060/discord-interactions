import {defineCommand} from '#/mod.ts'
import {ApplicationCommandOptionType, type ApplicationCommandType} from 'discord-api-types/v10'

export default defineCommand({
  command: {
    name: 'test3',
    description: `Test 3`,
    options: [
      {type: ApplicationCommandOptionType.Subcommand, name: 'test3s1', description: 'Test3 sub 1'},
      {type: ApplicationCommandOptionType.Subcommand, name: 'test3s2', description: 'Test3 sub 2'},
    ],
  },
})
