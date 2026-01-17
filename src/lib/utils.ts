import 'jsr:@std/dotenv/load'

export const getRequiredEnv = (key: string) => {
  if (!Deno.env.has(key)) throw new Error(`Env '${key}' is required`)
  return Deno.env.get(key)!
}
