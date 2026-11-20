[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-utils](../../../README.md) / [Logging](../README.md) / InMemoryLogger

# Class: InMemoryLogger

An in-memory logger that stores logged and suppressed messages.

## Extends

- [`LoggerBase`](LoggerBase.md)

## Constructors

### Constructor

> **new InMemoryLogger**(`logLevel?`): `InMemoryLogger`

Creates a new in-memory logger.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `logLevel?` | [`ReporterLogLevel`](../type-aliases/ReporterLogLevel.md) | The level of logging to be used. |

#### Returns

`InMemoryLogger`

#### Overrides

[`LoggerBase`](LoggerBase.md).[`constructor`](LoggerBase.md#constructor)

## Properties

| Property | Modifier | Type | Default value | Description |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-loglevel"></a> `logLevel` | `public` | [`ReporterLogLevel`](../type-aliases/ReporterLogLevel.md) | `'info'` | The level of logging to be used. |

## Accessors

### logged

#### Get Signature

> **get** **logged**(): `string`[]

The messages that have been logged.

##### Returns

`string`[]

***

### suppressed

#### Get Signature

> **get** **suppressed**(): `string`[]

The messages that have been suppressed.

##### Returns

`string`[]

## Methods

### \_format()

> **\_format**(`message?`, ...`parameters`): `string`

Formats a message and parameters into a string.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message?` | `unknown` | The message to format. |
| ...`parameters?` | `unknown`[] | The parameters to format. |

#### Returns

`string`

The formatted message.

#### Inherited from

[`LoggerBase`](LoggerBase.md).[`_format`](LoggerBase.md#_format)

***

### \_log()

> `protected` **\_log**(`message`, `__level`): [`Success`](../../../classes/Success.md)\<`string` \| `undefined`\>

Inner method called for logged messages. Should be implemented by derived classes.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message` | `string` | The message to log. |
| `__level` | [`MessageLogLevel`](../../../type-aliases/MessageLogLevel.md) | The [level](../../../type-aliases/MessageLogLevel.md) of the message. |

#### Returns

[`Success`](../../../classes/Success.md)\<`string` \| `undefined`\>

`Success` with the logged message, or `Success` with `undefined` if the message is suppressed.

#### Overrides

[`LoggerBase`](LoggerBase.md).[`_log`](LoggerBase.md#_log)

***

### \_logStructured()

> **\_logStructured**(`__level`, `__formatted`, `__message?`, `__parameters?`): `void`

Inner hook called for logged messages alongside [\_log](LoggerBase.md#_log),
exposing the structured `(level, formatted, message, parameters)` form before it is
collapsed to the formatted string. The default implementation is a no-op; subclasses
that need to retain structured records (e.g. [RetainingLogger](RetainingLogger.md))
override this. Fired only in the `shouldLog` branch, so suppressed messages never reach it.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `__level` | [`MessageLogLevel`](../../../type-aliases/MessageLogLevel.md) | The [level](../../../type-aliases/MessageLogLevel.md) of the message. |
| `__formatted` | `string` | The formatted message (same string passed to `_log`). |
| `__message?` | `unknown` | The raw message argument before formatting. |
| `__parameters?` | readonly `unknown`[] | The raw parameter arguments before formatting. |

#### Returns

`void`

#### Inherited from

[`LoggerBase`](LoggerBase.md).[`_logStructured`](LoggerBase.md#_logstructured)

***

### \_suppressLog()

> `protected` **\_suppressLog**(`level`, `message?`, ...`parameters`): [`Success`](../../../classes/Success.md)\<`undefined`\>

Inner method called for suppressed log messages.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `level` | [`MessageLogLevel`](../../../type-aliases/MessageLogLevel.md) |
| `message?` | `unknown` |
| ...`parameters?` | `unknown`[] |

#### Returns

[`Success`](../../../classes/Success.md)\<`undefined`\>

#### Overrides

[`LoggerBase`](LoggerBase.md).[`_suppressLog`](LoggerBase.md#_suppresslog)

***

### clear()

> **clear**(): `void`

Clears the logged and suppressed messages.

#### Returns

`void`

***

### detail()

> **detail**(`message?`, ...`parameters`): [`Success`](../../../classes/Success.md)\<`string` \| `undefined`\>

Logs a detail message.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message?` | `unknown` | The message to log. |
| ...`parameters?` | `unknown`[] | The parameters to log. |

#### Returns

[`Success`](../../../classes/Success.md)\<`string` \| `undefined`\>

`Success` with the logged message if the level is enabled, or
`Success` with `undefined` if the message is suppressed.

#### Inherited from

[`LoggerBase`](LoggerBase.md).[`detail`](LoggerBase.md#detail)

***

### error()

> **error**(`message?`, ...`parameters`): [`Success`](../../../classes/Success.md)\<`string` \| `undefined`\>

Logs an error message.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message?` | `unknown` | The message to log. |
| ...`parameters?` | `unknown`[] | The parameters to log. |

#### Returns

[`Success`](../../../classes/Success.md)\<`string` \| `undefined`\>

`Success` with the logged message if the level is enabled, or
`Success` with `undefined` if the message is suppressed.

#### Inherited from

[`LoggerBase`](LoggerBase.md).[`error`](LoggerBase.md#error)

***

### errorWithDetail()

> **errorWithDetail**(`message`, `detail`): [`Success`](../../../classes/Success.md)\<`string` \| `undefined`\>

Logs a short error summary at `error` level, then emits `detail` at `detail` level.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message` | `string` | Short human-readable summary. |
| `detail` | `unknown` | Full detail (e.g. raw converter error) logged at `detail` level. |

#### Returns

[`Success`](../../../classes/Success.md)\<`string` \| `undefined`\>

#### Inherited from

[`LoggerBase`](LoggerBase.md).[`errorWithDetail`](LoggerBase.md#errorwithdetail)

***

### info()

> **info**(`message?`, ...`parameters`): [`Success`](../../../classes/Success.md)\<`string` \| `undefined`\>

Logs an info message.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message?` | `unknown` | The message to log. |
| ...`parameters?` | `unknown`[] | The parameters to log. |

#### Returns

[`Success`](../../../classes/Success.md)\<`string` \| `undefined`\>

`Success` with the logged message if the level is enabled, or
`Success` with `undefined` if the message is suppressed.

#### Inherited from

[`LoggerBase`](LoggerBase.md).[`info`](LoggerBase.md#info)

***

### log()

> **log**(`level`, `message?`, ...`parameters`): [`Success`](../../../classes/Success.md)\<`string` \| `undefined`\>

Logs a message at the given level.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `level` | [`MessageLogLevel`](../../../type-aliases/MessageLogLevel.md) | The level of the message. |
| `message?` | `unknown` | The message to log. |
| ...`parameters?` | `unknown`[] | The parameters to log. |

#### Returns

[`Success`](../../../classes/Success.md)\<`string` \| `undefined`\>

`Success` with the logged message if the level is enabled, or
`Success` with `undefined` if the message is suppressed.

#### Inherited from

[`LoggerBase`](LoggerBase.md).[`log`](LoggerBase.md#log)

***

### warn()

> **warn**(`message?`, ...`parameters`): [`Success`](../../../classes/Success.md)\<`string` \| `undefined`\>

Logs a warning message.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message?` | `unknown` | The message to log. |
| ...`parameters?` | `unknown`[] | The parameters to log. |

#### Returns

[`Success`](../../../classes/Success.md)\<`string` \| `undefined`\>

`Success` with the logged message if the level is enabled, or
`Success` with `undefined` if the message is suppressed.

#### Inherited from

[`LoggerBase`](LoggerBase.md).[`warn`](LoggerBase.md#warn)

***

### warnWithDetail()

> **warnWithDetail**(`message`, `detail`): [`Success`](../../../classes/Success.md)\<`string` \| `undefined`\>

Logs a short warning summary at `warning` level, then emits `detail` at `detail` level.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message` | `string` | Short human-readable summary. |
| `detail` | `unknown` | Full detail logged at `detail` level. |

#### Returns

[`Success`](../../../classes/Success.md)\<`string` \| `undefined`\>

#### Inherited from

[`LoggerBase`](LoggerBase.md).[`warnWithDetail`](LoggerBase.md#warnwithdetail)
