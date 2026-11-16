[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / TaskCapacityState

# Type Alias: TaskCapacityState

> **TaskCapacityState** = `"ok"` \| `"pressure"` \| `"admission-blocked"` \| `"draining"`

Overall admission state of a repository.

## Remarks

Capacity pressure is deliberately distinct from corruption and index health: a full
valid repository opens in `draining`, not as something broken. Reads, acknowledgement,
disposition, settlement of already-accepted work, pruning and archive all remain callable
in every state.

T3 settled what separates the two blocked states:
- `draining` — at least one dimension has no headroom left (`available === 0`). Ordinary
  growth that needs that dimension is refused; growth that does not is still admitted.
- `admission-blocked` — admission is fenced *regardless of headroom*, because a claim's
  consumption is `indeterminate`. The ledger cannot know what is free, so it admits nothing.
- `pressure` — some dimension is at or past [capacityPressureThreshold](../variables/capacityPressureThreshold.md).
