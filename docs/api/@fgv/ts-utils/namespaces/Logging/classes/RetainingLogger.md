[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-utils](../../../README.md) / [Logging](../README.md) / RetainingLogger

# Class: RetainingLogger

An [ILogger](../interfaces/ILogger.md) that retains structured log records in a bounded
most-recent-N ring, with a query API supporting min-severity filtering and
since-cursor incremental paging.

## Remarks

Records are captured via the [\_logStructured](LoggerBase.md#_logstructured) hook,
so the full structured form (`level` + formatted `message` + raw `args`) is retained.
The logger emits nowhere itself — pair it with a [MultiLogger](MultiLogger.md)
to also feed a [ConsoleLogger](ConsoleLogger.md) or other durable sink.

## Extends

- [`LoggerBase`](LoggerBase.md)

## Constructors

### Constructor

> **new RetainingLogger**(`logLevel?`, `maxRecords?`, `now?`): `RetainingLogger`

Creates a new retaining logger.

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `logLevel?` | [`ReporterLogLevel`](../type-aliases/ReporterLogLevel.md) | `'detail'` | The level of logging to retain. Defaults to `'detail'` to capture broadly and filter at query time. |
| `maxRecords?` | `number` | `1000` | The maximum number of records to retain. Defaults to `1000`. |
| `now?` | () => `number` | `...` | Injected clock returning milliseconds since epoch. Defaults to `Date.now`. |

#### Returns

`RetainingLogger`

#### Overrides

[`LoggerBase`](LoggerBase.md).[`constructor`](LoggerBase.md#constructor)

## Properties

| Property | Modifier | Type | Default value | Description |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-loglevel"></a> `logLevel` | `public` | [`ReporterLogLevel`](../type-aliases/ReporterLogLevel.md) | `'info'` | The level of logging to be used. |

## Accessors

### lastSeq

#### Get Signature

> **get** **lastSeq**(): `number`

The most recently assigned sequence number. A client can hold this value and
pass it as `sinceSeq` to page only records logged afterward.

##### Returns

`number`

***

### records

#### Get Signature

> **get** **records**(): readonly [`ILogRecord`](../interfaces/ILogRecord.md)[]

The retained records, oldest-first.

##### Returns

readonly [`ILogRecord`](../interfaces/ILogRecord.md)[]

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

> `protected` **\_logStructured**(`level`, `formatted`, `message`, `parameters`): `void`

Inner hook called for logged messages alongside [\_log](LoggerBase.md#_log),
exposing the structured `(level, formatted, message, parameters)` form before it is
collapsed to the formatted string. The default implementation is a no-op; subclasses
that need to retain structured records (e.g. RetainingLogger)
override this. Fired only in the `shouldLog` branch, so suppressed messages never reach it.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `level` | [`MessageLogLevel`](../../../type-aliases/MessageLogLevel.md) | The [level](../../../type-aliases/MessageLogLevel.md) of the message. |
| `formatted` | `string` | The formatted message (same string passed to `_log`). |
| `message` | `unknown` | The raw message argument before formatting. |
| `parameters` | readonly `unknown`[] | The raw parameter arguments before formatting. |

#### Returns

`void`

#### Overrides

[`LoggerBase`](LoggerBase.md).[`_logStructured`](LoggerBase.md#_logstructured)

***

### \_suppressLog()

> **\_suppressLog**(`__level`, `__message?`, ...`__parameters`): [`Success`](../../../classes/Success.md)\<`undefined`\>

Inner method called for suppressed log messages.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `__level` | [`MessageLogLevel`](../../../type-aliases/MessageLogLevel.md) |
| `__message?` | `unknown` |
| ...`__parameters?` | `unknown`[] |

#### Returns

[`Success`](../../../classes/Success.md)\<`undefined`\>

#### Inherited from

[`LoggerBase`](LoggerBase.md).[`_suppressLog`](LoggerBase.md#_suppresslog)

***

### clear()

> **clear**(): `void`

Clears all retained records. Does NOT reset the sequence counter, so a client
holding a `sinceSeq` cursor never re-sees a sequence number.

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

### getRecords()

> **getRecords**(`options?`): readonly [`ILogRecord`](../interfaces/ILogRecord.md)[]

Returns retained records, oldest-first, optionally filtered.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`IGetRecordsOptions`](../interfaces/IGetRecordsOptions.md) | [Filtering and paging options](../interfaces/IGetRecordsOptions.md). |

#### Returns

readonly [`ILogRecord`](../interfaces/ILogRecord.md)[]

The matching records, oldest-first.

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
