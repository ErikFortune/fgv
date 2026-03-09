[**@fgv/ts-utils**](../README.md)

***

[@fgv/ts-utils](../README.md) / Failure

# Class: Failure\<T\>

Reports a failed [result](../interfaces/IResult.md) from some operation, with an error message.

## Extended by

- [`DetailedFailure`](DetailedFailure.md)

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Implements

- [`IResult`](../interfaces/IResult.md)\<`T`\>

## Constructors

### Constructor

> **new Failure**\<`T`\>(`message`): `Failure`\<`T`\>

Constructs a Failure with the supplied message.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message` | `string` | Error message to be reported. |

#### Returns

`Failure`\<`T`\>

## Properties

| Property | Modifier | Type | Default value | Description |
| ------ | ------ | ------ | ------ | ------ |
| <a id="success"></a> `success` | `readonly` | `false` | `false` | Indicates whether the operation was successful. |
| <a id="value"></a> `value` | `readonly` | `undefined` | `undefined` | Failed operation always returns undefined for value. |

## Accessors

### message

#### Get Signature

> **get** **message**(): `string`

Gets the error message associated with this error.

##### Returns

`string`

Error message returned by a failed operation, undefined
for a successful operation.

#### Implementation of

[`IResult`](../interfaces/IResult.md).[`message`](../interfaces/IResult.md#message)

## Methods

### aggregateError()

> **aggregateError**(`errors`, `formatter?`): `this`

Propagates interior result, appending any error message to the
supplied errors array.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `errors` | [`IMessageAggregator`](../interfaces/IMessageAggregator.md) | [Error aggregator](../interfaces/IMessageAggregator.md) in which errors will be aggregated. |
| `formatter?` | [`ErrorFormatter`](../type-aliases/ErrorFormatter.md)\<`unknown`\> | An optional [error formatter](../type-aliases/ErrorFormatter.md) to be used to format the error message. |

#### Returns

`this`

#### Implementation of

[`IResult`](../interfaces/IResult.md).[`aggregateError`](../interfaces/IResult.md#aggregateerror)

***

### ~~getValueOrDefault()~~

> **getValueOrDefault**(`dflt?`): `T` \| `undefined`

Gets the value associated with a successful [result](../interfaces/IResult.md),
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

Use [orDefault(T)](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) or [orDefault()](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) instead.

#### Implementation of

[`IResult`](../interfaces/IResult.md).[`getValueOrDefault`](../interfaces/IResult.md#getvalueordefault)

***

### ~~getValueOrThrow()~~

> **getValueOrThrow**(`logger?`): `never`

Gets the value associated with a successful [result](../interfaces/IResult.md),
or throws the error message if the corresponding operation failed.

Note that `getValueOrThrow` is being superseded by `orThrow` and
will eventually be deprecated.  Please use orDefault instead.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `logger?` | [`IResultLogger`](../interfaces/IResultLogger.md)\<`unknown`\> | An optional [logger](../interfaces/IResultLogger.md) to which the error will also be reported. |

#### Returns

`never`

The return value, if the operation was successful.

#### Deprecated

Use [orThrow(logger)](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) or [orThrow(formatter)](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) instead.

#### Implementation of

[`IResult`](../interfaces/IResult.md).[`getValueOrThrow`](../interfaces/IResult.md#getvalueorthrow)

***

### isFailure()

> **isFailure**(): `this is Failure<T>`

Indicates whether this operation failed.  Functions
as a type guard for Failure\<T\>.

#### Returns

`this is Failure<T>`

#### Implementation of

[`IResult`](../interfaces/IResult.md).[`isFailure`](../interfaces/IResult.md#isfailure)

***

### isSuccess()

> **isSuccess**(): `this is Success<T>`

Indicates whether this operation was successful.  Functions
as a type guard for [Success\<T\>](Success.md).

#### Returns

`this is Success<T>`

#### Implementation of

[`IResult`](../interfaces/IResult.md).[`isSuccess`](../interfaces/IResult.md#issuccess)

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

#### Implementation of

[`IResult`](../interfaces/IResult.md).[`onFailure`](../interfaces/IResult.md#onfailure)

***

### onSuccess()

> **onSuccess**\<`TN`\>(`__`): [`Result`](../type-aliases/Result.md)\<`TN`\>

Calls a supplied [success continuation](../type-aliases/SuccessContinuation.md) if
the operation was a success.

#### Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `TN` |  |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `__` | [`SuccessContinuation`](../type-aliases/SuccessContinuation.md)\<`T`, `TN`\> | The [success continuation](../type-aliases/SuccessContinuation.md) to be called in the event of success. |

#### Returns

[`Result`](../type-aliases/Result.md)\<`TN`\>

If this operation was successful, returns the value returned
by the [success continuation](../type-aliases/SuccessContinuation.md).  If this result
failed, propagates the error message from this failure.

#### Remarks

The [success continuation](../type-aliases/SuccessContinuation.md) might return a
different result type than [IResult](../interfaces/IResult.md) on which it is invoked. This
enables chaining of operations with heterogenous return types.

#### Implementation of

[`IResult`](../interfaces/IResult.md).[`onSuccess`](../interfaces/IResult.md#onsuccess)

***

### orDefault()

#### Call Signature

> **orDefault**(`dflt`): `T`

Gets the value associated with a successful [result](../interfaces/IResult.md),
or a default value if the corresponding operation failed.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `dflt` | `T` | The value to be returned if the operation failed. |

##### Returns

`T`

The return value, if the operation was successful.  Returns
the supplied default if an error occurred.

##### Implementation of

[`IResult`](../interfaces/IResult.md).[`orDefault`](../interfaces/IResult.md#ordefault)

#### Call Signature

> **orDefault**(): `T` \| `undefined`

Gets the value associated with a successful [result](../interfaces/IResult.md),
or a default value if the corresponding operation failed.

##### Returns

`T` \| `undefined`

The return value, if the operation was successful, or
`undefined` if an error occurs.

##### Implementation of

[`IResult`](../interfaces/IResult.md).[`orDefault`](../interfaces/IResult.md#ordefault)

***

### orThrow()

#### Call Signature

> **orThrow**(`logger?`): `never`

Gets the value associated with a successful [result](../interfaces/IResult.md),
or throws the error message if the corresponding operation failed.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `logger?` | [`IResultLogger`](../interfaces/IResultLogger.md)\<`unknown`\> | An optional [logger](../interfaces/IResultLogger.md) to which the error will also be reported. |

##### Returns

`never`

The return value, if the operation was successful.

##### Implementation of

[`IResult`](../interfaces/IResult.md).[`orThrow`](../interfaces/IResult.md#orthrow)

#### Call Signature

> **orThrow**(`cb`): `never`

Gets the value associated with a successful [result](../interfaces/IResult.md),
or throws the error message if the corresponding operation failed.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cb` | [`ErrorFormatter`](../type-aliases/ErrorFormatter.md) | The [error formatter](../type-aliases/ErrorFormatter.md) to be called in the event of failure. |

