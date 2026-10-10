export class InteractionError extends Error {
  override name = this.constructor.name
  status: number

  constructor(message: string, status = 500) {
    super(message)
    this.status = status
  }
}
