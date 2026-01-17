<script lang="ts">
  interface Props {}

  let {}: Props = $props()

  const inputName = /^[-_'\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32}$/u

  let name = $state('')
  let isValidName = $derived(inputName.test(name))

  $inspect(name, isValidName)
</script>

<main class="container mx-auto">
  <div class="flex flex-col mt-4">
    <div>
      <input
        type="text"
        class={['input validator'/* isValidName ? 'btn-success' : 'btn-error' */
        ]}
        aria-invalid={!isValidName}
        required
        placeholder="name"
        minlength="1"
        maxlength="32"
        title=""
        bind:value={name}
      />
      <p class="validator-hint">
        Must be 1-32 characters
        <br />If there is a lowercase variant of any letters used, you must use those.
        <br />Characters with no lowercase variants and/or uncased letters are still allowed
      </p>
    </div>

  </div>
</main>
