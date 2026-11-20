[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / MessagesLogger

# Class: MessagesLogger

An @fgv/ts-utils#Logging.ILogger \| ILogger implementation that routes
messages into a [MessagesContext](../interfaces/IMessagesContextValue.md).

Use this as the `logger` parameter when creating a `LogReporter` to get
full `Result.report()` integration that feeds into the app's toast/log system.

## Example

```typescript
const { addMessage } = useMessages();
const logger = new MessagesLogger(addMessage);
const reporter = new LogReporter<unknown>({ logger });

// Now Result.report() flows into toasts + log panel
someResult.report(reporter, { success: 'info', failure: 'error' });
```

## Extends

- [`LoggerBase`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)

## Constructors

### Constructor

> **new MessagesLogger**(`addMessage`, `logLevel?`, `defaultAction?`): `MessagesLogger`

Creates a new MessagesLogger.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `addMessage` | (`level`, `text`, `options?`) => [`IMessage`](../interfaces/IMessage.md) | The addMessage function from MessagesContext |
| `logLevel?` | [`ReporterLogLevel`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) | The minimum log level to display (default: 'info') |
| `defaultAction?` | [`IMessageAction`](../type-aliases/IMessageAction.md) | Optional default action to attach to all messages |

#### Returns

`MessagesLogger`

#### Overrides

`Logging.LoggerBase.constructor`

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-loglevel"></a> `logLevel` | [`ReporterLogLevel`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) | The level of logging to be used. |

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

`Logging.LoggerBase._format`

***

### \_log()

> `protected` **\_log**(`message`, `level`): [`Success`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string` \| `undefined`\>

**`Internal`**

Routes a formatted log message into the MessagesContext, setting the message `level`
straight through from the log call (lossless). Display styling `severity` is left
undefined so it is derived from the level for display.

Suppression by threshold is handled upstream by @fgv/ts-utils#Logging.LoggerBase \| LoggerBase
(`shouldLog` against `logLevel`) before this method is invoked.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message` | `string` | The formatted message string |
| `level` | [`MessageLogLevel`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) | The @fgv/ts-utils#MessageLogLevel \| log level |

#### Returns

[`Success`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string` \| `undefined`\>

Success with the message that was logged

#### Overrides

`Logging.LoggerBase._log`

***

### \_logStructured()

> **\_logStructured**(`__level`, `__formatted`, `__message?`, `__parameters?`): `void`

Inner hook called for logged messages alongside [\_log](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs),
exposing the structured `(level, formatted, message, parameters)` form before it is
collapsed to the formatted string. The default implementation is a no-op; subclasses
that need to retain structured records (e.g. [RetainingLogger](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs))
override this. Fired only in the `shouldLog` branch, so suppressed messages never reach it.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `__level` | [`MessageLogLevel`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) | The [level](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) of the message. |
| `__formatted` | `string` | The formatted message (same string passed to `_log`). |
| `__message?` | `unknown` | The raw message argument before formatting. |
| `__parameters?` | readonly `unknown`[] | The raw parameter arguments before formatting. |

#### Returns

`void`

#### Inherited from

`Logging.LoggerBase._logStructured`

***

### \_suppressLog()

> **\_suppressLog**(`__level`, `__message?`, ...`__parameters`): [`Success`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`undefined`\>

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

> **detail**(`message?`, ...`parameters`): [`Success`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string` \| `undefined`\>

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

#### Inherited from

`Logging.LoggerBase.detail`

***

### error()

> **error**(`message?`, ...`parameters`): [`Success`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string` \| `undefined`\>

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

> **info**(`message?`, ...`parameters`): [`Success`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string` \| `undefined`\>

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

#### Inherited from

`Logging.LoggerBase.info`

***

### log()

> **log**(`level`, `message?`, ...`parameters`): [`Success`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string` \| `undefined`\>

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

#### Inherited from

`Logging.LoggerBase.log`

***

### warn()

> **warn**(`message?`, ...`parameters`): [`Success`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string` \| `undefined`\>

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
