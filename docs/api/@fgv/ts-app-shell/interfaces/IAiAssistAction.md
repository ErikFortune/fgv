[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / IAiAssistAction

# Interface: IAiAssistAction

A single available AI assist action.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="isavailable"></a> `isAvailable` | `readonly` | `boolean` | Whether the provider is currently available (keystore unlocked, secret present) |
| <a id="isdefault"></a> `isDefault` | `readonly` | `boolean` | Whether this is the default (first) action |
| <a id="label"></a> `label` | `readonly` | `string` | Display label (e.g. "AI Assist | Copy", "AI Assist | Grok") |
| <a id="provider"></a> `provider` | `readonly` | [`AiProviderId`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs) | The provider identifier |
| <a id="unavailablereason"></a> `unavailableReason?` | `readonly` | `string` | Reason the provider is unavailable, if any |
