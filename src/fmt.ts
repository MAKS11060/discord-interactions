import type {APIUser} from 'discord-api-types/v10'

// dprint-ignore
export type KnownLang =
  | 'ts' | 'tsx' | 'js' | 'jsx'
  | 'json' | 'html' | 'css' | 'scss'
  | 'py' | 'rb' | 'go' | 'rs'
  | 'java' | 'kt' | 'swift'
  | 'c' | 'cpp' | 'cs'
  | 'sh' | 'bash' | 'zsh'
  | 'sql' | 'yml' | 'yaml' | 'toml'
  | 'md' | 'diff' | 'ini'
  | 'php' | 'lua' | 'perl' | 'r'
  | 'dart' | 'scala' | 'ex' | 'exs'

// autocomplete for known, but any string accepted
export type Lang = KnownLang | (string & {})

type Node =
  | {kind: 'text'; value: string; escape: boolean}
  | {kind: 'style'; style: Style; children: Node[]}
  | {kind: 'code'; value: string; lang?: string}
  | {kind: 'link'; text: Node[]; url: string}
  | {kind: 'custom'; value: string}

type Style =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strike'
  | 'spoiler'
  | 'quote'
  | 'blockquote'

const STYLE_MARKERS: Record<Style, [string, string]> = {
  bold: ['**', '**'],
  italic: ['*', '*'],
  underline: ['__', '__'],
  strike: ['~~', '~~'],
  spoiler: ['||', '||'],
  quote: ['> ', ''],
  blockquote: ['>>> ', ''],
}

const ESCAPE_RE = /[\\*_~`|>]/g
const ESCAPE_MAP: Record<string, string> = {
  '\\': '\\\\',
  '*': '\\*',
  _: '\\_',
  '~': '\\~',
  '`': '\\`',
  '|': '\\|',
  '>': '\\>',
}

const escapeText = (s: string): string => s.replace(ESCAPE_RE, (c) => ESCAPE_MAP[c]!)

function renderNode(node: Node): string {
  switch (node.kind) {
    case 'text':
      return node.escape ? escapeText(node.value) : node.value
    case 'custom':
      return node.value
    case 'code': {
      if (node.lang) {
        const fence = '`'.repeat(Math.max(3, longestBacktickRun(node.value) + 1))
        return `${fence}${node.lang}\n${node.value}\n${fence}`
      }
      const fence = '`'.repeat(longestBacktickRun(node.value) + 1)
      const pad = node.value.startsWith('`') || node.value.endsWith('`') ? ' ' : ''
      return fence + pad + node.value + pad + fence
    }
    case 'link':
      return `[${renderNodes(node.text)}](${node.url})`
    case 'style': {
      const [open, close] = STYLE_MARKERS[node.style]
      const inner = renderNodes(node.children)
      if (node.style === 'quote' || node.style === 'blockquote') {
        const prefix = node.style === 'quote' ? '> ' : '>>> '
        return inner
          .split('\n')
          .map((line) => prefix + line)
          .join('\n')
      }
      return open + inner + close
    }
  }
}

const renderNodes = (nodes: Node[]): string => nodes.map(renderNode).join('')

