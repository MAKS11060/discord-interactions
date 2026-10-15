import * as discordRest from '#lib/api/discord/index.ts'
import {
  type APIApplicationCommandAutocompleteInteraction,
  type APIApplicationCommandInteraction,
  type APIApplicationCommandInteractionDataOption,
  type APIApplicationCommandOption,
  type APIAttachment,
  type APIChannel,
  type APIInteractionDataOptionBase,
  type APIInteractionDataResolvedChannel,
  type APIInteractionDataResolvedGuildMember,
  type APIInteractionGuildMember,
  type APIInteractionResponse,
  type APIInteractionResponseCallbackData,
  type APIInteractionResponseChannelMessageWithSource,
  type APIInteractionResponseDeferredChannelMessageWithSource,
  type APIInteractionResponseDeferredMessageUpdate,
  type APIInteractionResponseUpdateMessage,
  type APIMessageComponentInteraction,
  type APIModalInteractionResponse,
  type APIModalInteractionResponseCallbackData,
  type APIModalSubmitInteraction,
  type APIRole,
  type APIUser,
  type APIUserInteractionDataResolved,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ComponentType,
  InteractionResponseType,
  InteractionType,
  MessageFlags,
  type RESTPatchAPIInteractionFollowupJSONBody,
  type RESTPatchAPIInteractionOriginalResponseJSONBody,
  type RESTPostAPIInteractionFollowupJSONBody,
} from 'discord-api-types/v10'
import type {BuilderConfig, ConfigCustomIds} from './builder.ts'
import type {Message} from './components.ts'
import {Fmt, i} from './fmt.ts'

export type MaybePromise<T> = Promise<T> | T
export type DeferredOptions = {
  fetch?: typeof fetch
  signal?: AbortSignal
  waitUntil?: (promise: Promise<unknown>) => void
}

type DeferredRequestOptions = Pick<DeferredOptions, 'fetch' | 'signal'>
export type OptionToObject<T extends APIApplicationCommandOption> = {
  [K in T['name']]: T extends {name: K} ? T : never
}

//
export const deferredResponse = Symbol('Deferred')

// pick Option by Type
type GetOptionNameByType<
  Option extends {type: ApplicationCommandOptionType; name: string; required?: boolean},
  Type extends ApplicationCommandOptionType,
> = Option extends {type: Type; name: infer Name} ? Name : never

// check is required options
type GetOptionsResult<
  Option extends {type: ApplicationCommandOptionType; name: string; required?: boolean},
  Key extends string,
  Result extends unknown,
> = Option extends {name: Key} //
  ? Option extends {required: true} ? Result : Result | null
  : never

const normalizeReply = <
  const T extends string | Fmt | Message | {
    content?: string | Fmt | undefined
  },
>(input: T):
  & (T extends (string | Fmt) ? {content: string} : Omit<T, 'content'> & {content?: string | undefined})
  & Record<string, string> =>
{
  if (typeof input === 'string') return {content: String(input)} as any
  if (input instanceof Fmt) return {content: input.toString()} as any
  // Message with components
  if (typeof input === 'object' && 'components' in input) return {...input} as any

  // override Fmt in object
  if (input.content instanceof Fmt) input.content = input.content.toString()
  return input as any
}

// Context
export class ApplicationCommandContextChatInput<
  Option extends {type: ApplicationCommandOptionType; name: string; required?: boolean} = APIApplicationCommandOption,
