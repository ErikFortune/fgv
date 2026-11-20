# Stream brief: `result-should-not-fail`

**Status:** 🟢 ready to commission
**Branch base:** `release`
**Workflow shape:** single-PR feature (no integration branch; no sub-phase decomposition)
**Package surface:** `@fgv/ts-utils` (Result base packlet) + `/result-pattern` skill update

---

## Mission

Add a `.shouldNotFail(label?, frameDepth?)` method on `Result<T>` for declaration-time / setup-time assertions that "this Result MUST be a success — if not, throw a helpful error that points at the call site." Replaces the current `.orThrow()` + `.withErrorFormat(() => 'context')` boilerplate at module-level const declarations, static class properties, and test-fixture sites.

## Problem statement

A common pattern is:

```typescript
const CONST_THING: Thing = Converters.thing('thing').orThrow();
```

Failure modes today:
- The error message is whatever the converter produced — usually with no indication of WHICH constant or test value failed.
- The stack trace points at internal Result/Converter machinery.
- Adding `.withErrorFormat((msg) => 'CONST_THING declaration: ' + msg)` helps but is verbose and intent-obscuring.

`.shouldNotFail()` makes intent explicit at the call site AND auto-captures location, so the error message is useful without manual instrumentation.

## Locked design

### Signature

```typescript
shouldNotFail(label?: string, frameDepth?: number): T
```

- **`label`** (optional): human-meaningful identifier (e.g. `'CONST_THING global'`). When provided, prefixes the error message.
- **`frameDepth`** (optional, default `1`): for library-author wrappers that call `shouldNotFail` from within their own helpers — lets the wrapper point at THEIR caller, not at themselves.

### Semantics

- On success: returns `this.value` (same as `.orThrow()`).
- On failure: throws an `Error` constructed from the Result's failure message + captured call-site info.

### Error message format

Conditional on whether the captured frame has a usable function name:

| Has label | Has fn name | Message format |
|---|---|---|
| ✅ | ✅ | `<label> (at <fn> in <file>:<line>): <original error>` |
| ✅ | ❌ (anonymous/empty) | `<label> (at <file>:<line>): <original error>` |
| ❌ | ✅ | `<fn> at <file>:<line>: <original error>` |
| ❌ | ❌ | `<file>:<line>: <original error>` |

Skip the function name when it's empty, `<anonymous>`, or `Object.<anonymous>` (the noise pattern from V8's module-top-level IIFE wrapping).

### Stack capture mechanism

- Use `Error.captureStackTrace(err, shouldNotFail)` on V8 (Node + Chromium). This non-standard but widely-supported helper tells V8 to omit `shouldNotFail` and everything above it from `.stack`, so the parsed frame[0] is the user's call site directly.
- On WebKit (where `Error.captureStackTrace` is undefined), fall back to parsing the stack manually and skipping frames whose function path contains `shouldNotFail`.
- Parse both V8-style (`at <fn> (<file>:<line>:<col>)`) and WebKit-style (`<fn>@<file>:<line>:<col>`) frames. Existing parser libraries (`stacktrace-parser`, etc.) exist; for one method's worth of parsing, inline the logic to keep `@fgv/ts-utils` dependency-free.
- `frameDepth` selects which frame to attribute to (after the `captureStackTrace` skip, default 1 means "the immediate caller").

### Behavior in initialization contexts (load-bearing for docs)

| Context | Expected behavior |
|---|---|
| Module-level `const` declaration | File:line reliable. Function name typically `<anonymous>` or `Object.<anonymous>` — skipped in message format. |
| Static class property initializer | File:line reliable. Function name varies by TS compile target (ES2022 emits `static {}` blocks natively; older targets compile to anonymous IIFEs). |
| Static initialization block (`static { ... }`) | File:line reliable; function name often `<static_initializer>` on modern compile targets. |
| Function-wrapped initialization | Default frameDepth=1 points at the wrapping function; library authors use `frameDepth: 2` to point at their caller. |
| Inside test fixtures | Same as function-wrapped; tests see the fixture function name. |

### Source-map dependence

Stack reports compiled-file locations unless `source-map-support` is loaded (Node) or DevTools has source maps (browser). fgv's Heft + ts-jest configurations load them. Document as a JSDoc caveat: "function name and exact line number depend on source-map availability in the runtime."

## In-scope paths

- `libraries/ts-utils/src/packlets/base/` — Result method implementation (locate the existing `orThrow` implementation; `shouldNotFail` lives alongside).
- `libraries/ts-utils/src/test/unit/` — unit tests covering success, failure, with/without label, frameDepth override, all four message-format permutations, V8 and (best-effort) WebKit parsing.
- `libraries/ts-utils/etc/ts-utils.api.md` — api-extractor regen.
- `common/changes/@fgv/ts-utils/` — rush change file (`minor` bump).
- `.claude/skills/result-pattern.md` (or wherever the skill content lives — find via `grep -r "/result-pattern"`) — add a "Declaration-time fallible work" section naming `.shouldNotFail()` as the canonical method for module-top-level / static / test-fixture sites. Distinguish from `.orThrow()` which stays the canonical method for chains where the throw is intentional control flow.

