import {
  type APIInteraction,
  type APIInteractionResponse,
  InteractionResponseType,
  InteractionType,
  type RESTPostAPIApplicationCommandsJSONBody,
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

export const defineCommand = (data: {
  command: RESTPostAPIApplicationCommandsJSONBody
}): {
  toJSON(): RESTPostAPIApplicationCommandsJSONBody
} => {
  //
  return {
    toJSON(): RESTPostAPIApplicationCommandsJSONBody {
      return data.command
    },
  }
}

export interface DiscordInteractionDefaultExport {
  default: {
    toJSON(): RESTPostAPIApplicationCommandsJSONBody
  }
}
