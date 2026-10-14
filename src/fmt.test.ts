import assert from 'node:assert/strict'
import {test} from 'node:test'

import {b, c, Fmt, i, link, s, sp, t, u} from './fmt.ts'

// ---------------------------------------------------------------------------
// basic text
// ---------------------------------------------------------------------------

test('plain text is escaped by default', () => {
  assert.equal(Fmt.plain('a * b _ c').toString(), 'a \\* b \\_ c')
  assert.equal(
    Fmt.plain('backtick ` and pipe | and gt >').toString(),
    'backtick \\` and pipe \\| and gt \\>',
  )
  assert.equal(Fmt.plain('slash \\').toString(), 'slash \\\\')
})

test('raw text skips escaping', () => {
  assert.equal(Fmt.raw('a * b * c').toString(), 'a * b * c')
})

test('Fmt.of wraps non-Fmt values', () => {
  assert.equal(Fmt.of(42).toString(), '42')
  assert.equal(Fmt.of('x').toString(), 'x')
  const md = Fmt.plain('y')
  assert.equal(Fmt.of(md), md) // same instance
})

test('empty builder renders to empty string', () => {
  assert.equal(Fmt.empty().toString(), '')
})

// ---------------------------------------------------------------------------
// styles
// ---------------------------------------------------------------------------

test('bold', () => {
  assert.equal(Fmt.plain('x').bold().toString(), '**x**')
})

test('italic', () => {
  assert.equal(Fmt.plain('x').italic().toString(), '*x*')
})

test('underline', () => {
  assert.equal(Fmt.plain('x').underline().toString(), '__x__')
})

test('strike', () => {
  assert.equal(Fmt.plain('x').strike().toString(), '~~x~~')
})

test('spoiler', () => {
  assert.equal(Fmt.plain('x').spoiler().toString(), '||x||')
})

test('quote prefixes every line', () => {
  assert.equal(
    Fmt.plain('a\nb').quote().toString(),
    '> a\n> b',
  )
})

test('blockquote prefixes every line', () => {
  assert.equal(
    Fmt.plain('a\nb').blockquote().toString(),
    '>>> a\n>>> b',
  )
})

test('styles nest', () => {
  assert.equal(Fmt.plain('x').bold().italic().toString(), '***x***')
  assert.equal(Fmt.plain('x').italic().bold().toString(), '***x***')
})

test('wrapping empty builder is a no-op', () => {
  assert.equal(Fmt.empty().bold().toString(), '')
  assert.equal(Fmt.empty().italic().spoiler().toString(), '')
})

// ---------------------------------------------------------------------------
// code
// ---------------------------------------------------------------------------

test('inline code', () => {
  assert.equal(Fmt.plain('x = 1').code().toString(), '`x = 1`')
})

test('inline code uses double fence when content has a backtick', () => {
  assert.equal(Fmt.plain('a `b` c').code().toString(), '``a `b` c``')
})

test('inline code does not escape markdown characters', () => {
  assert.equal(Fmt.plain('a * b _ c | d > e').code().toString(), '`a * b _ c | d > e`')
})

test('inline code pads when content starts or ends with a backtick', () => {
  assert.equal(Fmt.plain('`x').code().toString(), '`` `x ``')
  assert.equal(Fmt.plain('x`').code().toString(), '`` x` ``')
})

test('inline code uses a longer fence for consecutive backticks', () => {
  assert.equal(Fmt.plain('a `` b').code().toString(), '```a `` b```')
})

test('fenced code keeps backticks as-is', () => {
  assert.equal(
    Fmt.plain('a `b` c').code('js').toString(),
    '```js\na `b` c\n```',
  )
})

// ---------------------------------------------------------------------------
// link
// ---------------------------------------------------------------------------

test('link', () => {
  assert.equal(
    Fmt.plain('click').link('https://example.com').toString(),
    '[click](https://example.com)',
  )
})

test('link on empty builder is a no-op', () => {
  assert.equal(Fmt.empty().link('https://example.com').toString(), '')
})

// ---------------------------------------------------------------------------
// discord helpers
// ---------------------------------------------------------------------------

