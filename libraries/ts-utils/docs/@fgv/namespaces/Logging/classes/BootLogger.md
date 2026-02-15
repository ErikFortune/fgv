[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Logging](../README.md) / BootLogger

# Class: BootLogger

A logger that buffers log entries during startup, then replays them
to a real logger once it becomes available.

## Remarks

During application bootstrap, the real logger (e.g. one backed by
toast notifications) may not be available yet. `BootLogger` solves
this by:
1. Buffering all log calls in memory during the boot phase.
2. When [ready()](#ready) is called with the real
   logger, replaying all buffered entries and then forwarding all
   subsequent calls directly.

## Example

```typescript
// Create early, before the real logger exists
const bootLogger = new BootLogger('detail');
bootLogger.info('Starting up...');

// Later, when the real logger is available
bootLogger.ready(realLogger);
// 'Starting up...' is replayed to realLogger
// All future calls go directly to realLogger
```

## Implements

- [`ILogger`](../interfaces/ILogger.md)

## Constructors

### Constructor

> **new BootLogger**(`logLevel?`): `BootLogger`

Creates a new boot logger.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `logLevel?` | [`ReporterLogLevel`](../type-aliases/ReporterLogLevel.md) | The log level for the initial in-memory buffer phase. Defaults to 'detail' to capture everything during boot. |

#### Returns

`BootLogger`

## Accessors

### isReady

#### Get Signature

> **get** **isReady**(): `boolean`

Whether the boot logger has been connected to a real logger.

##### Returns

`boolean`

***

### logLevel

#### Get Signature

> **get** **logLevel**(): [`ReporterLogLevel`](../type-aliases/ReporterLogLevel.md)

The level of logging to be used.

##### Returns

[`ReporterLogLevel`](../type-aliases/ReporterLogLevel.md)

The level of logging to be used.

#### Implementation of

[`ILogger`](../interfaces/ILogger.md).[`logLevel`](../interfaces/ILogger.md#loglevel)

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

[`ILogger`](../interfaces/ILogger.md).[`detail`](../interfaces/ILogger.md#detail)

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

[`ILogger`](../interfaces/ILogger.md).[`error`](../interfaces/ILogger.md#error)

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

[`ILogger`](../interfaces/ILogger.md).[`info`](../interfaces/ILogger.md#info)

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

[`ILogger`](../interfaces/ILogger.md).[`log`](../interfaces/ILogger.md#log)

***

### ready()

> **ready**(`logger`): `void`

Connects this boot logger to a real logger.
All buffered entries are replayed to the new logger in order,
and all subsequent calls are forwarded directly.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `logger` | [`ILogger`](../interfaces/ILogger.md) | The real logger to forward to. |

#### Returns

`void`

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

[`ILogger`](../interfaces/ILogger.md).[`warn`](../interfaces/ILogger.md#warn)
