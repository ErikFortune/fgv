[Home](../../README.md) > [Context](../README.md) > [IContextMatchOptions](./IContextMatchOptions.md) > acceptDefaultScore

## IContextMatchOptions.acceptDefaultScore property

If true, then conditions which would otherwise yield
NoMatch | NoMatch but have a defined Conditions.Condition.scoreAsDefault | scoreAsDefault
will yield `scoreAsDefault`instead of `NoMatch`.

**Signature:**

```typescript
acceptDefaultScore: boolean;
```
