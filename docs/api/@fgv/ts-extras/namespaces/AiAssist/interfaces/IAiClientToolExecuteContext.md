[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IAiClientToolExecuteContext

# Interface: IAiClientToolExecuteContext

Per-call context handed to `IAiClientTool.execute` alongside the arguments.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | The turn's abort signal — `IExecuteClientToolTurnParams.signal`, when the caller supplied one. A tool that does slow or side-effecting work (a network request, a subprocess) should pass it on, so that a cancelled or timed-out turn stops the tool and not only the provider stream. |
