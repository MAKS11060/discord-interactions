import {ApplicationCommandOptionType, ApplicationCommandType, Locale} from 'discord-api-types/v10'
import {z} from 'zod'
import {CHAT_INPUT_NAME_RE} from './constance.ts'

const localeRecord = (val: z.ZodString) => z.record(z.enum(Locale), val)

const commandOptions = z.object({
  type: z.enum(ApplicationCommandOptionType),
  name: z.string(),
  name_localizations: localeRecord(z.string()),

  description: z.string(),
  description_localizations: localeRecord(z.string()),
})

const slashCommandName = z.string().min(1).max(32).regex(CHAT_INPUT_NAME_RE)

const slashCommand = z.object({
  type: z.literal(ApplicationCommandType.ChatInput).optional(),
  name: slashCommandName,
  name_localizations: localeRecord(slashCommandName),

  description: z.string(),
  description_localizations: localeRecord(z.string()),

  options: commandOptions.array().max(25).optional(),
})