> {
  readonly interaction!: APIApplicationCommandInteraction
  readonly options!: Record<string, {value: unknown}>

  /**
   * Contains the initiator user
   */
  readonly from!: {
    /**
     * @returns The `user` who caused the interaction
     */
    readonly user: APIUser

    /**
     * @returns The `member` who caused the interaction, guild only
     */
    readonly member?: APIInteractionGuildMember

    /**
     * @returns The `channel` it was sent from
     */
    readonly channel?: Partial<APIChannel> & Pick<APIChannel, 'id' | 'type'>
  }

  constructor(
    interaction: APIApplicationCommandInteraction,
    options: Record<string, {value: unknown}> = {},
  ) {
    if (interaction.data.type !== ApplicationCommandType.ChatInput) {
      throw new Error('interaction type not supported for this context')
    }

    Object.defineProperty(this, 'interaction', {enumerable: true, value: interaction})
    Object.defineProperty(this, 'options', {enumerable: true, value: options})

    this.from = Object.create({}, {
      user: {
        enumerable: true,
        get: () => this.me,
      },
      member: {
        enumerable: true,
        get: () => this.interaction.member ?? null,
      },
      channel: {
        enumerable: true,
        get: () => this.interaction.channel ?? null,
      },
    })
  }

  #optionValue(name: string, type: ApplicationCommandOptionType): unknown {
    const resolved = this.options[name]
    if (resolved) return resolved.value

    const findOption = (options: APIApplicationCommandInteractionDataOption[]): unknown => {
      for (const option of options) {
        if ('value' in option && option.type === type && option.name === name) return option.value
        if ('options' in option && option.options) {
          const value = findOption(option.options)
          if (value !== undefined) return value
        }
      }
      return undefined
    }

    if (this.interaction.data.type !== ApplicationCommandType.ChatInput) return undefined
    return findOption(this.interaction.data.options ?? [])
  }

  // for pretty log
  get [Symbol.toStringTag]() {
    return `app:${this.interaction.application_id} user:${this.me.username}`
  }

  // Request

  /**
   * @returns The `user` who caused the interaction
   */
  get me(): APIUser {
    return this.interaction.member?.user ?? this.interaction.user!
  }

  getString<Key extends GetOptionNameByType<Option, ApplicationCommandOptionType.String>>(
    name: Key,
  ): GetOptionsResult<Option, Key, string> {
    if (this.interaction.data.type !== ApplicationCommandType.ChatInput) return null as any

    return (this.#optionValue(name, ApplicationCommandOptionType.String) ?? null) as any
  }

  getInteger<Key extends GetOptionNameByType<Option, ApplicationCommandOptionType.Integer>>(
    name: Key,
  ): GetOptionsResult<Option, Key, number> {
    if (this.interaction.data.type !== ApplicationCommandType.ChatInput) return null as any

    return (this.#optionValue(name, ApplicationCommandOptionType.Integer) ?? null) as any
  }

  getBoolean<Key extends GetOptionNameByType<Option, ApplicationCommandOptionType.Boolean>>(
    name: Key,
  ): GetOptionsResult<Option, Key, boolean> {
    if (this.interaction.data.type !== ApplicationCommandType.ChatInput) return null as any

    return (this.#optionValue(name, ApplicationCommandOptionType.Boolean) ?? null) as any
  }

  getUser<Key extends GetOptionNameByType<Option, ApplicationCommandOptionType.User>>(
    name: Key,
  ): GetOptionsResult<Option, Key, APIUser> {
    if (this.interaction.data.type !== ApplicationCommandType.ChatInput) return null as any
    // { name: "user", type: 6, value: "421033097400811521" }
    const userId = this.#optionValue(name, ApplicationCommandOptionType.User)
    const resolved = this.interaction.data.resolved as APIUserInteractionDataResolved
    return (typeof userId === 'string' ? resolved?.users?.[userId] : null) as any
  }

  getMember<Key extends GetOptionNameByType<Option, ApplicationCommandOptionType.User>>(
    name: Key,
  ): GetOptionsResult<Option, Key, APIInteractionDataResolvedGuildMember> {
    if (this.interaction.data.type !== ApplicationCommandType.ChatInput) return null as any

    // { name: "user", type: 6, value: "421033097400811521" }
    const userId = this.#optionValue(name, ApplicationCommandOptionType.User)
    const resolved = this.interaction.data.resolved as APIUserInteractionDataResolved
    return (typeof userId === 'string' ? resolved?.members?.[userId] : null) as any
  }

  getChannel<Key extends GetOptionNameByType<Option, ApplicationCommandOptionType.Channel>>(
    name: Key,
  ): GetOptionsResult<Option, Key, APIInteractionDataResolvedChannel> {
    if (this.interaction.data.type !== ApplicationCommandType.ChatInput) return null as any

    // { name: "channel", type: 7, value: "1223906943987617833" }
    const channelId = this.#optionValue(name, ApplicationCommandOptionType.Channel)
    const resolved = this.interaction.data.resolved // as APIInteractionDataResolvedChannel
    return (typeof channelId === 'string' ? resolved?.channels?.[channelId] : null) as any
  }

  getRole<Key extends GetOptionNameByType<Option, ApplicationCommandOptionType.Role>>(
    name: Key,
  ): GetOptionsResult<Option, Key, APIRole> {
    if (this.interaction.data.type !== ApplicationCommandType.ChatInput) return null as any

    const roleId = this.#optionValue(name, ApplicationCommandOptionType.Role)
    const resolved = this.interaction.data.resolved
    return (typeof roleId === 'string' ? resolved?.roles?.[roleId] : null) as any
  }

  getMentionable<Key extends GetOptionNameByType<Option, ApplicationCommandOptionType.Mentionable>>(
    name: Key,
  ): GetOptionsResult<Option, Key, APIUser | APIRole> {
    if (this.interaction.data.type !== ApplicationCommandType.ChatInput) return null as any

    // { name: "mentionable", type: 9, value: "1213048588805083157" }
    const mentionableId = this.#optionValue(name, ApplicationCommandOptionType.Mentionable)
    const resolved = this.interaction.data.resolved
    return (
      (typeof mentionableId === 'string' ? resolved?.roles?.[mentionableId] : undefined)
        ?? (typeof mentionableId === 'string' ? resolved?.users?.[mentionableId] : undefined)
        ?? null
    ) as any
  }

  getMentionableUser<Key extends GetOptionNameByType<Option, ApplicationCommandOptionType.Mentionable>>(
    name: Key,
  ): GetOptionsResult<Option, Key, APIUser | null> {
    if (this.interaction.data.type !== ApplicationCommandType.ChatInput) return null as any

    // { name: "mentionable", type: 9, value: "1213048588805083157" }
    const mentionableId = this.#optionValue(name, ApplicationCommandOptionType.Mentionable)
    const resolved = this.interaction.data.resolved
    return (typeof mentionableId === 'string' ? resolved?.users?.[mentionableId] : null) as any
  }

  getMentionableMember<Key extends GetOptionNameByType<Option, ApplicationCommandOptionType.Mentionable>>(
    name: Key,
  ): GetOptionsResult<Option, Key, APIInteractionDataResolvedGuildMember | null> {
    if (this.interaction.data.type !== ApplicationCommandType.ChatInput) return null as any

    // { name: "mentionable", type: 9, value: "1213048588805083157" }
    const mentionableId = this.#optionValue(name, ApplicationCommandOptionType.Mentionable)
    const resolved = this.interaction.data.resolved
    return (typeof mentionableId === 'string' ? resolved?.members?.[mentionableId] : null) as any
  }

  getMentionableRole<Key extends GetOptionNameByType<Option, ApplicationCommandOptionType.Mentionable>>(
    name: Key,
  ): GetOptionsResult<Option, Key, APIRole | null> {
    if (this.interaction.data.type !== ApplicationCommandType.ChatInput) return null as any

    // { name: "mentionable", type: 9, value: "1213048588805083157" }
    const mentionableId = this.#optionValue(name, ApplicationCommandOptionType.Mentionable)
    const resolved = this.interaction.data.resolved
    return (typeof mentionableId === 'string' ? resolved?.roles?.[mentionableId] : null) as any
  }

  // type guards
  isMentionableUser(mentionable: APIUser | APIRole): mentionable is APIUser {
    if (this.interaction.data.type !== ApplicationCommandType.ChatInput) return null as any

    return Boolean(this.interaction.data.resolved?.users?.[mentionable.id])
  }

  isMentionableRole(mentionable: APIUser | APIRole): mentionable is APIRole {
    if (this.interaction.data.type !== ApplicationCommandType.ChatInput) return null as any

    return Boolean(this.interaction.data.resolved?.roles?.[mentionable.id])
  }

  getNumber<Key extends GetOptionNameByType<Option, ApplicationCommandOptionType.Number>>(
    name: Key,
  ): GetOptionsResult<Option, Key, number> {
    if (this.interaction.data.type !== ApplicationCommandType.ChatInput) return null as any

    return (this.#optionValue(name, ApplicationCommandOptionType.Number) ?? null) as any
  }

  getAttachment<Key extends GetOptionNameByType<Option, ApplicationCommandOptionType.Attachment>>(
    name: Key,
  ): GetOptionsResult<Option, Key, APIAttachment> {
    if (this.interaction.data.type !== ApplicationCommandType.ChatInput) return null as any

    // { name: "attachment", type: 11, value: "1213048588805083157" }
    const attachmentId = this.#optionValue(name, ApplicationCommandOptionType.Attachment)
    const resolved = this.interaction.data.resolved
    return (typeof attachmentId === 'string' ? resolved?.attachments?.[attachmentId] : null) as any
  }

  // Response
  reply(content: string | Fmt): APIInteractionResponseChannelMessageWithSource
  reply(data: APIInteractionResponseCallbackData): APIInteractionResponseChannelMessageWithSource
  reply(data: string | Fmt | APIInteractionResponseCallbackData): APIInteractionResponse {
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: normalizeReply(data),
    }
  }

  replyEphemeral(content: string): APIInteractionResponseChannelMessageWithSource
  replyEphemeral(data: APIInteractionResponseCallbackData): APIInteractionResponseChannelMessageWithSource
  replyEphemeral(data: string | APIInteractionResponseCallbackData): APIInteractionResponse {
    const res = normalizeReply(data)
    res.flags = MessageFlags.Ephemeral

    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: res,
    }
  }

  replyDeferred(cb?: (c: DeferredContext) => MaybePromise<void>): DeferredContext {
    const deferredContext = new DeferredContext(
      this.interaction,
      {type: InteractionResponseType.DeferredChannelMessageWithSource},
    )

    cb?.(deferredContext)
    return deferredContext
  }

  replyDeferredEphemeral(cb: (c: DeferredContext) => MaybePromise<void>): DeferredContext {
    const deferredContext = new DeferredContext(this.interaction, {
      type: InteractionResponseType.DeferredChannelMessageWithSource,
      data: {flags: MessageFlags.Ephemeral},
    })

    cb?.(deferredContext)
    return deferredContext
  }

  /**
   * Creates a modal window
   */
  replyModal(data: APIModalInteractionResponseCallbackData): APIInteractionResponse {
    return {
      type: InteractionResponseType.Modal,
      data,
    }
  }
}

//
export class ApplicationCommandAutocompleteContext<
  Option extends APIApplicationCommandOption = APIApplicationCommandOption,
> {
  interaction!: APIApplicationCommandAutocompleteInteraction

  /**
   * Contains the initiator user
   */
  readonly from!: {
    /**
     * @returns The `user` who caused the interaction
     */
    readonly user: APIUser

    /**
     * @returns The `member` who caused the interaction
     */
    readonly member?: APIInteractionGuildMember
  }

  constructor(interaction: APIApplicationCommandAutocompleteInteraction) {
    if (interaction.type !== InteractionType.ApplicationCommandAutocomplete) {
      throw new Error('interaction type not supported for this context')
    }

    Object.defineProperty(this, 'interaction', {enumerable: true, value: interaction})

    this.from = Object.create({}, {
      user: {
        enumerable: true,
        get: () => this.me,
      },
      member: {
        enumerable: true,
        get: () => {
          return this.interaction.member ?? null
        },
      },
    })
  }

  // Request

  /**
   * @returns The `user` who caused the interaction
   */
  get me(): APIUser {
    return this.interaction.member?.user ?? this.interaction.user!
  }

  // Response
  /** Returns the list for auto-completion and truncates it to the limit of `25` */
  suggest(suggestions: Iterable<string | number | {value: string | number; name?: string}>) {
    return Array.from(Iterator.from(suggestions).take(25), (v) =>
      typeof v === 'object'
        ? {value: v.value, name: v.name ?? String(v.value)}
        : {value: v, name: String(v)})
      .slice(0, 25)
  }

  /** Returns empty list */
  empty() {
    return []
  }
}

type AnyString = string & {}
type GetCustomIds<T extends BuilderConfig> = ConfigCustomIds<T>[keyof ConfigCustomIds<T>] | AnyString

export class MessageComponentContext<Config extends BuilderConfig = BuilderConfig> {
  interaction!: APIMessageComponentInteraction

  /**
   * Contains the initiator user
   */
  readonly from!: {
    /**
     * @returns The `user` who caused the interaction
     */
    readonly user: APIUser

    /**
     * @returns The `member` who caused the interaction, guild only
     */
    readonly member?: APIInteractionGuildMember

    /**
     * @returns The `channel` it was sent from
     */
    readonly channel?: Partial<APIChannel> & Pick<APIChannel, 'id' | 'type'>
  }

  constructor(interaction: APIMessageComponentInteraction) {
    if (interaction.type !== InteractionType.MessageComponent) {
      throw new Error('interaction type not supported for this context')
    }

    Object.defineProperty(this, 'interaction', {enumerable: true, value: interaction})

    this.from = Object.create({}, {
      user: {
        enumerable: true,
        get: () => this.me,
      },
      member: {
        enumerable: true,
        get: () => this.interaction.member ?? null,
      },
      channel: {
        enumerable: true,
        get: () => this.interaction.channel ?? null,
      },
    })
  }

  // #region Request

  /**
   * @returns The `user` who caused the interaction
   */
  get me(): APIUser {
    return this.interaction.member?.user ?? this.interaction.user!
  }

  /**
   * Gets the type of the message component.
   * @returns The type of the message component.
   */
  get type(): ComponentType {
    return this.interaction.data.component_type
  }

  /**
   * Gets the custom ID of the message component.
   * @returns The custom ID of the message component, which is a string with a maximum length of 100 characters.
   */
  get customId(): GetCustomIds<Config> {
    return this.interaction.data.custom_id as GetCustomIds<Config> // optional typed
  }
  // #endregion

  // #region Response
  // Response
  reply(content: string | Fmt | Message): APIInteractionResponseChannelMessageWithSource
  reply(data: APIInteractionResponseCallbackData): APIInteractionResponseChannelMessageWithSource
  reply(data: string | Fmt | Message | APIInteractionResponseCallbackData): APIInteractionResponse {
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: normalizeReply(data),
    }
  }

  replyEphemeral(content: string | Fmt | Message): APIInteractionResponseChannelMessageWithSource {
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        ...normalizeReply(content),
        flags: MessageFlags.Ephemeral,
      },
    }
  }

  update(content: string | Fmt | Message): APIInteractionResponseUpdateMessage
  update(data: APIInteractionResponseCallbackData): APIInteractionResponseUpdateMessage
  update(data: string | Fmt | Message | APIInteractionResponseCallbackData): APIInteractionResponseUpdateMessage {
    return {
      type: InteractionResponseType.UpdateMessage,
      data: normalizeReply(data),
    }
  }

  deferReply(
    defer: (deferredContext: DeferredContext) => MaybePromise<void>,
    options?: DeferredOptions,
  ): APIInteractionResponseDeferredChannelMessageWithSource {
    const callback = Promise.resolve(defer(
      new DeferredContext(
        this.interaction,
        {type: InteractionResponseType.DeferredChannelMessageWithSource},
        options,
      ),
    ))
    if (options?.waitUntil) options.waitUntil(callback)

    return {type: InteractionResponseType.DeferredChannelMessageWithSource}
  }

  deferUpdate(
    defer: (deferredContext: DeferredContext) => MaybePromise<void>,
    options?: DeferredOptions,
  ): APIInteractionResponseDeferredMessageUpdate {
    const callback = Promise.resolve(defer(
      new DeferredContext(
        this.interaction,
        {type: InteractionResponseType.DeferredMessageUpdate},
        options,
      ),
    ))
    if (options?.waitUntil) options.waitUntil(callback)

    return {type: InteractionResponseType.DeferredMessageUpdate}
  }

  // #endregion
}

