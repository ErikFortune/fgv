[Home](../README.md) > [IFetchTransportHints](./IFetchTransportHints.md) > pinnedAddress

## IFetchTransportHints.pinnedAddress property

The address the address guard validated, to which this connection must be pinned.
A transport that cannot pin MUST fail rather than connect by hostname.

**Signature:**

```typescript
readonly pinnedAddress: string;
```
