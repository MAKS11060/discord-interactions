export interface DiscordSnowflakeData {
  timestamp: Date
  processId: number
  workerId: number
  increment: number
}

export class DiscordSnowflake {
  static EPOCH = 1420070400000n

  static parse(id: string | bigint): DiscordSnowflakeData {
    const snowflake = BigInt(id)

    return {
      timestamp: new Date(Number((snowflake >> 22n) + this.EPOCH)),
      workerId: Number((snowflake >> 17n) & 0x1fn),
      processId: Number((snowflake >> 12n) & 0x1fn),
      increment: Number(snowflake & 0xfffn),
    }
  }

  static now(data: Partial<DiscordSnowflakeData>) {
    const ts = BigInt(data.timestamp?.getTime() ?? Date.now())
    const workerId = BigInt(data.workerId ?? 0)
    const processId = BigInt(data.processId ?? 0)
    const increment = BigInt(data.increment ?? 0)

    if (workerId > 31n || processId > 31n) {
      throw new Error('ID workerId OR processId cannot be more than 31')
    }
    if (increment > 4095n) {
      throw new Error('The increment cannot exceed 4095')
    }

    const id = (ts - this.EPOCH) << 22n
      | (workerId << 17n)
      | (processId << 12n)
      | increment

    return id.toString()
  }
}
