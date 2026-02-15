[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Logging](../README.md) / NoOpLogger

# Class: NoOpLogger

A no-op [LoggerBase](LoggerBase.md) that does not log anything.

## Extends

- [`LoggerBase`](LoggerBase.md)

## Constructors

### Constructor

> **new NoOpLogger**(`logLevel?`): `NoOpLogger`

Creates a new no-op logger.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `logLevel?` | [`ReporterLogLevel`](../type-aliases/ReporterLogLevel.md) | The level of logging to be used. |

#### Returns

`NoOpLogger`

#### Overrides

[`LoggerBase`](LoggerBase.md).[`constructor`](LoggerBase.md#constructor)

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

#### Inherited from

[`LoggerBase`](LoggerBase.md).[`_format`](LoggerBase.md#_format)

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

#### Inherited from

[`LoggerBase`](LoggerBase.md).[`_suppressLog`](LoggerBase.md#_suppresslog)

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

#### Inherited from

[`LoggerBase`](LoggerBase.md).[`detail`](LoggerBase.md#detail)

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

#### Inherited from

[`LoggerBase`](LoggerBase.md).[`error`](LoggerBase.md#error)

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

#### Inherited from

[`LoggerBase`](LoggerBase.md).[`info`](LoggerBase.md#info)

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

#### Inherited from

[`LoggerBase`](LoggerBase.md).[`log`](LoggerBase.md#log)

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

#### Inherited from

[`LoggerBase`](LoggerBase.md).[`warn`](LoggerBase.md#warn)