export class ModalSubmitContext {
  interaction!: APIModalSubmitInteraction

  /**
   * Contains the initiator user
   */
  readonly from!: {
    /**
     * @returns The `user` who caused the interaction
     */
    readonly user: APIUser

    /**
     * @returns The `member` who caused the interaction
     */
    readonly member?: APIInteractionGuildMember
  }

  constructor(interaction: APIModalSubmitInteraction) {
    if (interaction.type !== InteractionType.ModalSubmit) {
      throw new Error('interaction type not supported for this context')
    }

    Object.defineProperty(this, 'interaction', {enumerable: true, value: interaction})

    this.from = Object.create({}, {
      user: {
        enumerable: true,
        get: () => this.me,
      },
      member: {
        enumerable: true,
        get: () => {
          return this.interaction.member ?? null
        },
      },
    })

    this.interaction.data.components
  }

  // Request

  /**
   * @returns The `user` who caused the interaction
   */
  get me(): APIUser {
    return this.interaction.member?.user ?? this.interaction.user!
  }

  get id() {
    return this.interaction.data.custom_id
  }

  // Response
}

// Deferred messages
export class DeferredContext {
  readonly interaction!: APIApplicationCommandInteraction | APIMessageComponentInteraction;
  [deferredResponse]!: APIInteractionResponse
  readonly #options: DeferredRequestOptions

