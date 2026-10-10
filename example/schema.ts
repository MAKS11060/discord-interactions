import {ApplicationCommandOptionType} from 'discord-api-types/payloads'
import {schema} from './builder.ts'

schema.slashCommand((t) =>
  t({
    name: 'hello',
    options: {},
    resolve(c) {
      return c.reply(`Hi ${c.from.user.global_name}`)
    },
  })
)

schema.slashCommand((t) =>
  t({
    name: 'tags',
    options: {
      tags: t.option.string({description: 'Type tag name', autocomplete: true, required: true}),
    },
    resolve(c) {
      return c.reply(`Hi ${c.from.user.global_name}`)
    },
    autocomplete: async (c, ctx) => {
      // console.dir(c, {depth: null})

      /*       if (c.interaction.data.options[0]?.type === ApplicationCommandOptionType.String) {
        console.log(c.interaction.data.options[0].value)

        const many = await db.query.entriesTag.findMany({
          where: {
            slug: {like: c.interaction.data.options[0].value + '%'},
          },
          with: {
            entriesTagTranslations: {
              where: {lang: 'ru'},
            },
          },
          limit: 25,
        })

        const r = many.map((v) => ({
          name: v.entriesTagTranslations[0]?.name ?? v.slug,
          value: v.slug,
        }))
        console.log(r)
        return r
      } */

      return []
    },
  })
)
