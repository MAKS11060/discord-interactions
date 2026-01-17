import deno from '@deno/vite-plugin'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'

const noCrossOrigin = (): Plugin => {
  return {
    name: 'no-crossorigin',
    transformIndexHtml(html) {
      return html.replaceAll(`crossorigin `, '')
    },
  }
}

// https://vitejs.dev/config
export default defineConfig({
  plugins: [
    svelte(),
    tailwindcss(),
    // noCrossOrigin(),
    deno(),
  ],
  server: {
    hmr: {protocol: 'ws', host: 'localhost', clientPort: 5173},
    // proxy: {
    //   '/api': {
    //     target: 'https://maks11060.keenetic.link',
    //   },
    // },
  },
})
