[**@fgv/ts-utils**](../README.md)

***

[@fgv/ts-utils](../README.md) / IResult

# Interface: IResult\<T\>

Represents the result of some operation of sequence of operations.

## Remarks

This common contract enables commingled discriminated usage of [Success\<T\>](../classes/Success.md)
and [Failure\<T\>](../classes/Failure.md).

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="message"></a> `message` | `readonly` | `string` \| `undefined` | Error message returned by a failed operation, undefined for a successful operation. |
| <a id="success"></a> `success` | `readonly` | `boolean` | Indicates whether the operation was successful. |
| <a id="value"></a> `value` | `readonly` | `T` \| `undefined` | Value returned by a successful operation, undefined for a failed operation. |

## Methods

### aggregateError()

> **aggregateError**(`errors`, `formatter?`): `this`

Propagates interior result, appending any error message to the
supplied errors array.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `errors` | [`IMessageAggregator`](IMessageAggregator.md) | [Error aggregator](IMessageAggregator.md) in which errors will be aggregated. |
| `formatter?` | [`ErrorFormatter`](../type-aliases/ErrorFormatter.md)\<`unknown`\> | An optional [error formatter](../type-aliases/ErrorFormatter.md) to be used to format the error message. |

#### Returns

`this`

***

### ~~getValueOrDefault()~~

> **getValueOrDefault**(`dflt?`): `T` \| `undefined`

Gets the value associated with a successful result,
or a default value if the corresponding operation failed.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `dflt?` | `T` | The value to be returned if the operation failed (default is `undefined`). Note that `getValueOrDefault` is being superseded by `orDefault` and will eventually be deprecated. Please use orDefault instead. |

#### Returns

`T` \| `undefined`

The return value, if the operation was successful.  Returns
the supplied default value or `undefined` if no default is supplied.

#### Deprecated

