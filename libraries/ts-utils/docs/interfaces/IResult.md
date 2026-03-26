[Home](../README.md) > IResult

# Interface: IResult

Represents the result of some operation of sequence of operations.

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

[success](./IResult.success.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Indicates whether the operation was successful.

</td></tr>
<tr><td>

[value](./IResult.value.md)

</td><td>

`readonly`

</td><td>

T | undefined

</td><td>

Value returned by a successful operation, undefined

</td></tr>
<tr><td>

[message](./IResult.message.md)

</td><td>

`readonly`

</td><td>

string | undefined

</td><td>

Error message returned by a failed operation, undefined

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

[isSuccess()](./IResult.isSuccess.md)

</td><td>



</td><td>

Indicates whether this operation was successful.

</td></tr>
<tr><td>

[isFailure()](./IResult.isFailure.md)

</td><td>



</td><td>

Indicates whether this operation failed.

</td></tr>
<tr><td>

[getValueOrThrow(logger)](./IResult.getValueOrThrow.md)

</td><td>



</td><td>

Gets the value associated with a successful IResult | result,
or throws the error message if the corresponding operation failed.

</td></tr>
<tr><td>

[getValueOrDefault(dflt)](./IResult.getValueOrDefault.md)

</td><td>



</td><td>

Gets the value associated with a successful IResult | result,

</td></tr>
<tr><td>

[orThrow(logger)](./IResult.orThrow.md)

</td><td>



</td><td>

Gets the value associated with a successful IResult | result,

</td></tr>
<tr><td>

[orDefault(dflt)](./IResult.orDefault.md)

</td><td>



</td><td>

Gets the value associated with a successful IResult | result,

</td></tr>
<tr><td>

[onSuccess(cb)](./IResult.onSuccess.md)

</td><td>



</td><td>

Calls a supplied SuccessContinuation | success continuation if

</td></tr>
<tr><td>

[onFailure(cb)](./IResult.onFailure.md)

</td><td>



</td><td>

Calls a supplied FailureContinuation | failed continuation if

</td></tr>
<tr><td>

[withErrorFormat(cb)](./IResult.withErrorFormat.md)

</td><td>



</td><td>

Calls a supplied ErrorFormatter | error formatter if

</td></tr>
<tr><td>

[withFailureDetail(detail)](./IResult.withFailureDetail.md)

</td><td>



</td><td>

Converts a IResult | IResult<T> to a DetailedResult | DetailedResult<T, TD>,

</td></tr>
<tr><td>

[withDetail(detail, successDetail)](./IResult.withDetail.md)

</td><td>



</td><td>

Converts a IResult | IResult<T> to a DetailedResult | DetailedResult<T, TD>,

</td></tr>
<tr><td>

[aggregateError(errors, formatter)](./IResult.aggregateError.md)

</td><td>



</td><td>

Propagates interior result, appending any error message to the

</td></tr>
<tr><td>

[report(reporter, options)](./IResult.report.md)

</td><td>



</td><td>

Reports the result to the supplied reporter

</td></tr>
</tbody></table>
