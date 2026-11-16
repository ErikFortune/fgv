[Home](../../README.md) > [SaferFetch](../README.md) > [IBlockPrivateNetworksOptions](./IBlockPrivateNetworksOptions.md) > allowLoopback

## IBlockPrivateNetworksOptions.allowLoopback property

Permits `127.0.0.0/8` and `::1` (and their IPv4-mapped forms). Off by
default: the polarity that ships a guard permitting `http://127.0.0.1:6379/`
so a local-development convenience keeps working is the wrong one. A
caller talking to a local sidecar opts in here, and the opt-in is
independently greppable at the call site.

**Signature:**

```typescript
readonly allowLoopback: boolean;
```