Use [orDefault(T)](#ordefault) or [orDefault()](#ordefault) instead.

***

### ~~getValueOrThrow()~~

> **getValueOrThrow**(`logger?`): `T`

Gets the value associated with a successful result,
or throws the error message if the corresponding operation failed.

Note that `getValueOrThrow` is being superseded by `orThrow` and
will eventually be deprecated.  Please use orDefault instead.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `logger?` | [`IResultLogger`](IResultLogger.md)\<`unknown`\> | An optional [logger](IResultLogger.md) to which the error will also be reported. |

#### Returns

`T`

The return value, if the operation was successful.

#### Throws

The error message if the operation failed.

#### Deprecated

Use [orThrow(logger)](#orthrow) or [orThrow(formatter)](#orthrow) instead.

***

### isFailure()

> **isFailure**(): `this is Failure<T>`

Indicates whether this operation failed.  Functions
as a type guard for [Failure\<T\>](../classes/Failure.md).

#### Returns

`this is Failure<T>`

***

### isSuccess()

> **isSuccess**(): `this is Success<T>`

Indicates whether this operation was successful.  Functions
as a type guard for [Success\<T\>](../classes/Success.md).

#### Returns

`this is Success<T>`

***

### onFailure()

> **onFailure**(`cb`): [`Result`](../type-aliases/Result.md)\<`T`\>

Calls a supplied [failed continuation](../type-aliases/FailureContinuation.md) if
the operation failed.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cb` | [`FailureContinuation`](../type-aliases/FailureContinuation.md)\<`T`\> | The [failure continuation](../type-aliases/FailureContinuation.md) to be called in the event of failure. |

#### Returns

[`Result`](../type-aliases/Result.md)\<`T`\>

If this operation failed, returns the value returned by the
[failure continuation](../type-aliases/FailureContinuation.md).  If this result
was successful, propagates the result value from the successful event.

***

### onSuccess()

> **onSuccess**\<`TN`\>(`cb`): [`Result`](../type-aliases/Result.md)\<`TN`\>

Calls a supplied [success continuation](../type-aliases/SuccessContinuation.md) if
the operation was a success.

#### Type Parameters

| Type Parameter |
| ------ |
| `TN` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cb` | [`SuccessContinuation`](../type-aliases/SuccessContinuation.md)\<`T`, `TN`\> | The [success continuation](../type-aliases/SuccessContinuation.md) to be called in the event of success. |

#### Returns

[`Result`](../type-aliases/Result.md)\<`TN`\>

If this operation was successful, returns the value returned
by the [success continuation](../type-aliases/SuccessContinuation.md).  If this result
failed, propagates the error message from this failure.

#### Remarks

The [success continuation](../type-aliases/SuccessContinuation.md) might return a
different result type than IResult on which it is invoked. This
enables chaining of operations with heterogenous return types.

***

### orDefault()

#### Call Signature

> **orDefault**(`dflt`): `T`

Gets the value associated with a successful result,
or a default value if the corresponding operation failed.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `dflt` | `T` | The value to be returned if the operation failed. |

##### Returns

`T`

The return value, if the operation was successful.  Returns
the supplied default if an error occurred.

#### Call Signature

> **orDefault**(): `T` \| `undefined`

Gets the value associated with a successful result,
or a default value if the corresponding operation failed.

##### Returns

`T` \| `undefined`

The return value, if the operation was successful, or
`undefined` if an error occurs.

***

### orThrow()

#### Call Signature

> **orThrow**(`logger?`): `T`

Gets the value associated with a successful result,
or throws the error message if the corresponding operation failed.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `logger?` | [`IResultLogger`](IResultLogger.md)\<`unknown`\> | An optional [logger](IResultLogger.md) to which the error will also be reported. |

##### Returns

`T`

The return value, if the operation was successful.

##### Throws

The error message if the operation failed.

#### Call Signature

> **orThrow**(`cb`): `T`

Gets the value associated with a successful result,
or throws the error message if the corresponding operation failed.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cb` | [`ErrorFormatter`](../type-aliases/ErrorFormatter.md) | The [error formatter](../type-aliases/ErrorFormatter.md) to be called in the event of failure. |

##### Returns

`T`

The return value, if the operation was successful.

##### Throws

The error message if the operation failed.

***

### report()

> **report**(`reporter?`, `options?`): [`Result`](../type-aliases/Result.md)\<`T`\>

Reports the result to the supplied reporter

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `reporter?` | [`IResultReporter`](IResultReporter.md)\<`T`, `unknown`\> | The [reporter](IResultReporter.md) to which the result will be reported. |
| `options?` | [`IResultReportOptions`](IResultReportOptions.md)\<`unknown`\> | The [options](IResultReportOptions.md) for reporting the result. |

#### Returns

[`Result`](../type-aliases/Result.md)\<`T`\>

***

### withDetail()

> **withDetail**\<`TD`\>(`detail`, `successDetail?`): [`DetailedResult`](../type-aliases/DetailedResult.md)\<`T`, `TD`\>

Converts a IResult\<T\> to a [DetailedResult\<T, TD\>](../type-aliases/DetailedResult.md),
adding supplied details.

#### Type Parameters

| Type Parameter |
| ------ |
| `TD` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `detail` | `TD` | The default detail to be added to the new [DetailedResult](../type-aliases/DetailedResult.md). |
| `successDetail?` | `TD` | An optional detail to be added if this result was successful. |

#### Returns

[`DetailedResult`](../type-aliases/DetailedResult.md)\<`T`, `TD`\>

A new [DetailedResult\<T, TD\>](../type-aliases/DetailedResult.md) with either
the success result or the error message from this IResult and the
appropriate added detail.

***

### withErrorFormat()

> **withErrorFormat**(`cb`): [`Result`](../type-aliases/Result.md)\<`T`\>

Calls a supplied [error formatter](../type-aliases/ErrorFormatter.md) if
the operation failed.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cb` | [`ErrorFormatter`](../type-aliases/ErrorFormatter.md) | The [error formatter](../type-aliases/ErrorFormatter.md) to be called in the event of failure. |

#### Returns

[`Result`](../type-aliases/Result.md)\<`T`\>

If this operation failed, returns the returns [Failure](../classes/Failure.md)
with the message returned by the formatter.  If this result
was successful, propagates the result value from the successful event.

***

### withFailureDetail()

> **withFailureDetail**\<`TD`\>(`detail`): [`DetailedResult`](../type-aliases/DetailedResult.md)\<`T`, `TD`\>

Converts a IResult\<T\> to a [DetailedResult\<T, TD\>](../type-aliases/DetailedResult.md),
adding a supplied detail if the operation failed.

#### Type Parameters

| Type Parameter |
| ------ |
| `TD` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `detail` | `TD` | The detail to be added if this operation failed. |

#### Returns

[`DetailedResult`](../type-aliases/DetailedResult.md)\<`T`, `TD`\>

A new [DetailedResult\<T, TD\>](../type-aliases/DetailedResult.md) with either
the success result or the error message from this IResult, with
the supplied detail (if this event failed) or detail `undefined` (if
this result succeeded).
