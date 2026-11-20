[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-re2](../README.md) / IRe2PatternValidatorOptions

# Interface: IRe2PatternValidatorOptions

Limits on what a pattern validator from [createRe2PatternValidator](../functions/createRe2PatternValidator.md) will compile.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-maxprogramsize"></a> `maxProgramSize?` | `readonly` | `number` | The largest compiled RE2 program admitted, as re2js's `programSize()` counts it — roughly one instruction per character matched, so `a{1000}` is about 1000. Matching costs time linear in the input **times** this size, so it bounds the per-character cost of every predicate call. Defaults to [DEFAULT\_RE2\_PATTERN\_LIMITS](../variables/DEFAULT_RE2_PATTERN_LIMITS.md). |
| <a id="property-maxsourcelength"></a> `maxSourceLength?` | `readonly` | `number` | The longest pattern source admitted, in UTF-16 code units. Longer sources are refused before they are read. Defaults to [DEFAULT\_RE2\_PATTERN\_LIMITS](../variables/DEFAULT_RE2_PATTERN_LIMITS.md). |