test('mention user', () => {
  assert.equal(Fmt.mention('1234567890').toString(), '<@1234567890>')
})

test('mention role', () => {
  assert.equal(Fmt.mentionRole('1234567890').toString(), '<@&1234567890>')
})

test('mention channel', () => {
  assert.equal(Fmt.mentionChannel('1234567890').toString(), '<#1234567890>')
})

test('emoji static', () => {
  assert.equal(Fmt.emoji('cat', '1234567890').toString(), '<:cat:1234567890>')
})

test('emoji animated', () => {
  assert.equal(
    Fmt.emoji('cat', '1234567890', true).toString(),
    '<a:cat:1234567890>',
  )
})

// ---------------------------------------------------------------------------
// timestamp
// ---------------------------------------------------------------------------

test('timestamp: full table including s and S', () => {
  const d = new Date('2021-04-20T16:20:30Z')
  const unix = Math.floor(d.getTime() / 1000)

  assert.equal(Fmt.timestamp(d, 'shortTime').toString(), `<t:${unix}:t>`)
  assert.equal(Fmt.timestamp(d, 'longTime').toString(), `<t:${unix}:T>`)
  assert.equal(Fmt.timestamp(d, 'shortDate').toString(), `<t:${unix}:d>`)
  assert.equal(Fmt.timestamp(d, 'longDate').toString(), `<t:${unix}:D>`)
  assert.equal(Fmt.timestamp(d, 'shortDateTime').toString(), `<t:${unix}:f>`)
  assert.equal(Fmt.timestamp(d, 'longDateTime').toString(), `<t:${unix}:F>`)
  assert.equal(Fmt.timestamp(d, 'dateTimeShort').toString(), `<t:${unix}:s>`)
  assert.equal(Fmt.timestamp(d, 'dateTimeLong').toString(), `<t:${unix}:S>`)
  assert.equal(Fmt.timestamp(d, 'relative').toString(), `<t:${unix}:R>`)
})

test('timestamp: short aliases map to the same styles', () => {
  const d = new Date('2026-10-13T12:00:00Z')
  const unix = Math.floor(d.getTime() / 1000)

  assert.equal(Fmt.timestamp(d, 't').toString(), `<t:${unix}:t>`)
  assert.equal(Fmt.timestamp(d, 'T').toString(), `<t:${unix}:T>`)
  assert.equal(Fmt.timestamp(d, 'd').toString(), `<t:${unix}:d>`)
  assert.equal(Fmt.timestamp(d, 'D').toString(), `<t:${unix}:D>`)
  assert.equal(Fmt.timestamp(d, 'f').toString(), `<t:${unix}:f>`)
  assert.equal(Fmt.timestamp(d, 'F').toString(), `<t:${unix}:F>`)
  assert.equal(Fmt.timestamp(d, 'R').toString(), `<t:${unix}:R>`)
})

test('timestamp: aliases s and S', () => {
  const d = new Date('2021-04-20T16:20:30Z')
  const unix = Math.floor(d.getTime() / 1000)
  assert.equal(Fmt.timestamp(d, 's').toString(), `<t:${unix}:s>`)
  assert.equal(Fmt.timestamp(d, 'S').toString(), `<t:${unix}:S>`)
})

test('timestamp: default style is f (per Discord spec)', () => {
  const d = new Date('2021-04-20T16:20:30Z')
  assert.match(Fmt.timestamp(d).toString(), /:f>$/)
})

// ---------------------------------------------------------------------------
// composition via plain()
// ---------------------------------------------------------------------------

test('concat via plain() and custom()', () => {
  const msg = Fmt.plain('Hi, ')
    .custom('<@123>')
    .plain('! You have ')
    .concat(Fmt.plain('5').bold())
    .plain(' new messages')
  assert.equal(
    msg.toString(),
    'Hi, <@123>! You have **5** new messages',
  )
})

test('concat keeps escaped and raw parts distinct', () => {
  const msg = Fmt.plain('a * b').raw(' * c *')
  assert.equal(msg.toString(), 'a \\* b * c *')
})

