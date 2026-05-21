#!/usr/bin/env -S deno bench -A --env-file --watch

export function concat(buffers: readonly Uint8Array[]): Uint8Array<ArrayBuffer> {
  let length = 0
  for (const buffer of buffers) {
    length += buffer.length
  }
  const output = new Uint8Array(length)
  let index = 0
  for (const buffer of buffers) {
    output.set(buffer, index)
    index += buffer.length
  }

  return output
}

// PRE
const publicKey = process.env.CLIENT_PUBLIC_KEY!

const a = Uint8Array.fromHex(publicKey)
const b = Uint8Array.fromHex(publicKey)
const c = crypto.getRandomValues(new Uint8Array(10240))

const input = [a, b, c]

Deno.bench({
  name: 'concat',
  async fn() {
    concat(input)
  },
})

Deno.bench({
  name: 'blob',
  async fn() {
    await new Blob(input).bytes()
  },
})

// 3
export function concatTypedArrays(arrays: readonly Uint8Array<ArrayBuffer>[]) {
  // 1. Calculate total length once to avoid resizing
  const totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0)

  // 2. Pre-allocate the result array
  const result = new Uint8Array(totalLength)

  // 3. Copy each array into the buffer at the correct offset
  let offset = 0
  for (const arr of arrays) {
    result.set(arr, offset)
    offset += arr.length
  }

  return result
}

Deno.bench({
  name: 'concatTypedArrays',
  fn() {
    concatTypedArrays(input)
  },
})

Deno.bench({
  name: 'Uint8Array.from',
  fn() {
    Uint8Array.from([
      ...a,
      ...b,
      ...c,
    ])
  },
})

Deno.bench({
  name: 'iter',
  fn() {
    Iterator.concat([
      ...a,
      ...b,
      ...c,
    ])
  },
})
