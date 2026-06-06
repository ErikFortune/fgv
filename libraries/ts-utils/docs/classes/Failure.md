[Home](../README.md) > Failure

# Class: Failure

Reports a failed IResult | result from some operation, with an error message.

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

`constructor(message)`

</td><td>



</td><td>

Constructs a Failure with the supplied message.

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

[success](./Failure.success.md)

</td><td>

`readonly`

</td><td>

false

</td><td>

Indicates whether the operation was successful.

</td></tr>
<tr><td>

[value](./Failure.value.md)

</td><td>

`readonly`

</td><td>

undefined

</td><td>

Failed operation always returns undefined for value.

</td></tr>
<tr><td>

[message](./Failure.message.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Gets the error message associated with this error.

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

[with(message)](./Failure.with.md)

</td><td>

`static`

</td><td>

Creates a Failure | Failure<T> with the supplied error message.

</td></tr>
<tr><td>

[isSuccess()](./Failure.isSuccess.md)

</td><td>



</td><td>

Indicates whether this operation was successful.

</td></tr>
<tr><td>

[isFailure()](./Failure.isFailure.md)

</td><td>



</td><td>

Indicates whether this operation failed.

</td></tr>
<tr><td>

[orThrow(logger)](./Failure.orThrow.md)

</td><td>



</td><td>

Gets the value associated with a successful IResult | result,

</td></tr>
<tr><td>

[shouldNotFail(label, frameDepth)](./Failure.shouldNotFail.md)

</td><td>



</td><td>

Asserts at the call site that this IResult | result MUST be a success.

</td></tr>
<tr><td>

[orDefault(dflt)](./Failure.orDefault.md)

</td><td>



</td><td>

Gets the value associated with a successful IResult | result,

</td></tr>
<tr><td>

[getValueOrThrow(logger)](./Failure.getValueOrThrow.md)

</td><td>



</td><td>

Gets the value associated with a successful IResult | result,
or throws the error message if the corresponding operation failed.

</td></tr>
<tr><td>

[getValueOrDefault(dflt)](./Failure.getValueOrDefault.md)

</td><td>



</td><td>

Gets the value associated with a successful IResult | result,

</td></tr>
<tr><td>

[onSuccess(__)](./Failure.onSuccess.md)

</td><td>



</td><td>

Calls a supplied SuccessContinuation | success continuation if

</td></tr>
<tr><td>

[onFailure(cb)](./Failure.onFailure.md)

</td><td>



</td><td>

Calls a supplied FailureContinuation | failed continuation if

</td></tr>
<tr><td>

[thenOnSuccess(__)](./Failure.thenOnSuccess.md)

</td><td>



</td><td>

Calls a supplied AsyncSuccessContinuation | async success continuation if

</td></tr>
<tr><td>

[thenOnFailure(cb)](./Failure.thenOnFailure.md)

</td><td>



</td><td>

Calls a supplied AsyncFailureContinuation | async failure continuation if

</td></tr>
<tr><td>

[withErrorFormat(cb)](./Failure.withErrorFormat.md)

</td><td>



</td><td>

Calls a supplied ErrorFormatter | error formatter if

</td></tr>
<tr><td>

[withFailureDetail(detail)](./Failure.withFailureDetail.md)

</td><td>



</td><td>

Converts a IResult | IResult<T> to a DetailedResult | DetailedResult<T, TD>,

</td></tr>
<tr><td>

[withDetail(detail, __successDetail)](./Failure.withDetail.md)

</td><td>



</td><td>

Converts a IResult | IResult<T> to a DetailedResult | DetailedResult<T, TD>,

</td></tr>
<tr><td>

[aggregateError(errors, formatter)](./Failure.aggregateError.md)

</td><td>



</td><td>

Propagates interior result, appending any error message to the

</td></tr>
<tr><td>

[report(reporter, options)](./Failure.report.md)

</td><td>



</td><td>

Reports the result to the supplied reporter

</td></tr>
<tr><td>

[withType()](./Failure.withType.md)

</td><td>



</td><td>

Re-types this Failure | Failure<T> as Failure | Failure<U> for

</td></tr>
<tr><td>

[toString()](./Failure.toString.md)

</td><td>



</td><td>

Get a 'friendly' string representation of this object.

</td></tr>
</tbody></table>
