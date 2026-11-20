[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskEnvironmentCreateParams

# Interface: ITaskEnvironmentCreateParams

Parameters for [TaskEnvironment.create](../classes/TaskEnvironment.md#create).

## Extends

- [`ITaskEnvironmentParams`](ITaskEnvironmentParams.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-clock"></a> `clock` | `readonly` | () => `number` | - |
| <a id="property-converters"></a> `converters?` | `readonly` | [`TaskConverters`](../classes/TaskConverters.md) | Converter set used to validate minted identities. Defaults to the default bounds. |
| <a id="property-logger"></a> `logger` | `readonly` | [`ILogger`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) | - |
| <a id="property-newid"></a> `newId` | `readonly` | () => [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`string`\> | - |
