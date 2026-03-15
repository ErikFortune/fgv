[Home](../README.md) > [IUserLibrary](./IUserLibrary.md) > locations

## IUserLibrary.locations property

A materialized library of all locations, keyed by composite ID.
Locations are materialized lazily on access and cached.

**Signature:**

```typescript
readonly locations: MaterializedLibrary<LocationId, ILocationEntity, ILocation, never>;
```
