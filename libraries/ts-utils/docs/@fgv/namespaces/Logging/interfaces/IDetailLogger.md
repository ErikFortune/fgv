[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Logging](../README.md) / IDetailLogger

# Interface: IDetailLogger

Extended logger interface that supports logging a short summary message at a
primary level (error/warn) while emitting the full detail at `detail` level.

The detail is suppressed by default (requires log level `'detail'` or `'all'`),
keeping the primary log clean while preserving the full context for debugging.

## Extends

- [`ILogger`](ILogger.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="loglevel"></a> `logLevel` | `readonly` | [`ReporterLogLevel`](../type-aliases/ReporterLogLevel.md) | The level of logging to be used. |

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

#### Inherited from

[`ILogger`](ILogger.md).[`detail`](ILogger.md#detail)

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

[`ILogger`](ILogger.md).[`error`](ILogger.md#error)

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

[`ILogger`](ILogger.md).[`info`](ILogger.md#info)

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

[`ILogger`](ILogger.md).[`log`](ILogger.md#log)

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

[`ILogger`](ILogger.md).[`warn`](ILogger.md#warn)

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
