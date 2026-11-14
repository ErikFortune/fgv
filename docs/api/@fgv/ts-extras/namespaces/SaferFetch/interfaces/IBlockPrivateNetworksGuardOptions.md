[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [SaferFetch](../README.md) / IBlockPrivateNetworksGuardOptions

# Interface: IBlockPrivateNetworksGuardOptions

Options for [SaferFetch.blockPrivateNetworks](../functions/blockPrivateNetworks.md).

## Extends

- [`IBlockPrivateNetworksOptions`](IBlockPrivateNetworksOptions.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-allowhosts"></a> `allowHosts?` | `readonly` | readonly `string`[] | Restricts every hop to these hostnames. Absent means any hostname. **Remarks** Matching is case-insensitive and exact — no wildcards and no suffix matching, because `endsWith('.example.com')` is the classic host-allowlist bypass (`evil-example.com`, `example.com.attacker.net`) and a primitive that offers the convenient form invites it. List the hosts. **A host allowlist is the recommended posture**, and it is stronger than address classification alone: with one, DNS rebinding can only be mounted by an allowlisted host's own resolver, which is a far smaller surface than "any hostname the caller was handed". |
| <a id="property-allowinsecurehttp"></a> `allowInsecureHttp?` | `readonly` | `boolean` | Permits `http:` hops. **Off by default**, so this guard requires `https:`. **Remarks** The core refuses everything that is not `http:` or `https:` and deliberately chooses between those two here rather than there, because the choice is a posture rather than a structural rule. Plaintext HTTP is exposed to a network-position attacker and is the scheme every SSRF payload reaches for, so the polarity matches `allowLoopback`: deny by default, opt in visibly, and let a reviewer grep for the opt-in. |
| <a id="property-allowloopback"></a> `allowLoopback?` | `readonly` | `boolean` | Permits `127.0.0.0/8` and `::1` (and their IPv4-mapped forms). Off by default: the polarity that ships a guard permitting `http://127.0.0.1:6379/` so a local-development convenience keeps working is the wrong one. A caller talking to a local sidecar opts in here, and the opt-in is independently greppable at the call site. |
| <a id="property-allowports"></a> `allowPorts?` | `readonly` | readonly `number`[] | Restricts every hop to these ports. Absent means any port. **Remarks** A URL with no explicit port is checked against the scheme's default — `443` for `https:`, `80` for `http:` — so `allowPorts: [443]` accepts `https://example.com/`. |
| <a id="property-resolve"></a> `resolve?` | `readonly` | [`HostResolver`](../type-aliases/HostResolver.md) | Name resolution. Defaults to [SaferFetch.nodeHostResolver](../variables/nodeHostResolver.md). **Remarks** Present so the guard is unit-testable with no network. It is **not** a hook through which DNS rebinding can be closed: swapping the resolver changes only the address the guard validates, while the transport still connects by hostname and resolves again. Closing that requires a pinning transport — see `IGuardVerdict.pinnedAddress`. |
