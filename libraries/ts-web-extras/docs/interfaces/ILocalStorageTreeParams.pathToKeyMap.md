[Home](../README.md) > [ILocalStorageTreeParams](./ILocalStorageTreeParams.md) > pathToKeyMap

## ILocalStorageTreeParams.pathToKeyMap property

Map of directory path prefixes to localStorage keys.
Files under each prefix are stored in the corresponding localStorage key.
Example: { '/data/ingredients': 'myapp:ingredients:v1' }

**Signature:**

```typescript
pathToKeyMap: Record<string, string>;
```
