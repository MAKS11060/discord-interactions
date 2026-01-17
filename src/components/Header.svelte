<script lang="ts">
  import { Link } from '@maks11060/svelte5-router'

  interface Props {
  }

  let {}: Props = $props()
</script>

<header class="header">
  <nav class="navbar gap-2">
    <Link class="link btn btn-primary btn-outline" to="/">Main</Link>
    <Link class="link btn btn-primary btn-outline" to="/test">test</Link>
    <Link class="link btn btn-primary btn-outline" to="/editor">editor</Link>
  </nav>
</header>
