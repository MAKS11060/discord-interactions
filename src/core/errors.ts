export class InteractionError extends Error {
  override name = this.constructor.name
  status = 500
}
