[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskRepositoryPlacementReport

# Interface: ITaskRepositoryPlacementReport

What [openOrInitializeTaskRepository](../functions/openOrInitializeTaskRepository.md) decided and found.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-durability"></a> `durability` | `readonly` | [`TaskRepositoryDurability`](../type-aliases/TaskRepositoryDurability.md) | - |
| <a id="property-fallbackreason"></a> `fallbackReason?` | `readonly` | `string` | Why the in-memory fallback was used, when it was. |
| <a id="property-guarantees"></a> `guarantees` | `readonly` | readonly (`"session"` \| `"process-crash"` \| `"os-crash"` \| `"power-loss"`)[] | The guarantees the given root qualifies for (see `probeTaskRepositoryRoot`). |
| <a id="property-initialized"></a> `initialized` | `readonly` | `boolean` | Whether the repository was initialized by this call rather than opened. |
| <a id="property-mode"></a> `mode` | `readonly` | [`TaskRepositoryMode`](../type-aliases/TaskRepositoryMode.md) | The mode the repository was opened or initialized in. |
| <a id="property-placement"></a> `placement` | `readonly` | [`TaskRepositoryPlacement`](../type-aliases/TaskRepositoryPlacement.md) | - |
| <a id="property-recovery"></a> `recovery` | `readonly` | [`ITaskRecoveryReport`](ITaskRecoveryReport.md) | What open found and did — the repository's, or the recovery handle's, report. |
