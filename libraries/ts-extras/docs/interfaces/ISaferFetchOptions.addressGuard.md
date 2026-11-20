[Home](../README.md) > [ISaferFetchOptions](./ISaferFetchOptions.md) > addressGuard

## ISaferFetchOptions.addressGuard property

**Required, with no default.** A passthrough default here would be exactly the failure
this primitive exists to avoid — advertising a guarantee it does not have. Requiring it
makes omission a *compile* error rather than a runtime surprise or a lint rule, and makes
every call site's posture greppable in one search with no ambient default to overlook.

Use a named factory. `allowAnyAddress()` is the explicit, deliberately uncomfortable
opt-out, and is the only correct choice in a browser, where neither DNS resolution nor
redirect interposition exists.

**Signature:**

```typescript
readonly addressGuard: IAddressGuard;
```
