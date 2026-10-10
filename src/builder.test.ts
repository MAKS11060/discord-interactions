import test from 'node:test'
import {InteractionBuilder} from './builder.ts'

test('Test 133914', async (t) => {
  const interactionBuilder = new InteractionBuilder()

  interactionBuilder.slashCommand((t) => ({
    name: 'hello',
    description: 'print hello',

    resolve: (context) => {
      return context.reply(`Hello ${context.from.user.global_name}`)
    },
  }))
})

test('Test 762018', async (t) => {
  const interactionBuilder = new InteractionBuilder()

  const command = interactionBuilder.slashCommand((t) =>
    t({
      name: 'test-args',
      description: 'test-args',
      options: {
        a: t.option({type: 'String', description: 'type random text'}),
        b: t.option.string({description: 'text'}),
        c: t.option.integer({description: 'type int', required: true}),
        d: t.option.string({description: 'type str', autocomplete: true}),
      },

      resolve: (context) => {
        context.options.a?.value
        context.options.b?.value satisfies string | undefined
        context.options.c.value satisfies number
        context.options.d?.value

        context.getString('a') satisfies string | undefined
        context.getInteger('c') // never
        context.getInteger('c') satisfies number | undefined

        return context.reply(`ok`)
      },

      autocomplete: (context, ctx, options) => {
        return []
      },
    })
  )
})

test('Test callable command definition', async () => {
  interface UserCtx {
    request: Request
  }

  const interactionBuilder = new InteractionBuilder<UserCtx>()

  interactionBuilder.slashCommand((t) =>
    t({
      name: 'callable-options',
      options: {
        text: t.option.string({description: 'text'}),
        count: t.option.integer({description: 'count', required: true}),
      },
      resolve: (context, ctx) => {
        const text: string | undefined = context.options.text.value
        const count: number | undefined = context.options.count.value
        ctx satisfies UserCtx
        void [text, count]
        return context.reply('ok')
      },
    })
  )
})

test('Test 706155', async (t) => {
  const interactionBuilder = new InteractionBuilder()

  const commandA = interactionBuilder.slashCommand((t) =>
    t({
      name: 'command-a',
      options: {},
      resolve: (context) => context.reply(`ok a`),
    })
  )
  const commandB = interactionBuilder.slashCommand((t) =>
    t({
      name: 'command-b',
      options: {},
      resolve: (context) => context.reply(`ok b`),
    })
  )

  const subCommand = interactionBuilder.slashSubcommand((t) => ({
    name: 'sub-command',
    commands: [commandA, commandB],
  }))
})

test('Test 987687', async (t) => {
  const interactionBuilder = new InteractionBuilder()

  const commandA = interactionBuilder.slashCommand((t) =>
    t({
      name: 'command-a',
      options: {},
      resolve: (context) => context.reply(`ok a`),
    })
  )
  const commandB = interactionBuilder.slashCommand((t) =>
    t({
      name: 'command-b',
      options: {},
      resolve: (context) => context.reply(`ok b`),
    })
  )

  const subCommand = interactionBuilder.slashSubcommand((t) => ({
    name: 'sub-command',
    commands: [commandA, commandB],
  }))

  const subcommandGroup = interactionBuilder.slashSubcommandGroup((t) => ({
    name: 'sub-command-group',
    commands: [subCommand],
  }))
})

test('Test 224858', async (t) => {
  const interactionBuilder = new InteractionBuilder()

  interactionBuilder.user((t) => ({
    name: 'check user',
    resolve: (context) => {
      return context.reply(`ok a`)
    },
  }))

  interactionBuilder.message((t) => ({
    name: 'check message',
    resolve: (context) => {
      return context.reply(`ok a`)
    },
  }))
})
