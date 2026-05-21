# `result-should-not-fail` — phase result

## Implementation pattern

Single new method on `IResult<T>` / `Success<T>` / `Failure<T>`:

```typescript
shouldNotFail(label?: string, frameDepth: number = 1): T
```

- `Success<T>.shouldNotFail` is a one-liner: `return this._value`.
- `Failure<T>.shouldNotFail` constructs a fresh `Error`, calls
  `Error.captureStackTrace(err, this.shouldNotFail)` when available (V8), parses
  the stack with an inline two-format parser (V8 + WebKit), composes the message
  per the brief's four-row table, and throws.
- Stack-frame parsing is split into three `@internal` helpers exported with
  underscore prefixes so the test file can cover them directly without adding
  test-only public exports: `_parseStackFrame`, `_findShouldNotFailFrame`,
  `_formatShouldNotFailMessage`, plus the `_IShouldNotFailFrame` type and
  `_normalizeShouldNotFailFnName` helper.

## Stack-parsing surprises

1. **`shouldNotFail` substring filter must scope to the function name, not the
   raw line.** First implementation filtered any stack line whose source string
   contained `shouldNotFail` — which broke immediately because the test file is
   named `shouldNotFail.test.ts`. Every test frame got dropped and the parser
   bubbled up to `jest-circus` internals. Fix: parse first, then filter only
   when the parsed `fn` field contains `shouldNotFail`. File path is not
   inspected.

2. **Jest-circus runs synchronous test bodies via a Promise microtask, so the
   anonymous test arrow does not appear on V8's synchronous call stack when
   `shouldNotFail` runs.** The most-recent caller frame is `Promise.then.completed`
   in `jest-circus/build/utils.js`. The original test design — "call shouldNotFail
   directly in a test arrow and assert the test file shows up" — fails for that
   reason, not because of any bug in the implementation. Tests now wrap the
   call in a **named local function** and assert the function name + file path
   appear. This is a stable, robust pattern that also doubles as a `frameDepth: 2`
   regression case (named outer caller → named inner wrapper).

3. **`source-map-support` is loaded in the Heft + ts-jest setup**, so test
   output shows `.ts` paths and line numbers. Documented as a JSDoc caveat —
   the same code in a browser without source maps emits `.js` paths.

## Final message format (worked examples)

| Inputs | Output |
|---|---|
| `fail('boom').shouldNotFail()` from a named caller | `myFn at /…/file.ts:42: boom` |
| `fail('boom').shouldNotFail('MY_CONST')` | `MY_CONST (at myFn in /…/file.ts:42): boom` |
| Anonymous IIFE (e.g. module-level const, V8) | `MY_CONST (at /…/file.ts:42): boom` (Object.<anonymous> noise dropped) |
| `frameDepth: 0` or out-of-range | `MY_CONST: boom` (no frame info available) |
| WebKit (no `captureStackTrace`, no source maps) | same shape, possibly `.js` path |

## JSDoc caveat

- Function names and exact line numbers depend on source-map availability in
  the consumer runtime.
- The `<anonymous>` and `Object.<anonymous>` patterns are stripped from the
  function name to suppress V8's module-top-level IIFE noise.

## Acceptance gates

- ✅ `rush build` clean across the full repo.
- ✅ `rushx lint` clean in `@fgv/ts-utils` (after `rushx fixlint`).
- ✅ `rushx test` 100% across all 4 metrics in `@fgv/ts-utils`; new `shouldNotFail.test.ts`
  carries 31 tests covering success / failure / label / no-label / frameDepth
  (0, 1, 2) / all four message-format permutations / V8 parse / WebKit parse
  (synthesized stack string + a runtime test that nulls out `Error.captureStackTrace`).
- ✅ `etc/ts-utils.api.md` regenerated — diff shows only the new method on the
  three Result classes plus the new `@internal` helpers.
- ✅ Rush change file added under `common/changes/@fgv/ts-utils/` with `type: minor`.
- ✅ `/result-pattern` skill updated with a "Declaration-time fallible work"
  section, and the "Extracting values" table now lists `.shouldNotFail()` first
  with `.orThrow()` repositioned to "setup chains where the throw is intentional
  control flow."
- ✅ No `any` types; no unsafe casts.
- ✅ Substrate migrated to `.ai/tasks/completed/2026-05/result-should-not-fail/`.
