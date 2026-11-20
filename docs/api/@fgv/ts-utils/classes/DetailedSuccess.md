[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-utils](../README.md) / DetailedSuccess

# Class: DetailedSuccess\<T, TD\>

A DetailedSuccess extends [Success](Success.md) to report optional success
details in addition to the error message.

## Extends

- [`Success`](Success.md)\<`T`\>

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |
| <a id="type-parameter-td"></a> `TD` |

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
| <a id="property-_detail"></a> `_detail?` | `protected` | `TD` | `undefined` | **`Internal`** |
| <a id="property-_value"></a> `_value` | `protected readonly` | `T` | `undefined` | **`Internal`** |
| <a id="property-message"></a> `message` | `public readonly` | `undefined` | `undefined` | For a successful operation, the error message is always `undefined`. |
| <a id="property-success"></a> `success` | `public readonly` | `true` | `true` | Indicates whether the operation was successful. |

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
| `__formatter?` | [`ErrorFormatter`](../type-aliases/ErrorFormatter.md) | An optional [error formatter](../type-aliases/ErrorFormatter.md) to be used to format the error message. |

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

Use [orDefault(T)](Success.md#ordefault) or [orDefault()](Success.md#ordefault) instead.

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

Use [orThrow(logger)](Success.md#orthrow) or [orThrow(formatter)](Success.md#orthrow) instead.

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
| <a id="type-parameter-tn"></a> `TN` |

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

### orDefaultWith()

> **orDefaultWith**(`cb`): `T`

Gets the value associated with a successful [result](../interfaces/IResult.md), or a
default produced by the supplied callback if the corresponding operation
failed.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cb` | () => `T` | Produces the default. Invoked only when the operation failed. |

#### Returns

`T`

The result value if the operation succeeded, otherwise the value
returned by `cb`.

#### Remarks

The deferring sibling of [orDefault(T)](../interfaces/IResult.md#ordefault). The
callback runs **only on failure**, so an expensive default — a computation, a
file read, an allocation — costs nothing on the success path. Reach for this
whenever the default is anything more than a literal or an already-held
value; `orDefault(expensive())` evaluates its argument before the call and
pays that cost every time, which is a defect a reader has to look at the
*argument* to spot.

The name follows this library's `with*` convention for a method that takes a
callback (see [withErrorFormat](../interfaces/IResult.md#witherrorformat)).

#### Inherited from

[`Success`](Success.md).[`orDefaultWith`](Success.md#ordefaultwith)

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

### shouldNotFail()

> **shouldNotFail**(`__label?`, `__frameDepth?`): `T`

Asserts at the call site that this [result](../interfaces/IResult.md) MUST be a success.
Returns the value on success; on failure, throws an `Error` whose message
is composed from the original failure message and the captured call-site
location (file, line, and where useful function name).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `__label?` | `string` | Optional human-meaningful identifier (e.g. the constant name) prefixed to the error message. |
| `__frameDepth?` | `number` | Optional 1-indexed depth into the caller stack. Default `1` (immediate caller). Library authors wrapping `shouldNotFail` inside their own helper pass `2` to attribute to their caller. |

#### Returns

`T`

The result value, if the operation was successful.

#### Remarks

Use for declaration-time / setup-time invariants — module-level `const`
initializers, static class properties, static initialization blocks, and
test fixtures — where a failure indicates a coding bug that should
surface at the call site rather than propagate as a `Result`. For chains
where the throw is intentional control flow, prefer `orThrow`.

On V8 (Node + Chromium) `Error.captureStackTrace` is used to elide
`shouldNotFail` itself from the captured stack so the parsed frame is
the user's call site directly. On WebKit (where `captureStackTrace` is
unavailable) the stack is parsed manually and frames whose **parsed
function name** contains `shouldNotFail` are filtered out — the raw
stack-line text (including the file path) is deliberately NOT inspected,
so consumer files named after `shouldNotFail` are not collateral damage.
Function names and exact line numbers depend on source-map availability
in the runtime. When no caller frame is recoverable (e.g. `frameDepth`
out of range, or `frameDepth: 0`) the message falls back to the
label-only form (or the bare original message when no label is given).

Error message format (depending on whether a label and a usable function
name are available):
- both: `<label> (at <fn> in <file>:<line>): <original>`
- label only: `<label> (at <file>:<line>): <original>`
- fn only: `<fn> at <file>:<line>: <original>`
- neither: `<file>:<line>: <original>`

#### Inherited from

[`Success`](Success.md).[`shouldNotFail`](Success.md#shouldnotfail)

***

### thenOnFailure()

#### Call Signature

> **thenOnFailure**(`__cb`): [`AsyncDetailedResult`](AsyncDetailedResult.md)\<`T`, `TD`\>

Propagates this DetailedSuccess into an [AsyncDetailedResult](AsyncDetailedResult.md) chain without
invoking the callback.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `__cb` | [`AsyncDetailedFailureContinuation`](../type-aliases/AsyncDetailedFailureContinuation.md)\<`T`, `TD`\> | The [async failure callback](../type-aliases/AsyncDetailedFailureContinuation.md) to be called in case of failure (ignored). |

##### Returns

[`AsyncDetailedResult`](AsyncDetailedResult.md)\<`T`, `TD`\>

An [AsyncDetailedResult\<T, TD\>](AsyncDetailedResult.md) wrapping `this`.

##### Remarks

Overrides [Success.thenOnFailure](Success.md#thenonfailure) to preserve the detail type.

##### Overrides

[`Success`](Success.md).[`thenOnFailure`](Success.md#thenonfailure)

#### Call Signature

> **thenOnFailure**(`__cb`): [`AsyncResult`](AsyncResult.md)\<`T`\>

Back-compatible form of the overload above, for a callback which returns a plain
[Result](../type-aliases/Result.md) rather than a [DetailedResult](../type-aliases/DetailedResult.md).

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `__cb` | [`AsyncFailureContinuation`](../type-aliases/AsyncFailureContinuation.md)\<`T`\> | The async failure callback to be invoked. |

##### Returns

[`AsyncResult`](AsyncResult.md)\<`T`\>

An [AsyncResult](AsyncResult.md) wrapping the callback's result, with no detail.

##### Remarks

Declared so such a callback keeps compiling, and keeps yielding a plain [AsyncResult](AsyncResult.md),
exactly as it did when this class inherited [Success.thenOnFailure](Success.md#thenonfailure). Without it the override
would *narrow* the inherited parameter type, which is a source-breaking change even though it
only adds API surface - and therefore one an additive-looking API report cannot detect.

##### Overrides

`Success.thenOnFailure`

***

### thenOnSuccess()

#### Call Signature

> **thenOnSuccess**\<`TN`\>(`cb`): [`AsyncDetailedResult`](AsyncDetailedResult.md)\<`TN`, `TD`\>

Invokes the supplied [async success callback](../type-aliases/AsyncDetailedSuccessContinuation.md),
bridging into an [AsyncDetailedResult](AsyncDetailedResult.md) chain which preserves the detail type.

##### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-tn-1"></a> `TN` |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cb` | [`AsyncDetailedSuccessContinuation`](../type-aliases/AsyncDetailedSuccessContinuation.md)\<`T`, `TD`, `TN`\> | The [async success callback](../type-aliases/AsyncDetailedSuccessContinuation.md) to be invoked. |

##### Returns

[`AsyncDetailedResult`](AsyncDetailedResult.md)\<`TN`, `TD`\>

An [AsyncDetailedResult\<TN, TD\>](AsyncDetailedResult.md) wrapping the callback's
result.

##### Remarks

Overrides [Success.thenOnSuccess](Success.md#thenonsuccess), which returns a plain
[AsyncResult\<TN\>](AsyncResult.md) and would drop `<TD>` silently.

A callback which throws synchronously or returns a rejected promise yields a
[DetailedFailure](DetailedFailure.md) with no detail rather than escaping as an exception.

##### Overrides

[`Success`](Success.md).[`thenOnSuccess`](Success.md#thenonsuccess)

#### Call Signature

> **thenOnSuccess**\<`TN`\>(`cb`): [`AsyncResult`](AsyncResult.md)\<`TN`\>

Back-compatible form of the overload above, for a callback which returns a plain
[Result](../type-aliases/Result.md) rather than a [DetailedResult](../type-aliases/DetailedResult.md).

##### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-tn-2"></a> `TN` |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cb` | [`AsyncSuccessContinuation`](../type-aliases/AsyncSuccessContinuation.md)\<`T`, `TN`\> | The async success callback to be invoked. |

##### Returns

[`AsyncResult`](AsyncResult.md)\<`TN`\>

An [AsyncResult](AsyncResult.md) wrapping the callback's result, with no detail.

##### Remarks

Declared so such a callback keeps compiling, and keeps yielding a plain [AsyncResult](AsyncResult.md),
exactly as it did when this class inherited [Success.thenOnSuccess](Success.md#thenonsuccess). Without it the override
would *narrow* the inherited parameter type, which is a source-breaking change even though it
only adds API surface - and therefore one an additive-looking API report cannot detect.

##### Overrides

`Success.thenOnSuccess`

***

### withDetail()

> **withDetail**\<`TD`\>(`detail`, `successDetail?`): [`DetailedResult`](../type-aliases/DetailedResult.md)\<`T`, `TD`\>

Converts a [IResult\<T\>](../interfaces/IResult.md) to a [DetailedResult\<T, TD\>](../type-aliases/DetailedResult.md),
adding supplied details.

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-td-1"></a> `TD` |

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

| Type Parameter |
| ------ |
| <a id="type-parameter-td-2"></a> `TD` |

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
| <a id="type-parameter-t-1"></a> `T` |
| <a id="type-parameter-td-3"></a> `TD` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `T` |
| `detail?` | `TD` |

#### Returns

`DetailedSuccess`\<`T`, `TD`\>

#### Overrides

[`Success`](Success.md).[`with`](Success.md#with)