  constructor(
    interaction: APIApplicationCommandInteraction | APIMessageComponentInteraction,
    response: APIInteractionResponse,
    options?: DeferredRequestOptions,
  ) {
    Object.defineProperty(this, 'interaction', {value: interaction})
    this[deferredResponse] = response
    this.#options = options ?? {}
  }

  /**
   * Edits the original interaction response.
   * @param body - The data for the edited interaction response.
   * @returns A promise that resolves to a DeferredReplyContext object.
   */
  async reply(
    body: RESTPatchAPIInteractionOriginalResponseJSONBody,
    options?: DeferredRequestOptions,
  ) {
    const {data, error} = await discordRest.updateOriginalWebhookMessage({
      path: {
        webhook_id: this.interaction.application_id,
        webhook_token: this.interaction.token,
      },
      body: normalizeReply(body as any),
      fetch: options?.fetch ?? this.#options.fetch,
      signal: options?.signal ?? this.#options.signal,
    })

    return {
      res: data!,
      delete: async () => {
        const {data, error, response} = await discordRest.deleteOriginalWebhookMessage({
          path: {
            webhook_id: this.interaction.application_id,
            webhook_token: this.interaction.token,
          },
          fetch: this.#options.fetch,
          signal: this.#options.signal,
        })

        return error ? false : response?.ok ?? false
      },
    }
  }

