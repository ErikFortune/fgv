[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [SaferFetch](../README.md) / DEFAULT\_TIMEOUT\_MS

# Variable: DEFAULT\_TIMEOUT\_MS

> `const` **DEFAULT\_TIMEOUT\_MS**: `number` = `30_000`

Default overall deadline, in milliseconds — comfortably above a slow-but-real API and far
below "a hung request pins a socket for minutes". Streaming LLM calls should not use this
primitive at all; that is what `AiAssist` is for.
