[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ObservabilityTools](../README.md) / IObservabilityContext

# Interface: IObservabilityContext

Observability context that provides both diagnostic and user logging capabilities.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="diag"></a> `diag` | `readonly` | [`LogReporter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`unknown`\> | Diagnostic logger for internal system diagnostics. |
| <a id="policy"></a> `policy?` | `readonly` | `IObservabilityPolicy` | Optional policy configuration for context behavior. |
| <a id="user"></a> `user` | `readonly` | `IUserLogReporter` | User logger for user-facing messages and feedback. |
