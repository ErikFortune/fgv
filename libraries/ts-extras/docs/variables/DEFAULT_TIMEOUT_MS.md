[Home](../README.md) > DEFAULT_TIMEOUT_MS

# Variable: DEFAULT_TIMEOUT_MS

Default overall deadline, in milliseconds — comfortably above a slow-but-real API and far
below "a hung request pins a socket for minutes". Streaming LLM calls should not use this
primitive at all; that is what `AiAssist` is for.

## Type

`number`
