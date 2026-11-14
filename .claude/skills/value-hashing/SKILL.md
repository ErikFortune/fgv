---
name: value-hashing
description: Use when writing or reviewing code that needs structural equality on objects — comparing two objects for "are these the same value", deduplicating an array of objects, using an object as a `Map` / `Set` key, or building a cache key from a request shape. Projects using the FGV toolset use the `Hash` namespace from `@fgv/ts-utils` (`Crc32Normalizer.computeHash`) instead of `JSON.stringify(a) === JSON.stringify(b)`, hand-rolled property walks, lodash `isEqual`, or `fast-deep-equal`. Load this skill BEFORE writing any of the following: `JSON.stringify(...)===JSON.stringify(...)`, a recursive `function deepEqual(...)` walker, `new Map<SomeObjectShape, ...>` keyed by an object, `Set<SomeObjectShape>`, or anything that says "these two objects are structurally the same." Covers the `computeHash` API, the four canonical usage patterns, the edge cases the normalizer handles vs doesn't, and the anti-patterns it replaces.
---

# Value Hashing

> Source: `<repo>/.claude/skills/value-hashing/SKILL.md` in the source
> corpus. Toolset binding: `@fgv/ts-utils`.

Structural equality / dedup / object-as-key in projects using the
FGV toolset goes through `@fgv/ts-utils`'s `Hash` namespace —
specifically `Crc32Normalizer`. It produces a stable,
key-order-independent hash of any JSON-shaped value. Don't roll your
own; don't reach for `JSON.stringify` or `lodash.isEqual`.

## Mental model

`Crc32Normalizer.computeHash(value)` walks the value, normalizes its
shape (object keys sorted, type tags applied to disambiguate `null` /
`undefined` / `Date` / `RegExp` / `Map` / `Set`), joins the parts,
and CRC32-hashes them. Returns `Result<string>` — eight hex digits.

