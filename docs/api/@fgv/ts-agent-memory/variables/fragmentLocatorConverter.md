[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / fragmentLocatorConverter

# Variable: fragmentLocatorConverter

> `const` **fragmentLocatorConverter**: [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IFragmentLocator`](../interfaces/IFragmentLocator.md)\>

Converter for an [IFragmentLocator](../interfaces/IFragmentLocator.md). Validates the two offsets only — the
span's *meaning* (character / byte / token unit) is the consumer's, and the index
never interprets it. Note the span is advisory: see [IFragmentLocator](../interfaces/IFragmentLocator.md).
