[Home](../README.md) > AsyncResult

# Class: AsyncResult

Wraps a Promise of a Result to enable fluent chaining of both
synchronous and asynchronous operations.

**Implements:** `PromiseLike<Result<T>>`

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

`constructor(promise)`

</td><td>



</td><td>

Constructs an AsyncResult wrapping the supplied promise.

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

[from(result)](./AsyncResult.from.md)

</td><td>

`static`

</td><td>

Creates an AsyncResult from a Result.

</td></tr>
<tr><td>

[onSuccess(cb)](./AsyncResult.onSuccess.md)

</td><td>



</td><td>

Calls a supplied SuccessContinuation | success continuation if

</td></tr>
<tr><td>

[thenOnSuccess(cb)](./AsyncResult.thenOnSuccess.md)

</td><td>



</td><td>

Calls a supplied AsyncSuccessContinuation | async success continuation if

</td></tr>
<tr><td>

[onFailure(cb)](./AsyncResult.onFailure.md)

</td><td>



</td><td>

Calls a supplied FailureContinuation | failure continuation if

</td></tr>
<tr><td>

[thenOnFailure(cb)](./AsyncResult.thenOnFailure.md)

</td><td>



</td><td>

Calls a supplied AsyncFailureContinuation | async failure continuation if

</td></tr>
<tr><td>

[withErrorFormat(cb)](./AsyncResult.withErrorFormat.md)

</td><td>



</td><td>

Calls a supplied ErrorFormatter | error formatter if

</td></tr>
<tr><td>

[aggregateError(errors, formatter)](./AsyncResult.aggregateError.md)

</td><td>



</td><td>

Propagates the wrapped result, appending any error message to the

</td></tr>
<tr><td>

[report(reporter, options)](./AsyncResult.report.md)

</td><td>



</td><td>

Reports the wrapped result to the supplied reporter.

</td></tr>
<tr><td>

[then(onfulfilled, onrejected)](./AsyncResult.then.md)

</td><td>



</td><td>

Implementation of PromiseLike.then enabling `await` on AsyncResult.

</td></tr>
</tbody></table>
