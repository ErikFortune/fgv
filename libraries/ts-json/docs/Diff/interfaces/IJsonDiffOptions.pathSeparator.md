[Home](../../README.md) > [Diff](../README.md) > [IJsonDiffOptions](./IJsonDiffOptions.md) > pathSeparator

## IJsonDiffOptions.pathSeparator property

Custom path separator for nested property paths.

Controls the character used to separate levels in nested object paths.
For example, with separator `'/'`, a nested property would be reported
as `"user/profile/name"` instead of `"user.profile.name"`.

**Signature:**

```typescript
pathSeparator: string;
```
