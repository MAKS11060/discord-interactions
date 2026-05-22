import createClient from 'openapi-fetch'
import {ApiPaths, type paths} from './discord.oas.ts'

export { ApiPaths as DiscordApi }

export const discordApi = createClient<paths>({
  baseUrl: 'https://discord.com/api/v10',
  headers: {'Content-Type': 'application/json'},
})
