import {
  type APIInteraction,
  type APIInteractionResponse,
  InteractionResponseType,
  InteractionType,
} from 'discord-api-types/v10'

export const interaction = (interaction: APIInteraction): APIInteractionResponse => {
  console.dir(interaction, {depth: null})
  if (interaction.type === InteractionType.Ping) {
    return {type: InteractionResponseType.Pong}
  }

  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content: 'Hello!',
    },
  }
}
