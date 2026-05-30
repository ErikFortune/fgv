[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / IUseAiAssistParams

# Interface: IUseAiAssistParams

Parameters for the generic useAiAssist hook.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="keystore"></a> `keyStore` | `readonly` | [`IAiAssistKeyStore`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs) \| `undefined` | Keystore for API key resolution (or undefined if no keystore). |
| <a id="logger"></a> `logger?` | `readonly` | [`ILogger`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) | Optional logger for request/response observability. |
| <a id="settings"></a> `settings` | `readonly` | [`IAiAssistSettings`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs) \| `undefined` | Resolved AI assist settings (provider list + default). |
