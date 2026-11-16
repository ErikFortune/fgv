[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / openOrInitializeTaskRepository

# Function: openOrInitializeTaskRepository()

> **openOrInitializeTaskRepository**(`params`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`OpenOrInitializeTaskRepositoryResult`](../type-aliases/OpenOrInitializeTaskRepositoryResult.md)\>\>

Opens the task repository at a root, or initializes one there when the root is empty, in the
strongest mode the root qualifies for.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `params` | [`IOpenOrInitializeTaskRepositoryParams`](../interfaces/IOpenOrInitializeTaskRepositoryParams.md) |

## Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`OpenOrInitializeTaskRepositoryResult`](../type-aliases/OpenOrInitializeTaskRepositoryResult.md)\>\>

## Remarks

1. **The mode** comes from `probeTaskRepositoryRoot` — the same inquiry the repository makes, so
   the two cannot disagree: `{ durable: 'process-crash' }` when the root qualifies for it, else
   `'session'`. A root that qualifies for neither is refused, or — with `fallback: 'in-memory'` —
   replaced by a fresh in-memory tree, and the result and its report say `placement: 'in-memory'`.
2. **Open or initialize** is `FileTreeTaskRepository.openOrInitialize`'s decision, made under the
   repository's exclusive ownership by `initialize`'s own emptiness test: a root holding nothing but
   interrupted writes' working files is empty.
3. **`recovery-required` is surfaced, never repaired.** The result carries the read-only handle
   and its report; nothing is rewritten.

A repository initialized `process-crash` records that in its manifest, and opening it later as
`session` — because the root no longer qualifies — is refused unless `allowSessionOverDurable` is
passed. Every other failure is the repository's own, classified as it classifies it.

Building the broker over the repository stays with the host.
