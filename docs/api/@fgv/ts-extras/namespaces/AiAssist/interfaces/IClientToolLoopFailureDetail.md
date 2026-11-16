[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IClientToolLoopFailureDetail

# Interface: IClientToolLoopFailureDetail

The detail a failed `runClientToolLoop` call carries.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-rounds"></a> `rounds` | `readonly` | readonly [`IClientToolRound`](IClientToolRound.md)[] | Every round that completed before the failure, in order (empty when none did). |
