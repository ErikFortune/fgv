[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / TaskRepositoryOpenResult

# Type Alias: TaskRepositoryOpenResult

> **TaskRepositoryOpenResult** = \{ `repository`: [`ITaskRepository`](../interfaces/ITaskRepository.md); `state`: `"ready"`; \} \| \{ `recovery`: [`ITaskRecoveryHandle`](../interfaces/ITaskRecoveryHandle.md); `state`: `"recovery-required"`; \}

The outcome of opening a repository that exists.
