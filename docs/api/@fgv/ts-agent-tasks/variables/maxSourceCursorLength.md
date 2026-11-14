[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / maxSourceCursorLength

# Variable: maxSourceCursorLength

> `const` **maxSourceCursorLength**: `number` = `4096`

The longest source cursor or checkpoint the library represents: 4 KiB. A capacity profile's
`maxSourceCursorBytes` may be lower but never higher, and every stored cursor is also checked
against the stored profile's byte bound.