function longestBacktickRun(value: string): number {
  let longest = 0
  for (const [run] of value.matchAll(/`+/g)) {
    longest = Math.max(longest, run.length)
  }
  return longest
}

function renderCodeNodes(nodes: Node[]): string {
  return nodes.map((node) => {
    if (node.kind === 'text') return node.value
    if (node.kind === 'style') {
      const [open, close] = STYLE_MARKERS[node.style]
      const inner = renderCodeNodes(node.children)
      if (node.style === 'quote' || node.style === 'blockquote') {
        const prefix = node.style === 'quote' ? '> ' : '>>> '
        return inner.split('\n').map((line) => prefix + line).join('\n')
      }
      return open + inner + close
    }
    if (node.kind === 'link') {
      return `[${renderCodeNodes(node.text)}](${node.url})`
    }
    if (node.kind === 'code') {
      return renderNode(node)
    }
    return node.value
  }).join('')
}

// ---------------------------------------------------------------------------
// timestamp
// ---------------------------------------------------------------------------

/**
 * Timestamp display style in Discord.
 * Corresponds to the suffix in `<t:unix:STYLE>`.
 */
export type TimestampStyle =
  // long, human-readable names
  | 'shortTime' // t
  | 'longTime' // T
  | 'shortDate' // d
  | 'longDate' // D
  | 'shortDateTime' // f  (default)
  | 'longDateTime' // F
  | 'dateTimeShort' // s
  | 'dateTimeLong' // S
  | 'relative' // R
  // raw single-letter aliases
  | 't'
  | 'T'
  | 'd'
  | 'D'
  | 'f'
  | 'F'
  | 's'
  | 'S'
  | 'R'

const TIMESTAMP_STYLE_MAP: Record<TimestampStyle, 't' | 'T' | 'd' | 'D' | 'f' | 'F' | 's' | 'S' | 'R'> = {
  shortTime: 't',
  longTime: 'T',
  shortDate: 'd',
  longDate: 'D',
  shortDateTime: 'f',
  longDateTime: 'F',
  dateTimeShort: 's',
  dateTimeLong: 'S',
  relative: 'R',
  t: 't',
  T: 'T',
  d: 'd',
  D: 'D',
  f: 'f',
  F: 'F',
  s: 's',
  S: 'S',
  R: 'R',
}

// ---------------------------------------------------------------------------
// Md
// ---------------------------------------------------------------------------

export class Fmt {
  private constructor(private readonly nodes: Node[]) {}

  static empty(): Fmt {
    return new Fmt([])
  }

  static raw(s: string): Fmt {
    return new Fmt([{kind: 'text', value: s, escape: false}])
  }

  static plain(s: string): Fmt {
    return new Fmt([{kind: 'text', value: s, escape: true}])
  }

  static of(v: unknown): Fmt {
    return v instanceof Fmt ? v : Fmt.plain(String(v))
  }

  static concat(values: Iterable<Fmt>): Fmt {
    return Fmt.empty().concat(values)
  }

  static join(values: Iterable<Fmt>, separator: string | Fmt = ' '): Fmt {
    const separatorFmt = Fmt.of(separator)
    const result: Node[] = []
    let isFirst = true

    for (const value of values) {
      if (!isFirst) result.push(...separatorFmt.nodes)
      result.push(...value.nodes)
      isFirst = false
    }

    return new Fmt(result)
  }

  plain(s: unknown): Fmt {
    return this.concat(Fmt.of(s))
  }

  raw(s: string): Fmt {
    return this.concat(Fmt.raw(s))
  }

  custom(s: string): Fmt {
    return this.concat(new Fmt([{kind: 'custom', value: s}]))
  }

  concat(other: Fmt | Iterable<Fmt>): Fmt {
    const nodes = [...this.nodes]
    if (other instanceof Fmt) {
      nodes.push(...other.nodes)
    } else {
      for (const value of other) {
        nodes.push(...value.nodes)
      }
    }
    return new Fmt(nodes)
  }

  private wrap(style: Style): Fmt {
    if (this.nodes.length === 0) return this
    return new Fmt([{kind: 'style', style, children: this.nodes}])
  }

  bold(): Fmt {
    return this.wrap('bold')
  }
  italic(): Fmt {
    return this.wrap('italic')
  }
  underline(): Fmt {
    return this.wrap('underline')
  }
  strike(): Fmt {
    return this.wrap('strike')
  }
  spoiler(): Fmt {
    return this.wrap('spoiler')
  }
  quote(): Fmt {
    return this.wrap('quote')
  }
  blockquote(): Fmt {
    return this.wrap('blockquote')
  }

  code(lang?: Lang): Fmt {
    const text = renderCodeNodes(this.nodes)
    return new Fmt([{kind: 'code', value: text, lang}])
  }

  link(url: string): Fmt {
    if (this.nodes.length === 0) return this
    return new Fmt([{kind: 'link', text: this.nodes, url}])
  }

  // -------------------------------------------------------------------------
  // Discord-specific helpers: mentions, emoji, timestamps
  // -------------------------------------------------------------------------

  /**
   * Mention a user.
   *
   * @example
   * Md.mention('1234567890').toString()
   * // → '<@1234567890>'
   *
   * t`Hi, ${Md.mention(userId)}!`.toString()
   * // → 'Hi, <@1234567890>!'
   *
   * @remarks
   * In Discord this renders as a clickable ping of the user.
   * The displayed name is the server nickname if set, otherwise the global name.
   */
  static mention(userId: string | APIUser | {user: APIUser}): Fmt {
    if (typeof userId === 'string') {
      return Fmt.empty().custom(`<@${userId}>`)
    } else if (typeof userId === 'object' && 'id' in userId) {
      return Fmt.empty().custom(`<@${userId.id}>`)
    } else if (typeof userId === 'object' && 'id' in userId?.user) {
      return Fmt.empty().custom(`<@${userId.user.id}>`)
    }
  }

  /**
   * Mention a role.
   *
   * @example
   * Md.mentionRole('1234567890').toString()
   * // → '<@&1234567890>'
   *
   * t`Role ${Md.mentionRole(roleId)} is now mentioned`.toString()
   * // → 'Role <@&1234567890> is now mentioned'
   *
   * @remarks
   * Only renders as a real mention if the bot has the "Mention @role"
   * permission and the role is not marked as unmentionable.
   * Otherwise it falls back to plain text.
   */
  static mentionRole(roleId: string): Fmt {
    return Fmt.empty().custom(`<@&${roleId}>`)
  }

  /**
   * Mention a channel.
   *
   * @example
   * Md.mentionChannel('1234567890').toString()
   * // → '<#1234567890>'
   *
   * t`See ${Md.mentionChannel(channelId)}`.toString()
   * // → 'See <#1234567890>'
   *
   * @remarks
   * In Discord this renders as a clickable link to the channel.
   * Does not work for categories or voice channels without text —
   * there it will just be plain text.
   */
  static mentionChannel(channelId: string): Fmt {
    return Fmt.empty().custom(`<#${channelId}>`)
  }

  /**
   * Custom server emoji (not a Unicode one).
   *
   * @example
   * Md.emoji('cat', '1234567890').toString()
   * // → '<:cat:1234567890>'
   *
   * Md.emoji('cat', '1234567890', true).toString()
   * // → '<a:cat:1234567890>'
   *
   * t`Look ${Md.emoji('cat', id)} at this`.toString()
   * // → 'Look <:cat:1234567890> at this'
   *
   * @remarks
   * `name` is the emoji name (without colons), `id` is its snowflake.
   * `animated` = true for animated emoji (Nitro-style).
   * Unicode emoji (😀) are inserted as plain text and do not need this helper.
   */
  static emoji(name: string, id: string, animated = false): Fmt {
    const prefix = animated ? 'a' : ''
    return Fmt.empty().custom(`<${prefix}:${name}:${id}>`)
  }

  /**
   * Discord timestamp — rendered in the **client's local time**,
   * so every user sees their own time.
   *
   * Accepts a `Date` or Unix time in **milliseconds**.
   *
   * @example
   * const d = new Date('2026-10-13T12:00:00Z')
   *
   * Md.timestamp(d, 'shortTime').toString()     // → '<t:1760356800:t>'  → '3:00 PM'
   * Md.timestamp(d, 'longTime').toString()      // → '<t:1760356800:T>'  → '3:00:00 PM'
   * Md.timestamp(d, 'shortDate').toString()     // → '<t:1760356800:d>'  → '10/13/2026'
   * Md.timestamp(d, 'longDate').toString()      // → '<t:1760356800:D>'  → 'October 13, 2026'
   * Md.timestamp(d, 'shortDateTime').toString() // → '<t:1760356800:f>'  → 'October 13, 2026 at 3:00 PM'
   * Md.timestamp(d, 'longDateTime').toString()  // → '<t:1760356800:F>'  → 'Tuesday, October 13, 2026 at 3:00 PM'
   * Md.timestamp(d, 'relative').toString()      // → '<t:1760356800:R>'  → 'in 2 minutes'
   *
   * @remarks
   * Timestamp display style in Discord.
   * Corresponds to the suffix in `<t:unix:STYLE>`.
   *
   * | Style | Alias | Output example (en-US)                  | Description                  |
   * |-------|-------|-----------------------------------------|------------------------------|
   * | `t`   | `shortTime`     | `16:20`                       | Short Time                   |
   * | `T`   | `longTime`      | `16:20:30`                    | Medium Time                  |
   * | `d`   | `shortDate`     | `20/04/2021`                  | Short Date                   |
   * | `D`   | `longDate`      | `April 20, 2021`              | Long Date                    |
   * | `f`   | `shortDateTime` | `April 20, 2021 at 16:20`     | Long Date, Short Time        |
   * | `F`   | `longDateTime`  | `Tuesday, April 20, 2021 at 16:20` | Full Date, Short Time   |
   * | `s`   | `dateTimeShort` | `20/04/2021, 16:20`           | Short Date, Short Time       |
   * | `S`   | `dateTimeLong`  | `20/04/2021, 16:20:30`        | Short Date, Medium Time      |
   * | `R`   | `relative`      | `4 years ago`                 | Relative Time                |
   *
   * `f` is the default style.
   */
  static timestamp(
    date: Date | number,
    style: TimestampStyle = 'f', // default per Discord
  ): Fmt {
    const ms = date instanceof Date ? date.getTime() : date
    const unix = Math.floor(ms / 1000)
    const s = TIMESTAMP_STYLE_MAP[style]
    return Fmt.empty().custom(`<t:${unix}:${s}>`)
  }

  toString(): string {
    return renderNodes(this.nodes)
  }

  valueOf(): string {
    return this.toString()
  }

  get length(): number {
    return this.toString().length
  }
}

// ---------------------------------------------------------------------------
// tagged template + functional wrappers
// ---------------------------------------------------------------------------

export function t(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Fmt {
  let result = Fmt.empty()
  for (let i = 0; i < strings.length; i++) {
    if (strings[i]) result = result.plain(strings[i]!)
    if (i < values.length) {
      const value = values[i]
      result = result.concat(value instanceof Fmt ? value : Fmt.of(value))
    }
  }
  return result
}

export const b = (v: unknown) => Fmt.of(v).bold()
export const i = (v: unknown) => Fmt.of(v).italic()
export const u = (v: unknown) => Fmt.of(v).underline()
export const s = (v: unknown) => Fmt.of(v).strike()
export const sp = (v: unknown) => Fmt.of(v).spoiler()
export const c = (v: unknown, lang?: string) => Fmt.of(v).code(lang)
export const link = (text: unknown, url: string) => Fmt.of(text).link(url)
