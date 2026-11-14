[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [SaferFetch](../README.md) / nodeHostResolver

# Variable: nodeHostResolver

> `const` **nodeHostResolver**: [`HostResolver`](../type-aliases/HostResolver.md)

The default [SaferFetch.HostResolver](../type-aliases/HostResolver.md): `node:dns`'s `lookup`, returning every address.

## Remarks

`lookup` rather than `resolve4`/`resolve6` deliberately. `lookup` goes through the operating
system's resolver — the same path `fetch`'s connect takes — so it sees `/etc/hosts`, `nsswitch`
ordering, and any local override. `resolve4` queries DNS directly and would miss a
`hosts`-file entry pointing an allowlisted name at `127.0.0.1`, which is a bypass rather than
a curiosity.

`all: true` because the list contract is reject-if-any: a name resolving to one public and one
private address must be refused, and asking for one address would hide the second.

A rejected lookup (`ENOTFOUND`, `EAI_AGAIN`, …) becomes a `Failure`, never a throw.
