export const CHAT_INPUT_NAME_RE = /^[-_\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32}$/u

export const isValidChatInputName = (name: string) => CHAT_INPUT_NAME_RE.test(name)
