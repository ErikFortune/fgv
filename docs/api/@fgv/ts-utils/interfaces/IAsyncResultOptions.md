[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-utils](../README.md) / IAsyncResultOptions

# Interface: IAsyncResultOptions

Options for the bounded-parallel asynchronous members of this family.

## Remarks

The transitively-asynchronous members ([populateObjectAsync](../functions/populateObjectAsync.md) and
[firstSuccessAsync](../functions/firstSuccessAsync.md)) are serial by contract and deliberately do *not* accept these
options - a `concurrency` field on an operation which is serial by definition would be a lie
in the type signature.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-aggregatederrors"></a> `aggregatedErrors?` | `readonly` | [`IMessageAggregator`](IMessageAggregator.md) | Optional aggregator to which any error messages will be appended, matching the third parameter of the synchronous members of this family. Each error is appended as an individual string. |
| <a id="property-concurrency"></a> `concurrency?` | `readonly` | `number` | Maximum number of operations in flight at once. Defaults to [DEFAULT\_RESULT\_CONCURRENCY](../variables/DEFAULT_RESULT_CONCURRENCY.md). Values below `1`, and `NaN`, are clamped to `1`; fractional values are truncated; supply `Number.POSITIVE_INFINITY` to run without a bound. |
