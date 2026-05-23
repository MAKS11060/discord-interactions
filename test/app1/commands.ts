import {messageCommand, slashCommand, userCommand} from '#app'
import {ApplicationCommandOptionType} from 'discord-api-types/v10'

export const hello = slashCommand({
  name: 'hello',
  description: 'Hello World!',
})

export const helloUser = userCommand({
  name: 'hello',
})

export const helloMessage = messageCommand({
  name: 'hello',
})

export const tagUser = userCommand({
  name: 'tag user',
})

export const hashMessage = messageCommand({
  name: 'hash-message',
})

export const test2 = slashCommand({
  name: 'test2',
  description: `Test 2`,
  // dprint-ignore
  options: [
    {type: ApplicationCommandOptionType.String, name: 'string', description: 'String option'},
    {type: ApplicationCommandOptionType.Integer, name: 'integer', description: 'Integer option'},
    {type: ApplicationCommandOptionType.Boolean, name: 'boolean', description: 'Boolean option'},
    {type: ApplicationCommandOptionType.User, name: 'user', description: 'User option'},
    {type: ApplicationCommandOptionType.Channel, name: 'channel', description: 'Channel option'},
    {type: ApplicationCommandOptionType.Role, name: 'role', description: 'Role option'},
    {type: ApplicationCommandOptionType.Mentionable, name: 'mentionable', description: 'Mentionable option'},
    {type: ApplicationCommandOptionType.Number, name: 'number', description: 'Number option'},
    {type: ApplicationCommandOptionType.Attachment, name: 'attachment', description: 'Attachment option'},
    //
    {type: ApplicationCommandOptionType.String, name: 'string-req', description: 'String option', required: true},
    {type: ApplicationCommandOptionType.Integer, name: 'integer-req', description: 'Integer option', required: true},
    {type: ApplicationCommandOptionType.Boolean, name: 'boolean-req', description: 'Boolean option', required: true},
    {type: ApplicationCommandOptionType.User, name: 'user-req', description: 'User option', required: true},
    {type: ApplicationCommandOptionType.Channel, name: 'channel-req', description: 'Channel option', required: true},
    {type: ApplicationCommandOptionType.Role, name: 'role-req', description: 'Role option', required: true},
    {type: ApplicationCommandOptionType.Mentionable, name: 'mentionable-req', description: 'Mentionable option', required: true},
    {type: ApplicationCommandOptionType.Number, name: 'number-req', description: 'Number option', required: true},
    {type: ApplicationCommandOptionType.Attachment, name: 'attachment-req', description: 'Attachment option', required: true},
  ],
})

export const test3 = slashCommand({
  name: 'test3',
  description: `Test 3`,
  options: [
    {type: ApplicationCommandOptionType.Subcommand, name: 'test3s1', description: 'Test3 sub 1'},
    {type: ApplicationCommandOptionType.Subcommand, name: 'test3s2', description: 'Test3 sub 2'},
  ],
})

export const test4 = slashCommand({
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

export const test5 = slashCommand({
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
