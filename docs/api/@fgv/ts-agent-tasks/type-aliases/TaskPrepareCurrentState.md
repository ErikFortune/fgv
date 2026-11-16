[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / TaskPrepareCurrentState

# Type Alias: TaskPrepareCurrentState

> **TaskPrepareCurrentState** = `"include"` \| `"owed-only"`

What [IBoundTaskDelivery.prepare](../interfaces/IBoundTaskDelivery.md#prepare) renders beside the owed updates.

## Remarks

- `'include'` — the default: the selection's current tasks too, so a context shows the work as it
  is now as well as what changed. A current task the subscription is owed nothing for renders with
  no update ids, and it ranks by its own state — attention and terminal outcomes above routine
  changes — so under a small item budget it can take every slot and deliver nothing.
- `'owed-only'` — only what is owed: each owed revision renders from its own frozen snapshot, and
  no current state is a candidate. Every rendered entry then carries update ids unless the text
  budget abbreviated it. For a consumer that decides one owed revision at a time.
