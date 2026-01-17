<script lang="ts">
  import { Route, Router } from '@maks11060/svelte5-router'
  import { hc } from 'hono/client'
  import type { AppType } from '../server/app.ts'
  import Header from './components/Header.svelte'
  import Editor from './Pages/Editor.svelte'

  const app = hc<AppType>('http://localhost')

  const fn = async () => {
    // const res1 = await app.test.$get()
    // await res1.json()

    const data = await app.api.register.$post({
      json: {
        username: '',
      },
    })
    const d = await data.json()
  }
</script>

<Router>
  <Header></Header>

  <Route path="/editor" component={Editor} />

  <!-- <Route path="/">12</Route>
  <Route path="/test">
    <main>test</main>
  </Route> -->
</Router>
