const CERT = process.env['CERT']!
const KEY = process.env['KEY']!
const IS_TLS = CERT && KEY
const PORT = Number(process.env['PORT']) || (IS_TLS ? 443 : 80)

export const serve = async (handler: (req: Request) => Promise<Response> | Response) => {
  Bun.serve({
    fetch: handler,
    port: PORT,
    ...(IS_TLS && {
      tls: {
        key: Bun.file(KEY),
        cert: Bun.file(CERT),
      },
    }),
  })
}
