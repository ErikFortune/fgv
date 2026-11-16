[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / MODEL\_ALIAS\_SIGIL

# Variable: MODEL\_ALIAS\_SIGIL

> `const` **MODEL\_ALIAS\_SIGIL**: `"@"` = `'@'`

Marker prefix for an fgv model alias.

## Remarks

A model string is an fgv alias **iff** it begins with this sigil. Everything
else is a raw provider model id and passes through [resolveModelAlias](../functions/resolveModelAlias.md)
untouched — this is what keeps the alias layer back-compatible (no current
`defaultModel`, `modelOverride`, or self-hosted `model:tag` id starts with `@`).
