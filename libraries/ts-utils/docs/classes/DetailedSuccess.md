[**@fgv/ts-utils**](../README.md)

***

[@fgv/ts-utils](../README.md) / DetailedSuccess

# Class: DetailedSuccess\<T, TD\>

A DetailedSuccess extends [Success](Success.md) to report optional success
details in addition to the error message.

## Extends

- [`Success`](Success.md)\<`T`\>

## Type Parameters

| Type Parameter |
| ------ |
| `T` |
| `TD` |

## Constructors

### Constructor

> **new DetailedSuccess**\<`T`, `TD`\>(`value`, `detail?`): `DetailedSuccess`\<`T`, `TD`\>

Constructs a new DetailedSuccess\<T, TD\> with the supplied
value and detail.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `T` | The value to be returned. |
| `detail?` | `TD` | An optional successful detail to be returned. If omitted, detail will be `undefined`. |

#### Returns

`DetailedSuccess`\<`T`, `TD`\>

#### Overrides

[`Success`](Success.md).[`constructor`](Success.md#constructor)

## Properties

| Property | Modifier | Type | Default value | Description |
| ------ | ------ | ------ | ------ | ------ |
| <a id="message"></a> `message` | `readonly` | `undefined` | `undefined` | For a successful operation, the error message is always `undefined`. |
| <a id="success"></a> `success` | `readonly` | `true` | `true` | Indicates whether the operation was successful. |

## Accessors

### asResult

#### Get Signature

> **get** **asResult**(): [`Result`](../type-aliases/Result.md)\<`T`\>

Returns this DetailedSuccess as a [Result](../type-aliases/Result.md).

##### Returns

[`Result`](../type-aliases/Result.md)\<`T`\>

***

### detail

#### Get Signature

> **get** **detail**(): `TD` \| `undefined`

The success detail associated with this DetailedSuccess, or `undefined` if
no detail was supplied.

##### Returns

`TD` \| `undefined`

***

### value

#### Get Signature

> **get** **value**(): `T`

The result value returned by the successful operation.

##### Returns

`T`

Value returned by a successful operation, undefined
for a failed operation.

#### Inherited from

[`Success`](Success.md).[`value`](Success.md#value)

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

#### Inherited from

[`Success`](Success.md).[`aggregateError`](Success.md#aggregateerror)

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

[`Success`](Success.md).[`getValueOrDefault`](Success.md#getvalueordefault)

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

#### Inherited from

[`Success`](Success.md).[`getValueOrThrow`](Success.md#getvalueorthrow)

***

### isFailure()

> **isFailure**(): `this is Failure<T>`

Indicates whether this operation failed.  Functions
as a type guard for [Failure\<T\>](Failure.md).

#### Returns

`this is Failure<T>`

#### Inherited from

[`Success`](Success.md).[`isFailure`](Success.md#isfailure)

***

### isSuccess()

> **isSuccess**(): `this is DetailedSuccess<T, TD>`

Reports that this DetailedSuccess is a success.

#### Returns

`this is DetailedSuccess<T, TD>`

`true`

#### Remarks

Always true for DetailedSuccess but can be used as type guard
to discriminate DetailedSuccess from [DetailedFailure](DetailedFailure.md) in
a [DetailedResult](../type-aliases/DetailedResult.md).

#### Overrides

[`Success`](Success.md).[`isSuccess`](Success.md#issuccess)

***

### onFailure()

> **onFailure**(`__cb`): [`DetailedResult`](../type-aliases/DetailedResult.md)\<`T`, `TD`\>

Propagates this DetailedSuccess.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `__cb` | [`DetailedFailureContinuation`](../type-aliases/DetailedFailureContinuation.md)\<`T`, `TD`\> | [Failure callback](../type-aliases/DetailedFailureContinuation.md) to be called on a [DetailedResult](../type-aliases/DetailedResult.md) in case of failure (ignored). |

#### Returns

[`DetailedResult`](../type-aliases/DetailedResult.md)\<`T`, `TD`\>

`this`

#### Remarks

Failure does not mutate return type so we can return this event directly.

#### Overrides

[`Success`](Success.md).[`onFailure`](Success.md#onfailure)

***

### onSuccess()

> **onSuccess**\<`TN`\>(`cb`): [`DetailedResult`](../type-aliases/DetailedResult.md)\<`TN`, `TD`\>

Invokes the supplied [success callback](../type-aliases/DetailedSuccessContinuation.md) and propagates
its returned [DetailedResult\<TN, TD\>](../type-aliases/DetailedResult.md).

#### Type Parameters

| Type Parameter |
| ------ |
| `TN` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cb` | [`DetailedSuccessContinuation`](../type-aliases/DetailedSuccessContinuation.md)\<`T`, `TD`, `TN`\> | The [success callback](../type-aliases/DetailedSuccessContinuation.md) to be invoked. |

#### Returns

[`DetailedResult`](../type-aliases/DetailedResult.md)\<`TN`, `TD`\>

The [DetailedResult\<T, TD\>](../type-aliases/DetailedResult.md) returned by the success callback.

#### Remarks

The success callback mutates the return type from `<T>` to `<TN>`.

#### Overrides

[`Success`](Success.md).[`onSuccess`](Success.md#onsuccess)

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

[`Success`](Success.md).[`orDefault`](Success.md#ordefault)

#### Call Signature

> **orDefault**(): `T` \| `undefined`

Gets the value associated with a successful [result](../interfaces/IResult.md),
or a default value if the corresponding operation failed.

##### Returns

`T` \| `undefined`

The return value, if the operation was successful, or
`undefined` if an error occurs.

##### Inherited from

[`Success`](Success.md).[`orDefault`](Success.md#ordefault)

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

##### Inherited from

[`Success`](Success.md).[`orThrow`](Success.md#orthrow)

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

##### Inherited from

[`Success`](Success.md).[`orThrow`](Success.md#orthrow)

***

### report()

> **report**(`reporter?`, `options?`): `DetailedSuccess`\<`T`, `TD`\>

Reports the result to the supplied reporter

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `reporter?` | [`IResultReporter`](../interfaces/IResultReporter.md)\<`T`, `unknown`\> | The [reporter](../interfaces/IResultReporter.md) to which the result will be reported. |
| `options?` | [`IResultReportOptions`](../interfaces/IResultReportOptions.md)\<`unknown`\> | The [options](../interfaces/IResultReportOptions.md) for reporting the result. |

#### Returns

`DetailedSuccess`\<`T`, `TD`\>

#### Overrides

[`Success`](Success.md).[`report`](Success.md#report)

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

#### Inherited from

[`Success`](Success.md).[`withDetail`](Success.md#withdetail)

***

### withErrorFormat()

> **withErrorFormat**(`cb`): [`DetailedResult`](../type-aliases/DetailedResult.md)\<`T`, `TD`\>

Calls a supplied [error formatter](../type-aliases/ErrorFormatter.md) if
the operation failed.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cb` | [`ErrorFormatter`](../type-aliases/ErrorFormatter.md) | The [error formatter](../type-aliases/ErrorFormatter.md) to be called in the event of failure. |

#### Returns

[`DetailedResult`](../type-aliases/DetailedResult.md)\<`T`, `TD`\>

If this operation failed, returns the returns [Failure](Failure.md)
with the message returned by the formatter.  If this result
was successful, propagates the result value from the successful event.

#### Overrides

[`Success`](Success.md).[`withErrorFormat`](Success.md#witherrorformat)

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

#### Inherited from

[`Success`](Success.md).[`withFailureDetail`](Success.md#withfailuredetail)

***

### with()

> `static` **with**\<`T`, `TD`\>(`value`, `detail?`): `DetailedSuccess`\<`T`, `TD`\>

Creates a DetailedSuccess\<T, TD\> with the supplied value and
optional detail.

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |
| `TD` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `T` |
| `detail?` | `TD` |

#### Returns

`DetailedSuccess`\<`T`, `TD`\>

#### Overrides

[`Success`](Success.md).[`with`](Success.md#with)
