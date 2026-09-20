# `@fgv/ts-random` — capabilities

**Seeded, reproducible pseudo-random generation.** Deterministic by construction: the same seed
replays the same sequence, and a generator can be cloned or forked mid-stream so a sub-sequence is
reproducible independently of what the parent does next.

> **`CAPABILITIES.md` is authoritative for what exists here and what not to hand-roll.** A package's
> `README.md`, where present, is getting-started material.

---

## ⚠️ Not cryptographically secure — this is the one thing to get right

`SeededRandomSource` is a **mulberry32** step function over a 32-bit state, seeded from a hashed
string or number. It is fast, small and reproducible, and it is **not** a CSPRNG. The state is
recoverable from a short run of outputs.

**Never use this for** tokens, session ids, salts, nonces, IVs, passwords, key material, or anything
an attacker benefits from predicting.

| you want | use |
|---|---|
| security-sensitive random bytes | `ICryptoProvider.generateRandomBytes` — `@fgv/ts-extras` `crypto-utils` |
| a UUID | `generateUuid()` — `@fgv/ts-utils` `base` |
| reproducible test data, sampling, shuffles, procedural content | **this package** |

The reproducibility that makes it good at the third row is exactly what disqualifies it from the
first two.

---

## `Generator` — the two layers

### `PseudoRandomGenerator` — the ergonomic surface

`PseudoRandomGenerator.create(params?)` → `Result<PseudoRandomGenerator>`. This is the one to reach
for; it wraps a `SeededRandomSource` (reachable as `.rng`) and adds the draw operations.

| method | draws |
|---|---|
| `nextFloat()` | `[0, 1)` |
| `nextInt(extent?)` | `[0, extent)` — but a **negative** `extent` gives `(extent, 0]`, and an omitted or non-finite one gives `[0, MAX_SAFE_INTEGER)` |
| `nextInRange(min, max)` | **inclusive of both bounds.** Either may be `undefined` (→ `0` / `MAX_SAFE_INTEGER`), and `min > max` is tolerated rather than an error — the range is simply walked the other way |
| `nextBoolean(trueProbability = 0.5)` | weighted boolean |
| `nextString(length, chars?)` | `chars` **defaults to alphanumeric**; pass one of `GeneratorData.Chars` for anything else |
| `pickNext(items?)` | one element, or `undefined` for an empty or absent array |
| `pickSequential(params)` / `pickRandom(params)` / `pickSequence(params)` | see below — the shape is not what the names suggest |

**`candidates` is an array of *pools*, not of items** — `ReadonlyArray<ReadonlyArray<T>>` — and this
is the detail worth reading twice:

- **`pickSequential`** walks the pools **in declaration order, cyclically**, drawing one random item
  from each. `count` defaults to the number of pools. With `candidates: [adjectives, animals]` you
  get `['brave', 'otter']` — this is the readable-identifier generator.
- **`pickRandom`** picks a **random pool** for each draw, then a random item from it. `count` is
  required.
- **`pickSequence`** dispatches on the params union's `how` field (`'sequence'` | `'random'`).

**The result can be shorter than `count`.** An empty pool yields `undefined` from the inner
`pickNext` and is silently skipped rather than producing a hole — so check `.length` if a pool might
be empty, rather than assuming `count` elements.

**Forking is a first-class operation, and the two forms differ.** `clone()` copies the generator so
both continue the *same* sequence independently. **`createChild(label)` derives a new stream from the
current state plus the label** — so two differently-labelled children of the same parent diverge, and
a given label always yields the same child from the same parent state. Use `createChild` when a
sub-computation must be reproducible without its position in the parent's draw order mattering; that
is what makes a seeded test stable as unrelated code starts drawing.

**Global slot:** `setGlobalRng` / `getGlobalRng` / `ensureRng(rng?)`. `ensureRng` returns a `Result`
and is the accessor to use — it resolves an explicit generator or falls back to the global one, so a
component takes an optional generator and stays testable without reading global state itself.

### `SeededRandomSource` — the state layer

`SeededRandomSource.create(seed?)` (a `number | string`) or `create(initParams)` →
`Result<SeededRandomSource>`. Carries `seed`, `lineage` (the chain of `createChild` labels) and
`counter` (draws so far), with `next()`, `clone()` and `createChild(label)`.

**Reach for it directly only when you need the state, the lineage, or a custom step function.**
`ISeededRandomSourceCreateParams.step` accepts any `RandomStepFunction`, so the algorithm is
substitutable; `mulberryStep` is the default. `hashSeed` and `hashStateAndLabel` are exposed as
statics because the seed derivation is part of the reproducibility contract — same inputs, same
stream, across processes and platforms.

**An omitted seed defaults to `Date.now()`**, which makes the generator non-reproducible. That is
usually not what you want from this package: pass an explicit seed anywhere the run needs to be
replayable, and record it.

---

## `GeneratorData` — the corpora

**`Chars`** — character-class constants for `nextString`: `lowerCase`, `upperCase`, `digits`,
`letters`, `alphanumeric`, `symbols`, `whitespace`, `printable`, `hexDigits`, `hexDigitsUpper`,
`hex`, `base64`, `base64Url`, `base64UrlNoPadding`, `all`.

**Don't hand-roll an alphabet string** — and in particular don't hand-roll `base64Url`, where the
`-_` vs `+/` distinction is easy to get wrong silently.

**`Words`** — word lists for readable identifiers and fixtures. **The exports are capitalized**, and
the module files are not: it is `Words.Adjectives`, not `Words.adjectives`.

| export | size | export | size |
|---|---|---|---|
| `Adjectives` | 225 | `Gerunds` | 104 |
| `Animals` | 53 | `jobs` ⚠️ | 153 |
| `Cities` | 207 | `FirstNamesMale` | 201 |
| `Colors` | 34 | `FirstNamesFemale` | 210 |
| `Countries` | 195 | `FirstNames` | 411 |
| `Domains` | 25 | `FamilyNames` | 200 |

⚠️ **`jobs` is lowercase** where every sibling is capitalized. It is the odd one out, not a typo in
this table — reach for it as `Words.jobs`.

**Use these before generating a word list or vendoring one.** Passed as pools to `pickSequential`
they give memorable ids without a new dependency:

```ts
rng.pickSequential({ how: 'sequence', candidates: [Words.Adjectives, Words.Animals] }).join('-');
// 'talented-cow'   (seed 'demo' — deterministic, so this exact value replays)
```

---

## Result posture

Every fallible entry point returns `Result<T>` — both `create` factories, and `ensureRng`. The draw
methods (`nextFloat`, `nextInt`, `pickNext`, …) return values directly, because a generator that
exists cannot fail to draw.

---

## Not in scope

Cryptographic randomness (above), distributions beyond uniform and weighted-boolean (no gaussian,
poisson, or arbitrary PDF sampling), and reservoir or streaming sampling. If you need a distribution,
build it on `nextFloat()` rather than adding a second generator.

---

## Recent additions

*Newest first. **Generated** — see the repo index; do not hand-edit inside the markers.*

<!-- BEGIN GENERATED: recent-additions -->

*No stream has recorded a `sourceLine` against this package yet.*

<!-- END GENERATED: recent-additions -->
