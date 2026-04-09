[Home](../README.md) > DetailedFailure

# Class: DetailedFailure

A DetailedFailure | DetailedFailure<T, TD> extends Failure | Failure<T> to report optional
failure details in addition to the error message.

**Extends:** [`Failure<T>`](Failure.md)

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

`constructor(message, detail)`

</td><td>



</td><td>

Constructs a new DetailedFailure | DetailedFailure<T, TD> with the supplied
message and detail.

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

[detail](./DetailedFailure.detail.md)

</td><td>

`readonly`

</td><td>

TD | undefined

</td><td>

The error detail associated with this DetailedFailure.

</td></tr>
<tr><td>

[asResult](./DetailedFailure.asResult.md)

</td><td>

`readonly`

</td><td>

[Result](../type-aliases/Result.md)&lt;T&gt;

</td><td>

Returns this DetailedFailure as a Result.

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

[with(message, detail)](./DetailedFailure.with.md)

</td><td>

`static`

</td><td>

Creates a DetailedFailure | DetailedFailure<T, TD> with the supplied error message

</td></tr>
<tr><td>

[isFailure()](./DetailedFailure.isFailure.md)

</td><td>



</td><td>

Reports that this DetailedFailure is a failure.

</td></tr>
<tr><td>

[onSuccess(__cb)](./DetailedFailure.onSuccess.md)

</td><td>



</td><td>

Propagates the error message and detail from this result.

</td></tr>
<tr><td>

[onFailure(cb)](./DetailedFailure.onFailure.md)

</td><td>



</td><td>

Invokes the supplied DetailedFailureContinuation | failure callback and propagates

</td></tr>
<tr><td>

[withErrorFormat(cb)](./DetailedFailure.withErrorFormat.md)

</td><td>



</td><td>

Calls a supplied ErrorFormatter | error formatter if

</td></tr>
<tr><td>

[aggregateError(errors, formatter)](./DetailedFailure.aggregateError.md)

</td><td>



</td><td>

Propagates interior result, appending any error message to the

</td></tr>
<tr><td>

[report(reporter, options)](./DetailedFailure.report.md)

</td><td>



</td><td>

Reports the result to the supplied reporter

</td></tr>
<tr><td>

[orThrow(logOrFormat)](./DetailedFailure.orThrow.md)

</td><td>



</td><td>

Gets the value associated with a successful IResult | result,

</td></tr>
<tr><td>

[isSuccess()](./Failure.isSuccess.md)

</td><td>



</td><td>

Indicates whether this operation was successful.

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

[toString()](./Failure.toString.md)

</td><td>



</td><td>

Get a 'friendly' string representation of this object.

</td></tr>
</tbody></table>
