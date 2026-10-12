import {schema} from '../builder.ts'

schema.slashCommands((t) => ({
  'all-options': t.command({
    name: 'all-options',
    // name_localizations: {'en-US': 'all-options'},
    description: 'Test every chat input option field',
    // description_localizations: {'en-US': 'Test every option field'},
    // nsfw: false,

    args: {
      name: t.arg.integer({required: true, description: 'Integer with choices and range'}),
    },
    resolve: (c, args) => {
      return c.reply('')
    },
  }),
}))
