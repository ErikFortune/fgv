[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskCommandToolOptions

# Interface: ITaskCommandToolOptions

The registered commands a host offers the model as tools, and what they need to run.

## Remarks

Offering a command makes a tool available; it authorizes nothing. Every call is authorized by
`writer`'s policy when it runs, exactly as a direct `execute` would be.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-enable"></a> `enable` | `readonly` | readonly [`ITaskCommandToolSpec`](ITaskCommandToolSpec.md)[] | The commands to offer, one tool each, in this order. An empty list offers none. |
| <a id="property-environment"></a> `environment` | `readonly` | `Pick`\<[`ITaskEnvironment`](ITaskEnvironment.md), `"newOperationId"`\> | Mints each call's operation id. The model never supplies one. Usually the host's `TaskEnvironment`. |
| <a id="property-registry"></a> `registry` | `readonly` | [`ITaskKindRegistry`](ITaskKindRegistry.md) | The registry each offered command is looked up in, for its parameter schema — the one the broker's repository was opened with. The broker validates every command against its own registry whatever the tool offered, so a mismatched one can only make a call fail. |
| <a id="property-writer"></a> `writer` | `readonly` | [`IBoundTaskWriter`](IBoundTaskWriter.md) | The writer every command goes through. It must be the very object passed as `view`. |
