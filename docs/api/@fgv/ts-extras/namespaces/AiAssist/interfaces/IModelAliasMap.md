[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IModelAliasMap

# Interface: IModelAliasMap

Canonical fgv alias → concrete provider model map.

## Remarks

Keys are full fgv aliases (`@<providerId>:<role>`, e.g. `@google-gemini:flash`);
values are the current concrete provider model id (or a provider-native alias,
which is resolved with one further indirection hop). Additive; absence of an
`aliases` field on a descriptor means "this provider defines no aliases" and
every model string passes through verbatim.

## Indexable

> \[`alias`: `string`\]: `string`
