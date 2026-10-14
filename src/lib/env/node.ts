import type {EnvKeys} from './types.ts'

export const getEnv = (key: EnvKeys): string | undefined => {
  return process.env[key]
}

export const getEnvRequired = (key: EnvKeys): string => {
  if (!process.env[key]) throw new Error(`Env ${key} is required`)

  return process.env[key]!
}
