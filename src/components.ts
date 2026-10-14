import {
  type APIActionRowComponent,
  type APIButtonComponent,
  type APIChannelSelectComponent,
  type APIComponentInContainer,
  type APIComponentInMessageActionRow,
  type APIContainerComponent,
  type APIFileComponent,
  type APIMediaGalleryComponent,
  type APIMentionableSelectComponent,
  type APIMessageComponentEmoji,
  type APIMessageTopLevelComponent,
  type APIRoleSelectComponent,
  type APISectionAccessoryComponent,
  type APISectionComponent,
  type APISeparatorComponent,
  type APIStringSelectComponent,
  type APITextDisplayComponent,
  type APIThumbnailComponent,
  type APIUserSelectComponent,
  ButtonStyle,
  ChannelType,
  ComponentType,
  MessageFlags,
  SelectMenuDefaultValueType,
} from 'discord-api-types/v10'

import {componentError, reportComponentError} from './errors.ts'
import {Fmt} from './fmt.ts'

export type TextInput = string | Fmt

export interface SeparatorOptions {
  spacing?: 'small' | 'large'
  divider?: boolean
}

export interface ThumbnailOptions {
  url: string
  description?: string
  spoiler?: boolean
}

export interface FileOptions {
  url: string
  spoiler?: boolean
}

export interface MediaGalleryItem {
  url: string
  description?: string
  spoiler?: boolean
}

export type ButtonStyleName =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'link'
  | 'premium'

export interface ButtonOptions {
  id?: string
  skuId?: string
  label?: string
  emoji?: APIMessageComponentEmoji | string
  disabled?: boolean
  url?: string
}

interface SelectOptions {
  id: string
  placeholder?: string
  min?: number
  max?: number
  disabled?: boolean
}

export interface StringSelectOptions extends SelectOptions {
  options: Array<{
    label: string
    value: string
    description?: string
    emoji?: APIMessageComponentEmoji | string
    default?: boolean
  }>
}

export interface UserSelectOptions extends SelectOptions {
  defaultValues?: string[]
}

export interface RoleSelectOptions extends SelectOptions {
  defaultValues?: string[]
}

export interface MentionableSelectOptions extends SelectOptions {
  defaultValues?: Array<{id: string; type: 'user' | 'role'}>
}

export interface ChannelSelectOptions extends SelectOptions {
  channelTypes?: ChannelType[]
  defaultValues?: string[]
}

type ButtonBuilder =
  & {
    [K in Exclude<ButtonStyleName, 'premium'>]: (opts: ButtonOptions) => APIButtonComponent
  }
  & {
    premium(opts: ButtonOptions & {skuId: string}): APIButtonComponent
  }

export interface RowBuilder {
  button: ButtonBuilder
  stringSelect(opts: StringSelectOptions): APIStringSelectComponent
  userSelect(opts: UserSelectOptions): APIUserSelectComponent
  roleSelect(opts: RoleSelectOptions): APIRoleSelectComponent
  mentionableSelect(opts: MentionableSelectOptions): APIMentionableSelectComponent
  channelSelect(opts: ChannelSelectOptions): APIChannelSelectComponent
}

export interface SectionBuilder {
  text(strings: TemplateStringsArray, ...values: unknown[]): APITextDisplayComponent
  text(value: TextInput): APITextDisplayComponent
  thumbnail(opts: ThumbnailOptions): APIThumbnailComponent
  button: ButtonBuilder
}

export interface TopBuilder {
  text(strings: TemplateStringsArray, ...values: unknown[]): APITextDisplayComponent
  text(value: TextInput): APITextDisplayComponent
  separator(opts?: SeparatorOptions): APISeparatorComponent
  section(
    fn: (s: SectionBuilder) => {
      text: APITextDisplayComponent | APITextDisplayComponent[]
      accessory: APISectionAccessoryComponent
    },
  ): APISectionComponent
  row(fn: (r: RowBuilder) => APIComponentInMessageActionRow[]): APIActionRowComponent<APIComponentInMessageActionRow>
  gallery(...items: MediaGalleryItem[]): APIMediaGalleryComponent
  file(opts: FileOptions): APIFileComponent
}

export interface MessageBuilder extends TopBuilder {
  container(fn: (t: TopBuilder) => APIComponentInContainer[]): APIContainerComponent
}

function renderText(input: TextInput): string {
  return input instanceof Fmt ? input.toString() : input
}

function renderEmoji(emoji: APIMessageComponentEmoji | string): APIMessageComponentEmoji {
  return typeof emoji === 'string' ? {name: emoji} : {...emoji}
}

