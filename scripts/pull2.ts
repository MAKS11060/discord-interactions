#!/usr/bin/env -S bun --hot

import {readFileSync} from 'node:fs'
import * as ts from 'typescript'

const json = JSON.parse(readFileSync('.discord/1097172825292406814.json', 'utf8'))
console.log(json)

const sourceFile = ts.createSourceFile(
  'discord.ts',
  '',
  {languageVersion: ts.ScriptTarget.Latest},
)

// ts.factory.createto
ts.factory


ts.factory.createInterfaceDeclaration(
  undefined,
  'DiscordRegistry',
  [],
  [],
  [
    // ts.factory.()
  ]
)

ts.factory.createIdentifier('test1')

