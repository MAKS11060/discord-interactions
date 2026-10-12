import {ApplicationIntegrationType, InteractionContextType} from 'discord-api-types/v10'
import {schema} from '../builder.ts'

schema.message((t) => ({
  name: 'message-context',
  name_localizations: {'en-US': 'message-context'},
  default_member_permissions: '8',
  dm_permission: false,
  default_permission: false,
  nsfw: true,
  integration_types: [ApplicationIntegrationType.GuildInstall],
  contexts: [InteractionContextType.Guild],
  resolve: (context) => context.reply('Selected a message'),
}))
