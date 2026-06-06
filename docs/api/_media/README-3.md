[@fgv/ts-utils](../../../README.md) &rsaquo; **collections**

# Type-Safe Collections

The `collections` packlet provides Result-aware, Map-like collections with optional validation and conversion layers.

## Table of Contents
- [Overview](#overview)
- [Collection Hierarchy](#collection-hierarchy)
- [ResultMap](#resultmap)
- [Collector](#collector)
- [KeyValueConverters and the Validating Pattern](#keyvalueconverters-and-the-validating-pattern)
- [Converting Collections](#converting-collections)
- [AggregatedResultMap](#aggregatedresultmap)
- [DetailedResult Details](#detailedresult-details)

## Overview

Standard JavaScript `Map` operations throw or return `undefined` for error cases. The collections in this packlet return `DetailedResult<T, ResultMapResultDetail>`, providing both the result value and a discriminated detail indicating exactly what happened (e.g., `'added'`, `'exists'`, `'not-found'`).

Every mutable collection also exposes a read-only interface via `toReadOnly()`, and each collection has a **Validating** variant that adds a `.validating` property for weakly-typed access with automatic key/value validation.

## Collection Hierarchy

```
ResultMap                         Collector
    │                                 │
ValidatingResultMap              ValidatingCollector
    │                                 │
ConvertingResultMap              ConvertingCollector
    │                                 │
ValidatingConvertingResultMap    ValidatingConvertingCollector
```

Each layer adds capability:
- **Base** — Result-returning Map/Collection operations with `toReadOnly()`
- **Validating** — Adds `.validating` property for weakly-typed access with key/value validation
- **Converting** — Adds lazy conversion with caching (ResultMap) or factory conversion (Collector)
- **Validating + Converting** — Combines both: converting with validated weakly-typed access

Additionally, `AggregatedResultMap` provides multi-collection querying with composite IDs.

## ResultMap

A mutable `Map<TK, TV>`-like collection where all operations return `DetailedResult`.

Also available as `ValidatingResultMap`, which adds a `.validating` property for weakly-typed access (see [Validating Pattern](#keyvalueconverters-and-the-validating-pattern)). Use `toReadOnly()` to obtain an `IReadOnlyResultMap`.

### Creating

```typescript
import { ResultMap } from '@fgv/ts-utils';

const map = new ResultMap<string, number>();
const fromEntries = new ResultMap<string, number>([['a', 1], ['b', 2]]);
```

### Operations

```typescript
// Add — fails if key exists
map.add('key', value);    // detail: 'added' or 'exists'

// Set — adds or updates
map.set('key', value);    // detail: 'added' or 'updated'

// Update — fails if key doesn't exist
map.update('key', value); // detail: 'updated' or 'not-found'

// Get
map.get('key');            // detail: 'exists' or 'not-found'

// Delete
map.delete('key');         // detail: 'deleted' or 'not-found'

// Get or add with factory
map.getOrAdd('key', (k) => succeed(computeValue(k)));
// detail: 'exists' or 'added'
```

### Handling Results

```typescript
// Chain into the value when detail isn't needed
map.get('key')
  .asResult
  .onSuccess((value) => processValue(value));

// Use .detail to discriminate outcomes
map.add('key', value)
  .onSuccess((val, detail) => {
    // val is the stored value; detail is 'added'
  })
  .onFailure((msg, detail) => {
    // msg describes the error; detail is 'exists'
  });
```

### Iteration

```typescript
for (const [key, value] of map) { /* ... */ }
map.entries();  // IterableIterator<[TK, TV]>
map.keys();     // IterableIterator<TK>
map.values();   // IterableIterator<TV>
map.forEach((value, key) => { /* ... */ });
```

## Collector

An append-only, insertion-order-tracked collection for items implementing `ICollectible`.

Also available as `ValidatingCollector`, which adds a `.validating` property for weakly-typed access (see [Validating Pattern](#keyvalueconverters-and-the-validating-pattern)). Use `toReadOnly()` to obtain an `IReadOnlyCollector`.

### ICollectible Interface

```typescript
interface ICollectible<TKey extends string, TIndex extends number> {
  readonly key: TKey;
  readonly index: TIndex | undefined;
  setIndex(index: number): Result<TIndex>;
}
```

Items receive a write-once index when added to a Collector. The `Collectible` class provides a standard implementation.

### Usage

```typescript
import { Collector, Collectible } from '@fgv/ts-utils';

const collector = new Collector<MyItem>();

// Add items — index assigned automatically
collector.add(item);           // detail: 'added' or 'exists'

// Access by key
collector.get(item.key);       // detail: 'exists' or 'not-found'

// Access by insertion index
collector.getAt(0);            // Result<MyItem>

// Ordered values
collector.valuesByIndex();     // ReadonlyArray<MyItem>

// Get or create
collector.getOrAdd(key, (k, index) => createItem(k, index));
```

## KeyValueConverters and the Validating Pattern

Collections are strongly typed — a `ResultMap<BrandedKey, MyValue>` requires callers to provide `BrandedKey` and `MyValue` directly. The **validating pattern** bridges the gap between weakly-typed external data (e.g., JSON strings, `unknown` values) and strongly-typed collections.

### KeyValueConverters

`KeyValueConverters` pairs a key converter/validator with a value converter/validator:

```typescript
import { KeyValueConverters } from '@fgv/ts-utils';

const converters = new KeyValueConverters<BrandedKey, MyValue>({
  key: brandedKeyConverter,   // Converter, Validator, or ConverterFunc
  value: myValueValidator,    // Converter, Validator, or ConverterFunc
});

// Convert individual keys, values, or entries
converters.convertKey('raw-key');              // DetailedResult<BrandedKey>
converters.convertValue(unknownValue);         // DetailedResult<MyValue>
converters.convertEntry(['raw-key', unknown]); // DetailedResult<[BrandedKey, MyValue]>
converters.convertEntries(rawPairs);           // Result<[BrandedKey, MyValue][]>
```

Failed conversions return detail `'invalid-key'` or `'invalid-value'`, which integrates naturally with the `DetailedResult` details used by all collections.

### The `.validating` Property

Every **Validating** collection variant exposes a `.validating` property that accepts weakly-typed inputs (`string` keys, `unknown` values) and validates them before delegating to the underlying strongly-typed collection:

```typescript
import { ValidatingResultMap } from '@fgv/ts-utils';

const map = new ValidatingResultMap<BrandedKey, MyValue>({
  converters,
  entries: rawEntries, // validated and converted during construction
});

// Strongly-typed access (normal ResultMap API)
map.get(brandedKey);
map.add(brandedKey, typedValue);

// Weakly-typed access (validates before operating)
map.validating.get('some-string-key');         // validates key → BrandedKey
map.validating.add('key', unknownValue);       // validates both key and value
map.validating.set('key', unknownValue);
map.validating.update('key', unknownValue);
map.validating.delete('key');
```

The same pattern applies to `ValidatingCollector`:

```typescript
import { ValidatingCollector } from '@fgv/ts-utils';

const collector = new ValidatingCollector<MyItem>({
  converters: itemConverters,
});

collector.validating.add(unknownItem);         // validates item
collector.validating.get('string-key');         // validates key
collector.validating.getOrAdd('key', factory);  // validates key, uses factory
```

### Read-Only Access

Both the `.validating` property and the underlying collection support `toReadOnly()`, returning interfaces that expose only read operations (`get`, `has`, iteration):

```typescript
const readOnly = map.toReadOnly();
// IReadOnlyValidatingResultMap — has .validating (read-only) and all read operations
// No add, set, update, or delete
```

## Converting Collections

### ConvertingResultMap

Wraps a `ResultMap<TK, TSrc>` and lazily converts values to `TTarget` on read, with caching. Mutations go through the `.source` property, which auto-invalidates cached conversions.

Also available as `ValidatingConvertingResultMap`, which adds a read-only `.validating` property for weakly-typed access to converted values. Use `toReadOnly()` to obtain a `ReadOnlyConvertingResultMap`.

```typescript
import { ConvertingResultMap } from '@fgv/ts-utils';

const converting = new ConvertingResultMap<string, RawData, ProcessedData>({
  inner: sourceMap,
  converter: (raw, key) => processData(raw),
});

// Values converted on first access, then cached
converting.get('key'); // DetailedResult<ProcessedData>

// Mutations go through .source, which auto-invalidates cache
converting.source.set('key', newRawData);
```

### ConvertingCollector

Extends `Collector` with factory-based conversion on add — accepts raw source data and converts to `ICollectible` items via a factory function.

Also available as `ValidatingConvertingCollector`, which adds a `.validating` property for weakly-typed access. Use `toReadOnly()` to obtain an `IReadOnlyValidatingCollector`.

```typescript
import { ConvertingCollector } from '@fgv/ts-utils';

const collector = new ConvertingCollector<MyItem, RawData>({
  factory: (key, index, raw) => MyItem.create(key, index, raw),
});

// Add from raw source data
collector.add(key, rawData);

// Or add a pre-built item directly
collector.add(existingItem);
```

## AggregatedResultMap

Manages multiple named collections, accessed via composite IDs (`collectionId.itemId`). Each inner collection is a `ValidatingResultMap` and can be mutable or read-only.

```typescript
import { AggregatedResultMap } from '@fgv/ts-utils';

const aggregated = new AggregatedResultMap({
  collectionIdConverter,
  itemIdConverter,
  itemConverter,
  separator: '.',
  collections: [
    { id: 'users', items: usersMap, isMutable: true },
    { id: 'roles', items: rolesMap, isMutable: false },
  ],
});

// Access by composite ID
aggregated.get('users.alice');     // DetailedResult<Item>
aggregated.set('users.bob', item); // adds to 'users' collection

// Access by split ID
aggregated.addToCollection('users', 'charlie', item);

// Collection-level operations
aggregated.addCollectionWithItems('teams', initialItems);
aggregated.getCollectionMetadata('users');
```

## DetailedResult Details

All collection operations return `DetailedResult` with these discriminated details:

| Detail | Meaning |
|--------|---------|
| `'added'` | Item was newly added |
| `'updated'` | Existing item was updated |
| `'deleted'` | Item was removed |
| `'exists'` | Item found (for get/has) |
| `'not-found'` | Item not found |
| `'invalid-key'` | Key validation failed |
| `'invalid-value'` | Value validation failed |
| `'success'` | Generic success |
| `'failure'` | Generic failure |

Use `.detail` to discriminate outcomes and `.asResult` to strip detail when chaining into the [Result pattern](../base/README.md).

---

**Packlets:** [base](../base/README.md) | [conversion](../conversion/README.md) | [validation](../validation/README.md) | **collections** | [logging](../logging/README.md) | [hash](../hash/README.md)
