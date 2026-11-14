[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / TaskRepositoryFallback

# Type Alias: TaskRepositoryFallback

> **TaskRepositoryFallback** = `"refuse"` \| `"in-memory"`

What [openOrInitializeTaskRepository](../functions/openOrInitializeTaskRepository.md) does with a root that qualifies for no repository mode.

## Remarks

- `'refuse'` — fail (`unsupported`).
- `'in-memory'` — run on a fresh in-memory tree in `session` mode, labelled `in-memory` in the
  result and its report. Nothing it holds survives the process.
