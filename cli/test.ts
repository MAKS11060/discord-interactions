import {DiscordApi, discordApi} from '#/lib/discord.ts'
import {parseResponse} from '#/lib/openapi-fetch.ts'
import {getRequiredEnv} from '#/lib/utils.ts'
import {oauth2ClientCredentials} from '@maks11060/oauth2/client-credentials'
import {createDiscordOauth2} from '@maks11060/oauth2/providers'
import type {RESTPostOAuth2ClientCredentialsResult} from 'discord-api-types/v10'

const clientId = getRequiredEnv('CLIENT_ID')
const clientSecret = getRequiredEnv('CLIENT_SECRET')

const getToken = async () => {
  const token = await oauth2ClientCredentials<RESTPostOAuth2ClientCredentialsResult>(
    createDiscordOauth2({
      clientId,
      clientSecret,
      redirectUri: '',
      scope: 'identify applications.commands.update',
    }),
  )

  return token
}

const getBearerToken = (token: RESTPostOAuth2ClientCredentialsResult) => {
  return `${token.token_type} ${token.access_token}`
}

Deno.test('Test Authorization', async (t) => {
  const token = await getToken()
  console.log(token)

  const {data} = await parseResponse(discordApi.GET(DiscordApi.get_my_oauth2_authorization, {
    headers: {
      Authorization: getBearerToken(token),
    },
  }))
  console.log(data)
})
