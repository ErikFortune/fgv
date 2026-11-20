[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / SourceHistoryDeclaration

# Type Alias: SourceHistoryDeclaration

> **SourceHistoryDeclaration** = \{ `history`: `"observed-state"`; \} \| \{ `envelope`: [`ISourceReplayEnvelope`](../interfaces/ISourceReplayEnvelope.md); `history`: `"source-replay"`; \}

What a registration or subscription declares about its source's history contract.

## Remarks

Modelled as a union rather than a flag plus an optional envelope, so that a
`source-replay` declaration without a finite envelope is not representable.
