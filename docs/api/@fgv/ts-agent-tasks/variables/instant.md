[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / instant

# Variable: instant

> `const` **instant**: [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Instant`](../type-aliases/Instant.md)\>

Converts an unknown value to a canonical UTC [Instant](../type-aliases/Instant.md).

## Remarks

No general date parser and no date dependency: this is a shape check, an actual
platform parse, and an ISO round-trip. The round-trip is what rejects a
well-shaped but impossible date such as `2026-02-30T00:00:00.000Z`, which `Date`
would otherwise roll forward into March. Zone-free and offset-qualified spellings
fail the shape check; hosts normalize before this boundary.