const BUTTON_STYLE: Record<ButtonStyleName, ButtonStyle> = {
  primary: ButtonStyle.Primary,
  secondary: ButtonStyle.Secondary,
  success: ButtonStyle.Success,
  danger: ButtonStyle.Danger,
  link: ButtonStyle.Link,
  premium: ButtonStyle.Premium,
}

function buildButton(style: ButtonStyleName, opts: ButtonOptions): APIButtonComponent {
  const base = {
    type: ComponentType.Button,
    style: BUTTON_STYLE[style],
    ...(opts.label !== undefined ? {label: opts.label} : {}),
    ...(opts.emoji ? {emoji: renderEmoji(opts.emoji)} : {}),
    ...(opts.disabled !== undefined ? {disabled: opts.disabled} : {}),
  }

  if (style === 'link') {
    if (!opts.url) componentError('link button requires url')
    if (opts.label === undefined && opts.emoji === undefined) {
      componentError('link button requires a label or emoji')
    }
    return {...base, url: opts.url} as APIButtonComponent
  }
  if (style === 'premium') {
    if (!opts.skuId) componentError('premium button requires skuId')
    return {...base, sku_id: opts.skuId} as APIButtonComponent
  }
  if (!opts.id) componentError(`${style} button requires id`)
  if (opts.label === undefined && opts.emoji === undefined) {
    componentError(`${style} button requires a label or emoji`)
  }
  return {...base, custom_id: opts.id} as APIButtonComponent
}

function baseSelectOptions(opts: SelectOptions) {
  if (!opts.id) componentError('select menu requires id')
  if (opts.min != null && (opts.min < 0 || opts.min > 25)) {
    componentError('select min must be between 0 and 25')
  }
  if (opts.max != null && (opts.max < 1 || opts.max > 25)) {
    componentError('select max must be between 1 and 25')
  }
  if (opts.min != null && opts.max != null && opts.min > opts.max) {
    componentError('select min cannot exceed max')
  }
  return {
    custom_id: opts.id,
    ...(opts.placeholder !== undefined ? {placeholder: opts.placeholder} : {}),
    ...(opts.min != null ? {min_values: opts.min} : {}),
    ...(opts.max != null ? {max_values: opts.max} : {}),
    ...(opts.disabled !== undefined ? {disabled: opts.disabled} : {}),
  }
}

function buildSelectMenu<T extends SelectMenuDefaultValueType>(
  opts: SelectOptions & {defaultValues?: string[]},
  type: T,
) {
  return {
    ...baseSelectOptions(opts),
    ...(opts.defaultValues
      ? {default_values: opts.defaultValues.map((id) => ({id, type}))}
      : {}),
  }
}

function makeTextComponent(input: TextInput): APITextDisplayComponent {
  return {type: ComponentType.TextDisplay, content: renderText(input)}
}

function makeText(
  stringsOrInput: TemplateStringsArray | TextInput,
  ...values: unknown[]
): APITextDisplayComponent {
  if (Array.isArray(stringsOrInput) && 'raw' in stringsOrInput) {
    const strings = stringsOrInput as TemplateStringsArray
    let result = Fmt.empty()
    for (let i = 0; i < strings.length; i++) {
      if (strings[i]) result = result.raw(strings[i]!)
      if (i < values.length) result = result.concat(Fmt.of(values[i]))
    }
    return makeTextComponent(result)
  }
  return makeTextComponent(stringsOrInput as TextInput)
}

function makeButtonNamespace(): ButtonBuilder {
  return {
    primary: (opts) => buildButton('primary', opts),
    secondary: (opts) => buildButton('secondary', opts),
    success: (opts) => buildButton('success', opts),
    danger: (opts) => buildButton('danger', opts),
    link: (opts) => buildButton('link', opts),
    premium: (opts) => buildButton('premium', opts),
  }
}

