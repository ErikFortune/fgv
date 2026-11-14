[Home](../README.md) > AsyncDetailedResult

# Class: AsyncDetailedResult

Wraps a `Promise` of a DetailedResult to enable fluent chaining of both synchronous
and asynchronous operations **without losing the detail type `<TD>`**.

**Extends:** [`AsyncResult<T>`](AsyncResult.md)

**Implements:** `PromiseLike<DetailedResult<T, TD>>`

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

Constructs an AsyncDetailedResult wrapping the supplied promise (or any
`PromiseLike` that resolves to a DetailedResult, such as another
AsyncDetailedResult).

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

[fromDetailed(result)](./AsyncDetailedResult.fromDetailed.md)

</td><td>

`static`

</td><td>

Creates an AsyncDetailedResult from a DetailedResult.

</td></tr>
<tr><td>

[from(result)](./AsyncResult.from.md)

</td><td>

`static`

</td><td>

Creates an AsyncResult from a Result.

</td></tr>
<tr><td>

[onSuccess(cb)](./AsyncDetailedResult.onSuccess.md)

</td><td>



</td><td>

Calls a supplied DetailedSuccessContinuation | success continuation if the wrapped

</td></tr>
<tr><td>

[thenOnSuccess(cb)](./AsyncDetailedResult.thenOnSuccess.md)

</td><td>



</td><td>

Calls a supplied AsyncDetailedSuccessContinuation | async success continuation if the

</td></tr>
<tr><td>

[onFailure(cb)](./AsyncDetailedResult.onFailure.md)

</td><td>



</td><td>

Calls a supplied DetailedFailureContinuation | failure continuation if the wrapped

</td></tr>
<tr><td>

[thenOnFailure(cb)](./AsyncDetailedResult.thenOnFailure.md)

</td><td>



</td><td>

Calls a supplied AsyncDetailedFailureContinuation | async failure continuation if the

</td></tr>
<tr><td>

[withErrorFormat(cb)](./AsyncDetailedResult.withErrorFormat.md)

</td><td>



</td><td>

Calls a supplied ErrorFormatter | error formatter if the wrapped result is a failure.

</td></tr>
<tr><td>

[aggregateError(errors, formatter)](./AsyncDetailedResult.aggregateError.md)

</td><td>



</td><td>

Propagates the wrapped result, appending any error message to the supplied errors aggregator.

</td></tr>
<tr><td>

[report(reporter, options)](./AsyncDetailedResult.report.md)

</td><td>



</td><td>

Reports the wrapped result to the supplied reporter.

</td></tr>
<tr><td>

[then(onfulfilled, onrejected)](./AsyncDetailedResult.then.md)

</td><td>



</td><td>

Implementation of `PromiseLike.then` enabling `await` on AsyncDetailedResult.

</td></tr>
</tbody></table>
