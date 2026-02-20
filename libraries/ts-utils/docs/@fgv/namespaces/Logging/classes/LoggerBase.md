[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Logging](../README.md) / LoggerBase

# Abstract Class: LoggerBase

Abstract base class which implements [IDetailLogger](../interfaces/IDetailLogger.md).

## Extended by

- [`InMemoryLogger`](InMemoryLogger.md)
- [`ConsoleLogger`](ConsoleLogger.md)
- [`NoOpLogger`](NoOpLogger.md)

## Implements

- [`IDetailLogger`](../interfaces/IDetailLogger.md)

## Constructors

### Constructor

> `protected` **new LoggerBase**(`logLevel?`): `LoggerBase`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `logLevel?` | [`ReporterLogLevel`](../type-aliases/ReporterLogLevel.md) |

#### Returns

`LoggerBase`

## Properties

| Property | Modifier | Type | Default value | Description |
| ------ | ------ | ------ | ------ | ------ |
| <a id="loglevel"></a> `logLevel` | `public` | [`ReporterLogLevel`](../type-aliases/ReporterLogLevel.md) | `'info'` | The level of logging to be used. |

## Methods

### \_format()

> **\_format**(`message?`, ...`parameters?`): `string`

Formats a message and parameters into a string.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message?` | `unknown` | The message to format. |
| ...`parameters?` | `unknown`[] | The parameters to format. |

#### Returns

`string`

The formatted message.

***

### \_log()

> `abstract` **\_log**(`message`, `level`): [`Success`](../../../../classes/Success.md)\<`string` \| `undefined`\>

Inner method called for logged messages. Should be implemented by derived classes.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message` | `string` | The message to log. |
| `level` | [`MessageLogLevel`](../../../../type-aliases/MessageLogLevel.md) | The [level](../../../../type-aliases/MessageLogLevel.md) of the message. |

#### Returns

[`Success`](../../../../classes/Success.md)\<`string` \| `undefined`\>

`Success` with the logged message, or `Success` with `undefined` if the message is suppressed.

***

### \_suppressLog()

> **\_suppressLog**(`__level`, `__message?`, ...`__parameters?`): [`Success`](../../../../classes/Success.md)\<`undefined`\>

Inner method called for suppressed log messages.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `__level` | [`MessageLogLevel`](../../../../type-aliases/MessageLogLevel.md) |
| `__message?` | `unknown` |
| ...`__parameters?` | `unknown`[] |

#### Returns

[`Success`](../../../../classes/Success.md)\<`undefined`\>

***

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
