export const getRequiredEnv = (key: string) => {
  if (!process.env[key]) throw new Error(`Env '${key}' is required`)
  return process.env[key]

  if (!Deno.env.has(key)) throw new Error(`Env '${key}' is required`)
  return Deno.env.get(key)!
}
