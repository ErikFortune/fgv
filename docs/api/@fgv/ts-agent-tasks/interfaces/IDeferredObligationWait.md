[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IDeferredObligationWait

# Interface: IDeferredObligationWait

What [DeferredObligations.wait](../classes/DeferredObligations.md#wait) changes besides `notBefore`. Each member omitted keeps the
obligation's current value.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-attention"></a> `attention?` | `readonly` | readonly [`ITaskReference`](ITaskReference.md)[] |
| <a id="property-changes"></a> `changes?` | `readonly` | readonly `string`[] |
| <a id="property-summary"></a> `summary?` | `readonly` | `string` |
