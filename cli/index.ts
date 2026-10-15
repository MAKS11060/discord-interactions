#!/usr/bin/env node

import {checkbox, select} from '@inquirer/prompts'
import {access} from 'node:fs/promises'
import {resolve} from 'node:path'
import {parseArgs} from 'node:util'
import {type DiscordApplicationConfig, initDiscordConfig, readDiscordConfig, writeDiscordApplication} from './config.ts'
import {resolveFirstUseCredentials} from './credentials.ts'
import {getAuthorizedApplication, listApplicationCommands, showApplicationInfo} from './discord.ts'
import {loadCommandsFromSchema, pushApplicationCommands} from './push.ts'

const help = `Usage: pnpm discord <command> [options]

Commands:
  init       Initialize Discord config and secret files
  push       Create or update application commands
  list, ls   List registered application commands
  me         Show application info (aliases: i, whoim, whoami, login)

Run "pnpm discord <command> --help" for command-specific options.
Global options:
      --env-file <path> Load an environment file (first-time setup)
`

const commandHelp: Record<string, string> = {
  init: `Usage: pnpm discord init [-s <path>]

Create .discord.json and .discord.secret.json in the current directory.
Add .discord.secret.json to .gitignore. Existing files are left unchanged.

Options:
  -s, --schema <path>   Add an application entry with this schema module path
      --env-file <path> Load environment variables from this file
  -h, --help            Show this help
`,
  push: `Usage: pnpm discord push [options]

Interactively select an application, then synchronize all or selected commands.

Options:
  -s, --schema <path>   Override the schema module path
      --all             Replace all registered commands for the selected application
      --name <name>     Upsert a command by name (repeatable; non-interactive)
      --id <clientId>   Select an application without prompting
      --env-file <path> Load environment variables from this file
  -h, --help            Show this help
`,
  list: `Usage: pnpm discord list [--guild <id>] [--id <clientId>]

List registered global application commands, or commands for one guild.

Options:
      --guild <id>      List commands registered for a guild
      --id <clientId>   Select an application without prompting
      --env-file <path> Load environment variables from this file
  -h, --help            Show this help
`,
  ls: `Usage: pnpm discord ls [--guild <id>] [--id <clientId>]

Alias for "pnpm discord list".

Options:
      --guild <id>      List commands registered for a guild
      --id <clientId>   Select an application without prompting
      --env-file <path> Load environment variables from this file
  -h, --help            Show this help
`,
  me: `Usage: pnpm discord me [--id <clientId>]

Show application information and verify CLIENT_PUBLIC_KEY.
Aliases: i, whoim, whoami, login

Options:
      --id <clientId>   Select an application without prompting
      --env-file <path> Load environment variables from this file
  -h, --help            Show this help
`,
}

const meCommands = new Set(['me', 'i', 'whoim', 'whoami', 'login'])

export const runCli = async (args: string[] = process.argv.slice(2)): Promise<void> => {
  const {positionals, values} = parseArgs({
    args: args[0] === '--' ? args.slice(1) : args,
    options: {
      schema: {type: 'string', short: 's'},
      all: {type: 'boolean'},
      name: {type: 'string', multiple: true},
      guild: {type: 'string'},
      id: {type: 'string'},
      'env-file': {type: 'string'},
      help: {type: 'boolean', short: 'h'},
    },
    allowPositionals: true,
  })

  const command = positionals[0]?.toLowerCase()
  if (values.help) {
    console.log(command ? commandHelp[meCommands.has(command) ? 'me' : command] ?? help : help)
    return
  }
  if (positionals.length !== 1) throw new Error(help)

  if (command === 'init') {
    if (values.all || values.name || values.guild || values.id) throw new Error(`${commandHelp.init}`)
    await loadEnvironment(values['env-file'])
    await initDiscordConfig({schemaPath: values.schema})
    return
  }

  if (command === 'push') {
    if (values.guild) throw new Error(`--guild is only available for list\n\n${commandHelp.push}`)
    await loadEnvironment(values['env-file'])
    const application = await selectApplication(await resolveApplications(values.schema), values.id)
    if (values.all && values.name?.length) {
      throw new Error(`Use either --all or --name, not both\n\n${commandHelp.push}`)
    }
    await runPush({
      application,
      schemaPath: values.schema,
      all: values.all,
      names: values.name,
    })
    return
  }

  if (command && meCommands.has(command)) {
    if (values.guild || values.schema || values.all || values.name) {
      throw new Error(`me does not accept those options\n\n${commandHelp.me}`)
    }
    await loadEnvironment(values['env-file'])
    const application = await selectApplication(await resolveApplications(), values.id)
    await showApplicationInfo(process.env, undefined, {application})
    return
  }

  if (command === 'list' || command === 'ls') {
    if (values.schema || values.all || values.name) {
      throw new Error(`list only supports --guild\n\n${commandHelp[command]}`)
    }
    await loadEnvironment(values['env-file'])
    const application = await selectApplication(await resolveApplications(), values.id)
    await listApplicationCommands(process.env, values.guild, undefined, {application})
    return
  }

  throw new Error(`Unknown command "${command ?? ''}"\n\n${help}`)
}

