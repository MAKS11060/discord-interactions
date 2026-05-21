export class InteractionError extends Error {
  override name = this.constructor.name
  status = 500 as const
}
