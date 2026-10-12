import * as discordRest from '#lib/api/discord/index.ts'
import {
  type APIApplicationCommandAutocompleteInteraction,
  type APIApplicationCommandInteraction,
  type APIApplicationCommandOption,
  type APIAttachment,
  type APIInteractionDataOptionBase,
  type APIInteractionDataResolvedChannel,
  type APIInteractionDataResolvedGuildMember,
  type APIInteractionGuildMember,
  type APIInteractionResponse,
  type APIInteractionResponseCallbackData,
  type APIInteractionResponseChannelMessageWithSource,
  type APIMessageComponentInteraction,
  type APIModalInteractionResponseCallbackData,
  type APIModalSubmitInteraction,
  type APIRole,
  type APIUser,
  type APIUserInteractionDataResolved,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  InteractionResponseType,
  InteractionType,
  MessageFlags,
  type RESTPatchAPIInteractionFollowupJSONBody,
  type RESTPatchAPIInteractionOriginalResponseJSONBody,
  type RESTPostAPIInteractionFollowupJSONBody,
} from 'discord-api-types/v10'

export type MaybePromise<T> = Promise<T> | T
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
     * @returns Get the `user` who caused the interaction
     */
    readonly user: APIUser

    /**
     * @returns Get the `member` who caused the interaction
     */
    readonly member?: APIInteractionGuildMember
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
        get: () => {
          if (this.interaction.data.type !== ApplicationCommandType.User) return null!
          return this.interaction.member ?? null
        },
      },
    })
  }

  // for pretty log
  get [Symbol.toStringTag]() {
    return `app:${this.interaction.application_id} id:${this.interaction.id} user:${this.me.username}`
  }

  // Request

  /**
   * @returns Get the `user` who caused the interaction
   */
  get me(): APIUser {
    return this.interaction.member?.user ?? this.interaction.user!
  }

  getString<Key extends GetOptionNameByType<Option, ApplicationCommandOptionType.String>>(
    name: Key,
  ): GetOptionsResult<Option, Key, string> {
    if (this.interaction.data.type !== ApplicationCommandType.ChatInput) return null as any

    const payload = this.interaction.data.options?.find((v) =>
      v.type === ApplicationCommandOptionType.String
      && v.name === name
    ) as APIInteractionDataOptionBase<ApplicationCommandOptionType.String, string>

    return (payload?.value ?? null) as any
  }

  getInteger<Key extends GetOptionNameByType<Option, ApplicationCommandOptionType.Integer>>(
    name: Key,
  ): GetOptionsResult<Option, Key, number> {
    if (this.interaction.data.type !== ApplicationCommandType.ChatInput) return null as any

    const payload = this.interaction.data.options?.find((v) =>
      v.type === ApplicationCommandOptionType.Integer
      && v.name === name
    ) as APIInteractionDataOptionBase<ApplicationCommandOptionType.Integer, number>

    return (payload?.value ?? null) as any
  }

  getBoolean<Key extends GetOptionNameByType<Option, ApplicationCommandOptionType.Boolean>>(
    name: Key,
  ): GetOptionsResult<Option, Key, boolean> {
    if (this.interaction.data.type !== ApplicationCommandType.ChatInput) return null as any

    const payload = this.interaction.data.options?.find((v) =>
      v.type === ApplicationCommandOptionType.Boolean
      && v.name === name
    ) as APIInteractionDataOptionBase<ApplicationCommandOptionType.Boolean, boolean>

    return (payload?.value ?? null) as any
  }

  getUser<Key extends GetOptionNameByType<Option, ApplicationCommandOptionType.User>>(
    name: Key,
  ): GetOptionsResult<Option, Key, APIUser> {
    if (this.interaction.data.type !== ApplicationCommandType.ChatInput) return null as any

    // { name: "user", type: 6, value: "421033097400811521" }
    const payload = this.interaction.data.options?.find((v) =>
      v.type === ApplicationCommandOptionType.User
      && v.name === name
    ) as APIInteractionDataOptionBase<ApplicationCommandOptionType.User, string>

    const resolved = this.interaction.data.resolved as APIUserInteractionDataResolved
    return (resolved.users?.[payload?.value] ?? null) as any
  }

  getMember<Key extends GetOptionNameByType<Option, ApplicationCommandOptionType.User>>(
    name: Key,
  ): GetOptionsResult<Option, Key, APIInteractionDataResolvedGuildMember> {
    if (this.interaction.data.type !== ApplicationCommandType.ChatInput) return null as any

    // { name: "user", type: 6, value: "421033097400811521" }
    const payload = this.interaction.data.options?.find((v) =>
      v.type === ApplicationCommandOptionType.User
      && v.name === name
    ) as APIInteractionDataOptionBase<ApplicationCommandOptionType.User, string>

    const resolved = this.interaction.data.resolved as APIUserInteractionDataResolved
    return (resolved.members?.[payload?.value] ?? null) as any
  }

  getChannel<Key extends GetOptionNameByType<Option, ApplicationCommandOptionType.Channel>>(
    name: Key,
  ): GetOptionsResult<Option, Key, APIInteractionDataResolvedChannel> {
    if (this.interaction.data.type !== ApplicationCommandType.ChatInput) return null as any

    // { name: "channel", type: 7, value: "1223906943987617833" }
    const payload = this.interaction.data.options?.find((v) =>
      v.type === ApplicationCommandOptionType.Channel
      && v.name === name
    ) as APIInteractionDataOptionBase<ApplicationCommandOptionType.Channel, string>

    const resolved = this.interaction.data.resolved // as APIInteractionDataResolvedChannel
    return (resolved?.channels?.[payload?.value] ?? null) as any
  }

  getRole<Key extends GetOptionNameByType<Option, ApplicationCommandOptionType.Role>>(
    name: Key,
  ): GetOptionsResult<Option, Key, APIRole> {
    if (this.interaction.data.type !== ApplicationCommandType.ChatInput) return null as any

    const payload = this.interaction.data.options?.find((v) =>
      v.type === ApplicationCommandOptionType.Role
      && v.name === name
    ) as APIInteractionDataOptionBase<ApplicationCommandOptionType.Role, string>

    const resolved = this.interaction.data.resolved
    return (resolved?.roles?.[payload?.value] ?? null) as any
  }

  getMentionable<Key extends GetOptionNameByType<Option, ApplicationCommandOptionType.Mentionable>>(
    name: Key,
  ): GetOptionsResult<Option, Key, APIUser | APIRole> {
    if (this.interaction.data.type !== ApplicationCommandType.ChatInput) return null as any

    // { name: "mentionable", type: 9, value: "1213048588805083157" }
    const payload = this.interaction.data.options?.find((v) =>
      v.type === ApplicationCommandOptionType.Mentionable
      && v.name === name
    ) as APIInteractionDataOptionBase<ApplicationCommandOptionType.Mentionable, string>

    const resolved = this.interaction.data.resolved
    return (
      resolved?.roles?.[payload?.value]
        ?? resolved?.users?.[payload?.value]
        ?? null
    ) as any
  }

  getMentionableUser<Key extends GetOptionNameByType<Option, ApplicationCommandOptionType.Mentionable>>(
    name: Key,
  ): GetOptionsResult<Option, Key, APIUser | null> {
    if (this.interaction.data.type !== ApplicationCommandType.ChatInput) return null as any

    // { name: "mentionable", type: 9, value: "1213048588805083157" }
    const payload = this.interaction.data.options?.find((v) =>
      v.type === ApplicationCommandOptionType.Mentionable
      && v.name === name
    ) as APIInteractionDataOptionBase<ApplicationCommandOptionType.Mentionable, string>

    const resolved = this.interaction.data.resolved
    return (resolved?.users?.[payload?.value] ?? null) as any
  }

  getMentionableMember<Key extends GetOptionNameByType<Option, ApplicationCommandOptionType.Mentionable>>(
    name: Key,
  ): GetOptionsResult<Option, Key, APIInteractionDataResolvedGuildMember | null> {
    if (this.interaction.data.type !== ApplicationCommandType.ChatInput) return null as any

    // { name: "mentionable", type: 9, value: "1213048588805083157" }
    const payload = this.interaction.data.options?.find((v) =>
      v.type === ApplicationCommandOptionType.Mentionable
      && v.name === name
    ) as APIInteractionDataOptionBase<ApplicationCommandOptionType.Mentionable, string>

    const resolved = this.interaction.data.resolved
    return (resolved?.members?.[payload?.value] ?? null) as any
  }

  getMentionableRole<Key extends GetOptionNameByType<Option, ApplicationCommandOptionType.Mentionable>>(
    name: Key,
  ): GetOptionsResult<Option, Key, APIRole | null> {
    if (this.interaction.data.type !== ApplicationCommandType.ChatInput) return null as any

    // { name: "mentionable", type: 9, value: "1213048588805083157" }
    const payload = this.interaction.data.options?.find((v) =>
      v.type === ApplicationCommandOptionType.Mentionable
      && v.name === name
    ) as APIInteractionDataOptionBase<ApplicationCommandOptionType.Mentionable, string>

    const resolved = this.interaction.data.resolved
    return (resolved?.roles?.[payload?.value] ?? null) as any
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

    const payload = this.interaction.data.options?.find((v) =>
      v.type === ApplicationCommandOptionType.Number
      && v.name === name
    ) as APIInteractionDataOptionBase<ApplicationCommandOptionType.Number, number>

    return (payload?.value ?? null) as any
  }

  getAttachment<Key extends GetOptionNameByType<Option, ApplicationCommandOptionType.Attachment>>(
    name: Key,
  ): GetOptionsResult<Option, Key, APIAttachment> {
    if (this.interaction.data.type !== ApplicationCommandType.ChatInput) return null as any

    // { name: "attachment", type: 11, value: "1213048588805083157" }
    const payload = this.interaction.data.options?.find((v) =>
      v.type === ApplicationCommandOptionType.Attachment
      && v.name === name
    ) as APIInteractionDataOptionBase<ApplicationCommandOptionType.Attachment, string>

    const resolved = this.interaction.data.resolved
    return (resolved?.attachments?.[payload?.value] ?? null) as any
  }

  // Response
  reply(content: string): APIInteractionResponseChannelMessageWithSource
  reply(data: APIInteractionResponseCallbackData): APIInteractionResponseChannelMessageWithSource
  reply(data: string | APIInteractionResponseCallbackData): APIInteractionResponse {
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: typeof data === 'string' ? {content: data} : data,
    }
  }

  replyEphemeral(content: string): APIInteractionResponseChannelMessageWithSource
  replyEphemeral(data: APIInteractionResponseCallbackData): APIInteractionResponseChannelMessageWithSource
  replyEphemeral(data: string | APIInteractionResponseCallbackData): APIInteractionResponse {
    const res = typeof data === 'string' ? {content: data} : data
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
     * @returns Get the `user` who caused the interaction
     */
    readonly user: APIUser

    /**
     * @returns Get the `member` who caused the interaction
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
   * @returns Get the `user` who caused the interaction
   */
  get me(): APIUser {
    return this.interaction.member?.user ?? this.interaction.user!
  }

  // Response
  // TODO: impl method for reply
}

