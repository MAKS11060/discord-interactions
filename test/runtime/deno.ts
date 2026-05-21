const CERT = Deno.env.get('CERT')!
const KEY = Deno.env.get('KEY')!
const IS_TLS = CERT && KEY
const PORT = Number(Deno.env.get('PORT')) || (IS_TLS ? 443 : 80)

export const serve = async (handler: (req: Request) => Promise<Response> | Response) => {
  Deno.serve({
    port: PORT,
    hostname: '0.0.0.0',
    ...(IS_TLS && {
      key: Deno.readTextFileSync(KEY),
      cert: Deno.readTextFileSync(CERT),
    }),
  }, handler)
}
