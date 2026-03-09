[**@fgv/ts-utils**](../README.md)

***

[@fgv/ts-utils](../README.md) / DetailedFailure

# Class: DetailedFailure\<T, TD\>

A DetailedFailure\<T, TD\> extends [Failure\<T\>](Failure.md) to report optional
failure details in addition to the error message.

## Extends

- [`Failure`](Failure.md)\<`T`\>

## Type Parameters

| Type Parameter |
| ------ |
| `T` |
| `TD` |

## Constructors

### Constructor

> **new DetailedFailure**\<`T`, `TD`\>(`message`, `detail?`): `DetailedFailure`\<`T`, `TD`\>

Constructs a new DetailedFailure\<T, TD\> with the supplied
message and detail.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message` | `string` | The message to be returned. |
| `detail?` | `TD` | The error detail to be returned. |

#### Returns

`DetailedFailure`\<`T`, `TD`\>

#### Overrides

[`Failure`](Failure.md).[`constructor`](Failure.md#constructor)

## Properties

| Property | Modifier | Type | Default value | Description |
| ------ | ------ | ------ | ------ | ------ |
| <a id="success"></a> `success` | `readonly` | `false` | `false` | Indicates whether the operation was successful. |
| <a id="value"></a> `value` | `readonly` | `undefined` | `undefined` | Failed operation always returns undefined for value. |

## Accessors

### asResult

#### Get Signature

> **get** **asResult**(): [`Result`](../type-aliases/Result.md)\<`T`\>

Returns this DetailedFailure as a [Result](../type-aliases/Result.md).

##### Returns

[`Result`](../type-aliases/Result.md)\<`T`\>

***

### detail

#### Get Signature

> **get** **detail**(): `TD` \| `undefined`

The error detail associated with this DetailedFailure.

##### Returns

`TD` \| `undefined`

***

### message

#### Get Signature

> **get** **message**(): `string`

Gets the error message associated with this error.

##### Returns

`string`

Error message returned by a failed operation, undefined
for a successful operation.

#### Inherited from

[`Failure`](Failure.md).[`message`](Failure.md#message)

## Methods

### aggregateError()

> **aggregateError**(`errors`, `formatter?`): `this`

Propagates interior result, appending any error message to the
supplied errors array.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `errors` | [`IMessageAggregator`](../interfaces/IMessageAggregator.md) | [Error aggregator](../interfaces/IMessageAggregator.md) in which errors will be aggregated. |
| `formatter?` | [`ErrorFormatter`](../type-aliases/ErrorFormatter.md)\<`TD`\> | An optional [error formatter](../type-aliases/ErrorFormatter.md) to be used to format the error message. |

#### Returns

`this`

#### Overrides

[`Failure`](Failure.md).[`aggregateError`](Failure.md#aggregateerror)

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

#### Inherited from

[`Failure`](Failure.md).[`getValueOrDefault`](Failure.md#getvalueordefault)

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

#### Inherited from

[`Failure`](Failure.md).[`getValueOrThrow`](Failure.md#getvalueorthrow)

***

### isFailure()

> **isFailure**(): `this is DetailedFailure<T, TD>`

Reports that this DetailedFailure is a failure.

#### Returns

`this is DetailedFailure<T, TD>`

`true`

#### Remarks

Always true for DetailedFailure but can be used as type guard
to discriminate [DetailedSuccess](DetailedSuccess.md) from DetailedFailure in
a [DetailedResult](../type-aliases/DetailedResult.md).

#### Overrides

[`Failure`](Failure.md).[`isFailure`](Failure.md#isfailure)

***

### isSuccess()

> **isSuccess**(): `this is Success<T>`

Indicates whether this operation was successful.  Functions
as a type guard for [Success\<T\>](Success.md).

#### Returns

`this is Success<T>`

#### Inherited from

[`Failure`](Failure.md).[`isSuccess`](Failure.md#issuccess)

***

### onFailure()

> **onFailure**(`cb`): [`DetailedResult`](../type-aliases/DetailedResult.md)\<`T`, `TD`\>

Invokes the supplied [failure callback](../type-aliases/DetailedFailureContinuation.md) and propagates
its returned [DetailedResult\<T, TD\>](../type-aliases/DetailedResult.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cb` | [`DetailedFailureContinuation`](../type-aliases/DetailedFailureContinuation.md)\<`T`, `TD`\> | The [failure callback](../type-aliases/DetailedFailureContinuation.md) to be invoked. |

#### Returns

[`DetailedResult`](../type-aliases/DetailedResult.md)\<`T`, `TD`\>

The [DetailedResult\<T, TD\>](../type-aliases/DetailedResult.md) returned by the failure callback.

#### Overrides

