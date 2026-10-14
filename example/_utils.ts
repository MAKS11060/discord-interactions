export class Logger {
  #now = performance.now()
  request: Request

  constructor(request: Request) {
    this.request = request
  }

  log(response: Response): Response {
    const dur = (performance.now() - this.#now).toFixed(2)
    const url = new URL(this.request.url)

    console.log(
      `%c[http] %c${response.status} %c${this.request.method} %c${url.pathname} %c${dur}ms`,
      'color: orange',
      response.ok ? 'color: green' : 'color: red',
      'color: yellow',
      'color: lime',
      'color: cyan',
    )

    return response
  }
}
