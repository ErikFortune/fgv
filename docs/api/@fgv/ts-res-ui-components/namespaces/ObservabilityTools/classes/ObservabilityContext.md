[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ObservabilityTools](../README.md) / ObservabilityContext

# Class: ObservabilityContext

Observability context that provides both diagnostic and user logging capabilities.

## Implements

- [`IObservabilityContext`](../interfaces/IObservabilityContext.md)

## Constructors

### Constructor

> **new ObservabilityContext**(`diag`, `user`, `policy?`): `ObservabilityContext`

Creates a new observability context.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `diag` | [`ILogger`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) | The diagnostic logger. |
| `user` | [`IUserLogger`](../interfaces/IUserLogger.md) | The user logger. |
| `policy?` | `IObservabilityPolicy` | Optional policy configuration. |

#### Returns

`ObservabilityContext`

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="diag"></a> `diag` | `readonly` | [`LogReporter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`unknown`\> | Diagnostic logger for internal system diagnostics. |
| <a id="policy"></a> `policy?` | `readonly` | `IObservabilityPolicy` | Optional policy configuration for context behavior. |
| <a id="user"></a> `user` | `readonly` | `IUserLogReporter` | User logger for user-facing messages and feedback. |
