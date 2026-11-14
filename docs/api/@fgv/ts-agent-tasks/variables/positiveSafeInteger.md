[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / positiveSafeInteger

# Variable: positiveSafeInteger

> `const` **positiveSafeInteger**: [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`number`\>

Converts an unknown value to a positive safe integer.

## Remarks

Revisions and schema versions use this. A value beyond `Number.MAX_SAFE_INTEGER`
fails here — before a write — rather than silently losing ordering.
