#!/usr/bin/env -S bun

import type {DiscordInteraction} from '../src/-mod.ts'
import {DiscordApi, discordApi} from '#lib/discord.ts'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'
import {authorize} from './_utils.ts'

/**
 * TODO PUSH to discord
 *
 * Find all commands
 *  import commands defs
 */

// const token = await authorize()

const entryPoint = process.argv[2]!
if (!entryPoint) throw new Error('Missing entryPoint argument')

const target = resolve(entryPoint)
console.log(`load ${pathToFileURL(target).href}`)

const mod = await import(pathToFileURL(target).href) as Record<string, DiscordInteraction>

const application_id = ''

const {data} = await discordApi.GET(DiscordApi.list_application_commands, {params: {path: {application_id}}})
if (data) {
  for (const datum of data) {
  }
}

// discordApi.POST(DiscordApi.bulk_set_application_commands, {})
