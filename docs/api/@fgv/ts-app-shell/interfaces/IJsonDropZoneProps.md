[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / IJsonDropZoneProps

# Interface: IJsonDropZoneProps\<T\>

Props for the JsonDropZone component.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| <a id="type-parameter-t"></a> `T` | The expected validated type |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-classname"></a> `className?` | `readonly` | `string` | Additional CSS class names |
| <a id="property-converter"></a> `converter` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\> | Converter to validate parsed JSON against |
| <a id="property-error"></a> `error?` | `readonly` | `string` | Externally-controlled error message to display |
| <a id="property-hint"></a> `hint?` | `readonly` | `string` | Placeholder hint text |
| <a id="property-onerror"></a> `onError?` | `readonly` | (`message`) => `void` | Called with an error message on parse/validation failure |
| <a id="property-onvaluereceived"></a> `onValueReceived` | `readonly` | (`value`) => `void` | Called with the validated value on successful drop/paste |
