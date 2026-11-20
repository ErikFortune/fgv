[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / OpenOrInitializeTaskRepositoryResult

# Type Alias: OpenOrInitializeTaskRepositoryResult

> **OpenOrInitializeTaskRepositoryResult** = \{ `durability`: [`TaskRepositoryDurability`](TaskRepositoryDurability.md); `placement`: [`TaskRepositoryPlacement`](TaskRepositoryPlacement.md); `report`: [`ITaskRepositoryPlacementReport`](../interfaces/ITaskRepositoryPlacementReport.md); `repository`: [`ITaskRepository`](../interfaces/ITaskRepository.md); `state`: `"ready"`; \} \| \{ `durability`: [`TaskRepositoryDurability`](TaskRepositoryDurability.md); `placement`: [`TaskRepositoryPlacement`](TaskRepositoryPlacement.md); `recovery`: [`ITaskRecoveryHandle`](../interfaces/ITaskRecoveryHandle.md); `report`: [`ITaskRepositoryPlacementReport`](../interfaces/ITaskRepositoryPlacementReport.md); `state`: `"recovery-required"`; \}

The outcome of [openOrInitializeTaskRepository](../functions/openOrInitializeTaskRepository.md).
