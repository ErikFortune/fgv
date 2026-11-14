---
name: result-pattern
description: Use when writing, reviewing, or refactoring TypeScript code that returns Result<T> from @fgv/ts-utils. Covers chaining patterns, mapResults for arrays, withErrorFormat for error context, .asResult for DetailedResult, MessageAggregator for collecting errors, the factory pattern for fallible construction, and the Result<void> anti-pattern. Load this skill before writing any function that can fail, before refactoring imperative error-handling into Result chains, or when reviewing code that uses succeed()/fail()/captureResult().
---

# Result Pattern

> Source: `<repo>/.claude/skills/result-pattern/SKILL.md` in the source
> corpus. Toolset binding: `@fgv/ts-utils`.

All fallible operations in projects using the FGV toolset return
`Result<T>` from `@fgv/ts-utils`. Errors are explicit values, not
exceptions.

## Creating Results

```typescript
import { Result, succeed, fail, captureResult } from '@fgv/ts-utils';

function divide(a: number, b: number): Result<number> {
  if (b === 0) {
    return fail('Division by zero');
  }
  return succeed(a / b);
}

// Wrap throwing code with captureResult
function parseJson(text: string): Result<unknown> {
  return captureResult(() => JSON.parse(text));
}
```

## Extracting values

| Method | Use when |
|--------|---------|
| `.shouldNotFail(label?)` | **Declaration-time invariants** — module-top-level `const`, static initializers, test fixtures. Auto-captures the call site. |
| `.orThrow()` | **Setup chains where the throw is intentional control flow** — factory `create()` bodies that wrap and re-throw, `beforeEach` chained on previous `Result<T>` steps |
| `.orDefault(value)` | Safe fallback to a constant |
| `.orDefaultLazy(() => …)` | Fallback is expensive to compute |

Never `.shouldNotFail()` or `.orThrow()` in business logic — return a `Result<T>` instead.

## Declaration-time fallible work

For module-top-level `const`s, static class property initializers, static
initialization blocks, and test fixtures, prefer `.shouldNotFail()` over
`.orThrow()`:

```typescript
// GOOD — call site, file, line, and label show up in the thrown error
const CONST_THING: Thing = Converters.thing('thing').shouldNotFail('CONST_THING');

class MyClass {
  public static readonly defaults = Converters.config(rawDefaults)
    .shouldNotFail('MyClass.defaults');
}

// In test fixtures:
beforeAll(() => {
  fixture = loadFixture('basic').shouldNotFail('basic fixture');
});

// AVOID — original message has no indication WHICH constant failed, and
// the stack trace points at internal Converter/Result machinery rather than
// the declaration site.
const CONST_THING: Thing = Converters.thing('thing').orThrow();

// AVOID — equivalent but verbose and intent-obscuring.
const CONST_THING: Thing = Converters.thing('thing')
  .withErrorFormat((msg) => `CONST_THING declaration: ${msg}`)
  .orThrow();
```

`.shouldNotFail()`:

- Captures the caller frame via `Error.captureStackTrace` on V8 (Node + Chromium)
  and a manual stack-frame walk on WebKit.
- Composes an error message: `<label> (at <fn> in <file>:<line>): <original>`
  (with sensible fallbacks when the label or function name is unavailable).
- Function names and exact line numbers depend on source-map availability in
  the runtime — fgv's Heft + ts-jest configs load them, so test failures show
  `.ts` paths.
