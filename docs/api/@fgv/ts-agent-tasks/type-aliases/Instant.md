[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / Instant

# Type Alias: Instant

> **Instant** = [`Brand`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`, `"TaskInstant"`\>

An absolute instant, as canonical UTC `YYYY-MM-DDTHH:mm:ss.sssZ`.

## Remarks

Zone-free, offset-qualified and non-canonical spellings are rejected at the
converter boundary; hosts normalize before reaching it.
