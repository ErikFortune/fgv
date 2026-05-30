[Home](../README.md) > Success

# Class: Success

Reports a successful IResult | result from some operation and the
corresponding value.

**Implements:** [`IResult<T>`](../interfaces/IResult.md)

## Constructors

<table><thead><tr><th>

Constructor

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

`constructor(value)`

</td><td>



</td><td>

Constructs a Success with the supplied value.

</td></tr>
</tbody></table>

## Properties

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[success](./Success.success.md)

</td><td>

`readonly`

</td><td>

true

</td><td>

Indicates whether the operation was successful.

</td></tr>
<tr><td>

[message](./Success.message.md)

</td><td>

`readonly`

</td><td>

undefined

</td><td>

For a successful operation, the error message is always `undefined`.

</td></tr>
<tr><td>

[value](./Success.value.md)

</td><td>

`readonly`

</td><td>

T

</td><td>

The result value returned by the successful operation.

</td></tr>
</tbody></table>

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[with(value)](./Success.with.md)

</td><td>

`static`

</td><td>

Creates a Success | Success<T> with the supplied value.

</td></tr>
<tr><td>

[isSuccess()](./Success.isSuccess.md)

</td><td>



</td><td>

Indicates whether this operation was successful.

</td></tr>
<tr><td>

[isFailure()](./Success.isFailure.md)

</td><td>



</td><td>

Indicates whether this operation failed.

</td></tr>
<tr><td>

[orThrow(logger)](./Success.orThrow.md)

</td><td>



</td><td>

Gets the value associated with a successful IResult | result,

</td></tr>
<tr><td>

[orDefault(dflt)](./Success.orDefault.md)

</td><td>



</td><td>

Gets the value associated with a successful IResult | result,

</td></tr>
<tr><td>

[getValueOrThrow(__logger)](./Success.getValueOrThrow.md)

</td><td>



</td><td>

Gets the value associated with a successful IResult | result,
or throws the error message if the corresponding operation failed.

</td></tr>
<tr><td>

[getValueOrDefault(dflt)](./Success.getValueOrDefault.md)

</td><td>



</td><td>

Gets the value associated with a successful IResult | result,

</td></tr>
<tr><td>

[onSuccess(cb)](./Success.onSuccess.md)

</td><td>



</td><td>

Calls a supplied SuccessContinuation | success continuation if

</td></tr>
<tr><td>

[onFailure(__)](./Success.onFailure.md)

</td><td>



</td><td>

Calls a supplied FailureContinuation | failed continuation if

</td></tr>
<tr><td>

[thenOnSuccess(cb)](./Success.thenOnSuccess.md)

</td><td>



</td><td>

Calls a supplied AsyncSuccessContinuation | async success continuation if

</td></tr>
<tr><td>

[thenOnFailure(__)](./Success.thenOnFailure.md)

</td><td>



</td><td>

Calls a supplied AsyncFailureContinuation | async failure continuation if

</td></tr>
<tr><td>

[withErrorFormat(__cb)](./Success.withErrorFormat.md)

</td><td>



</td><td>

Calls a supplied ErrorFormatter | error formatter if

</td></tr>
<tr><td>

[withFailureDetail(__detail)](./Success.withFailureDetail.md)

</td><td>



</td><td>

Converts a IResult | IResult<T> to a DetailedResult | DetailedResult<T, TD>,

</td></tr>
<tr><td>

[withDetail(detail, successDetail)](./Success.withDetail.md)

</td><td>



</td><td>

Converts a IResult | IResult<T> to a DetailedResult | DetailedResult<T, TD>,

</td></tr>
<tr><td>

[aggregateError(__errors, __formatter)](./Success.aggregateError.md)

</td><td>



</td><td>

Propagates interior result, appending any error message to the

</td></tr>
<tr><td>

[report(reporter, options)](./Success.report.md)

</td><td>



</td><td>

Reports the result to the supplied reporter

</td></tr>
</tbody></table>