function makeRowBuilder(): RowBuilder {
  return {
    button: makeButtonNamespace(),
    stringSelect(opts) {
      if (opts.options.length === 0 || opts.options.length > 25) {
        componentError('string select supports 1 to 25 options')
      }
      return {
        type: ComponentType.StringSelect,
        ...baseSelectOptions(opts),
        options: opts.options.map((option) => ({
          label: option.label,
          value: option.value,
          ...(option.description !== undefined ? {description: option.description} : {}),
          ...(option.emoji ? {emoji: renderEmoji(option.emoji)} : {}),
          ...(option.default !== undefined ? {default: option.default} : {}),
        })),
      }
    },
    userSelect(opts) {
      return {
        type: ComponentType.UserSelect,
        ...buildSelectMenu(opts, SelectMenuDefaultValueType.User),
      }
    },
    roleSelect(opts) {
      return {
        type: ComponentType.RoleSelect,
        ...buildSelectMenu(opts, SelectMenuDefaultValueType.Role),
      }
    },
    mentionableSelect(opts) {
      return {
        type: ComponentType.MentionableSelect,
        ...baseSelectOptions(opts),
        ...(opts.defaultValues
          ? {
            default_values: opts.defaultValues.map(({id, type}) => ({
              id,
              type: type === 'user' ? SelectMenuDefaultValueType.User : SelectMenuDefaultValueType.Role,
            })),
          }
          : {}),
      }
    },
    channelSelect(opts) {
      return {
        type: ComponentType.ChannelSelect,
        ...buildSelectMenu(opts, SelectMenuDefaultValueType.Channel),
        ...(opts.channelTypes ? {channel_types: opts.channelTypes} : {}),
      }
    },
  }
}

function makeSectionBuilder(): SectionBuilder {
  return {
    text: makeText as SectionBuilder['text'],
    thumbnail(opts) {
      return {
        type: ComponentType.Thumbnail,
        media: {url: opts.url},
        ...(opts.description !== undefined ? {description: opts.description} : {}),
        ...(opts.spoiler !== undefined ? {spoiler: opts.spoiler} : {}),
      }
    },
    button: makeButtonNamespace(),
  }
}

function makeTopBuilder(): TopBuilder {
  return {
    text: makeText as TopBuilder['text'],
    separator(opts = {}) {
      return {
        type: ComponentType.Separator,
        ...(opts.spacing ? {spacing: opts.spacing === 'large' ? 2 : 1} : {}),
        ...(opts.divider !== undefined ? {divider: opts.divider} : {}),
      }
    },
    section(fn) {
      const {text, accessory} = fn(makeSectionBuilder())
      const components = Array.isArray(text) ? text : [text]
      if (components.length < 1 || components.length > 3) {
        componentError('section supports 1 to 3 text components')
      }
      if (components.some((component) => component.type !== ComponentType.TextDisplay)) {
        componentError('section children must be text display components')
      }
      return {type: ComponentType.Section, components, accessory}
    },
    row(fn) {
      const components = fn(makeRowBuilder())
      if (components.length === 0) componentError('row must have at least one child')
      if (components.length > 5) componentError('row supports at most 5 children')
      const hasSelect = components.some((component) =>
        component.type === ComponentType.StringSelect
        || component.type === ComponentType.UserSelect
        || component.type === ComponentType.RoleSelect
        || component.type === ComponentType.MentionableSelect
        || component.type === ComponentType.ChannelSelect
      )
      if (hasSelect && components.length !== 1) {
        componentError('select menus must be the only component in a row')
      }
      return {type: ComponentType.ActionRow, components}
    },
    gallery(...items) {
      if (items.length === 0) componentError('gallery must have at least one item')
      if (items.length > 10) componentError('gallery supports at most 10 items')
      return {
        type: ComponentType.MediaGallery,
        items: items.map((item) => ({
          media: {url: item.url},
          ...(item.description !== undefined ? {description: item.description} : {}),
          ...(item.spoiler !== undefined ? {spoiler: item.spoiler} : {}),
        })),
      }
    },
    file(opts) {
      return {
        type: ComponentType.File,
        file: {url: opts.url},
        ...(opts.spoiler !== undefined ? {spoiler: opts.spoiler} : {}),
      }
    },
  }
}

export interface Message {
  readonly components: APIMessageTopLevelComponent[]
  readonly flags: MessageFlags.IsComponentsV2
}

export function message(
  fn: (t: MessageBuilder) => APIMessageTopLevelComponent[],
): Message {
  try {
    const top = makeTopBuilder()
    const builder: MessageBuilder = {
      ...top,
      container(callback) {
        const components = callback(top)
        if (components.length === 0) componentError('container must have children')
        if (components.length > 10) componentError('container supports at most 10 children')
        return {type: ComponentType.Container, components}
      },
    }

    const components = fn(builder)
    if (components.length === 0) componentError('message must have at least one component')
    if (components.length > 10) {
      componentError('message supports at most 10 top-level components')
    }

    return {
      components,
      flags: MessageFlags.IsComponentsV2,
    }
  } catch (error) {
    reportComponentError(error)
    throw error
  }
}
