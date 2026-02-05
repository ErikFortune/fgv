[Home](../../README.md) > [LibraryRuntime](../README.md) > [IValidatingLibraryParams](./IValidatingLibraryParams.md) > orchestrator

## IValidatingLibraryParams.orchestrator property

The orchestrator that provides find functionality.
The orchestrator's entity type (TOrchEntity) may be a supertype of TV
(e.g., IIngredient when TV is AnyIngredient).

**Signature:**

```typescript
orchestrator: IFindOrchestrator<TOrchEntity, TSpec>;
```
