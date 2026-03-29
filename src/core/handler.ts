import {InteractionResponseType, InteractionType} from 'discord-api-types/v10'
import {InteractionError} from './errors.ts'
import type {InteractionHandler} from './types.ts'

export const handler = {
  async execute(interaction) {
    if (interaction.type === InteractionType.Ping) {
      return {type: InteractionResponseType.Pong}
    }

    // IMPL


    throw new InteractionError('No handlers')
  },
} satisfies InteractionHandler