## Out-of-scope

- Jest `expect`-flavored variant (tests have `toSucceed*` matchers; `shouldNotFail` is for production-code invariants and test setup, not assertions inside test cases).
- TypeScript transformer to inject file/line at compile time (heavy infrastructure; runtime stack-trace approach is sufficient).
- Modifying `.orThrow()` — it stays as-is. `.shouldNotFail()` is a sibling.
- Source-map resolution helpers (consumer-runtime concern).

## Acceptance criteria (hard exit gates)

- [ ] `rush build` passes full repo (downstream consumers compile unchanged — additive surface only).
- [ ] `rushx lint` passes in `@fgv/ts-utils` (separate gate from build).
- [ ] `rushx fixlint` run before final commit.
- [ ] `rushx test` passes with 100% coverage in `@fgv/ts-utils` across all 4 metrics, including the new method's success/failure/with-label/no-label/frameDepth/V8/WebKit-parse paths.
- [ ] api-extractor `etc/ts-utils.api.md` regenerated. Diff shows ONLY the new method on `Result<T>` + `Success<T>` + `Failure<T>` (or wherever the Result hierarchy declares its methods). No removed/renamed exports.
- [ ] Rush change file added under `common/changes/@fgv/ts-utils/` with `type: minor`.
- [ ] `/result-pattern` skill updated with the "Declaration-time fallible work" section.
- [ ] No `any` types; no unsafe casts. Stack-frame parsing returns optional/default-shape types, not casts.
- [ ] Result doc written at `.ai/tasks/active/result-should-not-fail/phase-result.md` summarizing: the implementation pattern (V8/WebKit branch), the final message format examples, any stack-parsing edge cases encountered, any caveats for the JSDoc.
- [ ] State.md updated: row flipped to ✅; substrate migrated to `.ai/tasks/completed/<YYYY-MM>/result-should-not-fail/` with polished README.md as part of the PR (not as a follow-up).

## Stop-and-surface triggers (one-shot — cannot ask mid-flight)

- The `Result` class hierarchy turns out to make adding a method awkward (e.g. shared between `Success<T>` and `Failure<T>` via different implementations needing different shapes than `orThrow` had).
- Stack-trace parsing on the WebKit fallback path surfaces a real format incompatibility that can't be handled tolerantly.
- The `/result-pattern` skill content is structured in a way that "Declaration-time fallible work" doesn't fit cleanly as a section — surface the structural question.

## Skills to load

- `/result-pattern` — load before writing the method (you'll be modifying it). Covers Result base conventions.
- `/result-tests` — load before writing tests.
- `/published-primitives-reflex` — load before reaching for a stack-trace-parsing library. The inline approach is the right call for one method's worth of parsing; the reflex check should confirm there's nothing in `@fgv/*` that already does this.

## fgv-conventions pre-load (per L22)

- All fallible ops return `Result<T>`; `shouldNotFail` is the OK-to-throw counterpart. Don't introduce Result-returning helpers inside its implementation that would defeat the simplicity.
- No `any` types. Stack-frame parsing returns optional/structured types.
- Existing `.orThrow()` stays as-is — `shouldNotFail` is a sibling, not a rename.
- `@fgv/ts-utils` is established surface; this is pure-additive, no breaking changes.
- Per L26-L30 from the recent ts-prompt-assist-features cluster: PR description should accurately frame scope (additive type-and-runtime; not type-only); bundled tests cover both V8 and WebKit-fallback paths; pre-PR `rushx fixlint` is mandatory.

## Branch + PR posture

- **Work branch stem:** `feat/result-should-not-fail` (cloud-agent harness may suffix; document the actual branch name in state.md as your first checkpoint).
- **PR target:** `release` (no integration branch; this is a stand-alone single-PR feature).
- **PR title:** `feat(ts-utils): add Result.shouldNotFail() for declaration-time invariants`
- **PR body:** locked design (signature + semantics + message format table); pre-PR gate checklist; explicit compatibility statement (additive method; `.orThrow()` unchanged); link to the skill update.

## Final-message protocol

≤200 words back to the orchestrator:
- Confirm acceptance gates pass.
- Name the PR number.
- Name any stack-parsing surprises (WebKit format variations, source-map behavior in the test runtime, etc.).
- Confirm the skill update landed cleanly.

Don't restate the work — the orchestrator will read the PR diff and `phase-result.md` directly.
