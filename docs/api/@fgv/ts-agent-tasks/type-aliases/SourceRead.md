[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / SourceRead

# Type Alias: SourceRead

> **SourceRead** = \{ `state`: `"observed"`; `value`: [`ISourceProjection`](../interfaces/ISourceProjection.md); \} \| \{ `reason`: `string`; `state`: `"unavailable"` \| `"missing"`; \}

The result of reading one binding from its source.

## Remarks

`unavailable` is an outage: it changes observation health, never execution lifecycle.
`missing` is unresolved — never an automatic cancellation or deletion.
