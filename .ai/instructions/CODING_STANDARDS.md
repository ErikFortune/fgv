# Coding Standards

This document defines the coding standards for this repository. All AI assistants and human developers must follow these guidelines.

## Table of Contents
- [TypeScript Standards](#typescript-standards)
- [Result Pattern](#result-pattern)
- [Type-Safe Validation](#type-safe-validation)
- [Error Handling](#error-handling)
- [Extending Core Libraries Over Working Around Them](#extending-core-libraries-over-working-around-them)
- [Code Style](#code-style)

---

## TypeScript Standards

### Never Use `any` Type

This rule is **absolute and non-negotiable**. The codebase has strict lint rules that will fail CI.

```typescript
// ❌ NEVER - Will fail CI/linting
const data: any = something;
function process(input: any): any { }
const obj = value as any;

// ✅ CORRECT alternatives
const data: unknown = something;
const data = something as unknown as SpecificType;
function process(input: unknown): Result<Output> { }
const obj: Record<string, unknown> = {};
```

### Type Assertions

Use proper type assertion patterns:

```typescript
// ✅ For branded types
const id = 'user-123' as unknown as UserId;

// ✅ For test data with intentionally invalid types
const corrupted = {
  id: 'invalid' as unknown as ValidId,
  type: 999 as unknown as TypeIndex
};

// ❌ NEVER double-cast through Record
const bad = value as Record<string, unknown> as TargetType;
```

### Prefer Strict Types

- Use `unknown` instead of `any` for truly unknown data
- Use `Record<string, unknown>` for dynamic objects that need iteration
- Define interfaces for structured data
- Use branded types for domain identifiers

---

## Result Pattern

All operations that can fail must return `Result<T>` objects from `@fgv/ts-utils`. This makes errors explicit and avoids exceptions.

### Creating Results

```typescript
import { Result, succeed, fail, captureResult } from '@fgv/ts-utils';

// Success case
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

### Extracting Values

```typescript
// ✅ Use orThrow() ONLY in setup/initialization
const config = loadConfig().orThrow(); // OK in constructor/setup

// ✅ Use orDefault() for safe fallbacks
const port = getPort().orDefault(3000);
const name = getName().orDefault(undefined);

// ✅ Use orDefaultLazy() for expensive defaults
const data = loadData().orDefaultLazy(() => computeExpensiveDefault());
```

### Result Chaining

Prefer chaining over intermediate variables when it improves clarity:

```typescript
// ✅ GOOD - Chain operations
function processData(input: string): Result<Output> {
  return parseInput(input)
    .onSuccess((parsed) => validate(parsed))
    .onSuccess((valid) => transform(valid));
}

// ❌ AVOID - Unnecessary intermediate variables
function processData(input: string): Result<Output> {
  const parsed = parseInput(input);
  if (parsed.isFailure()) return parsed;
  const valid = validate(parsed.value);
  if (valid.isFailure()) return valid;
  return transform(valid.value);
}
```

**Exception**: Complex conditional logic may be clearer with intermediate variables. Prioritize readability.

### Async Result Chaining

Use `thenOnSuccess()` and `thenOnFailure()` to chain async operations fluently. These bridge from `Result<T>` into `AsyncResult<T>`, which supports continued chaining of both sync and async steps and can be directly `await`ed.

```typescript
// ✅ GOOD - Fluent async chain
async function processData(input: string): Promise<Result<SavedData>> {
  return parseInput(input)
    .onSuccess((parsed) => validate(parsed))
    .thenOnSuccess(async (valid) => fetchRelatedData(valid.id))
    .onSuccess((data) => transform(data))
    .thenOnSuccess(async (transformed) => saveData(transformed))
    .withErrorFormat((msg) => `pipeline failed: ${msg}`);
}

// ❌ AVOID - Breaking the chain for async calls
async function processData(input: string): Promise<Result<SavedData>> {
  const validated = parseInput(input).onSuccess((parsed) => validate(parsed));
  if (validated.isFailure()) return validated;
  const related = await fetchRelatedData(validated.value.id);
  if (related.isFailure()) return related;
  const transformed = transform(related.value);
  if (transformed.isFailure()) return transformed;
  return saveData(transformed.value);
}
```

Use `captureAsyncResult()` to wrap async functions that might throw (analogous to `captureResult` for sync):

```typescript
const result = await captureAsyncResult(async () => {
  const response = await fetch(url);
  return response.json();
});
```

Rejected promises in `thenOnSuccess`/`thenOnFailure` callbacks are automatically caught and converted to `Failure`.

### Converting DetailedResult to Result

When chaining from `MaterializedLibrary.get()` (which returns `DetailedResult`), use `.asResult` to convert:

```typescript
// ✅ CORRECT - Use .asResult to strip detail before chaining
function resolveItem(id: ItemId): Result<ResolvedItem> {
  return this._context.items.get(id)
    .asResult
    .withErrorFormat((msg) => `item ${id}: ${msg}`)
    .onSuccess((item) => succeed({ id, item }));
}

// ❌ AVOID - Type errors when chaining DetailedResult
function resolveItem(id: ItemId): Result<ResolvedItem> {
  return this._context.items.get(id)
    .withErrorFormat((msg) => `item ${id}: ${msg}`) // Type error!
    .onSuccess((item) => succeed({ id, item }));
}
```

### Array Processing with Per-Item Helpers

When processing arrays, use `mapResults()` with dedicated per-item helper methods:

```typescript
// ✅ EXCELLENT - mapResults with per-item helper
function getFillings(): Result<ReadonlyArray<IResolvedFillingSlot>> {
  if (this._resolvedFillings === undefined) {
    const slots = this._version.fillings ?? [];
    return mapResults(slots.map((slot) => this._resolveFillingSlot(slot)))
      .onSuccess((slots) => {
        this._resolvedFillings = slots;
        return succeed(slots);
      });
  }
  return succeed(this._resolvedFillings);
}

private _resolveFillingSlot(slot: IFillingSlotEntity): Result<IResolvedFillingSlot> {
  return this._resolveFillingOptions(slot.filling)
    .withErrorFormat((msg) => `slot ${slot.name}: failed to resolve fillings: ${msg}`)
    .onSuccess((filling) => succeed({
      slotId: slot.slotId,
      name: slot.name,
      filling
    }));
}

// ❌ AVOID - Imperative loop with manual error handling
function getFillings(): Result<ReadonlyArray<IResolvedFillingSlot>> {
  if (this._resolvedFillings === undefined) {
    const slots = this._version.fillings ?? [];
    const results: IResolvedFillingSlot[] = [];
    for (const slot of slots) {
      const fillingResult = this._resolveFillingOptions(slot.filling);
      if (fillingResult.isFailure()) {
        return fail(`Failed to resolve fillings for slot '${slot.name}': ${fillingResult.message}`);
      }
      results.push({
        slotId: slot.slotId,
        name: slot.name,
        filling: fillingResult.value
      });
    }
    this._resolvedFillings = results;
  }
  return succeed(this._resolvedFillings);
}
```

**Benefits of per-item helpers:**
- Isolates single-item resolution logic
- Enables better error context with `.withErrorFormat()`
- More testable (can unit test individual item resolution)
- More readable (declarative vs imperative)

### Chaining with Early Returns

For optional fields, handle the undefined case early:

```typescript
// ✅ GOOD - Early return for undefined, then chain
function getEnrobingChocolate(): Result<IResolvedChocolateSpec | undefined> {
  if (this._resolvedEnrobingChocolate === undefined) {
    const spec = this._version.enrobingChocolate;
    if (!spec) {
      this._resolvedEnrobingChocolate = null;
      return succeed(undefined);
    }

    return this._context.ingredients.getWithAlternates(spec)
      .withErrorFormat((msg) => `confection ${this._id}: failed to resolve enrobing chocolate: ${msg}`)
      .onSuccess((resolved) => {
        if (!resolved.primary.isChocolate()) {
          return fail(`confection ${this._id}: primary ingredient is not a chocolate`);
        }
        this._resolvedEnrobingChocolate = {
          chocolate: resolved.primary,
          alternates: resolved.alternates.filter((i) => i.isChocolate()),
          entity: spec
        };
        return succeed(this._resolvedEnrobingChocolate);
      });
  }
  return succeed(this._resolvedEnrobingChocolate ?? undefined);
}

// ❌ AVOID - Nested conditionals with imperative checks
function getEnrobingChocolate(): Result<IResolvedChocolateSpec | undefined> {
  if (this._resolvedEnrobingChocolate === undefined) {
    const spec = this._version.enrobingChocolate;
    if (!spec) {
      this._resolvedEnrobingChocolate = null;
    } else {
      const resolved = this._context.ingredients.getWithAlternates(spec);
      if (resolved.isFailure()) {
        return fail(`Failed to resolve: ${resolved.message}`);
      }
      if (!resolved.value.primary.isChocolate()) {
        return fail('Not a chocolate');
      }
      this._resolvedEnrobingChocolate = { /* ... */ };
    }
  }
  return succeed(this._resolvedEnrobingChocolate ?? undefined);
}
```

### Avoid Result<void>

**Never use `Result<void>`** - it's an anti-pattern. Operations should return meaningful values:

```typescript
// ❌ ANTI-PATTERN - Result<void>
function updateUser(id: string, data: UserData): Result<void> {
  // ...
  return succeed(undefined);
}

// ✅ CORRECT - Return something meaningful
function updateUser(id: string, data: UserData): Result<User> {
  // ...
  return succeed(updatedUser);
}

// ✅ CORRECT - Return computed/achieved value
function scaleToTargetWeight(target: Measurement): Result<Measurement> {
  // Scale ingredients...
  const actualWeight = calculateActualWeight();
  return succeed(actualWeight); // Actual achieved weight may differ from target
}
```

### Error Context

Add context as errors propagate:

```typescript
function loadUserProfile(userId: string): Result<UserProfile> {
  return loadUser(userId)
    .withErrorFormat((e) => `Failed to load user ${userId}: ${e}`)
    .onSuccess((user) => loadProfile(user.profileId)
      .withErrorFormat((e) => `Failed to load profile for user ${userId}: ${e}`)
    );
}
```

### Error Aggregation

Use `MessageAggregator` for collecting multiple errors:

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

Use `mapResults()` for processing arrays:

```typescript
import { mapResults } from '@fgv/ts-utils';

function processItems(items: Item[]): Result<ProcessedItem[]> {
  const results = items.map(item => processItem(item));
  return mapResults(results); // Returns all successes or aggregated errors
}
```

### Factory Pattern

Constructors that might throw should be private/protected with a static `create` method:

```typescript
class ResourceManager {
  private constructor(private config: Config) {
    if (!config.name) {
      throw new Error('Config name is required');
    }
  }

  public static create(params: Params): Result<ResourceManager> {
    return validateParams(params)
      .onSuccess(valid => loadConfig(valid))
      .onSuccess(config => captureResult(() => new ResourceManager(config)));
  }
}

// Usage
const manager = ResourceManager.create(params).orThrow(); // In setup
const result = ResourceManager.create(params); // In application code
```

---

## Type-Safe Validation

### Critical Anti-Patterns (MUST FIX)

These patterns defeat TypeScript's type safety and must be replaced:

```typescript
// ❌ ANTI-PATTERN 1: Manual type checking in Converters.generic
Converters.generic<unknown, MyType>((from: unknown) => {
  if (typeof from !== 'object' || from === null) return fail('...');
  const obj = from as Record<string, unknown>;
  if (typeof obj.field !== 'string') return fail('...');
  return succeed(obj as MyType); // UNSAFE CAST
});

// ❌ ANTI-PATTERN 2: Manual property checking with cast
if ('id' in obj && 'name' in obj) {
  return succeed(obj as IUser); // Properties could have wrong types!
}

// ❌ ANTI-PATTERN 3: Double casting
const value = someValue as Record<string, unknown> as TargetType;
```

### Required Patterns

Use Converters for data transformation:

```typescript
// ✅ CORRECT: Use Converters.object
const converter = Converters.object<IConfig>({
  name: Converters.string,
  port: Converters.number,
  options: Converters.optionalField(Converters.jsonObject)
});
return converter.convert(input);
```

Use Validators for complex objects with class instances:

```typescript
// ✅ CORRECT: Use Validators for objects with constructors
const validator = Validators.object<IResource>({
  id: Convert.resourceId,
  type: Validators.isA((v): v is ResourceType => v instanceof ResourceType),
  items: Validators.arrayOf(itemValidator)
});
return validator.validate(from);
```

### When to Use Each

| Pattern | Use For |
|---------|---------|
| `Converters.object` | Plain data structures, JSON transformation |
| `Validators.object` | Objects with class instances, complex validation |
| `Converters.generic` | Custom conversion logic (but never with manual type checks!) |

---

## Error Handling

### Prefer Results Over Exceptions

```typescript
// ❌ AVOID throwing in business logic
function process(input: string): Output {
  if (!valid) throw new Error('Invalid');
  return output;
}

// ✅ CORRECT - Return Result
function process(input: string): Result<Output> {
  if (!valid) return fail('Invalid');
  return succeed(output);
}
```

### Error Messages

Include context in error messages:

```typescript
// ✅ GOOD - Contextual error messages
return fail(`Index ${index} out of bounds for array of length ${arr.length}`);
return fail(`${resourceId}: Failed to load: ${underlyingError.message}`);

// ❌ AVOID - Generic messages
return fail('Invalid index');
return fail('Load failed');
```

---

## Extending Core Libraries Over Working Around Them

**When in doubt, level up the core library instead of working around its limitations.**

The repo ships a family of `@fgv/*` libraries that publish canonical primitives — `Result<T>`, `Converter`/`Validator`, `FileTree`, `MustacheTemplate`, `ICryptoProvider`, `Logger`, the collections in `ts-utils`, the resource machinery in `ts-res`, and so on. When you encounter a case where the existing primitive doesn't quite do what you need, there are two paths:

1. **Work around the limitation** in your consumer code — reimplement a partial version, cast through `any`, monkey-patch a global, fork the behavior locally.
2. **Extend the primitive** with an additive change — new option on a `create()` method, new mode flag, new sibling class, expanded interface.

**Default to (2).** The repo expects this discipline of its external consumers (see `LIBRARY_CAPABILITIES.md` and the `/published-primitives-reflex` skill: "before writing utility-shaped code, check whether a primitive exists"). The same discipline applies internally — when one `@fgv/*` library hits a limitation in another `@fgv/*` library, the right move is to extend the lower library, not to layer a workaround on top.

### Why this matters

- **Workarounds compound.** A workaround in one consumer becomes a precedent. Future consumers copy the workaround instead of asking for the upstream extension. The primitive's surface stays artificially small; the ecosystem accumulates duplicate partial implementations.
- **Consumers' trust depends on it.** External consumers won't trust our libraries if our own libraries don't trust each other. If `@fgv/ts-prompt-assist` hand-rolls Mustache escape logic because `@fgv/ts-extras/mustache` "didn't quite support it," that signals to external consumers that the canonical primitive isn't really canonical.
- **Lockstep version policy makes additive extensions cheap.** Adding a new option to a `create()` method or a new sibling export ships in the same alpha as everything else. The cost of extending is small; the cost of accumulating workarounds across libraries grows over time.

### What "extending" looks like (in priority order)

1. **Additive option on an existing `create()` / factory method.** Default value preserves existing behavior. Example: `MustacheTemplate.create(template, { escapeStrategy?: 'html' | 'none' })` — existing callers unaffected; new callers opt into the new behavior.
2. **Additive method on an existing class/interface.** Same compatibility property. Example: adding `sign()` / `verify()` to `ICryptoProvider` (this happened with the crypto-batch-2-misc stream).
3. **New sibling primitive in the same packlet.** When the new behavior is structurally different enough that flagging it via an option would be misleading. Example: `PassthroughMustacheTemplate` as a sibling to `MustacheTemplate`.
4. **New exported class/function.** When the concept is genuinely new.

In all cases: the extension must preserve the existing surface (no removed/renamed/silently-changed exports unless the surface is on the "active development" list per `ACTIVE_DEVELOPMENT.md`).

### When to ask first

Extension scope expands a stream's PR footprint. Ask the orchestrator before extending if:

- The extension would touch a library outside your stream's declared package surface (per the stream brief). Adding a packlet to scope warrants a brief amendment.
- The extension would be **breaking** (removed/renamed exports) on a library whose surface is on the "established/stable" list per `ACTIVE_DEVELOPMENT.md`. Breaking changes on established surfaces require explicit signoff.
- The extension is large enough that it deserves its own stream (e.g., adding a major new packlet, not just a new option on an existing class).

For additive changes on the active-development surface, default to extending without asking — that's the whole point of the active surface designation.

### What "working around" looks like (and why to avoid it)

- Casting through `any` to bypass the type system. Almost always a sign that the primitive's type surface is missing something the consumer needs. The right move: extend the type surface, not bypass it.
- Hand-rolled save/restore patterns for globals (`const originalX = globalThis.X; ...`) instead of using or extending a spy/mock primitive. Recently surfaced as a 23-instance contagion (see `TECH_DEBT.md`).
- Reimplementing partial Mock shapes of canonical types (e.g., `{ isSuccess: () => true, value: x }` cast to `Result<T>`) instead of using `succeed()` / `fail()`. Recently surfaced as a 20-instance contagion in `ts-web-extras` tests.
- Monkey-patching a primitive's behavior at runtime (mutating `Mustache.escape` globally, replacing global `fetch`, etc.) instead of using a per-instance / per-call API extension.
- Duplicating a primitive's implementation in a consumer to add one missing feature. Almost always extending the primitive is cheaper, even after the orchestrator round-trip to expand scope.

If you find yourself reaching for one of these, **stop**. Either the primitive needs extension, or you've misread what the primitive provides and there's already a way. Both outcomes are useful surfacing.

---

## Code Style

### Avoid Over-Engineering

- Only make changes that are directly requested
- Don't add features beyond what was asked
- Don't refactor surrounding code during bug fixes
- Three similar lines is better than a premature abstraction

### Clean Up Unused Code

- Delete unused code completely
- Don't leave `// removed` comments
- Don't rename unused variables to `_var`
- Don't add backwards-compatibility shims

### Null Coalescing

```typescript
// ✅ Use ?? for undefined/null checks
const value = input ?? 'default';

// ❌ Don't use || when ?? is appropriate
const value = input || 'default'; // Wrong if 0 or '' are valid
```

### Prefer Existing Patterns

- Look for similar code in the codebase and follow its patterns
- Use existing helper functions rather than creating new ones
- Check if a Converter, Validator, or type guard already exists

---

## Pre-PR Validation Checklist

**Before opening any PR, run the full local validation suite** in every modified package:

```bash
rushx build    # compile + emit
rushx lint     # ESLint
rushx test     # Jest with coverage gates
```

All three must pass. CI catches what's left, but the local feedback loop is faster and catches issues before reviewers see them.

### `rushx lint` is a first-class gate

`rushx build` does **not** transitively run lint in this monorepo's Heft config. Lint is a separate gate. PRs have repeatedly merged with passing build + tests but failing lint, blocking downstream cluster merges. Treat lint as mandatory, not optional.

If `rushx lint` reports rule violations:
- **Run `rushx fixlint` first.** It autofixes the mechanical class of errors (formatting, unused-import sort, missing semicolons, many style rules).
- For violations the autofix can't resolve, fix manually — **do not disable rules to make lint pass**. If a rule genuinely shouldn't apply, surface as an open question to the orchestrator rather than adding an inline disable directive.

### Acceptance criteria for any stream's exit

Every stream's acceptance criteria list must include:

- [ ] `rushx build` passes in every modified package
- [ ] **`rushx lint` passes in every modified package** *(load-bearing — not transitively run by build)*
- [ ] `rushx test` passes with 100% coverage in every modified package
- [ ] **`rushx fixlint` was run before the final commit** *(catches the mechanical class)*
- [ ] No `any` types; all fallible operations return `Result<T>`
- [ ] **`code-reviewer` agent run on the final diff; findings resolved or dispositioned** *(see "Review-loop discipline" below)*
- [ ] **Copilot review loop driven by implementer; stopped on diminishing returns or 10-round cap** *(see "Review-loop discipline" below)*

The bolded items above are the gap recently codified — multiple recent streams had lint failures escape into PR-open state, blocking cluster merges, and multi-round Copilot ping-pong on PRs that hadn't been internally reviewed first.

### Why this gate is load-bearing

Lint errors break CI. When a cluster integration branch tries to merge to `release`, a single per-stream lint failure blocks the whole cluster. The cost compounds: the cluster-close prep PR can't merge, the integration-to-release PR can't merge, and any downstream consumer waiting for the alpha gets delayed.

The local cost of running lint is ~5-10 seconds per package. The downstream cost of skipping it is potentially hours of orchestrator + agent time unwinding a blocked merge.

### For orchestrators

When reviewing an implementing agent's PR before merge (or before bundling into a cluster-close prep), call `mcp__github__pull_request_read` with `method: get_check_runs` and refuse to advance the workflow if any check is `conclusion: failure`. Do this **before** opening downstream prep/promotion PRs — once a failed-CI commit is in the integration branch, unwinding is painful.

---

## Review-loop discipline

PR review is a three-layer stack:

1. **Internal pre-push pass** — implementing agent runs the `code-reviewer` agent on the final diff *before* the first push.
2. **External post-push loop** — implementing agent drives Copilot's automated review on the open PR, capped and managed.
3. **Orchestrator gating** — orchestrator confirms CI green + Copilot pass addressed before advancing the workflow.

Each layer has a different purpose; skipping any one compounds cost into the next. Layer 2 in particular bloats into 5-6 ad-hoc rounds when layer 1 hasn't run, because the internal reviewer catches the repo-pattern class of finding that Copilot would otherwise surface piecemeal.

### Layer 1 — `code-reviewer` agent on the final diff (pre-PR)

**Before opening the PR**, run the `code-reviewer` agent on the final diff. Resolve or disposition every finding:

- **P1** findings (CI-blocking — `any` types, Result-pattern violations, manual type checks with unsafe casts): must be fixed.
- **P2** findings (should-fix — chaining over intermediate variables, missing error context, missed cascade): fix or explicitly disposition (e.g. "intentional; would need a separate refactor").
- **P3** findings (advisory — style, naming consistency): apply or note.

Summarize the run in the PR description: which findings were found at which priority, what was resolved, what was dispositioned with reasoning. This is part of the standard PR-description gate — not a freeform addendum.

**Why this matters.** A `private-key-storage` style six-round Copilot loop (PR #427) is almost always evidence that layer 1 was skipped. The internal reviewer is built for repo-pattern + edge-case classes (browser-barrel `node:crypto` leaks, types/JS mismatches, JWK cast safety, IDB durability chains, doc-accuracy drift) — exactly what Copilot catches one-at-a-time over several rounds. A single internal pass up front converts multi-round external ping-pong into one round.

### Layer 2 — Copilot review loop, agent-driven with cap

After the first complete commit (gates green, layer-1 findings resolved), the implementing agent **drives** the Copilot loop:

1. **Request Copilot review on the first complete commit** — when the PR is ready, the agent considers it ready, and layer 1 has been run.
2. **Re-request Copilot review after each round** of resolved comments, for as long as the agent believes Copilot is adding **substantive value** (real findings, not nitpicks or repetition).
3. **Cap at 10 rounds total.** Most PRs converge well before this; the cap is a safety net to prevent runaway loops.
4. **Stop conditions: diminishing returns OR cap.** When either fires, the agent stops requesting reviews and surfaces the stop to the orchestrator (or to the user, if no orchestrator is in the loop) with a one-line note: "stopping the Copilot loop after N rounds because [diminishing returns / 10-round cap]; latest round's findings resolved or dispositioned."

The "agent judges diminishing returns" step is load-bearing: agents have full diff + commit-history context and are well-positioned to call when each round is still surfacing substantive findings vs. surfacing ever-smaller issues. The cap exists as a safety net, not the expected stop point.

Include in the PR description: `Copilot review loop driven by implementer; stopped at <N> rounds on [diminishing returns / cap]`.

### Layer 3 — Orchestrator gating (already codified in `.claude/agents/orchestrator.md`)

When reviewing an implementing agent's PR before merge or bundling, the orchestrator:

1. Calls `mcp__github__pull_request_read` with `method: get_check_runs` and refuses to advance if any check is `conclusion: failure`.
2. Waits for Copilot's automated review pass before merging — the unified-delta pass catches structural findings that per-PR reviews miss (half-cascades, runtime-soundness gaps, TSDoc/impl drift). Allocate ~1–2 rounds at this layer; yield curves down beyond that.
3. Once CI is green and Copilot's pass is addressed, advances the workflow.

This layer doesn't replace layers 1 and 2 — it audits that they ran and catches the unified-delta class of finding that only emerges when constituent PRs are bundled.

### Why the cap matters

A 10-round cap on layer 2 is the safety net against runaway loops on PRs where Copilot finds ever-smaller issues. The expected stop is the **diminishing-returns judgment**, which fires earlier — typically after 2–4 rounds on a well-prepared PR. If a PR is running into round 5+, that's a signal worth surfacing to the orchestrator: either layer 1 wasn't run thoroughly, or the change is genuinely large enough to warrant the rounds, or Copilot is in nitpick territory and the agent should call diminishing returns.

### Round count is not the signal — substantive value per round is

A common implementer mistake: stopping the Copilot loop at round 3 because "three rounds feels like enough" when round 3 surfaced a substantive structural finding. Round count is a safety net, not a stop criterion. The correct stop signal is **the finding profile of the most recent round** — was it substantive (real correctness or anti-pattern issues) or nitpicky (style, doc-drift, advisory observations)?

Concrete patterns from observed loops:

- **Round 3 surfaces a load-bearing structural bug** (e.g. a validator/convert symmetry hole invisible to top-level tests but real when nested) → don't stop; commission round 4 because the system clearly still has substance to surface. If round 4 then surfaces only doc-drift and judgment calls, *that* is the diminishing-returns signal.
- **Round 2 surfaces only "missed an `ae-unresolved-link` warning" and "rename test file header"** → stop now; the loop is in nitpick territory regardless of round count.
- **Round 5+ on a PR that has been mostly nitpicks since round 3** → stop and surface to the orchestrator with the diagnosis ("rounds 3–5 produced only doc and naming items; treating as diminishing returns at round N").

The orchestrator handles edge cases: PRs that legitimately need 5+ rounds (large surface, novel patterns), PRs that should have stopped at 2 (one substantive round + one cleanup), PRs that hit the 10-round cap (those almost always indicate layer 1 was skipped or the PR is too large for the loop and should be decomposed). Implementing agents should call the stop and surface the reasoning; the orchestrator decides whether to push back or accept.
