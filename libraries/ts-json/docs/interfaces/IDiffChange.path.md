[Home](../README.md) > [IDiffChange](./IDiffChange.md) > path

## IDiffChange.path property

The path to the changed value using dot notation.

For nested objects, uses dots to separate levels (e.g., "user.profile.name").
For arrays, uses numeric indices (e.g., "items.0.id", "tags.2").
Empty string indicates the root value itself changed.

**Signature:**

```typescript
path: string;
```
