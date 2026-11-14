[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / SourceCommandLookup

# Type Alias: SourceCommandLookup

> **SourceCommandLookup** = [`SourceCommandResult`](SourceCommandResult.md) \| \{ `state`: `"not-found"`; \}

What a source's command lookup found for a command key.

## Remarks

`not-found` does not make a resend safe: a send may still be in flight. Only a source that
deduplicates the key (`idempotency: 'source-key'`) is ever sent the same command again.
