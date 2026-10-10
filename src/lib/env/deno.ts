import type {EnvKeys} from './types.ts'

export const getEnv = (key: EnvKeys): string | undefined => {
  return Deno.env.get(key)
}

export const getEnvRequired = (key: EnvKeys): string => {
  if (!Deno.env.has(key)) throw new Error(`Env ${key} is required`)

  return Deno.env.get(key)!
}