##### Returns

`never`

The return value, if the operation was successful.

##### Implementation of

[`IResult`](../interfaces/IResult.md).[`orThrow`](../interfaces/IResult.md#orthrow)

***

### report()

> **report**(`reporter?`, `options?`): `Failure`\<`T`\>

Reports the result to the supplied reporter

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `reporter?` | [`IResultReporter`](../interfaces/IResultReporter.md)\<`T`, `unknown`\> | The [reporter](../interfaces/IResultReporter.md) to which the result will be reported. |
| `options?` | [`IResultReportOptions`](../interfaces/IResultReportOptions.md)\<`unknown`\> | The [options](../interfaces/IResultReportOptions.md) for reporting the result. |

#### Returns

`Failure`\<`T`\>

#### Implementation of

[`IResult`](../interfaces/IResult.md).[`report`](../interfaces/IResult.md#report)

***

### toString()

> **toString**(): `string`

Get a 'friendly' string representation of this object.

#### Returns

`string`

A string representing this object.

#### Remarks

The string representation of a Failure value is the error message.

***

### withDetail()

> **withDetail**\<`TD`\>(`detail`, `__successDetail?`): [`DetailedResult`](../type-aliases/DetailedResult.md)\<`T`, `TD`\>

Converts a [IResult\<T\>](../interfaces/IResult.md) to a [DetailedResult\<T, TD\>](../type-aliases/DetailedResult.md),
adding supplied details.

#### Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `TD` |  |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `detail` | `TD` | The default detail to be added to the new [DetailedResult](../type-aliases/DetailedResult.md). |
| `__successDetail?` | `TD` | An optional detail to be added if this result was successful. |

#### Returns

[`DetailedResult`](../type-aliases/DetailedResult.md)\<`T`, `TD`\>

A new [DetailedResult\<T, TD\>](../type-aliases/DetailedResult.md) with either
the success result or the error message from this [IResult](../interfaces/IResult.md) and the
appropriate added detail.

#### Implementation of

[`IResult`](../interfaces/IResult.md).[`withDetail`](../interfaces/IResult.md#withdetail)

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

If this operation failed, returns the returns Failure
with the message returned by the formatter.  If this result
was successful, propagates the result value from the successful event.

#### Implementation of

[`IResult`](../interfaces/IResult.md).[`withErrorFormat`](../interfaces/IResult.md#witherrorformat)

***

### withFailureDetail()

> **withFailureDetail**\<`TD`\>(`detail`): [`DetailedResult`](../type-aliases/DetailedResult.md)\<`T`, `TD`\>

Converts a [IResult\<T\>](../interfaces/IResult.md) to a [DetailedResult\<T, TD\>](../type-aliases/DetailedResult.md),
adding a supplied detail if the operation failed.

#### Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `TD` |  |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `detail` | `TD` | The detail to be added if this operation failed. |

#### Returns

[`DetailedResult`](../type-aliases/DetailedResult.md)\<`T`, `TD`\>

A new [DetailedResult\<T, TD\>](../type-aliases/DetailedResult.md) with either
the success result or the error message from this [IResult](../interfaces/IResult.md), with
the supplied detail (if this event failed) or detail `undefined` (if
this result succeeded).

#### Implementation of

[`IResult`](../interfaces/IResult.md).[`withFailureDetail`](../interfaces/IResult.md#withfailuredetail)

***

### with()

> `static` **with**\<`T`\>(`message`): `Failure`\<`T`\>

Creates a Failure\<T\> with the supplied error message.

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message` | `string` | The error message to be returned. |

#### Returns

`Failure`\<`T`\>

The resulting Failure\<T\> with the supplied error message.
