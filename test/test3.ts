type Ctx<
  Args extends Record<string, string>,
  Components extends Record<string, (a: string) => unknown>,
  //  T,
  //  Arg extends readonly [c: string],
  //  Components extends Record<string, NonNullable<(...a: Arg) => T>>,
> = {
  args: Args
  components: Components
}

const register = <
  const Args extends Record<string, string>,
  const T,
  const Arg extends readonly [c: string],
  const Components extends Record<string, (...a: Arg) => T>=Record<string, (...a: Arg) => T>,
  R,
>(options: {
  name: string
  args?: Args
  components?: Components
  resolve: (ctx: Ctx<Args, Components>) => R
}) => {}

register({
  name: 'test',

  args: {a: 'a', b: 'b'},
  // components: {
  //   confirm: () => 'c',
  //   cancel: () => 'd',
  // },
  components: {
    confirm: (a) => '1',
    // cancel: (a: string) => '2',
  },

  resolve: (c) => {
    c.components.confirm('sa')
    // c.components.cancel
    c.args.a satisfies 'a'
  },


})
