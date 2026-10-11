import test from 'node:test'

type MaybePromise<T> = Promise<T> | T

type OptionTypeMap = {
  String: string
  Integer: number
  Number: number
}
type OptionType = keyof OptionTypeMap

type OptionFn = {
  <T extends OptionType, const R extends boolean = false>(params: {
    type: T
    required?: R
    name?: string
    description?: string
  }): {value: R extends true ? OptionTypeMap[T] : OptionTypeMap[T] | undefined}

  string<const R extends boolean = false>(params?: {
    required?: R
    name?: string
    description?: string
  }): {value: R extends true ? string : string | undefined}

  integer<const R extends boolean = false>(params?: {
    required?: R
    name?: string
    description?: string
  }): {value: R extends true ? number : number | undefined}

  number<const R extends boolean = false>(params?: {
    required?: R
    name?: string
    description?: string
  }): {value: R extends true ? number : number | undefined}
}

// Context — как раньше, только по options
class Context<O extends Record<string, {value: unknown}>> {
  readonly options!: O
  reply(content: string) {
    return {type: 1, content}
  }
}

// Def: resolve принимает (context, ctx)
type SlashCommandDef<
  O extends Record<string, {value: unknown}>,
  Ctx extends object,
> = {
  name: string
  description?: string
  options: O
  resolve: (context: Context<O>, ctx: Ctx) => MaybePromise<{}>
}

// CommandBuilder знает про Ctx
type CommandBuilder<Ctx extends object> = {
  <const O extends Record<string, {value: unknown}>>(def: {
    name: string
    description?: string
    options: O
    resolve: (context: Context<O>, ctx: Ctx) => MaybePromise<{}>
  }): SlashCommandDef<O, Ctx>

  option: OptionFn
}

class InteractionBuilder<Ctx extends object = object> {
  commands<const O extends Record<string, {value: unknown}>>(
    handler: (t: CommandBuilder<Ctx>) => SlashCommandDef<O, Ctx>,
  ): SlashCommandDef<O, Ctx> {
    const t = ((def: any) => def) as CommandBuilder<Ctx>
    ;(t as any).option = {
      string: () => ({value: undefined}),
      integer: () => ({value: undefined}),
      number: () => ({value: undefined}),
    }
    return handler(t)
  }
}

// ---------- тест ----------
test('Test 762018', async (t) => {
  interface UserCtx {
    req: Request
  }
  const builder = new InteractionBuilder<UserCtx>()

  const commands = builder.commands((t) =>
    t({
      name: 'test-args',
      options: {
        a: t.option({type: 'String'}),
        b: t.option({type: 'Integer'}),
        c: t.option.string(),
        d: t.option.string({required: true}),
      },
      resolve: (context, ctx) => {
        context.options.a.value satisfies string | undefined
        context.options.b.value satisfies number | undefined
        context.options.c.value satisfies string | undefined
        context.options.d.value satisfies string

        ctx satisfies UserCtx

        return context.reply('ok')
      },
    })
  )
})
