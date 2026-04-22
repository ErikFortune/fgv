[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ObservabilityTools](../README.md) / ViewStateUserLogger

# Class: ViewStateUserLogger

ViewState-connected user logger that forwards messages to viewState.addMessage().
This logger bridges the observability system with React component state management.

## Extends

- [`LoggerBase`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)

## Implements

- [`IUserLogger`](../interfaces/IUserLogger.md)

## Constructors

### Constructor

> **new ViewStateUserLogger**(`addMessage`, `logLevel?`): `ViewStateUserLogger`

Creates a new ViewState user logger.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `addMessage` | (`type`, `message`) => `void` | Function to add messages to viewState (typically viewState.addMessage) |
| `logLevel?` | [`ReporterLogLevel`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) | The level of logging to be used. |

#### Returns

`ViewStateUserLogger`

#### Overrides

`Logging.LoggerBase.constructor`

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="loglevel"></a> `logLevel` | [`ReporterLogLevel`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) | The level of logging to be used. |

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

`Logging.LoggerBase._format`

***

### \_log()

> `protected` **\_log**(`message`, `level`): [`Success`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string` \| `undefined`\>

Implements base class _log method by forwarding to viewState.addMessage.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `message` | `string` |
| `level` | [`MessageLogLevel`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) |

#### Returns

[`Success`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string` \| `undefined`\>

#### Overrides

`Logging.LoggerBase._log`

***

### \_suppressLog()

> **\_suppressLog**(`__level`, `__message?`, ...`__parameters?`): [`Success`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`undefined`\>

Inner method called for suppressed log messages.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `__level` | [`MessageLogLevel`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) |
| `__message?` | `unknown` |
| ...`__parameters?` | `unknown`[] |

#### Returns

[`Success`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`undefined`\>

#### Inherited from

`Logging.LoggerBase._suppressLog`

***

### detail()

> **detail**(`message?`, ...`parameters?`): [`Success`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string` \| `undefined`\>

Logs a detail message.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message?` | `unknown` | The message to log. |
| ...`parameters?` | `unknown`[] | The parameters to log. |

#### Returns

[`Success`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string` \| `undefined`\>

`Success` with the logged message if the level is enabled, or
`Success` with `undefined` if the message is suppressed.

#### Implementation of

[`IUserLogger`](../interfaces/IUserLogger.md).[`detail`](../interfaces/IUserLogger.md#detail)

#### Inherited from

`Logging.LoggerBase.detail`

***

### error()

> **error**(`message?`, ...`parameters?`): [`Success`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string` \| `undefined`\>

Logs an error message.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message?` | `unknown` | The message to log. |
| ...`parameters?` | `unknown`[] | The parameters to log. |

#### Returns

[`Success`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string` \| `undefined`\>

`Success` with the logged message if the level is enabled, or
`Success` with `undefined` if the message is suppressed.

#### Implementation of

[`IUserLogger`](../interfaces/IUserLogger.md).[`error`](../interfaces/IUserLogger.md#error)

#### Inherited from

`Logging.LoggerBase.error`

***

### errorWithDetail()

> **errorWithDetail**(`message`, `detail`): [`Success`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string` \| `undefined`\>

Logs a short error summary at `error` level, then emits `detail` at `detail` level.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message` | `string` | Short human-readable summary. |
| `detail` | `unknown` | Full detail (e.g. raw converter error) logged at `detail` level. |

#### Returns

[`Success`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string` \| `undefined`\>

#### Inherited from

`Logging.LoggerBase.errorWithDetail`

***

### info()

> **info**(`message?`, ...`parameters?`): [`Success`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string` \| `undefined`\>

Logs an info message.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message?` | `unknown` | The message to log. |
| ...`parameters?` | `unknown`[] | The parameters to log. |

#### Returns

[`Success`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string` \| `undefined`\>

`Success` with the logged message if the level is enabled, or
`Success` with `undefined` if the message is suppressed.

#### Implementation of

[`IUserLogger`](../interfaces/IUserLogger.md).[`info`](../interfaces/IUserLogger.md#info)

#### Inherited from

`Logging.LoggerBase.info`

***

### log()

> **log**(`level`, `message?`, ...`parameters?`): [`Success`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string` \| `undefined`\>

Logs a message at the given level.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `level` | [`MessageLogLevel`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) | The level of the message. |
| `message?` | `unknown` | The message to log. |
| ...`parameters?` | `unknown`[] | The parameters to log. |

#### Returns

[`Success`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string` \| `undefined`\>

`Success` with the logged message if the level is enabled, or
`Success` with `undefined` if the message is suppressed.

#### Implementation of

[`IUserLogger`](../interfaces/IUserLogger.md).[`log`](../interfaces/IUserLogger.md#log)

#### Inherited from

`Logging.LoggerBase.log`

***

### success()

> **success**(`message?`, ...`parameters?`): [`Success`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string` \| `undefined`\>

Logs a success message for user feedback.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message?` | `unknown` | The message to log. |
| ...`parameters?` | `unknown`[] | The parameters to log. |

#### Returns

[`Success`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string` \| `undefined`\>

`Success` with the logged message if the level is enabled, or
`Success` with `undefined` if the message is suppressed.

#### Implementation of

[`IUserLogger`](../interfaces/IUserLogger.md).[`success`](../interfaces/IUserLogger.md#success)

***

### warn()

> **warn**(`message?`, ...`parameters?`): [`Success`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string` \| `undefined`\>

Logs a warning message.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message?` | `unknown` | The message to log. |
| ...`parameters?` | `unknown`[] | The parameters to log. |

#### Returns

[`Success`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string` \| `undefined`\>

`Success` with the logged message if the level is enabled, or
`Success` with `undefined` if the message is suppressed.

#### Implementation of

[`IUserLogger`](../interfaces/IUserLogger.md).[`warn`](../interfaces/IUserLogger.md#warn)

#### Inherited from

`Logging.LoggerBase.warn`

***

### warnWithDetail()

> **warnWithDetail**(`message`, `detail`): [`Success`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string` \| `undefined`\>

Logs a short warning summary at `warning` level, then emits `detail` at `detail` level.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message` | `string` | Short human-readable summary. |
| `detail` | `unknown` | Full detail logged at `detail` level. |

#### Returns

[`Success`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string` \| `undefined`\>

#### Inherited from

`Logging.LoggerBase.warnWithDetail`
