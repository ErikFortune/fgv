[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [SaferFetch](../README.md) / DEFAULT\_MAX\_REDIRECTS

# Variable: DEFAULT\_MAX\_REDIRECTS

> `const` **DEFAULT\_MAX\_REDIRECTS**: `number` = `5`

Default cap on redirect hops followed under `'validate-each-hop'`.

## Remarks

Five is enough for the ordinary shortener-then-canonicalize-then-CDN chains real services
produce and small enough that a chain designed to burn budget is refused quickly. Every hop
costs a full guard evaluation — including a DNS resolution — against the same overall
deadline, so the cap bounds work, not just politeness.
