[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / TaskRepositoryFactory

# Type Alias: TaskRepositoryFactory

> **TaskRepositoryFactory** = () => `Promise`\<[`TaskResult`](TaskResult.md)\<[`ITaskRepository`](../interfaces/ITaskRepository.md)\>\>

Creates one empty, writable repository whose registry has `fgv.tracked@1` and `fgv.task-list@1`
registered. Called once per check, so no check depends on another's state.

## Returns

`Promise`\<[`TaskResult`](TaskResult.md)\<[`ITaskRepository`](../interfaces/ITaskRepository.md)\>\>
