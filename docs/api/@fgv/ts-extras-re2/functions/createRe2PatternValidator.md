[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-re2](../README.md) / createRe2PatternValidator

# Function: createRe2PatternValidator()

> **createRe2PatternValidator**(`options?`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`SchemaPatternValidator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>

Creates a `JsonSchema.SchemaPatternValidator` that compiles each pattern with RE2 (via re2js),
under the given limits.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`IRe2PatternValidatorOptions`](../interfaces/IRe2PatternValidatorOptions.md) | Limits; each omitted one takes its [DEFAULT\_RE2\_PATTERN\_LIMITS](../variables/DEFAULT_RE2_PATTERN_LIMITS.md) value. |

## Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`SchemaPatternValidator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>

The validator, or a failure if a limit is not a positive integer.

## Remarks

Use [re2PatternValidator](../variables/re2PatternValidator.md) for the defaults. This exists to tighten (or loosen) the limits.
