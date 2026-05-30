[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / IJsonDropZoneProps

# Interface: IJsonDropZoneProps\<T\>

Props for the JsonDropZone component.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The expected validated type |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="classname"></a> `className?` | `readonly` | `string` | Additional CSS class names |
| <a id="converter"></a> `converter` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\> | Converter to validate parsed JSON against |
| <a id="error"></a> `error?` | `readonly` | `string` | Externally-controlled error message to display |
| <a id="hint"></a> `hint?` | `readonly` | `string` | Placeholder hint text |
| <a id="onerror"></a> `onError?` | `readonly` | (`message`) => `void` | Called with an error message on parse/validation failure |
| <a id="onvaluereceived"></a> `onValueReceived` | `readonly` | (`value`) => `void` | Called with the validated value on successful drop/paste |
