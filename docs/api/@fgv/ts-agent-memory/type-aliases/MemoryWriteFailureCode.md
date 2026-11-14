[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / MemoryWriteFailureCode

# Type Alias: MemoryWriteFailureCode

> **MemoryWriteFailureCode** = [`StringOneOf`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<*typeof* [`allMemoryWriteFailureCodes`](../variables/allMemoryWriteFailureCodes.md)\>

Why a write or delete failed.

- `conflict` — `expected` did not match; nothing was written.
- `duplicate` — a conditional `put` whose content already exists under a different id, which an
  unconditional `put` would answer by returning that record unchanged. Under `expected`, success
  means the addressed record was written, so this fails instead; nothing was written.
- `invalid` — the input was refused before the store looked at the vault (body, codec, layout,
  or a malformed `expected`); nothing was written.
- `rejected` — the kind's write policy refused admission; nothing was written.
- `not-found` — a delete found no record (and carried no `expected`).
- `io` — anything else: storage, the index, or a host callback that failed rather than decided.
  The message says what; it does not promise the vault is unchanged.