  /**
   * Creates a followup message.
   * @param body - The data for the followup message.
   * @returns A promise that resolves to a DeferredReplyFollowupContext object.
   */
  async replyFollowup(
    body: RESTPostAPIInteractionFollowupJSONBody,
    options?: DeferredRequestOptions,
  ) {
    const {data, error} = await discordRest.executeWebhook({
      path: {
        webhook_id: this.interaction.application_id,
        webhook_token: this.interaction.token,
      },
      body: normalizeReply(body as any),
      fetch: options?.fetch ?? this.#options.fetch,
      signal: options?.signal ?? this.#options.signal,
    })

    if (!data || error) return null

    return {
      res: data!,
      edit: async (
        body: RESTPatchAPIInteractionFollowupJSONBody,
        options?: DeferredRequestOptions,
      ) => {
        const {data: edited, error} = await discordRest.updateWebhookMessage({
          path: {
            webhook_id: this.interaction.application_id,
            webhook_token: this.interaction.token,
            message_id: data?.id,
          },
          body: body as any,
          fetch: options?.fetch ?? this.#options.fetch,
          signal: options?.signal ?? this.#options.signal,
        })

        return edited!
      },
      delete: async (
        options?: DeferredRequestOptions,
      ) => {
        const {error, response} = await discordRest.deleteWebhookMessage({
          path: {
            webhook_id: this.interaction.application_id,
            webhook_token: this.interaction.token,
            message_id: data.id,
          },
          fetch: options?.fetch ?? this.#options.fetch,
          signal: options?.signal ?? this.#options.signal,
        })

        return response?.ok ?? false
      },
    }
  }

