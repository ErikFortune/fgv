[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-system-one](../README.md) / ISystemOneRequest

# Interface: ISystemOneRequest\<Q\>

A request to [askSystemOne](../functions/askSystemOne.md).

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-q"></a> `Q` *extends* [`Questions`](Questions.md) |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-inputlimit"></a> `inputLimit` | `readonly` | [`SystemOneInputLimit`](../type-aliases/SystemOneInputLimit.md) | The input bound. Required: there is no default. |
| <a id="property-questions"></a> `questions` | `readonly` | `Q` | The questions, keyed by the ids their answers are returned under. |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | Cancels the request and any pending retry. |
| <a id="property-state"></a> `state` | `readonly` | [`EntryType`](../type-aliases/EntryType.md) | The state the questions are asked about. |
