[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-system-one](../README.md) / SystemOneInputLimit

# Type Alias: SystemOneInputLimit

> **SystemOneInputLimit** = \{ `maxChars`: `number`; \} \| `"unchecked"`

The caller's input bound, in characters. `'unchecked'` sends without measuring, and is correct
only for a backend known to refuse an over-long input rather than truncate it.
