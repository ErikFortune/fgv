[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [SaferFetch](../README.md) / ALWAYS\_STRIPPED\_HEADERS

# Variable: ALWAYS\_STRIPPED\_HEADERS

> `const` **ALWAYS\_STRIPPED\_HEADERS**: `ReadonlyArray`\<`string`\>

Header names dropped on every cross-origin redirect hop, whatever the caller configured.

## Remarks

Turning on manual redirects makes this primitive responsible for a rule the platform was
applying for free: browsers and `curl` both strip credential headers when a redirect leaves
the origin, and a hand-rolled loop that replays them hands `Authorization: Bearer …` to
whatever host the redirect names. Callers add their own names with
`ISaferFetchOptions.sensitiveHeaders`; these three are not removable.
