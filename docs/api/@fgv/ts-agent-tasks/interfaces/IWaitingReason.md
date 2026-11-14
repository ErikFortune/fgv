[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IWaitingReason

# Interface: IWaitingReason

A [ITaskReason](ITaskReason.md) for a waiting task, optionally naming the earliest instant at
which the wait could end.

## Extends

- [`ITaskReason`](ITaskReason.md)

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-attention"></a> `attention?` | `readonly` | readonly [`ITaskReference`](ITaskReference.md)[] |
| <a id="property-code"></a> `code` | `readonly` | `string` |
| <a id="property-notbefore"></a> `notBefore?` | `readonly` | [`Instant`](../type-aliases/Instant.md) |
| <a id="property-summary"></a> `summary` | `readonly` | `string` |
