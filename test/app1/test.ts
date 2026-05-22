import {ApplicationCommandOptionType, ApplicationCommandType, InteractionType} from 'discord-api-types/v10'
import {test} from 'node:test'
import type {CommandSchema} from '../../src/v1/types.ts'
import * as commands from './commands.ts'

test('Test 847634', async (t) => {
  // console.log(commands)

  type T1 = Partial<
    Record<
      InteractionType,
      Partial<
        Record<
          ApplicationCommandType,
          Record<string, any>
        >
      >
    >
  >

  const commandsAST: T1 = {}

  for (const data of Object.entries(commands)) {
    // console.log(command.name)
    const [key, {command}] = data as [string, CommandSchema]

    commandsAST[InteractionType.ApplicationCommand] ??= {}
    commandsAST[InteractionType.ApplicationCommand][command.type!] ??= {}
    // commandsAST[InteractionType.ApplicationCommand][command.type!]![command.name] ??= {}

    if (command.type === ApplicationCommandType.ChatInput) {
      for (const option of command.options ?? []) {
        commandsAST[InteractionType.ApplicationCommand][command.type!]![command.name] ??= {}

        if (option.type === ApplicationCommandOptionType.Subcommand) {
          commandsAST[InteractionType.ApplicationCommand][command.type!]![command.name][option.name] ??= {}
        }
        if (option.type === ApplicationCommandOptionType.SubcommandGroup) {
          commandsAST[InteractionType.ApplicationCommand][command.type!]![command.name][option.name] ??= {}
        }
      }
    }
  }

  console.dir(commandsAST, {depth: null})
})
