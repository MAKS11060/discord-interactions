import {ApplicationIntegrationType, EntryPointCommandHandlerType, InteractionContextType} from 'discord-api-types/v10'
import {schema} from '../builder.ts'

schema.primaryEntryPoint((t) => ({
  name: 'activity',
  name_localizations: {'en-US': 'activity'},
  description: 'Launch the activity',
  description_localizations: {'en-US': 'Launch the activity'},
  default_member_permissions: null,
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
  handler: EntryPointCommandHandlerType.AppHandler,
}))
