#!/usr/bin/env -S deno run -A --env-file

import {parseArgs} from 'node:util'
import {listApplicationCommands, showApplicationInfo} from './discord.ts'

const help = `Usage: pnpm cli -- <command> [options]

Commands:
  me, i, whoim, whoami, login  Show application info and verify CLIENT_PUBLIC_KEY
  list, ls                     List registered application commands

Options:
  --guild <id>                 List commands registered for a guild
  -h, --help                   Show this help
`

export const runCli = async (args: string[] = process.argv.slice(2)): Promise<void> => {
  const {positionals, values} = parseArgs({
    args: args[0] === '--' ? args.slice(1) : args,
    options: {
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
  if (command === 'me' || command === 'i' || command === 'whoim' || command === 'whoami' || command === 'login') {
    if (values.guild) throw new Error('--guild can only be used with list/ls')
    await showApplicationInfo()
    return
  }

  if (command === 'list' || command === 'ls') {
    await listApplicationCommands(process.env, values.guild)
    return
  }

  throw new Error(`Unknown command "${command ?? ''}"\n\n${help}`)
}

try {
  await runCli()
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(message)
  process.exitCode = 1
}
