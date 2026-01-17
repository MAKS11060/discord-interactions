export class HTTPError extends Error {
  override name: string = this.constructor.name

  readonly status: number
  readonly statusText: string
  readonly url: string
  readonly response: Response
  // readonly cause?: unknown

  constructor(response: Response, message?: string, cause?: unknown) {
    super(message ?? `HTTP ${response.status} ${response.statusText}`)

    this.status = response.status
    this.statusText = response.statusText
    this.url = response.url
    this.response = response
    this.cause = cause
  }
}

export async function parseResponse<T>(
  request: Promise<{
    data?: T
    error?: unknown
    response: Response
  }>,
): Promise<{data: T; response: Response}> {
  const {data, error, response} = await request

  if (!response.ok) {
    throw new HTTPError(response, undefined, error)
  }

  if (data === undefined) {
    throw new HTTPError(
      response,
      'Empty response data',
      error,
    )
  }

  return {data, response}
}
