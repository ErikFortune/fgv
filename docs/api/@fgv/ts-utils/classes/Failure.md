[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-utils](../README.md) / Failure

# Class: Failure\<T\>

Reports a failed [result](../interfaces/IResult.md) from some operation, with an error message.

## Extended by

- [`DetailedFailure`](DetailedFailure.md)

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |

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
| <a id="property-_message"></a> `_message` | `protected readonly` | `string` | `undefined` | **`Internal`** |
| <a id="property-success"></a> `success` | `public readonly` | `false` | `false` | Indicates whether the operation was successful. |
| <a id="property-value"></a> `value` | `public readonly` | `undefined` | `undefined` | Failed operation always returns undefined for value. |

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

[`IResult`](../interfaces/IResult.md).[`message`](../interfaces/IResult.md#property-message)

## Methods

### aggregateError()

> **aggregateError**(`errors`, `formatter?`): `this`

Propagates interior result, appending any error message to the
supplied errors array.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `errors` | [`IMessageAggregator`](../interfaces/IMessageAggregator.md) | [Error aggregator](../interfaces/IMessageAggregator.md) in which errors will be aggregated. |
| `formatter?` | [`ErrorFormatter`](../type-aliases/ErrorFormatter.md) | An optional [error formatter](../type-aliases/ErrorFormatter.md) to be used to format the error message. |

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

Use [orDefault(T)](#ordefault) or [orDefault()](#ordefault) instead.

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

Use [orThrow(logger)](#orthrow) or [orThrow(formatter)](#orthrow) instead.

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

| Type Parameter |
| ------ |
| <a id="type-parameter-tn"></a> `TN` |

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

#### Implementation of

[`IResult`](../interfaces/IResult.md).[`orDefaultWith`](../interfaces/IResult.md#ordefaultwith)

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

### shouldNotFail()

> **shouldNotFail**(`label?`, `frameDepth?`): `never`

Asserts at the call site that this [result](../interfaces/IResult.md) MUST be a success.
Returns the value on success; on failure, throws an `Error` whose message
is composed from the original failure message and the captured call-site
location (file, line, and where useful function name).

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `label?` | `string` | `undefined` | Optional human-meaningful identifier (e.g. the constant name) prefixed to the error message. |
| `frameDepth?` | `number` | `1` | Optional 1-indexed depth into the caller stack. Default `1` (immediate caller). Library authors wrapping `shouldNotFail` inside their own helper pass `2` to attribute to their caller. |

#### Returns

`never`

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

#### Implementation of

[`IResult`](../interfaces/IResult.md).[`shouldNotFail`](../interfaces/IResult.md#shouldnotfail)

***

### thenOnFailure()

> **thenOnFailure**(`cb`): [`AsyncResult`](AsyncResult.md)\<`T`\>

Calls a supplied [async failure continuation](../type-aliases/AsyncFailureContinuation.md) if
the operation failed, bridging into an [AsyncResult](AsyncResult.md) chain.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cb` | [`AsyncFailureContinuation`](../type-aliases/AsyncFailureContinuation.md)\<`T`\> | The [async failure continuation](../type-aliases/AsyncFailureContinuation.md) to be called in the event of failure. |

#### Returns

[`AsyncResult`](AsyncResult.md)\<`T`\>

An [AsyncResult](AsyncResult.md) wrapping the async continuation result, or
propagating the success value from this result.

#### Remarks

If the async callback rejects, the rejection is caught and converted
to a Failure.

#### Implementation of

[`IResult`](../interfaces/IResult.md).[`thenOnFailure`](../interfaces/IResult.md#thenonfailure)

***

### thenOnSuccess()

> **thenOnSuccess**\<`TN`\>(`__`): [`AsyncResult`](AsyncResult.md)\<`TN`\>

Calls a supplied [async success continuation](../type-aliases/AsyncSuccessContinuation.md) if
the operation was a success, bridging into an [AsyncResult](AsyncResult.md) chain.

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-tn-1"></a> `TN` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `__` | [`AsyncSuccessContinuation`](../type-aliases/AsyncSuccessContinuation.md)\<`T`, `TN`\> | The [async success continuation](../type-aliases/AsyncSuccessContinuation.md) to be called in the event of success. |

#### Returns

[`AsyncResult`](AsyncResult.md)\<`TN`\>

An [AsyncResult](AsyncResult.md) wrapping the async continuation result, or
propagating the error message from this failure.

#### Remarks

If the async callback rejects, the rejection is caught and converted
to a Failure.

#### Implementation of

[`IResult`](../interfaces/IResult.md).[`thenOnSuccess`](../interfaces/IResult.md#thenonsuccess)

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

| Type Parameter |
| ------ |
| <a id="type-parameter-td"></a> `TD` |

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

| Type Parameter |
| ------ |
| <a id="type-parameter-td-1"></a> `TD` |

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

### withType()

> **withType**\<`U`\>(): `Failure`\<`U`\>

Re-types this Failure\<T\> as Failure\<U\> for
propagation under a different success type.

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-u"></a> `U` |

#### Returns

`Failure`\<`U`\>

This same Failure instance, statically retyped as
Failure\<U\>.

#### Remarks

Supports the canonical Result early-return-after-`isFailure()` pattern when the
outer function's success type differs from the inner Result's success type:

```ts
const storeResult = await PromptStoreFixture.build(seed);
if (storeResult.isFailure()) {
  return storeResult.withType<PromptLibrary>();
}
return PromptLibrary.create({ store: storeResult.value, ... });
```

Without this helper, TypeScript rejects `return storeResult` because
`Failure<IPromptStore>` is invariant in `T` and not assignable to
`Result<PromptLibrary>`. The workaround `return fail<U>(r.message)` is
semantically equivalent but allocates a new Failure instance;
`withType` returns `this` and only retypes statically.

This method is sound because a Failure variant carries no `T`-shaped
data — only an error message — so re-typing it as `Failure<U>` cannot
misrepresent any value. The same operation is NOT exposed on [Success](Success.md)
because `Success<T>` carries `T`-shaped data and re-typing would be a lie.

For `DetailedResult` propagation that preserves a typed `detail`, consider
propagating the [DetailedFailure](DetailedFailure.md) directly through `onSuccess` (which
already re-types the success arm) rather than reaching for `withType`.

***

### with()

> `static` **with**\<`T`\>(`message`): `Failure`\<`T`\>

Creates a Failure\<T\> with the supplied error message.

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t-1"></a> `T` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message` | `string` | The error message to be returned. |

#### Returns

`Failure`\<`T`\>

The resulting Failure\<T\> with the supplied error message.