- Takes an optional `frameDepth` for library authors wrapping `shouldNotFail`
  in their own helpers (`frameDepth: 2` to attribute to the wrapper's caller).

Keep `.orThrow()` for chains where the throw is intentional control flow —
e.g. a `static create()` factory that runs several Result steps and re-throws
on the way out. The point of `.shouldNotFail()` is the declaration site
attribution, which is wasted in a multi-step chain that's already wrapping its
errors via `.withErrorFormat`.

## Chaining vs intermediate variables

Prefer chaining when it improves clarity:

```typescript
// GOOD — chain
function processData(input: string): Result<Output> {
  return parseInput(input)
    .onSuccess((parsed) => validate(parsed))
    .onSuccess((valid) => transform(valid));
}

// AVOID — unnecessary intermediate variables
function processData(input: string): Result<Output> {
  const parsed = parseInput(input);
  if (parsed.isFailure()) return parsed;
  const valid = validate(parsed.value);
  if (valid.isFailure()) return valid;
  return transform(valid.value);
}
```

Exception: when conditional logic is genuinely complex, intermediate
variables can be clearer. Prioritize readability.

### Coverage-gap smell — `c8 ignore` around `isFailure` is a refactor signal

If you're about to add a `c8 ignore` directive around an `isFailure()`
propagation block — the imperative shape above — **stop and try
chaining first.** Roughly:

```typescript
const fooResult = doFoo();
/* c8 ignore next 3 */         // ← this is the smell
if (fooResult.isFailure()) {
  return fail(fooResult.message);
}
// ... use fooResult.value ...
```

The branch is uncovered because it's *structurally redundant* in the
chained form — `.onSuccess()` makes the failure flow implicit and
removes the `if`-block entirely. Refactor first; the coverage gap
usually disappears with the branch.

**Chaining isn't applicable everywhere** — probably **more than half**
of these sites refactor cleanly, but the rest legitimately stay
imperative. Cases where the intermediate-variable shape genuinely
fits better:

- The intermediate value is used multiple times in subsequent
  operations (chaining would force multiple re-extractions or
  awkward closures).
- Branching based on the intermediate value where the branches
  diverge significantly (chaining flattens; an `if` inside
  `.onSuccess()` reads worse).
- Side effects between steps that don't compose into the chain
  (logging via `.report()` does compose; arbitrary mutation usually
  doesn't).
- Multi-Result fan-in where you need values from several sources
  (`mapResults` is the right tool when uniform; bespoke composition
  stays imperative).

When the imperative form is the right shape AND the failure branch is
structurally unreachable in v1 (e.g. a defensive check against a
freshly-minted ID that can't collide, or a defensive guard on a
brand whose Converter already validates), `c8 ignore` with a
one-line rationale is fine. The order of operations matters: **try
chaining first, accept c8 ignore only after determining the
imperative form is the right shape.**

The source corpus repeatedly hit this pattern: a phase-3 stream
implementation refactor cut a propagation-coverage gap from ~7% to
0% AND removed ~30 lines of imperative checks. A subsequent
chore-batch coverage-closure item hit it again on different files.
The smell is reliable.

## Adding error context

Use `.withErrorFormat()` to layer context as errors propagate:

```typescript
function loadUserProfile(userId: string): Result<UserProfile> {
  return loadUser(userId)
    .withErrorFormat((e) => `user ${userId}: ${e}`)
    .onSuccess((user) => loadProfile(user.profileId)
      .withErrorFormat((e) => `user ${userId} profile: ${e}`)
    );
}
```

## DetailedResult → Result

`MaterializedLibrary.get()` returns `DetailedResult`. Use `.asResult`
to strip detail before chaining:

```typescript
// CORRECT
function resolveItem(id: ItemId): Result<ResolvedItem> {
  return this._context.items.get(id)
    .asResult
    .withErrorFormat((msg) => `item ${id}: ${msg}`)
    .onSuccess((item) => succeed({ id, item }));
}
```

Without `.asResult`, `withErrorFormat` will fail to type-check.

## Array processing — `mapResults` with per-item helpers

```typescript
import { mapResults } from '@fgv/ts-utils';

// EXCELLENT — declarative, per-item helper, contextualized errors
function getOptions(): Result<ReadonlyArray<IResolvedOption>> {
  if (this._resolvedOptions === undefined) {
    const slots = this._version.options ?? [];
    return mapResults(slots.map((slot) => this._resolveOption(slot)))
      .onSuccess((resolved) => {
        this._resolvedOptions = resolved;
        return succeed(resolved);
      });
  }
  return succeed(this._resolvedOptions);
}

private _resolveOption(slot: IOptionEntity): Result<IResolvedOption> {
  return this._resolveOptionValue(slot.value)
    .withErrorFormat((msg) => `option ${slot.name}: ${msg}`)
    .onSuccess((value) => succeed({ slotId: slot.slotId, name: slot.name, value }));
}
```

Per-item helpers isolate logic, improve error context, and are easier
to unit-test than imperative loops with manual error handling.

## Early-return for optional fields, then chain

```typescript
function getCoating(): Result<IResolvedCoating | undefined> {
  if (this._resolvedCoating === undefined) {
    const spec = this._version.coating;
    if (!spec) {
      this._resolvedCoating = null;
      return succeed(undefined);
    }
    return this._context.materials.getWithAlternates(spec)
      .withErrorFormat((msg) => `entity ${this._id}: coating: ${msg}`)
      .onSuccess((resolved) => {
        if (!resolved.primary.isCoatingMaterial()) {
          return fail(`entity ${this._id}: primary material is not coating-grade`);
        }
        this._resolvedCoating = {
          material: resolved.primary,
          alternates: resolved.alternates.filter((m) => m.isCoatingMaterial()),
          entity: spec
        };
        return succeed(this._resolvedCoating);
      });
  }
  return succeed(this._resolvedCoating ?? undefined);
}
```

## Avoid `Result<void>` — anti-pattern

Operations should return something meaningful:

```typescript
// ANTI-PATTERN
function updateUser(id: string, data: UserData): Result<void> { … }

// CORRECT — return the updated entity
function updateUser(id: string, data: UserData): Result<User> { … }

// CORRECT — return achieved-vs-target value
function scaleToTargetWeight(target: Measurement): Result<Measurement> {
  // …actual achieved weight may differ from target
  return succeed(actualWeight);
}
```

## Aggregating errors across multiple operations

```typescript
import { MessageAggregator } from '@fgv/ts-utils';

function validateAll(data: Data): Result<ValidatedData> {
  const aggregator = new MessageAggregator();
  validateField1(data.field1).aggregateError(aggregator);
  validateField2(data.field2).aggregateError(aggregator);
  validateField3(data.field3).aggregateError(aggregator);

  if (aggregator.hasMessages) {
    return fail(aggregator.toString('; '));
  }
  return succeed(createValidatedData(data));
}
```

## Factory pattern for fallible construction

Constructors that might throw should be private/protected. Expose a
static `create` returning `Result<T>`:

```typescript
class ResourceManager {
  private constructor(private config: Config) {
    if (!config.name) throw new Error('Config name is required');
  }

  public static create(params: Params): Result<ResourceManager> {
    return validateParams(params)
      .onSuccess((valid) => loadConfig(valid))
      .onSuccess((config) => captureResult(() => new ResourceManager(config)));
  }
}

const manager = ResourceManager.create(params).orThrow(); // setup
const result = ResourceManager.create(params);            // app code
```

### Reference example — async multi-stage factory with per-step error context

A representative production-scale factory for an encrypted store
demonstrates the pattern:

```typescript
public static async create(params: ISecretStoreCreateParams): Promise<Result<SecretStore>> {
  const privateKeyStorage = new InMemoryPrivateKeyStorage();
  const algorithm: SigningAlgorithm = params.algorithm ?? DEFAULT_SIGNING_ALGORITHM;
  const storeId = params.storeId;

  return CryptoUtils.KeyStore.KeyStore.create({
    cryptoProvider: CryptoUtils.nodeCryptoProvider,
    privateKeyStorage
  })
    .thenOnSuccess(async (keyStore) =>
      (await keyStore.initialize(params.masterPassword))
        .withErrorFormat((m) => `initialize failed: ${m}`)
        .onSuccess(() => succeed(keyStore))
    )
    .thenOnSuccess(async (keyStore) =>
      (await keyStore.addKeyPair(signingKeySlot, { algorithm }))
        .withErrorFormat((m) => `addKeyPair failed: ${m}`)
        .onSuccess(() => succeed(keyStore))
    )
    .thenOnSuccess(async (keyStore) =>
      (await keyStore.getKeyPair(signingKeySlot))
        .withErrorFormat((m) => `getKeyPair failed: ${m}`)
        .onSuccess((keyPair) => succeed({ keyStore, keyPair }))
    )
    .thenOnSuccess(async ({ keyStore, keyPair }) =>
      (await exportPublicKeyAsMultibaseSpki(keyPair.publicKey))
        .withErrorFormat((m) => `SPKI export failed: ${m}`)
        .onSuccess((spki) => succeed({ keyStore, spki }))
    )
    .thenOnSuccess(async ({ keyStore, spki }) =>
      (await SecretStore._importExternalKeys(keyStore, params.externalKeys))
        .onSuccess(() => succeed(new SecretStore(storeId, keyStore, spki)))
    )
    .withErrorFormat((m) => `SecretStore.create: ${m}`);
}
```

Properties worth internalizing — these are the load-bearing reasons
the chain shape is preferred over an imperative version:

- **Linear chain via `.thenOnSuccess` (async-aware)** — every step
  composes; no `if (foo.isFailure()) return fail(foo.message)` ladder.
  The chain shape doesn't expose the defensive branches the imperative
  form would, so no `c8 ignore` is needed (see § Coverage-gap smell).
- **Per-step `.withErrorFormat` with operation-named prefixes** —
  `initialize failed: ...`, `addKeyPair failed: ...`, `SPKI export
  failed: ...`. Each layer adds context the layer above couldn't have
  known. A failure surfaces as a real ladder: `SecretStore.create:
  SPKI export failed: <upstream message>`. **Skipping the per-step
  prefixes is the most common drift**; the inner labels are what
  makes the error message actionable at the call site.
- **Outer `.withErrorFormat('SecretStore.create: ...')` at the
  bottom** — wraps every error in the chain with the factory's name.
  Two-level error contextualization: factory outside, operation
  inside.
- **Accumulator pattern for forward-carried context** — the chain's
  value type shifts from `KeyStore` → `{ keyStore, keyPair }` →
  `{ keyStore, spki }` → `SecretStore`. Each step gets exactly what
  it needs without re-fetching.
- **Deliberate omission of per-step prefix on `_importExternalKeys`**
  — that helper already returns contextualized errors of its own.
  The omission is a thoughtful choice, not a missed prefix; "does
  this helper already give actionable context?" is the question to
  ask before wrapping.

When a constructor's setup is async, multi-step, and has multiple
distinct failure modes, this is the shape to reach for.

## Error-message hygiene

Include enough context to be actionable:

```typescript
// GOOD
return fail(`index ${index} out of bounds for array of length ${arr.length}`);
return fail(`${resourceId}: failed to load: ${underlyingError.message}`);

// AVOID
return fail('invalid index');
return fail('load failed');
```
