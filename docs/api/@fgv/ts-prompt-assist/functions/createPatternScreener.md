[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / createPatternScreener

# Function: createPatternScreener()

> **createPatternScreener**(`options`): [`IScreener`](../interfaces/IScreener.md)

Builds an [IScreener](../interfaces/IScreener.md) that screens slot values against a set of regex
patterns — the built-in injection screener, reproducing the v0.1 regex
semantics now that screening is pluggable.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`IPatternScreenerOptions`](../interfaces/IPatternScreenerOptions.md) |

## Returns

[`IScreener`](../interfaces/IScreener.md)

## Remarks

Each pattern's `lastIndex` is reset to `0` before every `.test()` so
stateful (`g` / `y`) flag regexes don't leak match position across slot
values. A slot with no declared `source` is never screened; with
`screenedSources` set, a slot whose `source` is not in the allowlist emits a
`'screening-skipped'` info finding. A match emits a single
`'suspicious-pattern'` finding carrying the configured `onMatch` disposition.
