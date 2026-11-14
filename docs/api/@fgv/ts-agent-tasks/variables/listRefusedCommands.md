[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / listRefusedCommands

# Variable: listRefusedCommands

> `const` **listRefusedCommands**: `ReadonlyArray`\<[`TrackedCommand`](../type-aliases/TrackedCommand.md)\[`"command"`\]\>

The commands a task list refuses as `unsupported`: a list has no own work to start, suspend or
resume, and it succeeds only through list completion, which checks its children.
