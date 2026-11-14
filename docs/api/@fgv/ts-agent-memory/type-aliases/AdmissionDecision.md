[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / AdmissionDecision

# Type Alias: AdmissionDecision

> **AdmissionDecision** = \{ `decision`: `"accept"`; \} \| \{ `decision`: `"reject"`; `reason`: `string`; \} \| \{ `decision`: `"cull-oldest"`; `evict`: `ReadonlyArray`\<[`MemoryId`](MemoryId.md)\>; \}

The admission decision returned by [IWritePolicy.admit](../interfaces/IWritePolicy.md#admit).

## Union Members

### Type Literal

\{ `decision`: `"accept"`; \}

***

### Type Literal

\{ `decision`: `"reject"`; `reason`: `string`; \}

***

### Type Literal

\{ `decision`: `"cull-oldest"`; `evict`: `ReadonlyArray`\<[`MemoryId`](MemoryId.md)\>; \}

| Name | Type | Description |
| ------ | ------ | ------ |
| `decision` | `"cull-oldest"` | - |
| `evict` | `ReadonlyArray`\<[`MemoryId`](MemoryId.md)\> | [MemoryId](MemoryId.md)s to evict before writing the incoming record. |
