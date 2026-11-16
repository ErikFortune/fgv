[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / SourceCommandResult

# Type Alias: SourceCommandResult

> **SourceCommandResult** = \{ `reason`: [`SourceCommandRejection`](SourceCommandRejection.md); `state`: `"rejected"`; \} \| \{ `sourceReceipt`: `string`; `state`: `"accepted"`; \} \| \{ `observation`: [`ISourceProjection`](../interfaces/ISourceProjection.md); `state`: `"applied"`; \} \| \{ `reason`: `string`; `state`: `"indeterminate"`; \} \| \{ `reason`: `string`; `state`: `"key-expired"`; \}

What a source answered to a dispatched command.

## Remarks

- `accepted` — the source took the command; its effect is not yet observed.
- `applied` — the source reports the effect, with the projection it produced. For an
  `observed-state` source the broker commits that projection; for a `source-replay` source it is
  a hint and the receipt stays `accepted` until the feed reaches that revision.
- `indeterminate` — the source cannot say whether it acted.
- `key-expired` — the source no longer retains this command key, so it can neither say whether it
  acted nor deduplicate a resend. The command is held; it is never resent.
