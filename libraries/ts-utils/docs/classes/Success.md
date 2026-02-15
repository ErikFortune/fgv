[**@fgv/ts-utils**](../README.md)

***

[@fgv/ts-utils](../README.md) / Success

# Class: Success\<T\>

Reports a successful [result](../interfaces/IResult.md) from some operation and the
corresponding value.

## Extended by

- [`DetailedSuccess`](DetailedSuccess.md)

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Implements

- [`IResult`](../interfaces/IResult.md)\<`T`\>

## Constructors

### Constructor

> **new Success**\<`T`\>(`value`): `Success`\<`T`\>

Constructs a Success with the supplied value.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `T` | The value to be returned. |

#### Returns

`Success`\<`T`\>

## Properties

| Property | Modifier | Type | Default value | Description |
| ------ | ------ | ------ | ------ | ------ |
| <a id="message"></a> `message` | `readonly` | `undefined` | `undefined` | For a successful operation, the error message is always `undefined`. |
| <a id="success"></a> `success` | `readonly` | `true` | `true` | Indicates whether the operation was successful. |

## Accessors

### value

#### Get Signature

> **get** **value**(): `T`

The result value returned by the successful operation.

##### Returns

`T`

Value returned by a successful operation, undefined
for a failed operation.

#### Implementation of