export class MessageComponentContext {
  constructor(interaction: APIMessageComponentInteraction) {
    if (interaction.type !== InteractionType.MessageComponent) {
      throw new Error('interaction type not supported for this context')
    }
  }
}

export class ModalSubmitContext {
  interaction!: APIModalSubmitInteraction

  /**
   * Contains the initiator user
   */
  readonly from!: {
    /**
     * @returns Get the `user` who caused the interaction
     */
    readonly user: APIUser

    /**
     * @returns Get the `member` who caused the interaction
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
   * @returns Get the `user` who caused the interaction
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
  readonly interaction!: APIApplicationCommandInteraction;
  [deferredResponse]!: APIInteractionResponse

  constructor(interaction: APIApplicationCommandInteraction, response: APIInteractionResponse) {
    Object.defineProperty(this, 'interaction', {value: interaction})
    this[deferredResponse] = response
  }

  /**
   * Edits the original interaction response.
   * @param body - The data for the edited interaction response.
   * @returns A promise that resolves to a DeferredReplyContext object.
   */
  async reply(
    body: RESTPatchAPIInteractionOriginalResponseJSONBody,
    options?: {
      signal?: AbortSignal
    },
  ) {
    const {data, error} = await discordRest.updateOriginalWebhookMessage({
      path: {
        webhook_id: this.interaction.application_id,
        webhook_token: this.interaction.token,
      },
      body: body as any,
      signal: options?.signal,
    })

    return {
      res: data!,
      delete: async () => {
        const {data, error, response} = await discordRest.deleteOriginalWebhookMessage({
          path: {
            webhook_id: this.interaction.application_id,
            webhook_token: this.interaction.token,
          },
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
    options?: {
      signal?: AbortSignal
    },
  ) {
    const {data, error} = await discordRest.executeWebhook({
      path: {
        webhook_id: this.interaction.application_id,
        webhook_token: this.interaction.token,
      },
      body: body as any,
      signal: options?.signal,
    })

    if (!data || error) return null

    return {
      res: data!,
      edit: async (
        body: RESTPatchAPIInteractionFollowupJSONBody,
        options?: {
          signal?: AbortSignal
        },
      ) => {
        const {data: edited, error} = await discordRest.updateWebhookMessage({
          path: {
            webhook_id: this.interaction.application_id,
            webhook_token: this.interaction.token,
            message_id: data?.id,
          },
          body: body as any,
          signal: options?.signal,
        })

        return edited!
      },
      delete: async (
        options?: {
          signal?: AbortSignal
        },
      ) => {
        const {error, response} = await discordRest.deleteWebhookMessage({
          path: {
            webhook_id: this.interaction.application_id,
            webhook_token: this.interaction.token,
            message_id: data.id,
          },
          signal: options?.signal,
        })

        return response?.ok ?? false
      },
    }
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
     * @returns Get the `user` who caused the interaction
     */
    readonly user: APIUser

    /**
     * @returns Get the `member` who caused the interaction
     */
    readonly member?: APIInteractionGuildMember
  }

  /**
   * Contains the target user
   */
  readonly to!: {
    /**
     * Gets the user object for a user context menu command interaction.
     * @returns The resolved user object.
     */
    readonly user: APIUser

    /**
     * Gets the guild member object for a user context menu command interaction.
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
   * @returns Get the `user` who caused the interaction
   */
  get me(): APIUser {
    return this.interaction.member?.user || this.interaction.user!
  }

  // Response
  reply(content: string): APIInteractionResponseChannelMessageWithSource
  reply(data: APIInteractionResponseCallbackData): APIInteractionResponseChannelMessageWithSource
  reply(data: string | APIInteractionResponseCallbackData): APIInteractionResponse {
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: typeof data === 'string' ? {content: data} : data,
    }
  }

  replyEphemeral(content: string): APIInteractionResponseChannelMessageWithSource
  replyEphemeral(data: APIInteractionResponseCallbackData): APIInteractionResponseChannelMessageWithSource
  replyEphemeral(data: string | APIInteractionResponseCallbackData): APIInteractionResponse {
    const res = typeof data === 'string' ? {content: data} : data
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
