#!/usr/bin/env -S deno run -A --env-file

import {checkbox, select} from '@inquirer/prompts'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'
import {parseArgs} from 'node:util'
import {type DiscordApplicationConfig, initDiscordConfig, readDiscordConfig} from './config.ts'
import {listApplicationCommands, showApplicationInfo} from './discord.ts'
import {loadCommandsFromSchema, pushApplicationCommands} from './push.ts'

const help = `Usage: pnpm discord <command> [options]

Commands:
  init       Create .discord.json if it does not exist
  push       Create or update application commands
  list, ls   List registered application commands
  me         Show application info (aliases: i, whoim, whoami, login)

Run "pnpm discord <command> --help" for command-specific options.
`

const commandHelp: Record<string, string> = {
  init: `Usage: pnpm discord init [-s <path>]

Create .discord.json in the current directory. Existing files are left unchanged.

Options:
  -s, --schema <path>  Add an application entry with this schema module path
  -h, --help           Show this help
`,
  push: `Usage: pnpm discord push [options]

Interactively select an application, then synchronize all or selected commands.

Options:
  -s, --schema <path>  Override the schema module path
      --all            Replace all registered commands for configured applications
      --name <name>    Upsert a command by name (repeatable; non-interactive)
  -h, --help           Show this help
`,
  list: `Usage: pnpm discord list [--guild <id>]

List registered global application commands, or commands for one guild.

Options:
      --guild <id>  List commands registered for a guild
  -h, --help        Show this help
`,
  ls: `Usage: pnpm discord ls [--guild <id>]

Alias for "pnpm discord list".
`,
  me: `Usage: pnpm discord me

Show application information and verify CLIENT_PUBLIC_KEY.
Aliases: i, whoim, whoami, login

Options:
  -h, --help  Show this help
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
    if (values.all || values.name || values.guild) throw new Error(`${commandHelp.init}`)
    await initDiscordConfig({schemaPath: values.schema})
    return
  }

  if (command === 'push') {
    if (values.guild) throw new Error(`--guild is only available for list\n\n${commandHelp.push}`)
    if (values.all && values.name?.length) {
      throw new Error(`Use either --all or --name, not both\n\n${commandHelp.push}`)
    }
    await runPush({
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
    await showApplicationInfo()
    return
  }

  if (command === 'list' || command === 'ls') {
    if (values.schema || values.all || values.name) {
      throw new Error(`list only supports --guild\n\n${commandHelp[command]}`)
    }
    await listApplicationCommands(process.env, values.guild)
    return
  }

  throw new Error(`Unknown command "${command ?? ''}"\n\n${help}`)
}

async function runPush(options: {
  schemaPath?: string
  all?: boolean
  names?: string[]
}): Promise<void> {
  const config = await readDiscordConfig()
  if (!config) {
    console.log(help)
    return
  }

  let applications: DiscordApplicationConfig[] = [...config.applications]
  if (applications.length === 0 && options.schemaPath) {
    applications = [{
      schema: options.schemaPath,
      ...(process.env.CLIENT_ID ? {clientId: process.env.CLIENT_ID} : {}),
      ...(process.env.CLIENT_SECRET ? {clientSecret: process.env.CLIENT_SECRET} : {}),
      ...(process.env.CLIENT_PUBLIC_KEY ? {publicKey: process.env.CLIENT_PUBLIC_KEY} : {}),
    }]
  }

  if (applications.length === 0) {
    console.log('No applications configured in .discord.json')
    return
  }

  console.log('Applications:')
  applications.forEach((application, index) => {
    console.log(
      `  ${index + 1}. ${application.clientId ?? '(no clientId)'} — ${options.schemaPath ?? application.schema}`,
    )
  })

  if (options.all || options.names?.length) {
    for (const application of applications) {
      await pushApplicationCommands(application, process.env, options)
    }
    return
  }

  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error('Interactive push requires a TTY; use --all or --name <name>')
  }

  const selectedApplication = applications.length === 1
    ? applications[0]!
    : await select({
      message: 'Select an application',
      pageSize: 10,
      choices: applications.map((application, index) => ({
        name: `${application.clientId ?? '(no clientId)'} — ${options.schemaPath ?? application.schema}`,
        value: index,
      })),
    }).then((index) => applications[index])
  if (!selectedApplication) throw new Error('No application selected')

  const schemaPath = options.schemaPath ?? selectedApplication.schema
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
    await pushApplicationCommands(selectedApplication, process.env, {
      ...options,
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
  await pushApplicationCommands(selectedApplication, process.env, {
    ...options,
    schemaPath,
    names,
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    await runCli()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(message)
    process.exitCode = 1
  }
}
