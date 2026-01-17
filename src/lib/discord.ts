import createClient from 'openapi-fetch'
import {ApiPaths, type paths} from './discord.oas.ts'

export {ApiPaths as DiscordApi}

export const discordApi = createClient<paths>({baseUrl: 'https://discord.com/api/v10'})

// --- helpers ---
export const patterns = {
  chatInputName: /^[-_\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32}$/u,
}
