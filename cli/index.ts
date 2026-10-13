#!/usr/bin/env -S deno run -A --env-file

import {createInterface} from 'node:readline/promises'
import {parseArgs} from 'node:util'
import {type DiscordApplicationConfig, initDiscordConfig, readDiscordConfig} from './config.ts'
import {listApplicationCommands, showApplicationInfo} from './discord.ts'
import {loadCommandsFromSchema, pushApplicationCommands} from './push.ts'

const help = `Usage: pnpm cli -- <command> [options]

Commands:
  init                         Create .discord.json if it does not exist
  push                         Register or update application commands
  me, i, whoim, whoami, login  Show application info and verify CLIENT_PUBLIC_KEY
  list, ls                     List registered application commands

Options:
  -s, --schema <path>          Schema module path (init or push)
      --all                    Replace all registered commands for each app
      --name <name>            Create or update one command (repeatable)
      --guild <id>             List commands registered for a guild
  -h, --help                   Show this help
`

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

  if (values.help) {
    console.log(help)
    return
  }
  if (positionals.length !== 1) throw new Error(help)

  const command = positionals[0]?.toLowerCase()
  if (command === 'init') {
    if (values.all || values.name || values.guild) throw new Error('init only supports --schema')
    await initDiscordConfig({schemaPath: values.schema})
    return
  }

  if (command === 'push') {
    if (values.guild) throw new Error('--guild can only be used with list/ls')
    if (values.all && values.name?.length) throw new Error('Use either --all or --name, not both')
    await runPush({
      schemaPath: values.schema,
      all: values.all,
      names: values.name,
    })
    return
  }

  if (command === 'me' || command === 'i' || command === 'whoim' || command === 'whoami' || command === 'login') {
    if (values.guild || values.schema || values.all || values.name) {
      throw new Error('me does not accept --guild, --schema, --all, or --name')
    }
    await showApplicationInfo()
    return
  }

  if (command === 'list' || command === 'ls') {
    if (values.schema || values.all || values.name) {
      throw new Error('list only supports --guild')
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

  const input = createInterface({input: process.stdin, output: process.stdout})
  try {
    const selectedApplication = applications.length === 1
      ? applications[0]!
      : applications[
        await promptIndex(
          input,
          'Select an application number: ',
          applications.length,
        )
      ]
    if (!selectedApplication) throw new Error('No application selected')
    const schemaPath = options.schemaPath ?? selectedApplication.schema
    const commands = await loadCommandsFromSchema(schemaPath)
    if (commands.length === 0) throw new Error(`No commands found in schema "${schemaPath}"`)

    console.log('Commands:')
    console.log('  1. All commands')
    commands.forEach((command, index) => console.log(`  ${index + 2}. ${command.name}`))
    const selection = (await input.question('Select 1 for all or command numbers separated by commas: ')).trim()
    if (selection === '1') {
      await pushApplicationCommands(selectedApplication, process.env, {
        ...options,
        schemaPath,
        all: true,
      })
      return
    }

    const indexes = selection.split(',').map((part) => Number(part.trim()) - 2)
    if (
      indexes.length === 0
      || indexes.some((index) => !Number.isInteger(index) || index < 0 || index >= commands.length)
    ) {
      throw new Error('Invalid command selection')
    }
    const names = [...new Set(indexes.map((index) => commands[index]!.name))]
    await pushApplicationCommands(selectedApplication, process.env, {
      ...options,
      schemaPath,
      names,
    })
  } finally {
    input.close()
  }
}

async function promptIndex(
  input: ReturnType<typeof createInterface>,
  prompt: string,
  length: number,
): Promise<number> {
  const value = Number((await input.question(prompt)).trim())
  if (!Number.isInteger(value) || value < 1 || value > length) {
    throw new Error(`Select a number between 1 and ${length}`)
  }
  return value - 1
}

try {
  await runCli()
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(message)
  process.exitCode = 1
}
