[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Logging](../README.md) / InMemoryLogger

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
| <a id="loglevel"></a> `logLevel` | `public` | [`ReporterLogLevel`](../type-aliases/ReporterLogLevel.md) | `'info'` | The level of logging to be used. |

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

### clear()

> **clear**(): `void`

Clears the logged and suppressed messages.

#### Returns

`void`

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
