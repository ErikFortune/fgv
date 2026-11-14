[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IOpenOrInitializeTaskRepositoryParams

# Interface: IOpenOrInitializeTaskRepositoryParams

Parameters for [openOrInitializeTaskRepository](../functions/openOrInitializeTaskRepository.md): everything `FileTreeTaskRepository.open`
takes except the mode, which is decided from the root, and a fallback.

## Extends

- `Omit`\<[`ITaskRepositoryOpenParams`](ITaskRepositoryOpenParams.md), `"mode"`\>

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-allowsessionoverdurable"></a> `allowSessionOverDurable?` | `readonly` | `boolean` | On `open`, permits opening as `'session'` a repository whose manifest records that it was initialized `process-crash`. Without it such an open is refused (`unsupported`) before anything is written, so a host whose root lost its durable capability does not silently carry on with weaker commits over durable data. A manifest that records no initialization mode opens in either mode regardless. Ignored by `initialize`. |
| <a id="property-checkpoints"></a> `checkpoints?` | `readonly` | [`ITaskCheckpointStore`](ITaskCheckpointStore.md) | Where subscription records are persisted. Defaults to the repository's own root. A `process-crash` repository refuses a `session` store: a weaker checkpoint cannot be paired with durable task state. Everything the store returns is validated; see `ITaskCheckpointStore`. |
| <a id="property-converters"></a> `converters?` | `readonly` | [`TaskConverters`](../classes/TaskConverters.md) | Converters to validate with. Defaults to the default field bounds. |
| <a id="property-environment"></a> `environment` | `readonly` | [`ITaskEnvironment`](ITaskEnvironment.md) | - |
| <a id="property-fallback"></a> `fallback` | `readonly` | [`TaskRepositoryFallback`](../type-aliases/TaskRepositoryFallback.md) | - |
| <a id="property-profile"></a> `profile?` | `readonly` | [`ITaskCapacityProfile`](ITaskCapacityProfile.md) | The capacity profile the host expects. On `open` it must equal the stored profile exactly — a lower, higher or otherwise different configuration fails without touching the stored one. Raising limits is the explicit [ITaskRepositoryWriter.raiseCapacityLimits](ITaskRepositoryWriter.md#raisecapacitylimits). Omitted, the stored profile governs. On `initialize` it defaults to `defaultTaskCapacityProfile`. |
| <a id="property-recordcache"></a> `recordCache?` | `readonly` | [`ITaskRecordCacheOptions`](ITaskRecordCacheOptions.md) | The optional shared parsed-record cache. Disabled when omitted — the default, because every held record is resident memory a host did not ask for. At most 32 entries and 8 MiB of encoded charge. |
| <a id="property-registry"></a> `registry` | `readonly` | [`ITaskKindRegistry`](ITaskKindRegistry.md) | The kind registry. Frozen by open, so a kind cannot appear under committed data. |
| <a id="property-root"></a> `root` | `readonly` | [`FileTreeItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The repository root: a directory the host provisioned and owns exclusively. Every record lives directly in it. The storage packlet never sees a native path. |
