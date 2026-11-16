[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ISourceConverters

# Interface: ISourceConverters

Converters for what an external source returns.

## Remarks

A source is host code. Everything it answers is converted before the broker decides anything
from it: an oversized or malformed answer is a source-contract issue with a bounded diagnostic,
never silently truncated into a successful receipt (design § 8.6).

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-commandlookup"></a> `commandLookup` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`SourceCommandLookup`](../type-aliases/SourceCommandLookup.md)\> |
| <a id="property-commandresult"></a> `commandResult` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`SourceCommandResult`](../type-aliases/SourceCommandResult.md)\> |
| <a id="property-observation"></a> `observation` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ISourceObservation`](ISourceObservation.md)\> |
| <a id="property-page"></a> `page` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ISourceReconcilePage`](ISourceReconcilePage.md)\> |
| <a id="property-read"></a> `read` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`SourceRead`](../type-aliases/SourceRead.md)\> |
