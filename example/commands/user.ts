import {ApplicationIntegrationType, InteractionContextType} from 'discord-api-types/v10'
import {schema} from '../builder.ts'

schema.user({
  name: 'user-context',
  name_localizations: {'en-US': 'user-context'},
  default_member_permissions: null,
  dm_permission: true,
  default_permission: true,
  nsfw: false,
  integration_types: [
    ApplicationIntegrationType.GuildInstall,
    ApplicationIntegrationType.UserInstall,
  ],
  contexts: [
    InteractionContextType.Guild,
    InteractionContextType.BotDM,
    InteractionContextType.PrivateChannel,
  ],
  resolve: (context) => context.reply(`Selected ${context.to.user.username}`),
})
