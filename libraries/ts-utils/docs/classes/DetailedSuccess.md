[Home](../README.md) > DetailedSuccess

# Class: DetailedSuccess

A DetailedSuccess | DetailedSuccess extends Success | Success to report optional success
details in addition to the error message.

**Extends:** [`Success<T>`](Success.md)

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

`constructor(value, detail)`

</td><td>



</td><td>

Constructs a new DetailedSuccess | DetailedSuccess<T, TD> with the supplied
value and detail.

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

[detail](./DetailedSuccess.detail.md)

</td><td>

`readonly`

</td><td>

TD | undefined

</td><td>

The success detail associated with this DetailedSuccess, or `undefined` if

</td></tr>
<tr><td>

[asResult](./DetailedSuccess.asResult.md)

</td><td>

`readonly`

</td><td>

[Result](../type-aliases/Result.md)&lt;T&gt;

</td><td>

Returns this DetailedSuccess as a Result.

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

[with(value, detail)](./DetailedSuccess.with.md)

</td><td>

`static`

</td><td>

Creates a DetailedSuccess | DetailedSuccess<T, TD> with the supplied value and

</td></tr>
<tr><td>

[isSuccess()](./DetailedSuccess.isSuccess.md)

</td><td>



</td><td>

Reports that this DetailedSuccess is a success.

</td></tr>
<tr><td>

[onSuccess(cb)](./DetailedSuccess.onSuccess.md)

</td><td>



</td><td>

Invokes the supplied DetailedSuccessContinuation | success callback and propagates

</td></tr>
<tr><td>

[onFailure(__cb)](./DetailedSuccess.onFailure.md)

</td><td>



</td><td>

Propagates this DetailedSuccess.

</td></tr>
<tr><td>

[withErrorFormat(cb)](./DetailedSuccess.withErrorFormat.md)

</td><td>



</td><td>

Calls a supplied ErrorFormatter | error formatter if

</td></tr>
<tr><td>

[report(reporter, options)](./DetailedSuccess.report.md)

</td><td>



</td><td>

Reports the result to the supplied reporter

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
</tbody></table>