test('concat accepts an iterable of Fmt values', () => {
  const values = [Fmt.plain('a'), Fmt.mention('123'), Fmt.plain('b')]
  const expected = 'a<@123>b'

  assert.equal(Fmt.concat(values).toString(), expected)
  assert.equal(Fmt.empty().concat(values).toString(), expected)
  assert.equal(
    Fmt.empty().concat((function*() {
      yield* values
    })()).toString(),
    expected,
  )
})

test('join inserts a plain or formatted separator between values', () => {
  const values = [Fmt.plain('a'), Fmt.mention('123'), Fmt.plain('b')]

  assert.equal(Fmt.join(values).toString(), 'a <@123> b')
  assert.equal(Fmt.join(values, ', * ').toString(), 'a, \\* <@123>, \\* b')
  assert.equal(
    Fmt.join(values, Fmt.plain(', ').bold()).toString(),
    'a**, **<@123>**, **b',
  )
})

test('join handles empty and single-value iterables', () => {
  assert.equal(Fmt.join([]).toString(), '')
  assert.equal(Fmt.join([Fmt.plain('only')]).toString(), 'only')
})

// ---------------------------------------------------------------------------
// tagged template
// ---------------------------------------------------------------------------

test('t: interpolates Md and escapes plain strings', () => {
  const out = t`Hi, ${Fmt.mention('123')}! *ok*`
  assert.equal(out.toString(), 'Hi, <@123>! \\*ok\\*')
})

test('t: interpolates primitives with escaping', () => {
  assert.equal(t`value: ${'a * b'}`.toString(), 'value: a \\* b')
  assert.equal(t`value: ${42}`.toString(), 'value: 42')
})

test('t: interpolates Fmt instances without stringifying them', () => {
  const mention = Fmt.mention('123')
  assert.equal(t`Hello ${mention} ${Fmt.plain('bold').bold()}`.toString(), 'Hello <@123> **bold**')
})

test('t: empty template', () => {
  assert.equal(t``.toString(), '')
})

test('t: only interpolation', () => {
  assert.equal(t`${'x'}`.toString(), 'x')
})

test('t: nested styles', () => {
  assert.equal(t`${Fmt.plain('x').bold().italic()}`.toString(), '***x***')
})

// ---------------------------------------------------------------------------
// functional wrappers
// ---------------------------------------------------------------------------

test('b/i/u/s/sp/c/link wrappers', () => {
  assert.equal(b('x').toString(), '**x**')
  assert.equal(i('x').toString(), '*x*')
  assert.equal(u('x').toString(), '__x__')
  assert.equal(s('x').toString(), '~~x~~')
  assert.equal(sp('x').toString(), '||x||')
  assert.equal(c('x = 1').toString(), '`x = 1`')
  assert.equal(c('const x = 1', 'ts').toString(), '```ts\nconst x = 1\n```')
  assert.equal(link('here', 'https://example.com').toString(), '[here](https://example.com)')
})

test('wrappers compose inside t', () => {
  const out = t`${b('bold')} and ${i('italic')} and ${u('under')}`
  assert.equal(out.toString(), '**bold** and *italic* and __under__')
})

// ---------------------------------------------------------------------------
// misc
// ---------------------------------------------------------------------------

test('toString and valueOf agree', () => {
  const md = Fmt.plain('x').bold()
  assert.equal(md.toString(), '**x**')
  assert.equal(String(md), '**x**')
  assert.equal(`${md}`, '**x**')
})

test('length reflects rendered string', () => {
  const md = Fmt.plain('x').bold()
  assert.equal(md.length, '**x**'.length)
})

test('builder is immutable', () => {
  const base = Fmt.plain('x')
  const bolded = base.bold()
  assert.equal(base.toString(), 'x')
  assert.equal(bolded.toString(), '**x**')
  assert.notEqual(base, bolded)
})

test('Test 060728', () => {
  const text = Fmt.join([
    t`hello`.bold(),
    Fmt.mention('1234567890'),
    t`at`,
    Fmt.timestamp(Date.now(), 'relative'),
    t`\n`,
    t`const timeString = \`${new Date().toISOString()}\``.code('ts'),
  ])

  console.log(text.toString())
})
