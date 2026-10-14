export class InteractionError extends Error {
  override name = this.constructor.name
  status: number

  constructor(message: string, status = 500) {
    super(message)
    this.status = status
  }
}

export class ComponentBuilderError extends InteractionError {
  constructor(message: string) {
    super(message, 400)
  }
}

export function componentError(message: string): never {
  throw new ComponentBuilderError(message)
}

export function reportComponentError(error: unknown): void {
  console.error('Failed to build Components V2 message:', error)
}