[`IResult`](../interfaces/IResult.md).[`value`](../interfaces/IResult.md#value)

## Methods

### aggregateError()

> **aggregateError**(`__errors`, `__formatter?`): `this`

Propagates interior result, appending any error message to the
supplied errors array.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `__errors` | [`IMessageAggregator`](../interfaces/IMessageAggregator.md) | [Error aggregator](../interfaces/IMessageAggregator.md) in which errors will be aggregated. |
| `__formatter?` | [`ErrorFormatter`](../type-aliases/ErrorFormatter.md)\<`unknown`\> | An optional [error formatter](../type-aliases/ErrorFormatter.md) to be used to format the error message. |

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

> **getValueOrThrow**(`__logger?`): `T`

Gets the value associated with a successful [result](../interfaces/IResult.md),
or throws the error message if the corresponding operation failed.

Note that `getValueOrThrow` is being superseded by `orThrow` and
will eventually be deprecated.  Please use orDefault instead.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `__logger?` | [`IResultLogger`](../interfaces/IResultLogger.md)\<`unknown`\> | An optional [logger](../interfaces/IResultLogger.md) to which the error will also be reported. |

#### Returns

`T`

The return value, if the operation was successful.

#### Deprecated

Use [orThrow(logger)](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) or [orThrow(formatter)](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) instead.

#### Implementation of

[`IResult`](../interfaces/IResult.md).[`getValueOrThrow`](../interfaces/IResult.md#getvalueorthrow)

***

### isFailure()

> **isFailure**(): `this is Failure<T>`

Indicates whether this operation failed.  Functions
as a type guard for [Failure\<T\>](Failure.md).

#### Returns

`this is Failure<T>`

#### Implementation of

[`IResult`](../interfaces/IResult.md).[`isFailure`](../interfaces/IResult.md#isfailure)

***

### isSuccess()

> **isSuccess**(): `this is Success<T>`

Indicates whether this operation was successful.  Functions
as a type guard for Success\<T\>.

#### Returns

`this is Success<T>`

#### Implementation of

[`IResult`](../interfaces/IResult.md).[`isSuccess`](../interfaces/IResult.md#issuccess)

***

### onFailure()

> **onFailure**(`__`): [`Result`](../type-aliases/Result.md)\<`T`\>

Calls a supplied [failed continuation](../type-aliases/FailureContinuation.md) if
the operation failed.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `__` | [`FailureContinuation`](../type-aliases/FailureContinuation.md)\<`T`\> | The [failure continuation](../type-aliases/FailureContinuation.md) to be called in the event of failure. |

#### Returns

[`Result`](../type-aliases/Result.md)\<`T`\>

If this operation failed, returns the value returned by the
[failure continuation](../type-aliases/FailureContinuation.md).  If this result
was successful, propagates the result value from the successful event.

#### Implementation of

[`IResult`](../interfaces/IResult.md).[`onFailure`](../interfaces/IResult.md#onfailure)

***

### onSuccess()

> **onSuccess**\<`TN`\>(`cb`): [`Result`](../type-aliases/Result.md)\<`TN`\>

Calls a supplied [success continuation](../type-aliases/SuccessContinuation.md) if
the operation was a success.

#### Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `TN` |  |

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

> **orThrow**(`logger?`): `T`

Gets the value associated with a successful [result](../interfaces/IResult.md),
or throws the error message if the corresponding operation failed.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `logger?` | [`IResultLogger`](../interfaces/IResultLogger.md)\<`unknown`\> | An optional [logger](../interfaces/IResultLogger.md) to which the error will also be reported. |

##### Returns

`T`

The return value, if the operation was successful.

##### Implementation of

[`IResult`](../interfaces/IResult.md).[`orThrow`](../interfaces/IResult.md#orthrow)

#### Call Signature

> **orThrow**(`cb`): `T`

Gets the value associated with a successful [result](../interfaces/IResult.md),
or throws the error message if the corresponding operation failed.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cb` | [`ErrorFormatter`](../type-aliases/ErrorFormatter.md) | The [error formatter](../type-aliases/ErrorFormatter.md) to be called in the event of failure. |

##### Returns

`T`

The return value, if the operation was successful.

##### Implementation of

[`IResult`](../interfaces/IResult.md).[`orThrow`](../interfaces/IResult.md#orthrow)

***

### report()

> **report**(`reporter?`, `options?`): `Success`\<`T`\>

Reports the result to the supplied reporter

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `reporter?` | [`IResultReporter`](../interfaces/IResultReporter.md)\<`T`, `unknown`\> | The [reporter](../interfaces/IResultReporter.md) to which the result will be reported. |
| `options?` | [`IResultReportOptions`](../interfaces/IResultReportOptions.md)\<`unknown`\> | The [options](../interfaces/IResultReportOptions.md) for reporting the result. |

#### Returns

`Success`\<`T`\>

#### Implementation of

[`IResult`](../interfaces/IResult.md).[`report`](../interfaces/IResult.md#report)

***

### withDetail()

> **withDetail**\<`TD`\>(`detail`, `successDetail?`): [`DetailedResult`](../type-aliases/DetailedResult.md)\<`T`, `TD`\>

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
| `successDetail?` | `TD` | An optional detail to be added if this result was successful. |

#### Returns

[`DetailedResult`](../type-aliases/DetailedResult.md)\<`T`, `TD`\>

A new [DetailedResult\<T, TD\>](../type-aliases/DetailedResult.md) with either
the success result or the error message from this [IResult](../interfaces/IResult.md) and the
appropriate added detail.

#### Implementation of

[`IResult`](../interfaces/IResult.md).[`withDetail`](../interfaces/IResult.md#withdetail)

***

### withErrorFormat()

> **withErrorFormat**(`__cb`): [`Result`](../type-aliases/Result.md)\<`T`\>

Calls a supplied [error formatter](../type-aliases/ErrorFormatter.md) if
the operation failed.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `__cb` | [`ErrorFormatter`](../type-aliases/ErrorFormatter.md) | The [error formatter](../type-aliases/ErrorFormatter.md) to be called in the event of failure. |

#### Returns

[`Result`](../type-aliases/Result.md)\<`T`\>

If this operation failed, returns the returns [Failure](Failure.md)
with the message returned by the formatter.  If this result
was successful, propagates the result value from the successful event.

#### Implementation of

[`IResult`](../interfaces/IResult.md).[`withErrorFormat`](../interfaces/IResult.md#witherrorformat)

***

### withFailureDetail()

> **withFailureDetail**\<`TD`\>(`__detail`): [`DetailedResult`](../type-aliases/DetailedResult.md)\<`T`, `TD`\>

Converts a [IResult\<T\>](../interfaces/IResult.md) to a [DetailedResult\<T, TD\>](../type-aliases/DetailedResult.md),
adding a supplied detail if the operation failed.

#### Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `TD` |  |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `__detail` | `TD` | The detail to be added if this operation failed. |

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

> `static` **with**\<`T`\>(`value`): `Success`\<`T`\>

Creates a Success\<T\> with the supplied value.

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `T` | The value to be returned. |

#### Returns

`Success`\<`T`\>

The resulting Success\<T\> with the supplied value.
