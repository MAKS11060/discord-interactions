import assert from 'node:assert/strict'
import {test} from 'node:test'
import {runCli} from './index.ts'

async function captureHelp(args: string[]): Promise<string> {
  const output: string[] = []
  const originalLog = console.log
  console.log = (...values: unknown[]) => output.push(values.join(' '))
  try {
    await runCli(args)
  } finally {
    console.log = originalLog
  }
  return output.join('\n')
}

test('global help uses the installed CLI name and command-specific help hint', async () => {
  const output = await captureHelp(['--help'])
  assert.match(output, /Usage: pnpm discord <command>/)
  assert.match(output, /pnpm discord <command> --help/)
})

test('push help only lists options supported by push', async () => {
  const output = await captureHelp(['push', '--help'])
  assert.match(output, /Usage: pnpm discord push/)
  assert.match(output, /--all/)
  assert.match(output, /--name <name>/)
  assert.doesNotMatch(output, /--guild/)
})

test('list help only lists guild filter', async () => {
  const output = await captureHelp(['list', '--help'])
  assert.match(output, /--guild <id>/)
  assert.match(output, /--id <clientId>/)
  assert.doesNotMatch(output, /--schema|--all|--name/)
})

test('me help documents application selection and environment-file options', async () => {
  const output = await captureHelp(['me', '--help'])
  assert.match(output, /--id <clientId>/)
  assert.match(output, /--env-file <path>/)
})
