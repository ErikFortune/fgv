[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-utils](../README.md) / DetailedFailure

# Class: DetailedFailure\<T, TD\>

A DetailedFailure\<T, TD\> extends [Failure\<T\>](Failure.md) to report optional
failure details in addition to the error message.

## Extends

- [`Failure`](Failure.md)\<`T`\>

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |
| <a id="type-parameter-td"></a> `TD` |

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
| <a id="property-_detail"></a> `_detail?` | `protected` | `TD` | `undefined` | **`Internal`** |
| <a id="property-_message"></a> `_message` | `protected readonly` | `string` | `undefined` | **`Internal`** |
| <a id="property-success"></a> `success` | `public readonly` | `false` | `false` | Indicates whether the operation was successful. |
| <a id="property-value"></a> `value` | `public readonly` | `undefined` | `undefined` | Failed operation always returns undefined for value. |

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

Use [orDefault(T)](Failure.md#ordefault) or [orDefault()](Failure.md#ordefault) instead.

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

Use [orThrow(logger)](Failure.md#orthrow) or [orThrow(formatter)](Failure.md#orthrow) instead.

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
| <a id="type-parameter-tn"></a> `TN` |

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

[`Failure`](Failure.md).[`orDefaultWith`](Failure.md#ordefaultwith)

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

#### Inherited from

[`Failure`](Failure.md).[`shouldNotFail`](Failure.md#shouldnotfail)

***

### thenOnFailure()

#### Call Signature

> **thenOnFailure**(`cb`): [`AsyncDetailedResult`](AsyncDetailedResult.md)\<`T`, `TD`\>

Invokes the supplied [async failure callback](../type-aliases/AsyncDetailedFailureContinuation.md),
bridging into an [AsyncDetailedResult](AsyncDetailedResult.md) chain which preserves the detail type.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cb` | [`AsyncDetailedFailureContinuation`](../type-aliases/AsyncDetailedFailureContinuation.md)\<`T`, `TD`\> | The [async failure callback](../type-aliases/AsyncDetailedFailureContinuation.md) to be invoked. |

##### Returns

[`AsyncDetailedResult`](AsyncDetailedResult.md)\<`T`, `TD`\>

An [AsyncDetailedResult\<T, TD\>](AsyncDetailedResult.md) wrapping the callback's
result.

##### Remarks

Overrides [Failure.thenOnFailure](Failure.md#thenonfailure) to preserve the detail type. The callback receives
this failure's detail alongside its message.

A callback which throws synchronously or returns a rejected promise yields a
DetailedFailure with no detail rather than escaping as an exception.

##### Overrides

[`Failure`](Failure.md).[`thenOnFailure`](Failure.md#thenonfailure)

#### Call Signature

> **thenOnFailure**(`cb`): [`AsyncResult`](AsyncResult.md)\<`T`\>

Back-compatible form of the overload above, for a callback which returns a plain
[Result](../type-aliases/Result.md) rather than a [DetailedResult](../type-aliases/DetailedResult.md).

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cb` | [`AsyncFailureContinuation`](../type-aliases/AsyncFailureContinuation.md)\<`T`\> | The async failure callback to be invoked. |

##### Returns

[`AsyncResult`](AsyncResult.md)\<`T`\>

An [AsyncResult](AsyncResult.md) wrapping the callback's result, with no detail.

##### Remarks

Declared so such a callback keeps compiling, and keeps yielding a plain [AsyncResult](AsyncResult.md),
exactly as it did when this class inherited [Failure.thenOnFailure](Failure.md#thenonfailure). Without it the override
would *narrow* the inherited parameter type, which is a source-breaking change even though it
only adds API surface - and therefore one an additive-looking API report cannot detect.

##### Overrides

`Failure.thenOnFailure`

***

### thenOnSuccess()

#### Call Signature

> **thenOnSuccess**\<`TN`\>(`__cb`): [`AsyncDetailedResult`](AsyncDetailedResult.md)\<`TN`, `TD`\>

Propagates this failure's message **and detail** into an [AsyncDetailedResult](AsyncDetailedResult.md) chain
without invoking the callback.

##### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-tn-1"></a> `TN` |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `__cb` | [`AsyncDetailedSuccessContinuation`](../type-aliases/AsyncDetailedSuccessContinuation.md)\<`T`, `TD`, `TN`\> | The [async success callback](../type-aliases/AsyncDetailedSuccessContinuation.md) to be called in case of success (ignored). |

##### Returns

[`AsyncDetailedResult`](AsyncDetailedResult.md)\<`TN`, `TD`\>

An [AsyncDetailedResult\<TN, TD\>](AsyncDetailedResult.md) carrying this failure's
message and detail.

##### Remarks

Overrides [Failure.thenOnSuccess](Failure.md#thenonsuccess), which returns a plain
[AsyncResult\<TN\>](AsyncResult.md) and would drop `<TD>` silently. Mutates the success
type as the success callback would have, exactly as [DetailedFailure.onSuccess](#onsuccess) does.

##### Overrides

[`Failure`](Failure.md).[`thenOnSuccess`](Failure.md#thenonsuccess)

#### Call Signature

> **thenOnSuccess**\<`TN`\>(`__cb`): [`AsyncResult`](AsyncResult.md)\<`TN`\>

Back-compatible form of the overload above, for a callback which returns a plain
[Result](../type-aliases/Result.md) rather than a [DetailedResult](../type-aliases/DetailedResult.md).

##### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-tn-2"></a> `TN` |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `__cb` | [`AsyncSuccessContinuation`](../type-aliases/AsyncSuccessContinuation.md)\<`T`, `TN`\> | The async success callback to be invoked. |

##### Returns

[`AsyncResult`](AsyncResult.md)\<`TN`\>

An [AsyncResult](AsyncResult.md) wrapping the callback's result, with no detail.

##### Remarks

Declared so such a callback keeps compiling, and keeps yielding a plain [AsyncResult](AsyncResult.md),
exactly as it did when this class inherited [Failure.thenOnSuccess](Failure.md#thenonsuccess). Without it the override
would *narrow* the inherited parameter type, which is a source-breaking change even though it
only adds API surface - and therefore one an additive-looking API report cannot detect.

##### Overrides

`Failure.thenOnSuccess`

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

| Type Parameter |
| ------ |
| <a id="type-parameter-td-1"></a> `TD` |

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

| Type Parameter |
| ------ |
| <a id="type-parameter-td-2"></a> `TD` |

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

### withType()

> **withType**\<`U`\>(): [`Failure`](Failure.md)\<`U`\>

Re-types this [Failure\<T\>](Failure.md) as [Failure\<U\>](Failure.md) for
propagation under a different success type.

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-u"></a> `U` |

#### Returns

[`Failure`](Failure.md)\<`U`\>

This same [Failure](Failure.md) instance, statically retyped as
[Failure\<U\>](Failure.md).

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
semantically equivalent but allocates a new [Failure](Failure.md) instance;
`withType` returns `this` and only retypes statically.

This method is sound because a [Failure](Failure.md) variant carries no `T`-shaped
data — only an error message — so re-typing it as `Failure<U>` cannot
misrepresent any value. The same operation is NOT exposed on [Success](Success.md)
because `Success<T>` carries `T`-shaped data and re-typing would be a lie.

For `DetailedResult` propagation that preserves a typed `detail`, consider
propagating the DetailedFailure directly through `onSuccess` (which
already re-types the success arm) rather than reaching for `withType`.

#### Inherited from

[`Failure`](Failure.md).[`withType`](Failure.md#withtype)

***

### with()

> `static` **with**\<`T`, `TD`\>(`message`, `detail?`): `DetailedFailure`\<`T`, `TD`\>

Creates a DetailedFailure\<T, TD\> with the supplied error message
and optional detail.

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t-1"></a> `T` |
| <a id="type-parameter-td-3"></a> `TD` |

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