  async deleteFollowup() {
    const res = await discordRest.deleteWebhookMessage({
      path: {
        webhook_id: this.interaction.application_id,
        webhook_token: this.interaction.token,
        message_id: this.interaction.message?.id!,
      },
      fetch: this.#options.fetch,
      signal: this.#options.signal,
    })
    console.log(res.response?.status)
  }

  async deleteOrigin() {
    const res = await discordRest.deleteOriginalWebhookMessage({
      path: {
        webhook_id: this.interaction.application_id,
        webhook_token: this.interaction.token,
      },
      fetch: this.#options.fetch,
      signal: this.#options.signal,
    })
    console.log(res.response?.status)
  }
}

// user context menu
class ApplicationCommandContextMenu {
  readonly interaction!: APIApplicationCommandInteraction

  /**
   * Contains the initiator user
   */
  readonly from!: {
    /**
     * @returns The `user` who caused the interaction
     */
    readonly user: APIUser

    /**
     * @returns The `member` who caused the interaction
     */
    readonly member?: APIInteractionGuildMember
  }

  /**
   * Contains the target user
   */
  readonly to!: {
    /**
     * the `user` object for which the interaction is triggered, via the user's context menu.
     * @returns The resolved user object.
     */
    readonly user: APIUser

    /**
     * The guild `member` object for which the interaction is triggered, via the user's context menu.
     * @returns Returns the guild member object only if the interaction is a user context menu command interaction in a guild and the guild member object is present.
     */
    readonly member?: APIInteractionDataResolvedGuildMember
  }

