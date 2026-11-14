[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskRepositoryRootProbe

# Type Alias: ITaskRepositoryRootProbe

> **ITaskRepositoryRootProbe** = \{ `guarantees`: `ReadonlyArray`\<[`FileTree.AtomicWriteGuarantee`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>; `mode`: [`TaskRepositoryMode`](TaskRepositoryMode.md); \} \| \{ `guarantees`: `ReadonlyArray`\<[`FileTree.AtomicWriteGuarantee`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>; `mode`: `undefined`; `reason`: `string`; \}

What a root offers a task repository, as [probeTaskRepositoryRoot](../functions/probeTaskRepositoryRoot.md) finds it.

## Union Members

### Type Literal

\{ `guarantees`: `ReadonlyArray`\<[`FileTree.AtomicWriteGuarantee`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>; `mode`: [`TaskRepositoryMode`](TaskRepositoryMode.md); \}

| Name | Type | Description |
| ------ | ------ | ------ |
| `guarantees` | `ReadonlyArray`\<[`FileTree.AtomicWriteGuarantee`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\> | The atomic write guarantees a repository can rely on at this root: the ones the root lists, provided it can replace a file atomically at all. |
| `mode` | [`TaskRepositoryMode`](TaskRepositoryMode.md) | The strongest repository mode the root supports: `{ durable: 'process-crash' }`, else `'session'`. |

***

### Type Literal

\{ `guarantees`: `ReadonlyArray`\<[`FileTree.AtomicWriteGuarantee`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>; `mode`: `undefined`; `reason`: `string`; \}

| Name | Type | Description |
| ------ | ------ | ------ |
| `guarantees` | `ReadonlyArray`\<[`FileTree.AtomicWriteGuarantee`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\> | The guarantees the root qualifies for: empty for a root without the atomic capability, and for one that lists guarantees but cannot replace atomically. |
| `mode` | `undefined` | The root supports no repository mode. |
| `reason` | `string` | Why the root supports no mode. |
