[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / provenanceConverter

# Variable: provenanceConverter

> `const` **provenanceConverter**: [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IProvenance`](../interfaces/IProvenance.md)\>

Converter for [IProvenance](../interfaces/IProvenance.md). Validates the known fields and preserves
any extension keys verbatim (the `[key: string]: unknown` opaque payload),
so a round-trip never drops consumer-attached data.
