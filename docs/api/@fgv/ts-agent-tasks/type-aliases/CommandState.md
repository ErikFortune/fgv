[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / CommandState

# Type Alias: CommandState

> **CommandState** = \{ `reason`: [`CommandRejectionReason`](CommandRejectionReason.md); `state`: `"rejected"`; \} \| \{ `sourceReceipt?`: `string`; `state`: `"accepted"`; \} \| \{ `appliedRevision`: [`TaskRevision`](TaskRevision.md); `state`: `"applied"`; \} \| \{ `reason`: `string`; `state`: `"indeterminate"`; \} \| \{ `from`: [`CommandAbandonmentOrigin`](CommandAbandonmentOrigin.md); `reason`: `string`; `state`: `"abandoned"`; \}

The state of a dispatched command.

## Remarks

The four outcome states are deliberately not collapsible, and `abandoned` is none of them:
a host's explicit end of tracking for a command whose outcome is not known. `accepted` means intent is durably
recorded — it does *not* mean applied. `applied` requires an authoritative native
commit or a source-confirmed effect reconciled into a committed projection. An
ambiguous external send is `indeterminate` and keeps its operation ID, rather than
becoming a generic retryable failure.