[`Failure`](Failure.md).[`onFailure`](Failure.md#onfailure)

***

### onSuccess()

> **onSuccess**\<`TN`\>(`__cb`): [`DetailedResult`](../type-aliases/DetailedResult.md)\<`TN`, `TD`\>

Propagates the error message and detail from this result.

#### Type Parameters

| Type Parameter |
| ------ |
| `TN` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `__cb` | [`DetailedSuccessContinuation`](../type-aliases/DetailedSuccessContinuation.md)\<`T`, `TD`, `TN`\> | [Success callback](../type-aliases/DetailedSuccessContinuation.md) to be called on a [DetailedResult](../type-aliases/DetailedResult.md) in case of success (ignored). |

#### Returns

[`DetailedResult`](../type-aliases/DetailedResult.md)\<`TN`, `TD`\>

A new DetailedFailure\<TN, TD\> which contains
the error message and detail from this one.

#### Remarks

Mutates the success type as the success callback would have, but does not
call the success callback.

#### Overrides

[`Failure`](Failure.md).[`onSuccess`](Failure.md#onsuccess)

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

##### Inherited from

[`Failure`](Failure.md).[`orDefault`](Failure.md#ordefault)

#### Call Signature

> **orDefault**(): `T` \| `undefined`

Gets the value associated with a successful [result](../interfaces/IResult.md),
or a default value if the corresponding operation failed.

##### Returns

`T` \| `undefined`

The return value, if the operation was successful, or
`undefined` if an error occurs.

##### Inherited from

[`Failure`](Failure.md).[`orDefault`](Failure.md#ordefault)

***

### orThrow()

#### Call Signature

> **orThrow**(`logOrFormat?`): `never`

Gets the value associated with a successful [result](../interfaces/IResult.md),
or throws the error message if the corresponding operation failed.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `logOrFormat?` | [`ErrorFormatter`](../type-aliases/ErrorFormatter.md)\<`TD`\> \| [`IResultLogger`](../interfaces/IResultLogger.md)\<`TD`\> | An optional [logger](../interfaces/IResultLogger.md) to which the error will also be reported. |

##### Returns

`never`

The return value, if the operation was successful.

##### Overrides

[`Failure`](Failure.md).[`orThrow`](Failure.md#orthrow)

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

##### Overrides

[`Failure`](Failure.md).[`orThrow`](Failure.md#orthrow)

***

### report()

> **report**(`reporter?`, `options?`): `DetailedFailure`\<`T`, `TD`\>

Reports the result to the supplied reporter

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `reporter?` | [`IResultReporter`](../interfaces/IResultReporter.md)\<`T`, `unknown`\> | The [reporter](../interfaces/IResultReporter.md) to which the result will be reported. |
| `options?` | [`IResultReportOptions`](../interfaces/IResultReportOptions.md)\<`unknown`\> | The [options](../interfaces/IResultReportOptions.md) for reporting the result. |

#### Returns

`DetailedFailure`\<`T`, `TD`\>

#### Overrides

[`Failure`](Failure.md).[`report`](Failure.md#report)

***

### toString()

> **toString**(): `string`

Get a 'friendly' string representation of this object.

#### Returns

`string`

A string representing this object.

#### Remarks

The string representation of a [Failure](Failure.md) value is the error message.

#### Inherited from

[`Failure`](Failure.md).[`toString`](Failure.md#tostring)

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

#### Inherited from

[`Failure`](Failure.md).[`withDetail`](Failure.md#withdetail)

***

### withErrorFormat()

> **withErrorFormat**(`cb`): [`DetailedResult`](../type-aliases/DetailedResult.md)\<`T`, `TD`\>

Calls a supplied [error formatter](../type-aliases/ErrorFormatter.md) if
the operation failed.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cb` | [`ErrorFormatter`](../type-aliases/ErrorFormatter.md)\<`TD`\> | The [error formatter](../type-aliases/ErrorFormatter.md) to be called in the event of failure. |

#### Returns

[`DetailedResult`](../type-aliases/DetailedResult.md)\<`T`, `TD`\>

If this operation failed, returns the returns [Failure](Failure.md)
with the message returned by the formatter.  If this result
was successful, propagates the result value from the successful event.

#### Overrides

[`Failure`](Failure.md).[`withErrorFormat`](Failure.md#witherrorformat)

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

#### Inherited from

[`Failure`](Failure.md).[`withFailureDetail`](Failure.md#withfailuredetail)

***

### with()

> `static` **with**\<`T`, `TD`\>(`message`, `detail?`): `DetailedFailure`\<`T`, `TD`\>

Creates a DetailedFailure\<T, TD\> with the supplied error message
and optional detail.

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |
| `TD` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message` | `string` | The error message to be returned. |
| `detail?` | `TD` | The error detail to be returned. |

#### Returns

`DetailedFailure`\<`T`, `TD`\>

The resulting DetailedFailure\<T, TD\> with the supplied
error message and detail.

#### Overrides

[`Failure`](Failure.md).[`with`](Failure.md#with)
