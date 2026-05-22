import {discordApi} from '#lib/discord.ts'
import {HTTPError, parseResponse} from '#lib/openapi-fetch.ts'
import {DiscordSnowflake} from '#lib/snowflake.ts'
import {
  type APIInteraction,
  type APIInteractionResponse,
  type APIInteractionResponseCallbackData,
  type APIInteractionResponseChannelMessageWithSource,
  ComponentType,
  InteractionResponseType,
  InteractionType,
  MessageFlags,
  type RESTPatchAPIInteractionFollowupJSONBody,
  type RESTPatchAPIInteractionOriginalResponseJSONBody,
  type RESTPostAPIInteractionFollowupJSONBody,
} from 'discord-api-types/v10'
import {test} from 'node:test'
import type {MaybePromise} from './types.ts'

export class InteractionContext {
  readonly signal!: AbortSignal
  readonly interaction: APIInteraction

  constructor(options: {
    readonly interaction: APIInteraction
  }) {
    this.interaction = options.interaction
  }

  // getters
  get user() {
    return this.interaction.member?.user ?? this.interaction.user
  }

  get member() {
    return this.interaction.member
  }

  get message() {
    return this.interaction.message
  }

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

  //
  replyDeferred(cb: (c: DeferredContext) => MaybePromise<void>): APIInteractionResponse {
    cb(new DeferredContext(this.interaction))

    return {type: InteractionResponseType.DeferredChannelMessageWithSource}
  }

  replyDeferredEphemeral(cb: (c: DeferredContext) => MaybePromise<void>): APIInteractionResponse {
    cb(new DeferredContext(this.interaction))

    return {
      type: InteractionResponseType.DeferredChannelMessageWithSource,
      data: {flags: MessageFlags.Ephemeral},
    }
  }
}

//
export class DeferredContext {
  constructor(readonly interaction: APIInteraction) {}

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
    // console.log(DiscordSnowflake.parseDate(this.interaction.id))

    const res = await parseResponse(
      discordApi.PATCH('/webhooks/{webhook_id}/{webhook_token}/messages/@original', {
        params: {
          path: {
            webhook_id: this.interaction.application_id,
            webhook_token: this.interaction.token,
          },
        },
        body: body as any,
        signal: options?.signal,
      }),
    )

    return {
      res,
      delete: async () => {
        const res = await parseResponse(
          discordApi.DELETE('/webhooks/{webhook_id}/{webhook_token}/messages/@original', {
            params: {
              path: {
                webhook_id: this.interaction.application_id,
                webhook_token: this.interaction.token,
              },
            },
          }),
        )
        return res.response.ok
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
    const res = await parseResponse(discordApi.POST('/webhooks/{webhook_id}/{webhook_token}', {
      params: {
        path: {
          webhook_id: this.interaction.application_id,
          webhook_token: this.interaction.token,
        },
      },
      body: body as any,
      signal: options?.signal,
    }))

    return {
      res,
      edit: async (
        body: RESTPatchAPIInteractionFollowupJSONBody,
        options?: {
          signal?: AbortSignal
        },
      ) => {
        const editRes = await parseResponse(
          discordApi.PATCH('/webhooks/{webhook_id}/{webhook_token}/messages/{message_id}', {
            params: {
              path: {
                webhook_id: this.interaction.application_id,
                webhook_token: this.interaction.token,
                message_id: res.data.id,
              },
            },
            body: body as any,
            signal: options?.signal,
          }),
        )

        return editRes.data
      },
      delete: async (
        options?: {
          signal?: AbortSignal
        },
      ) => {
        const editRes = await parseResponse(
          discordApi.DELETE('/webhooks/{webhook_id}/{webhook_token}/messages/{message_id}', {
            params: {
              path: {
                webhook_id: this.interaction.application_id,
                webhook_token: this.interaction.token,
                message_id: res.data.id,
              },
            },
            signal: options?.signal,
          }),
        )

        return editRes.response.ok
      },
    }
  }
}

/*
test('Test 982078', async (t) => {
  try {
    const res = await parseResponse(discordApi.POST('/webhooks/{webhook_id}/{webhook_token}', {
      params: {
        path: {
          webhook_id: '1097172825292406814',
          webhook_token:
            'aW50ZXJhY3Rpb246MTUwNzAzMTU3MzgxNDU3OTMwMDpQV2VEcGxzT2dkYTBjQlFlMGo1NVAzWWtmdXVRSUZWU05lQXc1elFyUklZS3F3VjVEbjE1bVlnMnZlakpvSXdXMU91RGFvYXl6SDV1aEJqZHh0WFR2N2lwRk8xMVJScDFmMWU0THNsUk1SNGVTRWkzbGpCdW5MMFNrQ1g4UkY5Uw',
        },
      },
      body: {
        // content: '123'
        components: [
          {
            type: ComponentType.ActionRow,
            components: [
              {type: ComponentType.Button, style: 1, label: 'BTN!!!', custom_id: 'btn-1'},
            ],
          },
        ],
      },
    }))

    console.log(res.data)
  } catch (e) {
    if (e instanceof HTTPError) {
      console.dir(e.cause, {depth: null})
    }
  }
})
 */
