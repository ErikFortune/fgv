[Home](../../README.md) > [Logging](../README.md) > [MultiLogger](./MultiLogger.md) > logLevel

## MultiLogger.logLevel property

The most-verbose (most-permissive) level among the children, so an upstream
`shouldLog` gate does not suppress a call before it can fan out to a more
permissive child. Computed on access, since a child's level may change.

**Signature:**

```typescript
readonly logLevel: ReporterLogLevel;
```
