[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-utils](../../../README.md) / [Logging](../README.md) / ILogRecord

# Interface: ILogRecord

A retained log record. Preserves the level and an ordering cursor so consumers
can filter by severity and page incrementally.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-args"></a> `args?` | `readonly` | readonly `unknown`[] | The raw structured inputs `[message, ...parameters]` before formatting. |
| <a id="property-level"></a> `level` | `readonly` | [`MessageLogLevel`](../../../type-aliases/MessageLogLevel.md) | The level the record was logged at. |
| <a id="property-message"></a> `message` | `readonly` | `string` | The formatted message (same formatting [LoggerBase.\_format](../classes/LoggerBase.md#_format) produces). |
| <a id="property-seq"></a> `seq` | `readonly` | `number` | Monotonic 1-based sequence number, stable across ring eviction. |
| <a id="property-timestamp"></a> `timestamp` | `readonly` | `number` | Milliseconds since epoch when the record was logged (from the injected clock). |
