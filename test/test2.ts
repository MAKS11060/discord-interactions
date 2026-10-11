import test from 'node:test'
import {InteractionBuilder as InteractionBuilder} from '../src/builder2.ts'

test('Test 697872', async (t) => {
  const interactionBuilder = new InteractionBuilder()

  interactionBuilder.slashCommand((t) =>
    t.command({
      name: 'name',
      description: 'description',
      args: {
        string1: t.arg({type: 'String'}),
        string2: t.arg.string(),
        count: t.arg({type: 'Integer', required: true}),
        flag: t.arg.boolean({required: true}),
      },
    }).resolve((c, args) => {
      args.string1 satisfies string | undefined
      args.string2 satisfies string | undefined
      args.count satisfies number
      args.flag satisfies boolean

      // return c.reply(`${Date.now()}`)
    })
  )
})
