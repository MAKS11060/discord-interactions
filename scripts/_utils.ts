// import {getRequiredEnv} from '#lib/utils.ts'
import {createDiscordOauth2, oauth2ClientCredentials} from '@maks11060/oauth2'
import type {RESTPostOAuth2ClientCredentialsResult} from 'discord-api-types/v10'
import {readFile} from 'node:fs/promises'

export const clientId = process.env.CLIENT_ID!
const clientSecret = process.env.CLIENT_SECRET!

export const getToken = async () => {
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

export const getBearerToken = (token: RESTPostOAuth2ClientCredentialsResult) => {
  return `${token.token_type} ${token.access_token}`
}

export const authorize = async () => {
  try {
    const {token} = JSON.parse(await readFile(`.discord/${clientId}.json`, 'utf8'))
    return token
  } catch (e) {
    console.log('getToken()')
    return await getToken()
  }
}
