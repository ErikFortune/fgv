[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-utils](../README.md) / AsyncDetailedResult

# Class: AsyncDetailedResult\<T, TD\>

Wraps a `Promise` of a [DetailedResult](../type-aliases/DetailedResult.md) to enable fluent chaining of both synchronous
and asynchronous operations **without losing the detail type `<TD>`**.

## Remarks

`AsyncDetailedResult<T, TD>` is to [DetailedResult](../type-aliases/DetailedResult.md) exactly what [AsyncResult](AsyncResult.md)
is to [Result](../type-aliases/Result.md), and it **extends [AsyncResult\<T\>](AsyncResult.md)** for the same
reason [DetailedSuccess](DetailedSuccess.md) extends [Success](Success.md): a detailed result *is* a result, so
the detailed async ladder must be usable anywhere the plain one is. That inheritance is also
what lets [DetailedSuccess.thenOnSuccess](DetailedSuccess.md#thenonsuccess) and [DetailedFailure.thenOnSuccess](DetailedFailure.md#thenonsuccess)
override their base declarations while returning the narrower type.

Before this type existed, `someDetailedResult.thenOnSuccess(async (v) => ...)` inherited
`Success.thenOnSuccess` and returned a plain `AsyncResult<TN>` — it type-checked, and `TD`
was silently gone. Nothing failed at the chain site; the loss surfaced later (or never, if
the caller happened to widen anyway), which is what made it worth closing in the primitive
rather than working around per consumer.

**Rejections and synchronous throws carry no detail.** A callback that throws or returns a
rejected promise becomes a [DetailedFailure](DetailedFailure.md) whose `detail` is `undefined` — never an
escaped exception. There is no honest alternative: the thrown error supplies no `TD`, and
carrying the *upstream* detail forward would pair this failure's message with a previous
operation's detail. This matches `mapDetailedResultsAsync`, whose capture failures likewise
have no detail for `ignore` to match.

## Example

```typescript
const result: DetailedResult<Final, FailureReason> = await parse(input)
  .thenOnSuccess(async (parsed) => fetchData(parsed))
  .onSuccess((data) => transform(data))
  .withErrorFormat((msg, detail) => `pipeline failed (${detail?.kind}): ${msg}`);
```

## Extends

- [`AsyncResult`](AsyncResult.md)\<`T`\>

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |
| <a id="type-parameter-td"></a> `TD` |

## Implements

- `PromiseLike`\<[`DetailedResult`](../type-aliases/DetailedResult.md)\<`T`, `TD`\>\>

## Constructors

### Constructor

> **new AsyncDetailedResult**\<`T`, `TD`\>(`promise`): `AsyncDetailedResult`\<`T`, `TD`\>

Constructs an AsyncDetailedResult wrapping the supplied promise (or any
`PromiseLike` that resolves to a [DetailedResult](../type-aliases/DetailedResult.md), such as another
AsyncDetailedResult).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `promise` | `PromiseLike`\<[`DetailedResult`](../type-aliases/DetailedResult.md)\<`T`, `TD`\>\> | A `Promise` (or `PromiseLike`) that resolves to a [DetailedResult](../type-aliases/DetailedResult.md). |

#### Returns

`AsyncDetailedResult`\<`T`, `TD`\>

#### Remarks

If the supplied promise rejects, the rejection is caught and converted to a
[DetailedFailure](DetailedFailure.md) with no detail, ensuring that awaiting an
AsyncDetailedResult always yields a [DetailedResult](../type-aliases/DetailedResult.md).

#### Overrides

[`AsyncResult`](AsyncResult.md).[`constructor`](AsyncResult.md#constructor)

## Methods

### aggregateError()

> **aggregateError**(`errors`, `formatter?`): `AsyncDetailedResult`\<`T`, `TD`\>

Propagates the wrapped result, appending any error message to the supplied errors aggregator.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `errors` | [`IMessageAggregator`](../interfaces/IMessageAggregator.md) | [Error aggregator](../interfaces/IMessageAggregator.md) in which errors will be aggregated. |
| `formatter?` | [`ErrorFormatter`](../type-aliases/ErrorFormatter.md)\<`TD`\> | An optional [error formatter](../type-aliases/ErrorFormatter.md) to be used to format the error message. Receives the detail alongside the message. |

#### Returns

`AsyncDetailedResult`\<`T`, `TD`\>

A new AsyncDetailedResult wrapping the result after aggregation.

#### Overrides

[`AsyncResult`](AsyncResult.md).[`aggregateError`](AsyncResult.md#aggregateerror)

***

### onFailure()

> **onFailure**(`cb`): `AsyncDetailedResult`\<`T`, `TD`\>

Calls a supplied [failure continuation](../type-aliases/DetailedFailureContinuation.md) if the wrapped
result is a failure.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cb` | [`DetailedFailureContinuation`](../type-aliases/DetailedFailureContinuation.md)\<`T`, `TD`\> | The synchronous [failure continuation](../type-aliases/DetailedFailureContinuation.md) to be called in the event of failure. |

#### Returns

`AsyncDetailedResult`\<`T`, `TD`\>

A new AsyncDetailedResult wrapping the continuation result.

#### Overrides

[`AsyncResult`](AsyncResult.md).[`onFailure`](AsyncResult.md#onfailure)

***

### onSuccess()

> **onSuccess**\<`TN`\>(`cb`): `AsyncDetailedResult`\<`TN`, `TD`\>

Calls a supplied [success continuation](../type-aliases/DetailedSuccessContinuation.md) if the wrapped
result is successful.

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-tn"></a> `TN` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cb` | [`DetailedSuccessContinuation`](../type-aliases/DetailedSuccessContinuation.md)\<`T`, `TD`, `TN`\> | The synchronous [success continuation](../type-aliases/DetailedSuccessContinuation.md) to be called in the event of success. |

#### Returns

`AsyncDetailedResult`\<`TN`, `TD`\>

A new AsyncDetailedResult wrapping the continuation result.

#### Overrides

[`AsyncResult`](AsyncResult.md).[`onSuccess`](AsyncResult.md#onsuccess)

***

### report()

> **report**(`reporter?`, `options?`): `AsyncDetailedResult`\<`T`, `TD`\>

Reports the wrapped result to the supplied reporter.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `reporter?` | [`IResultReporter`](../interfaces/IResultReporter.md)\<`T`, `unknown`\> | The [reporter](../interfaces/IResultReporter.md) to which the result will be reported. |
| `options?` | [`IResultReportOptions`](../interfaces/IResultReportOptions.md)\<`unknown`\> | The [options](../interfaces/IResultReportOptions.md) for reporting the result. |

#### Returns

`AsyncDetailedResult`\<`T`, `TD`\>

A new AsyncDetailedResult wrapping the result after reporting.

#### Overrides

[`AsyncResult`](AsyncResult.md).[`report`](AsyncResult.md#report)

***

### then()

> **then**\<`TResult1`, `TResult2`\>(`onfulfilled?`, `onrejected?`): `Promise`\<`TResult1` \| `TResult2`\>

Implementation of `PromiseLike.then` enabling `await` on AsyncDetailedResult.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tresult1"></a> `TResult1` | [`DetailedResult`](../type-aliases/DetailedResult.md)\<`T`, `TD`\> |
| <a id="type-parameter-tresult2"></a> `TResult2` | `never` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `onfulfilled?` | ((`value`) => `TResult1` \| `PromiseLike`\<`TResult1`\>) \| `null` | Callback invoked when the promise resolves. |
| `onrejected?` | ((`reason`) => `TResult2` \| `PromiseLike`\<`TResult2`\>) \| `null` | Callback invoked when the promise rejects. |

#### Returns

`Promise`\<`TResult1` \| `TResult2`\>

A `Promise` resolving to the callback result.

#### Remarks

Narrows the base class's `Result<T>` to `DetailedResult<T, TD>`, so `await`ing a detailed
chain yields a value whose `detail` is typed.

#### Implementation of

`PromiseLike.then`

#### Overrides

[`AsyncResult`](AsyncResult.md).[`then`](AsyncResult.md#then)

***

### thenOnFailure()

> **thenOnFailure**(`cb`): `AsyncDetailedResult`\<`T`, `TD`\>

Calls a supplied [async failure continuation](../type-aliases/AsyncDetailedFailureContinuation.md) if the
wrapped result is a failure.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cb` | [`AsyncDetailedFailureContinuation`](../type-aliases/AsyncDetailedFailureContinuation.md)\<`T`, `TD`\> | The [async failure continuation](../type-aliases/AsyncDetailedFailureContinuation.md) to be called in the event of failure. |

#### Returns

`AsyncDetailedResult`\<`T`, `TD`\>

A new AsyncDetailedResult wrapping the async continuation result.

#### Remarks

Both synchronous throws and async rejections from the callback are caught and converted to a
[DetailedFailure](DetailedFailure.md) with no detail.

#### Overrides

[`AsyncResult`](AsyncResult.md).[`thenOnFailure`](AsyncResult.md#thenonfailure)

***

### thenOnSuccess()

> **thenOnSuccess**\<`TN`\>(`cb`): `AsyncDetailedResult`\<`TN`, `TD`\>

Calls a supplied [async success continuation](../type-aliases/AsyncDetailedSuccessContinuation.md) if the
wrapped result is successful.

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-tn-1"></a> `TN` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cb` | [`AsyncDetailedSuccessContinuation`](../type-aliases/AsyncDetailedSuccessContinuation.md)\<`T`, `TD`, `TN`\> | The [async success continuation](../type-aliases/AsyncDetailedSuccessContinuation.md) to be called in the event of success. |

#### Returns

`AsyncDetailedResult`\<`TN`, `TD`\>

A new AsyncDetailedResult wrapping the async continuation result.

#### Remarks

Both synchronous throws and async rejections from the callback are caught and converted to a
[DetailedFailure](DetailedFailure.md) with no detail.

#### Overrides

[`AsyncResult`](AsyncResult.md).[`thenOnSuccess`](AsyncResult.md#thenonsuccess)

***

### withErrorFormat()

> **withErrorFormat**(`cb`): `AsyncDetailedResult`\<`T`, `TD`\>

Calls a supplied [error formatter](../type-aliases/ErrorFormatter.md) if the wrapped result is a failure.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cb` | [`ErrorFormatter`](../type-aliases/ErrorFormatter.md)\<`TD`\> | The [error formatter](../type-aliases/ErrorFormatter.md) to be called in the event of failure. |

#### Returns

`AsyncDetailedResult`\<`T`, `TD`\>

A new AsyncDetailedResult with the formatted error message, or the original
success result.

#### Remarks

The formatter receives the detail as well as the message, matching
[DetailedFailure.withErrorFormat](DetailedFailure.md#witherrorformat). The reformatted failure keeps its detail.

#### Overrides

[`AsyncResult`](AsyncResult.md).[`withErrorFormat`](AsyncResult.md#witherrorformat)

***

### from()

> `static` **from**\<`T`\>(`result`): [`AsyncResult`](AsyncResult.md)\<`T`\>

Creates an [AsyncResult](AsyncResult.md) from a [Result](../type-aliases/Result.md).

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t-1"></a> `T` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `result` | [`Result`](../type-aliases/Result.md)\<`T`\> | The [Result](../type-aliases/Result.md) to wrap. |

#### Returns

[`AsyncResult`](AsyncResult.md)\<`T`\>

A new [AsyncResult](AsyncResult.md) wrapping the supplied result.

#### Inherited from

[`AsyncResult`](AsyncResult.md).[`from`](AsyncResult.md#from)

***

### fromDetailed()

> `static` **fromDetailed**\<`T`, `TD`\>(`result`): `AsyncDetailedResult`\<`T`, `TD`\>

Creates an AsyncDetailedResult from a [DetailedResult](../type-aliases/DetailedResult.md).

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t-2"></a> `T` |
| <a id="type-parameter-td-1"></a> `TD` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `result` | [`DetailedResult`](../type-aliases/DetailedResult.md)\<`T`, `TD`\> | The [DetailedResult](../type-aliases/DetailedResult.md) to wrap. |

#### Returns

`AsyncDetailedResult`\<`T`, `TD`\>

A new AsyncDetailedResult wrapping the supplied result.

#### Remarks

Named `fromDetailed` rather than overloading the inherited `from`: a static member which
narrowed its parameter from [Result](../type-aliases/Result.md) to [DetailedResult](../type-aliases/DetailedResult.md) would be unsound on the
static side, since `AsyncDetailedResult.from` is reachable through
[AsyncResult](AsyncResult.md)'s static type.  The inherited `AsyncResult.from` remains
available and still returns a plain [AsyncResult](AsyncResult.md).
