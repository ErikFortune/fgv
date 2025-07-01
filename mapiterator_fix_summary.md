# MapIterator Type Error Fix

## Problem
Consumers of the published `@fgv/ts-utils` library were encountering a TypeScript error: **"cannot find MapIterator"** from the generated types file.

## Root Cause
The codebase was using `MapIterator<T>` as a return type for several methods, but this type does not exist in TypeScript. The correct type should be `IterableIterator<T>`, which is what the standard JavaScript `Map` methods (`entries()`, `keys()`, `values()`) actually return.

## Files Affected
1. `libraries/ts-utils/src/packlets/collections/readonlyResultMap.ts`
2. `libraries/ts-utils/src/packlets/collections/resultMap.ts`
3. `libraries/ts-utils/src/packlets/collections/collector.ts`

## Changes Made
Replaced all occurrences of `MapIterator<T>` with `IterableIterator<T>`:

### Before:
```typescript
entries(): MapIterator<KeyValueEntry<TK, TV>>;
keys(): MapIterator<TK>;
values(): MapIterator<TV>;
```

### After:
```typescript
entries(): IterableIterator<KeyValueEntry<TK, TV>>;
keys(): IterableIterator<TK>;
values(): IterableIterator<TV>;
```

## Why This Fix is Correct
- `IterableIterator<T>` is the standard TypeScript type for objects that implement both `Iterator<T>` and `Iterable<T>`
- This is exactly what `Map.prototype.entries()`, `Map.prototype.keys()`, and `Map.prototype.values()` return
- The fix aligns the type definitions with the actual JavaScript runtime behavior
- This is a non-breaking change that simply corrects the type annotations

## Impact
- Consumers will no longer see "cannot find MapIterator" errors
- Type checking will work correctly with the iterator methods
- The runtime behavior remains unchanged (only type annotations were corrected)

## Verification
All references to `MapIterator` have been replaced and no instances remain in the codebase.