[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [SaferFetch](../README.md) / blockPrivateNetworks

# Function: blockPrivateNetworks()

> **blockPrivateNetworks**(`options?`): [`IAddressGuard`](../interfaces/IAddressGuard.md)

Creates the recommended address guard: resolves each hop's host and requires every resolved
address to be globally routable public unicast.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`IBlockPrivateNetworksGuardOptions`](../interfaces/IBlockPrivateNetworksGuardOptions.md) | optional relaxations of the default posture, plus the resolver seam. |

## Returns

[`IAddressGuard`](../interfaces/IAddressGuard.md)

the guard. Construction cannot fail.

## Remarks

**Node only** — it resolves names, and no browser API returns a hostname's A/AAAA records.
`allowAnyAddress()` is the honest choice there, and its name says so.

This is the guard an entry point's `addressGuard` option takes. It is the resolving,
hop-chain-aware half; the judgement itself belongs to
[SaferFetch.blockPrivateNetworksPolicy](blockPrivateNetworksPolicy.md), which this guard delegates to unchanged. Keeping
the adversarial classification matrix in one pure, synchronous implementation is what makes
"did the address check run, and run correctly?" answerable by reading one file.

The guard is invoked **once per redirect hop**, on the last entry of the chain. Hop 0 is not a
special case: a guard that only validated the initial URL is defeated by a single `302` to
`http://169.254.169.254/`.

The URL-level constraints — `https:` unless `allowInsecureHttp`, plus the optional `allowHosts`
and `allowPorts` allowlists — are checked **before** the name resolution, so a host the caller
never allowlisted is refused by string comparison rather than handed to a resolver.

```typescript
// A local Ollama sidecar: every deviation from the default posture is named and greppable.
const guard = blockPrivateNetworks({
  allowLoopback: true,
  allowInsecureHttp: true,
  allowHosts: ['localhost'],
  allowPorts: [11434]
});
```

**What this does not protect against.** It validates a resolved address and the transport then
re-resolves, so hostile DNS can answer the two lookups differently — the documented
DNS-rebinding limit, which is open in this release. A strict `allowHosts` list is the
recommended posture precisely because it shrinks that exposure to "an allowlisted host's own
resolver is hostile".
