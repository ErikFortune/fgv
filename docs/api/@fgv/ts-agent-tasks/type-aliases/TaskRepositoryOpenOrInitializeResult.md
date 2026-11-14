[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / TaskRepositoryOpenOrInitializeResult

# Type Alias: TaskRepositoryOpenOrInitializeResult

> **TaskRepositoryOpenOrInitializeResult** = \{ `initialized`: `boolean`; `repository`: [`ITaskRepository`](../interfaces/ITaskRepository.md); `state`: `"ready"`; \} \| \{ `recovery`: [`ITaskRecoveryHandle`](../interfaces/ITaskRecoveryHandle.md); `state`: `"recovery-required"`; \}

The outcome of [FileTreeTaskRepository.openOrInitialize](../classes/FileTreeTaskRepository.md#openorinitialize): a repository it opened or initialized
— `initialized` says which — or the read-only handle of one that could not open healthily.
