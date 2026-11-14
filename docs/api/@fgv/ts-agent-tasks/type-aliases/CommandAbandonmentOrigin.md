[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / CommandAbandonmentOrigin

# Type Alias: CommandAbandonmentOrigin

> **CommandAbandonmentOrigin** = `"not-sent"` \| `"possibly-sent"` \| `"awaiting-feed"`

What was known about a command when a host abandoned it.

## Remarks

- `not-sent` — the intent was recorded and never dispatched.
- `possibly-sent` — the marker was written; whether the source applied it is unknown.
- `awaiting-feed` — the source answered, and the `source-replay` feed never reached the revision
  that would confirm it.

`abandoned` is not an outcome. It ends the broker's tracking of the command, and releases its
settlement reservation, without claiming that anything was or was not applied.
