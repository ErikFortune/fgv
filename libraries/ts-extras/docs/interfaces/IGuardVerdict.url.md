[Home](../README.md) > [IGuardVerdict](./IGuardVerdict.md) > url

## IGuardVerdict.url property

The URL cleared for request. Guards may **normalize** it — lowercase the host, strip a
trailing dot, punycode an IDN — and the normalized URL is what gets requested. Guards
must not **retarget** it to a different destination.

**Signature:**

```typescript
readonly url: URL;
```
