[Home](../README.md) > [ISaferFetchResponse](./ISaferFetchResponse.md) > urlChain

## ISaferFetchResponse.urlChain property

Every URL actually requested, in order, as cleared by the address guard. `[0]` is the
caller's; later entries are redirect hops. A caller that allowlisted `api.example.com`
and was redirected to `cdn.example.com` usually wants to know.

**Signature:**

```typescript
readonly urlChain: readonly string[];
```