async function runPush(options: {
  application: DiscordApplicationConfig
  schemaPath?: string
  all?: boolean
  names?: string[]
}): Promise<void> {
  const {application, ...pushOptions} = options
  const schemaPath = pushOptions.schemaPath ?? application.schema
  if (!schemaPath) throw new Error('No schema path configured; use --schema <path>')

  if (pushOptions.all || pushOptions.names?.length) {
    await pushApplicationCommands(application, process.env, {...pushOptions, schemaPath})
    return
  }
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error('Interactive push requires a TTY; use --all or --name <name>')
  }

  const commands = await loadCommandsFromSchema(schemaPath)
  const action = await select({
    message: 'What should be synchronized?',
    pageSize: 10,
    choices: [
      {name: 'All commands (replace registered commands)', value: 'all'},
      {name: 'Choose commands to create or update', value: 'selected'},
    ],
  })

  if (action === 'all') {
    await pushApplicationCommands(application, process.env, {
      ...pushOptions,
      schemaPath,
      all: true,
    })
    return
  }

  const names = await checkbox({
    message: 'Select commands to create or update',
    pageSize: 10,
    required: true,
    choices: commands.map((command) => ({
      name: command.name,
      value: command.name,
    })),
  })
  await pushApplicationCommands(application, process.env, {
    ...pushOptions,
    schemaPath,
    names,
  })
}

async function resolveApplications(schemaPath?: string): Promise<DiscordApplicationConfig[]> {
  const config = await readDiscordConfig()
  if (config?.applications.length) return config.applications

  const env = process.env
  let clientId = env.CLIENT_ID?.trim()
  let clientSecret = env.CLIENT_SECRET?.trim()
  let publicKey = env.CLIENT_PUBLIC_KEY?.trim()
  let save = false
  if (!clientId || !clientSecret) {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
      const missing = [
        ...(!clientId ? ['CLIENT_ID'] : []),
        ...(!clientSecret ? ['CLIENT_SECRET'] : []),
      ]
      throw new Error(`${missing.join('/')} not found in .env; interactive input requires a TTY`)
    }
    const credentials = await resolveFirstUseCredentials(env)
    clientId = credentials.clientId
    clientSecret = credentials.clientSecret
    save = credentials.save
  }

  if (!clientId || !clientSecret) throw new Error('CLIENT_ID and CLIENT_SECRET are required')
  const application: DiscordApplicationConfig & {clientId: string} = {
    ...(schemaPath ? {schema: schemaPath} : {}),
    clientId,
    ...(publicKey ? {publicKey} : {}),
  }
  if (save) {
    const discordApplication = publicKey
      ? undefined
      : await getAuthorizedApplication(clientId, clientSecret)
    const savedApplication: DiscordApplicationConfig & {clientId: string} = {
      ...application,
      ...(discordApplication
        ? {
          name: discordApplication.name,
          publicKey: discordApplication.verify_key,
        }
        : {}),
    }
    await writeDiscordApplication(savedApplication, clientSecret)
    return [savedApplication]
  }

  env.CLIENT_ID = clientId
  env.CLIENT_SECRET = clientSecret
  return [application]
}

async function selectApplication(
  applications: DiscordApplicationConfig[],
  clientId?: string,
): Promise<DiscordApplicationConfig> {
  if (clientId) {
    const application = applications.find((item) => item.clientId === clientId)
    if (!application) throw new Error(`No application configured with clientId "${clientId}"`)
    return application
  }
  if (applications.length === 1) return applications[0]!
  if (!applications.length) throw new Error('No applications configured')
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error('Selecting an application requires a TTY; use --id <clientId>')
  }

  const index = await select({
    message: 'Select an application',
    pageSize: 10,
    choices: applications.map((application, index) => ({
      name: application.clientId
        ? `${application.clientId}${application.name ? ` (${application.name})` : ''}`
        : `${application.name ?? '(no clientId)'}`,
      value: index,
    })),
  })
  const selected = applications[index]
  if (!selected) throw new Error('No application selected')
  return selected
}

async function loadEnvironment(envFile?: string): Promise<void> {
  const configPath = resolve('.discord.json')
  const secretPath = resolve('.discord.secret.json')
  const [hasConfig, hasSecrets] = await Promise.all([
    pathExists(configPath),
    pathExists(secretPath),
  ])

  if (envFile) {
    process.loadEnvFile(resolve(envFile))
  } else if (!hasConfig && !hasSecrets && await pathExists(resolve('.env'))) {
    process.loadEnvFile(resolve('.env'))
  }
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return false
    throw error
  }
}

if (import.meta.main) {
  try {
    await runCli()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(message)
    process.exitCode = 1
  }
}
