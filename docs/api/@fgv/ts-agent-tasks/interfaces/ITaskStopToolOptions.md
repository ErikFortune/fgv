[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskStopToolOptions

# Interface: ITaskStopToolOptions

The cascade-stop tools a host opts into, and what they need to run.

## Remarks

Opting in offers `task_stop` — for exactly the modes in `enable` — and `task_stop_inspect`. It
authorizes nothing: every stop is authorized by `writer`'s policy when it runs, exactly as a direct
`requestStop` would be. Releasing a stop and running the stop pump are never offered to a model:
a model may apply the brakes; only the host lifts them, and only the host carries a stop out.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-enable"></a> `enable` | `readonly` | readonly [`StopMode`](../type-aliases/StopMode.md)[] | The modes `task_stop` offers. An empty list offers neither stop tool. |
| <a id="property-environment"></a> `environment` | `readonly` | `Pick`\<[`ITaskEnvironment`](ITaskEnvironment.md), `"newOperationId"`\> | Mints each stop's operation id, which is also the stop's intent id. The model never supplies one. Usually the host's `TaskEnvironment`. The ids must be unguessable: `task_stop_inspect` reads any stop on a visible root whose id the model can name, so a guessable id would let a model probe for stops other principals placed. |
| <a id="property-writer"></a> `writer` | `readonly` | [`IBoundTaskWriter`](IBoundTaskWriter.md) | The writer every stop goes through. It must be the very object passed as `view`. |
