import test from 'node:test'
import {DiscordSnowflake} from './snowflake.ts'

test('DiscordSnowflake.parse', () => {
  console.log(DiscordSnowflake.parse(175928847299117063n))
  console.log(DiscordSnowflake.parse(520614125093650432n))
  console.log(DiscordSnowflake.parse(1485027111893729410n))
})

test('DiscordSnowflake.now', () => {
  console.log(
    DiscordSnowflake.now({
      timestamp: new Date('2026-03-21T21:27:33.945Z'),
      increment: 130,
    }),
  )
})
