[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IPatternScreenerOptions

# Interface: IPatternScreenerOptions

Options for [createPatternScreener](../functions/createPatternScreener.md).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-name"></a> `name?` | `readonly` | `string` | Screener name used for finding attribution. Default `'pattern-screener'`. |
| <a id="property-onmatch"></a> `onMatch` | `readonly` | [`SafeguardDisposition`](../type-aliases/SafeguardDisposition.md) | Disposition carried by the `'suspicious-pattern'` finding on a match. `'reject'` fails the resolve; `'warn'` / `'info'` surface the finding on `trace.safeguardFindings` without failing. |
| <a id="property-patterns"></a> `patterns` | `readonly` | readonly `RegExp`[] | Regex patterns tested against each screened slot value. |
| <a id="property-screenedsources"></a> `screenedSources?` | `readonly` | readonly `string`[] | Optional slot-source allowlist. When provided, a slot whose `source` is not in the list is skipped with a `'screening-skipped'` info finding (the source-aware skip the screener now owns). When omitted, every slot value with a declared `source` is screened. Slots with no declared `source` are never screened. |
