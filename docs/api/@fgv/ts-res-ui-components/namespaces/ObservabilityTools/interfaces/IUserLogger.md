[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ObservabilityTools](../README.md) / IUserLogger

# Interface: IUserLogger

User logger interface that extends ILogger with success method for UI feedback.

## Extends

- [`ILogger`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="loglevel"></a> `logLevel` | `readonly` | [`ReporterLogLevel`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) | The level of logging to be used. |

## Methods

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

#### Inherited from

`Logging.ILogger.detail`

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

#### Inherited from

`Logging.ILogger.error`

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

#### Inherited from

`Logging.ILogger.info`

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

#### Inherited from

`Logging.ILogger.log`

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

#### Inherited from

`Logging.ILogger.warn`
