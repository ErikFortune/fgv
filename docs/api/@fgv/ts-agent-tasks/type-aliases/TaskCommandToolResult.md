[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / TaskCommandToolResult

# Type Alias: TaskCommandToolResult

> **TaskCommandToolResult** = \{ `state`: `"accepted"`; `taskId`: [`TaskId`](TaskId.md); \} \| \{ `revision`: [`TaskRevision`](TaskRevision.md); `state`: `"applied"`; `taskId`: [`TaskId`](TaskId.md); \}

What a command tool returns to the model when the command was taken: `accepted` — the command is
recorded for the task's executor, which does **not** mean it has taken effect (nor, in one race,
that it has been sent yet) — or `applied`, with the task's revision at which it took effect.

## Remarks

A refusal, and a command whose outcome is not known, are tool failures instead. A source's own
receipt text and a held command's reason are never returned; they go to the host's logger.
