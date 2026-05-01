/*
https://docs.discord.com/developers/reference#message-formatting
*/

import type {Snowflake} from 'discord-api-types/v10'

export enum TimestampStyle {
  /**
   * Short Time
   * @example 16:20
   */
  t = 't',
  /**
   * Medium Time
   * @example 16:20:30
   */
  T = 'T',
  /**
   * Short Date
   * @example 20/04/2021
   */
  d = 'd',
  /**
   * Long Date
   * @example April 20, 2021
   */
  D = 'D',
  /**
   * Long Date, Short Time
   * @example April 20, 2021 at 16:20
   */
  f = 'f',
  /**
   * Full Date, Short Time
   * @example Tuesday, April 20, 2021 at 16:20
   */
  F = 'F',
  /**
   * Short Date, Short Time
   * @example 20/04/2021, 16:20
   */
  s = 's',
  /**
   * Short Date, Medium Time
   * @example 20/04/2021, 16:20:30
   */
  S = 'S',
  /**
   * Relative Time
   * @example 4 years ago
   */
  R = 'R',
}

export class Fmt extends String {
  static user(userId: Snowflake) {
    return new Fmt(`<@${userId}>`)
  }

  static channel(channelId: Snowflake) {
    return new Fmt(`<#${channelId}>`)
  }
  static role(roleId: Snowflake) {
    return new Fmt(`<@&${roleId}>`)
  }

  static slashCommand(name: string, commandId: Snowflake) {
    return new Fmt(`</${name}:${commandId}>`)
  }

  static slashSubcommand(name: string, subName: string, commandId: Snowflake) {
    return new Fmt(`</${name} ${subName}:${commandId}>`)
  }
  static slashSubGroupCommand(name: string, subGroupName: string, subName: string, commandId: Snowflake) {
    return new Fmt(`</${name} ${subGroupName} ${subName}:${commandId}>`)
  }

  static timestamp(timestamp: number): Fmt
  static timestamp(date: Date): Fmt
  static timestamp(timestamp?: number | Date, style?: TimestampStyle): Fmt {
    const s = style ? `:${style}` : ''

    if (typeof timestamp === 'number') {
      return new Fmt(`<t:${timestamp}${s}>`)
    }

    if (timestamp instanceof Date) {
      return new Fmt(`<t:${Math.floor(timestamp.getTime() / 1000)}${s}>`)
    }
  }
}

Fmt.timestamp(1)
