import {
  type APIRole,
  type APIUser,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  InteractionType,
} from 'discord-api-types/v10'
import {test} from 'node:test'
import type {CommandSchema, CommandToHandler} from '../../src/v1/types.ts'
import * as commands from './commands.ts'
import {handler} from '#app'

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

test('Test 140238', async (t) => {
  handler(commands.hello, {
    chatInput: () => ({
      command: (c) => {
      },
    }),
  })

  handler(commands.helloMessage, {
    message() {},
  })

  handler(commands.helloUser, {
    user() {},
  })

  handler(commands.test2, {
    chatInput() {
      return {
        command(c) {
          c.getString('string')
          c.getInteger('integer')
          c.getBoolean('boolean')
          c.getUser('user')
          c.getChannel('channel')
          c.getRole('role')
          c.getMentionable('mentionable')
          c.getNumber('number')
          c.getAttachment('attachment')

          const string = c.getString('string')
          const stringReq = c.getString('string-req')

          const user = c.getUser('user')
          const userReq = c.getUser('user-req')

          const memberReq = c.getMember('user-req')

          const attached = c.getAttachment('attachment-req')

          const mentionableUser = c.getMentionableUser('mentionable-req')
          const mentionableRole = c.getMentionableRole('mentionable-req')
          const mentionableMember = c.getMentionableMember('mentionable-req')
          const mentionable = c.getMentionable('mentionable-req')
          if (c.isMentionableUser(mentionable)) {
            mentionable satisfies APIUser
          } else {
            mentionable satisfies APIRole
          }
        },
      }
    },
  })

  handler(commands.hello, {
    chatInput() {
      return {
        command(c) {

          return c.replyDeferred(async c => {})

        },
      }
    },
  })
})
