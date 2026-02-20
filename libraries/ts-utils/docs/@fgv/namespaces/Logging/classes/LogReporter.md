[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Logging](../README.md) / LogReporter

# Class: LogReporter\<T, TD\>

Abstract base class which wraps an existing [ILogger](../interfaces/ILogger.md) to implement
both [ILogger](../interfaces/ILogger.md) and [IResultReporter](../../../../interfaces/IResultReporter.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TD` | `unknown` |

## Implements

- [`IDetailLogger`](../interfaces/IDetailLogger.md)
- [`IResultReporter`](../../../../interfaces/IResultReporter.md)\<`T`, `TD`\>

## Constructors

### Constructor

> **new LogReporter**\<`T`, `TD`\>(`params?`): `LogReporter`\<`T`, `TD`\>

Creates a new LogReporter.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params?` | [`ILogReporterCreateParams`](../interfaces/ILogReporterCreateParams.md)\<`T`, `TD`\> | The parameters for creating the LogReporter. |

#### Returns

`LogReporter`\<`T`, `TD`\>

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="logger"></a> `logger` | `readonly` | [`ILogger`](../interfaces/ILogger.md) | Base logger used to by this reporter. |

## Accessors

### logLevel

#### Get Signature

> **get** **logLevel**(): [`ReporterLogLevel`](../type-aliases/ReporterLogLevel.md)

The level of logging to be used.

##### Returns

[`ReporterLogLevel`](../type-aliases/ReporterLogLevel.md)

The level of logging to be used.

#### Implementation of

[`IDetailLogger`](../interfaces/IDetailLogger.md).[`logLevel`](../interfaces/IDetailLogger.md#loglevel)

## Methods

### detail()

> **detail**(`message?`, ...`parameters?`): [`Success`](../../../../classes/Success.md)\<`string` \| `undefined`\>

Logs a detail message.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message?` | `unknown` | The message to log. |
| ...`parameters?` | `unknown`[] | The parameters to log. |

#### Returns

[`Success`](../../../../classes/Success.md)\<`string` \| `undefined`\>

`Success` with the logged message if the level is enabled, or
`Success` with `undefined` if the message is suppressed.

#### Implementation of

[`IDetailLogger`](../interfaces/IDetailLogger.md).[`detail`](../interfaces/IDetailLogger.md#detail)

***

### error()

> **error**(`message?`, ...`parameters?`): [`Success`](../../../../classes/Success.md)\<`string` \| `undefined`\>

Logs an error message.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message?` | `unknown` | The message to log. |
| ...`parameters?` | `unknown`[] | The parameters to log. |

#### Returns

[`Success`](../../../../classes/Success.md)\<`string` \| `undefined`\>

`Success` with the logged message if the level is enabled, or
`Success` with `undefined` if the message is suppressed.

#### Implementation of

[`IDetailLogger`](../interfaces/IDetailLogger.md).[`error`](../interfaces/IDetailLogger.md#error)

***

### errorWithDetail()

> **errorWithDetail**(`message`, `detail`): [`Success`](../../../../classes/Success.md)\<`string` \| `undefined`\>

Logs a short error summary at `error` level, then emits `detail` at `detail` level.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message` | `string` | Short human-readable summary. |
| `detail` | `unknown` | Full detail (e.g. raw converter error) logged at `detail` level. |

#### Returns

[`Success`](../../../../classes/Success.md)\<`string` \| `undefined`\>

#### Implementation of

[`IDetailLogger`](../interfaces/IDetailLogger.md).[`errorWithDetail`](../interfaces/IDetailLogger.md#errorwithdetail)

***

### info()

> **info**(`message?`, ...`parameters?`): [`Success`](../../../../classes/Success.md)\<`string` \| `undefined`\>

Logs an info message.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message?` | `unknown` | The message to log. |
| ...`parameters?` | `unknown`[] | The parameters to log. |

#### Returns

[`Success`](../../../../classes/Success.md)\<`string` \| `undefined`\>

`Success` with the logged message if the level is enabled, or
`Success` with `undefined` if the message is suppressed.

#### Implementation of

[`IDetailLogger`](../interfaces/IDetailLogger.md).[`info`](../interfaces/IDetailLogger.md#info)

***

### log()

> **log**(`level`, `message?`, ...`parameters?`): [`Success`](../../../../classes/Success.md)\<`string` \| `undefined`\>

Logs a message at the given level.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `level` | [`MessageLogLevel`](../../../../type-aliases/MessageLogLevel.md) | The level of the message. |
| `message?` | `unknown` | The message to log. |
| ...`parameters?` | `unknown`[] | The parameters to log. |

#### Returns

[`Success`](../../../../classes/Success.md)\<`string` \| `undefined`\>

`Success` with the logged message if the level is enabled, or
`Success` with `undefined` if the message is suppressed.

#### Implementation of

[`IDetailLogger`](../interfaces/IDetailLogger.md).[`log`](../interfaces/IDetailLogger.md#log)

***

### reportFailure()

> **reportFailure**(`level`, `message`, `detail?`): `void`

Reports a failed result at the specified log level.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `level` | [`MessageLogLevel`](../../../../type-aliases/MessageLogLevel.md) |  |
| `message` | `string` |  |
| `detail?` | `TD` |  |

#### Returns

`void`

#### Implementation of

[`IResultReporter`](../../../../interfaces/IResultReporter.md).[`reportFailure`](../../../../interfaces/IResultReporter.md#reportfailure)

***

### reportSuccess()

> **reportSuccess**(`level`, `value`, `detail?`, `message?`): `void`

Reports a successful result at the specified log level.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `level` | [`MessageLogLevel`](../../../../type-aliases/MessageLogLevel.md) |  |
| `value` | `T` |  |
| `detail?` | `TD` |  |
| `message?` | [`ErrorFormatter`](../../../../type-aliases/ErrorFormatter.md)\<`TD`\> |  |

#### Returns

`void`

#### Implementation of

[`IResultReporter`](../../../../interfaces/IResultReporter.md).[`reportSuccess`](../../../../interfaces/IResultReporter.md#reportsuccess)

***

### warn()

> **warn**(`message?`, ...`parameters?`): [`Success`](../../../../classes/Success.md)\<`string` \| `undefined`\>

Logs a warning message.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message?` | `unknown` | The message to log. |
| ...`parameters?` | `unknown`[] | The parameters to log. |

#### Returns

[`Success`](../../../../classes/Success.md)\<`string` \| `undefined`\>

`Success` with the logged message if the level is enabled, or
`Success` with `undefined` if the message is suppressed.

#### Implementation of

[`IDetailLogger`](../interfaces/IDetailLogger.md).[`warn`](../interfaces/IDetailLogger.md#warn)

***

### warnWithDetail()

> **warnWithDetail**(`message`, `detail`): [`Success`](../../../../classes/Success.md)\<`string` \| `undefined`\>

Logs a short warning summary at `warning` level, then emits `detail` at `detail` level.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message` | `string` | Short human-readable summary. |
| `detail` | `unknown` | Full detail logged at `detail` level. |

#### Returns

[`Success`](../../../../classes/Success.md)\<`string` \| `undefined`\>

#### Implementation of

[`IDetailLogger`](../interfaces/IDetailLogger.md).[`warnWithDetail`](../interfaces/IDetailLogger.md#warnwithdetail)

***

### withValueFormatter()

> **withValueFormatter**\<`TN`\>(`valueFormatter`): `LogReporter`\<`TN`, `TD`\>

Creates a new LogReporter with the same logger but a different value formatter.

#### Type Parameters

| Type Parameter |
| ------ |
| `TN` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `valueFormatter` | [`LogValueFormatter`](../type-aliases/LogValueFormatter.md)\<`TN`, `TD`\> | The value formatter to use. |

#### Returns

`LogReporter`\<`TN`, `TD`\>

A new LogReporter with the same logger but a different value formatter.

***

### createDefault()

> `static` **createDefault**(`logger?`): [`Result`](../../../../type-aliases/Result.md)\<`LogReporter`\<`unknown`, `unknown`\>\>

Creates a default LogReporter with a [NoOpLogger](NoOpLogger.md) with the
supplied parameters, returning both the logger and reporter.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `logger?` | [`ILogger`](../interfaces/ILogger.md) | Optional logger to use; defaults to a new [NoOpLogger](NoOpLogger.md) if not provided. |

#### Returns

[`Result`](../../../../type-aliases/Result.md)\<`LogReporter`\<`unknown`, `unknown`\>\>

***

### tryFormatObject()

> `static` **tryFormatObject**\<`T`, `TD`\>(`value`, `detail?`): `string`

Generic method to try to format an object for logging.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `unknown` |
| `TD` | `unknown` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `T` | The value to format. |
| `detail?` | `TD` | The detail to format. |

#### Returns

`string`
