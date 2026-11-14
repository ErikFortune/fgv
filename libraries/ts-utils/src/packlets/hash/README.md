[@fgv/ts-utils](../../../README.md) &rsaquo; **hash**

# Hashing

The `hash` packlet provides deterministic hashing of nested JavaScript objects, producing consistent hashes regardless of property order.

## Key Exports

| Export | Description |
|--------|-------------|
| `HashingNormalizer` | Abstract base class for hash-based normalizers |
| `Crc32Normalizer` | CRC32-based implementation for deterministic hashing |

## Usage

```typescript
import { Crc32Normalizer } from '@fgv/ts-utils';

const normalizer = new Crc32Normalizer();

// Hash any value — returns Result<string>
const hash = normalizer.computeHash({ name: 'Alice', age: 30 }).orThrow();
```

### Order Independence

Object properties and Map entries are sorted before hashing, so property order doesn't matter:

```typescript
const hash1 = normalizer.computeHash({ a: 1, b: 2 }).orThrow();
const hash2 = normalizer.computeHash({ b: 2, a: 1 }).orThrow();
// hash1 === hash2
```

Arrays preserve order:

```typescript
const hash1 = normalizer.computeHash([1, 2, 3]).orThrow();
const hash2 = normalizer.computeHash([3, 2, 1]).orThrow();
// hash1 !== hash2
```

### Supported Types

| Type | Behavior |
|------|----------|
| Primitives (string, number, boolean, etc.) | Hashed with type tag |
| Arrays | Order-dependent, recursive |
| Objects | Order-independent (sorted by key), recursive |
| `Map` | Order-independent (sorted by key), recursive |
| `Set` | Order-independent, recursive |
| `Date`, `RegExp` | Normalized to tagged string |
| Functions | Returns failure |

### Type Discrimination

Different container types with equivalent content produce different hashes:

```typescript
const obj = { key: 'value' };
const map = new Map([['key', 'value']]);
const arr = [['key', 'value']];

// All three produce different hashes
```

---

**Packlets:** [base](../base/README.md) | [conversion](../conversion/README.md) | [validation](../validation/README.md) | [collections](../collections/README.md) | [logging](../logging/README.md) | **hash**
