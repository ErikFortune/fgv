# Change Log - @fgv/ts-agent-tasks

This log was last generated on Fri, 20 Nov 2026 05:01:24 GMT and should not be manually modified.

## 5.1.0
Fri, 20 Nov 2026 05:01:24 GMT

### Minor changes

- Initial release: recording and mediation of agent work — a task envelope with lifecycle, observation, command and recovery unions, and a kind and command registry. It records work; it runs no agent loop.
- `FileTreeTaskRepository`: crash-safe, one-record-atomic persistence with indexed queries, paging, due and owed-update selection.
- `TaskBroker`: principal-bound, authorized and projected access, external task sources reconciled in order, subscriptions with issued receipts, retention, and cascade stop over a task subtree.
- `TaskContextRenderer` and `checkTaskPrompt` / `prepareTaskPrompt` render task snapshots into bounded, cacheable prompt context with a receipt of exactly what was included.
- `createTaskTools`: model tools over the tasks a principal may see — read-only by default, with create, update, reassign, typed commands and stop requests opt-in.

