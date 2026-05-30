[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-utils](../README.md) / AsyncResult

# Class: AsyncResult\<T\>

Wraps a `Promise` of a [Result](../type-aliases/Result.md) to enable fluent chaining of both
synchronous and asynchronous operations.

## Remarks

`AsyncResult<T>` implements `PromiseLike` so it can be directly `await`ed.
Use the `thenOnSuccess` and `thenOnFailure` methods on [Result](../type-aliases/Result.md) to bridge
from synchronous to asynchronous result chains.

## Example

```typescript
const result: Result<Final> = await parseInput(input)
  .thenOnSuccess(async (parsed) => fetchData(parsed))
  .onSuccess((data) => transform(data))
  .thenOnSuccess(async (transformed) => saveData(transformed))
  .withErrorFormat((msg) => `pipeline failed: ${msg}`);
```

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Implements

- `PromiseLike`\<[`Result`](../type-aliases/Result.md)\<`T`\>\>

## Constructors

### Constructor

> **new AsyncResult**\<`T`\>(`promise`): `AsyncResult`\<`T`\>

Constructs an AsyncResult wrapping the supplied promise.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `promise` | `Promise`\<[`Result`](../type-aliases/Result.md)\<`T`\>\> | A `Promise` that resolves to a [Result](../type-aliases/Result.md). |

#### Returns

`AsyncResult`\<`T`\>

#### Remarks

If the supplied promise rejects, the rejection is caught and converted
to a [Failure](Failure.md), ensuring that awaiting an AsyncResult always
yields a [Result](../type-aliases/Result.md).

## Methods

### aggregateError()

> **aggregateError**(`errors`, `formatter?`): `AsyncResult`\<`T`\>

Propagates the wrapped result, appending any error message to the
supplied errors aggregator.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `errors` | [`IMessageAggregator`](../interfaces/IMessageAggregator.md) | [Error aggregator](../interfaces/IMessageAggregator.md) in which errors will be aggregated. |
| `formatter?` | [`ErrorFormatter`](../type-aliases/ErrorFormatter.md)\<`unknown`\> | An optional [error formatter](../type-aliases/ErrorFormatter.md) to be used to format the error message. |

#### Returns

`AsyncResult`\<`T`\>

A new AsyncResult wrapping the result after aggregation.

***

### onFailure()

> **onFailure**(`cb`): `AsyncResult`\<`T`\>

Calls a supplied [failure continuation](../type-aliases/FailureContinuation.md) if
the wrapped result is a failure.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cb` | [`FailureContinuation`](../type-aliases/FailureContinuation.md)\<`T`\> | The synchronous [failure continuation](../type-aliases/FailureContinuation.md) to be called in the event of failure. |

#### Returns

`AsyncResult`\<`T`\>

A new AsyncResult wrapping the continuation result.

***

### onSuccess()

> **onSuccess**\<`TN`\>(`cb`): `AsyncResult`\<`TN`\>

Calls a supplied [success continuation](../type-aliases/SuccessContinuation.md) if
the wrapped result is successful.

#### Type Parameters

| Type Parameter |
| ------ |
| `TN` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cb` | [`SuccessContinuation`](../type-aliases/SuccessContinuation.md)\<`T`, `TN`\> | The synchronous [success continuation](../type-aliases/SuccessContinuation.md) to be called in the event of success. |

#### Returns

`AsyncResult`\<`TN`\>

A new AsyncResult wrapping the continuation result.

***

### report()

> **report**(`reporter?`, `options?`): `AsyncResult`\<`T`\>

Reports the wrapped result to the supplied reporter.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `reporter?` | [`IResultReporter`](../interfaces/IResultReporter.md)\<`T`, `unknown`\> | The [reporter](../interfaces/IResultReporter.md) to which the result will be reported. |
| `options?` | [`IResultReportOptions`](../interfaces/IResultReportOptions.md)\<`unknown`\> | The [options](../interfaces/IResultReportOptions.md) for reporting the result. |

#### Returns

`AsyncResult`\<`T`\>

A new AsyncResult wrapping the result after reporting.

***

### then()

> **then**\<`TResult1`, `TResult2`\>(`onfulfilled?`, `onrejected?`): `Promise`\<`TResult1` \| `TResult2`\>

Implementation of `PromiseLike.then` enabling `await` on AsyncResult.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TResult1` | [`Result`](../type-aliases/Result.md)\<`T`\> |
| `TResult2` | `never` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `onfulfilled?` | (`value`) => `TResult1` \| `PromiseLike`\<`TResult1`\> \| `null` | Callback invoked when the promise resolves. |
| `onrejected?` | (`reason`) => `TResult2` \| `PromiseLike`\<`TResult2`\> \| `null` | Callback invoked when the promise rejects. |

#### Returns

`Promise`\<`TResult1` \| `TResult2`\>

A `Promise` resolving to the callback result.

#### Implementation of

`PromiseLike.then`

***

### thenOnFailure()

> **thenOnFailure**(`cb`): `AsyncResult`\<`T`\>

Calls a supplied [async failure continuation](../type-aliases/AsyncFailureContinuation.md) if
the wrapped result is a failure.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cb` | [`AsyncFailureContinuation`](../type-aliases/AsyncFailureContinuation.md)\<`T`\> | The [async failure continuation](../type-aliases/AsyncFailureContinuation.md) to be called in the event of failure. |

#### Returns

`AsyncResult`\<`T`\>

A new AsyncResult wrapping the async continuation result.

#### Remarks

Both synchronous throws and async rejections from the callback are caught
and converted to a [Failure](Failure.md).

***

### thenOnSuccess()

> **thenOnSuccess**\<`TN`\>(`cb`): `AsyncResult`\<`TN`\>

Calls a supplied [async success continuation](../type-aliases/AsyncSuccessContinuation.md) if
the wrapped result is successful.

#### Type Parameters

| Type Parameter |
| ------ |
| `TN` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cb` | [`AsyncSuccessContinuation`](../type-aliases/AsyncSuccessContinuation.md)\<`T`, `TN`\> | The [async success continuation](../type-aliases/AsyncSuccessContinuation.md) to be called in the event of success. |

#### Returns

`AsyncResult`\<`TN`\>

A new AsyncResult wrapping the async continuation result.

#### Remarks

Both synchronous throws and async rejections from the callback are caught
and converted to a [Failure](Failure.md).

***

### withErrorFormat()

> **withErrorFormat**(`cb`): `AsyncResult`\<`T`\>

Calls a supplied [error formatter](../type-aliases/ErrorFormatter.md) if
the wrapped result is a failure.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cb` | [`ErrorFormatter`](../type-aliases/ErrorFormatter.md) | The [error formatter](../type-aliases/ErrorFormatter.md) to be called in the event of failure. |

#### Returns

`AsyncResult`\<`T`\>

A new AsyncResult with the formatted error message,
or the original success result.

***

### from()

> `static` **from**\<`T`\>(`result`): `AsyncResult`\<`T`\>

Creates an AsyncResult from a [Result](../type-aliases/Result.md).

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `result` | [`Result`](../type-aliases/Result.md)\<`T`\> | The [Result](../type-aliases/Result.md) to wrap. |

#### Returns

`AsyncResult`\<`T`\>

A new AsyncResult wrapping the supplied result.