  constructor(interaction: APIApplicationCommandInteraction) {
    if (interaction.type !== InteractionType.ApplicationCommand) {
      throw new Error('interaction type not supported for this context')
    }

    Object.defineProperty(this, 'interaction', {value: interaction})

    this.from = Object.create(null, {
      user: {
        enumerable: true,
        get: () => this.me,
      },
      member: {
        enumerable: true,
        get: () => {
          if (this.interaction.data.type !== ApplicationCommandType.User) return null!
          return this.interaction.member ?? null
        },
      },
    })

    this.to = Object.create(null, {
      user: {
        enumerable: true,
        get: () => {
          if (this.interaction.data.type !== ApplicationCommandType.User) return null!
          return this.interaction.data.resolved.users[this.interaction.data.target_id]!
        },
      },
      member: {
        enumerable: true,
        get: () => {
          if (this.interaction.data.type !== ApplicationCommandType.User) return null!
          return this.interaction.data.resolved.members?.[this.interaction.data.target_id] ?? null
        },
      },
    })
  }

  /**
   * @returns The `user` who caused the interaction
   */
  get me(): APIUser {
    return this.interaction.member?.user || this.interaction.user!
  }

  // Response
  reply(content: string | Fmt): APIInteractionResponseChannelMessageWithSource
  reply(data: APIInteractionResponseCallbackData): APIInteractionResponseChannelMessageWithSource
  reply(data: string | Fmt | APIInteractionResponseCallbackData): APIInteractionResponse {
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: normalizeReply(data),
    }
  }

  replyEphemeral(content: string): APIInteractionResponseChannelMessageWithSource
  replyEphemeral(data: APIInteractionResponseCallbackData): APIInteractionResponseChannelMessageWithSource
  replyEphemeral(data: string | APIInteractionResponseCallbackData): APIInteractionResponse {
    const res = normalizeReply(data)
    res.flags = MessageFlags.Ephemeral

    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: res,
    }
  }
}

export class ApplicationCommandContextUser extends ApplicationCommandContextMenu {
  constructor(interaction: APIApplicationCommandInteraction) {
    super(interaction)
    if (interaction.data.type !== ApplicationCommandType.User) {
      throw new Error('interaction type not supported for this context')
    }
  }
}

export class ApplicationCommandContextMessage extends ApplicationCommandContextMenu {
  constructor(interaction: APIApplicationCommandInteraction) {
    super(interaction)
    if (interaction.data.type !== ApplicationCommandType.Message) {
      throw new Error('interaction type not supported for this context')
    }
  }
}