Same hash → almost certainly the same value (CRC32 collisions exist
but are vanishingly rare for typical structured data; if you need
cryptographic-grade collision resistance, this isn't the tool).

```typescript
import { Hash } from '@fgv/ts-utils';

const normalizer = new Hash.Crc32Normalizer();

const h1 = normalizer.computeHash({ name: 'atlas', kind: 'agent' }).orThrow();
const h2 = normalizer.computeHash({ kind: 'agent', name: 'atlas' }).orThrow();
// h1 === h2 (key order doesn't matter)
```

Reuse a single normalizer instance — they're stateless beyond the
configured hash function.

## The four canonical usage patterns

### 1. Compare two objects for structural equality

```typescript
function isSame(a: unknown, b: unknown): Result<boolean> {
  const normalizer = new Hash.Crc32Normalizer();
  return normalizer.computeHash(a).onSuccess((ha) =>
    normalizer.computeHash(b).onSuccess((hb) => succeed(ha === hb))
  );
}
```

### 2. Deduplicate an array of objects

```typescript
function dedupe<T>(items: ReadonlyArray<T>): Result<T[]> {
  const normalizer = new Hash.Crc32Normalizer();
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const hashResult = normalizer.computeHash(item);
    if (hashResult.isFailure()) return fail(`dedupe: ${hashResult.message}`);
    if (!seen.has(hashResult.value)) {
      seen.add(hashResult.value);
      out.push(item);
    }
  }
  return succeed(out);
}
```

### 3. Object as a `Map` / `Set` key

JavaScript's `Map<K, V>` keys by reference for object keys, which is
rarely what you want. Hash first, key on the hash:

```typescript
class StructuralMap<K, V> {
  private readonly _normalizer = new Hash.Crc32Normalizer();
  private readonly _store = new Map<string, V>();

  public set(key: K, value: V): Result<this> {
    return this._normalizer.computeHash(key).onSuccess((h) => {
      this._store.set(h, value);
      return succeed(this);
    });
  }

  public get(key: K): Result<V | undefined> {
    return this._normalizer.computeHash(key).onSuccess((h) => succeed(this._store.get(h)));
  }
}
```

### 4. Cache key for a derived computation

```typescript
class ComputationCache<TInput, TOutput> {
  private readonly _normalizer = new Hash.Crc32Normalizer();
  private readonly _cache = new Map<string, TOutput>();

  public lookupOrCompute(input: TInput, compute: (i: TInput) => TOutput): Result<TOutput> {
    return this._normalizer.computeHash(input).onSuccess((key) => {
      const hit = this._cache.get(key);
      if (hit !== undefined) return succeed(hit);
      const value = compute(input);
      this._cache.set(key, value);
      return succeed(value);
    });
  }
}
```

## Anti-patterns (replace these)

- **`JSON.stringify(a) === JSON.stringify(b)`** — fails on key order
  (`{a:1,b:2}` vs `{b:2,a:1}` stringify differently), drops
  `undefined` properties silently, can't represent `Map` / `Set` /
  `Date` / `RegExp` / `BigInt`, and throws on circular refs. The
  normalizer fixes the first three; flags the fourth.
- **Hand-rolled `function deepEqual(a, b)`** — bug magnet. Optional
  fields, nested arrays, sparse arrays, prototype-pollution risk,
  NaN handling, Date comparison, RegExp comparison — every case has
  a subtle gotcha. The normalizer encodes all of them once,
  correctly, in one place.
- **Reference equality (`===` / `Object.is`)** for value-typed
  records — only works when you know the producer returned the same
  instance.
- **`lodash.isEqual` / `fast-deep-equal`** — extra dependency,
  doesn't return `Result<T>`, has its own opinions about
  Date/RegExp/class-instance handling. Use the in-house tool so the
  rest of the codebase has a single semantic.
- **`new Map<SomeObject, V>()` keyed by reference** — silently
  broken if you ever look up by an object built from the same data.
  Use a `StructuralMap` (pattern 3 above) keyed on the hash.

## Edge cases the normalizer handles

- **Object key order**: keys sorted before hashing. ✓
- **Array order**: positions preserved (arrays are ordered, this is
  correct). ✓
- **`null` vs `undefined`**: distinguished. ✓
- **`{a: undefined}` vs `{}`**: distinct hashes (the explicit
  `undefined` property is preserved). Differs from `JSON.stringify`,
  which silently drops them.
- **`Date`**: serialized via `valueOf()` (timestamp). ✓
- **`RegExp`**: serialized via `.toString()`. ✓
- **`Map` / `Set`**: handled via type prefix plus normalized
  entries. ✓
- **`NaN`**: every `NaN` hashes the same way — different from `===`
  semantics where `NaN !== NaN`. This is correct for structural
  equality. ✓
- **`bigint`, `boolean`, `number`, `symbol`**: typed wrapping
  prevents cross-type collisions. ✓

## Edge cases the normalizer does NOT handle

- **Circular references**: not protected against. Break the cycle
  before hashing.
- **Class instances**: only own string-keyed enumerable properties
  are walked. Class methods, prototype-defined properties, and
  symbol-keyed properties are stripped. Two instances of different
  classes with the same own data hash identically. If class identity
  matters, include a discriminator field.
- **Functions**: `computeHash` returns `fail(...)` for
  `typeof === 'function'`. Strip functions before passing in.
- **Symbol keys**: ignored entirely.

## Result-typed, not throwing

`computeHash` returns `Result<string>` and never throws. Use it like
any other Result API:

```typescript
return normalizer.computeHash(input)
  .onSuccess((hash) => /* use hash */)
  .withErrorFormat((msg) => `cache key: ${msg}`);
```

In setup / `beforeEach` / boot only, `.orThrow()` is acceptable.

## TypeScript surface

```typescript
import { Hash } from '@fgv/ts-utils';

// Concrete normalizer — 99% of consumers want this:
const normalizer = new Hash.Crc32Normalizer();

// Custom hash function (e.g. SHA-256) — extend HashingNormalizer:
class Sha256Normalizer extends Hash.HashingNormalizer {
  public constructor() {
    super((parts) => /* your SHA-256 */ '');
  }
}
```

Public API:

| Name | Shape | Use |
|------|-------|-----|
| `Hash.Crc32Normalizer` | `class extends HashingNormalizer` (no-arg constructor) | Default. Use this. |
| `Hash.HashingNormalizer` | `class extends Normalizer` | Subclass to plug in a different hash. |
| `Hash.HashFunction` | `(parts: string[]) => string` | The hash plugin signature. |
| `.computeHash(from: unknown)` | `Result<string>` | Primary API. |
| `.normalize<T>(from: T)` | `Result<T>` | Returns a normalized value (sorted keys etc.) when you want the canonical *shape*, not a hash. Rare. |

If you need normalized canonical *values* rather than hashes (e.g.
to write a stable JSON file representation), use `.normalize()`
instead of `.computeHash()`. Otherwise, default to `computeHash`.
