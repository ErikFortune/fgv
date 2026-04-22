[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ObservabilityTools](../README.md) / createViewStateObservabilityContext

# Function: createViewStateObservabilityContext()

> **createViewStateObservabilityContext**(`addMessage`, `diagLogLevel`, `userLogLevel`): [`IObservabilityContext`](../interfaces/IObservabilityContext.md)

Creates an observability context that forwards user messages to viewState.addMessage().
This bridges the observability system with React component state management.

## Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `addMessage` | (`type`, `message`) => `void` | `undefined` | Function to add messages to viewState (typically viewState.addMessage) |
| `diagLogLevel` | [`ReporterLogLevel`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) | `'info'` | Log level for diagnostic messages (defaults to 'info') |
| `userLogLevel` | [`ReporterLogLevel`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) | `'info'` | Log level for user messages (defaults to 'info') |

## Returns

[`IObservabilityContext`](../interfaces/IObservabilityContext.md)

A new observability context with ViewState-connected user logger
