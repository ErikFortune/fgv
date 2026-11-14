[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-utils](../../../README.md) / [Logging](../README.md) / MultiLogger

# Class: MultiLogger

An [ILogger](../interfaces/ILogger.md) that fans every log call out to N child loggers,
each applying its own threshold.

## Remarks

The composite does not pre-filter — it forwards the raw `(level, message, ...params)`
to each child's public method so each child formats and filters per its own rules.
This lets a single pinned logger feed, for example, a [ConsoleLogger](ConsoleLogger.md)
(stdout) and a [RetainingLogger](RetainingLogger.md) (observability buffer)
with independent log levels.

## Implements

- [`ILogger`](../interfaces/ILogger.md)

## Constructors

### Constructor

> **new MultiLogger**(`loggers`): `MultiLogger`

Creates a new multi logger.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `loggers` | readonly [`ILogger`](../interfaces/ILogger.md)[] | The child loggers to fan calls out to. |

#### Returns

`MultiLogger`

## Accessors

### logLevel

#### Get Signature

> **get** **logLevel**(): [`ReporterLogLevel`](../type-aliases/ReporterLogLevel.md)

The most-verbose (most-permissive) level among the children, so an upstream
`shouldLog` gate does not suppress a call before it can fan out to a more
permissive child. Computed on access, since a child's level may change.

##### Returns

[`ReporterLogLevel`](../type-aliases/ReporterLogLevel.md)

The level of logging to be used.

#### Implementation of

[`ILogger`](../interfaces/ILogger.md).[`logLevel`](../interfaces/ILogger.md#property-loglevel)

## Methods

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

#### Implementation of

[`ILogger`](../interfaces/ILogger.md).[`detail`](../interfaces/ILogger.md#detail)

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

#### Implementation of

[`ILogger`](../interfaces/ILogger.md).[`error`](../interfaces/ILogger.md#error)

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

#### Implementation of

[`ILogger`](../interfaces/ILogger.md).[`info`](../interfaces/ILogger.md#info)

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

#### Implementation of

[`ILogger`](../interfaces/ILogger.md).[`log`](../interfaces/ILogger.md#log)

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

#### Implementation of

[`ILogger`](../interfaces/ILogger.md).[`warn`](../interfaces/ILogger.md#warn)
