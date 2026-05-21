# result-should-not-fail — completed

**Stream ID:** result-should-not-fail
**Bucket:** 2026-05
**PR:** [#400](https://github.com/ErikFortune/fgv/pull/400)
**Branch:** `claude/implement-should-not-fail-R6KET`
**Target:** `release` (single-PR feature; no integration branch)
**Workflow shape:** single-PR feature

## What shipped

Added `Result<T>.shouldNotFail(label?, frameDepth?)` on `@fgv/ts-utils`. The
method replaces `.orThrow()` + `.withErrorFormat()` boilerplate at
declaration-time / setup-time sites (module-top-level `const`, static class
property initializers, static initialization blocks, test fixtures). On a
`Failure`, it throws an `Error` whose message is composed from the original
failure message and the captured call site — function (when usable), file,
and line. On a `Success`, it returns the value, same as `.orThrow()`.

Implementation uses `Error.captureStackTrace` on V8 (Node + Chromium) with a
WebKit fallback that filters frames whose parsed function name contains
`shouldNotFail`. Stack-frame parser handles both V8 (`at <fn> (<file>:<line>:<col>)`)
and WebKit (`<fn>@<file>:<line>:<col>`) formats inline — no new dependency.

## Files touched

- `libraries/ts-utils/src/packlets/base/result.ts` — method on `IResult` /
  `Success<T>` / `Failure<T>`, plus four `@internal` helpers exported with
  underscore prefixes for direct test coverage.
- `libraries/ts-utils/src/test/unit/shouldNotFail.test.ts` — new test file,
  31 tests, 100% coverage of the new code paths including synthesized V8 +
  WebKit stack strings and a runtime test that nulls out
  `Error.captureStackTrace`.
- `libraries/ts-utils/etc/ts-utils.api.md` — api-extractor regen.
- `common/changes/@fgv/ts-utils/result-should-not-fail_2026-05-21-12-00.json`
  — minor bump.
- `.claude/skills/result-pattern/SKILL.md` — added "Declaration-time fallible
  work" section, repositioned `.orThrow()` in the Extracting Values table.

## Compatibility

Pure-additive. No removed/renamed exports. `.orThrow()` unchanged.

## Lessons / surprises

See `phase-result.md` for the full list. The non-obvious findings were:

1. **Filter on parsed `fn` field, not raw line text.** The test file itself
   is named `shouldNotFail.test.ts`, which collides with a naïve
   `line.includes('shouldNotFail')` filter.

2. **jest-circus runs synchronous test bodies via a Promise microtask**, so
   the anonymous test arrow is not on V8's synchronous call stack. Tests
   must wrap the call in a named local function and assert on that function's
   name. The same pattern doubles as the `frameDepth: 2` test (named outer
   caller → named inner wrapper).

3. **Don't throw a fresh `Error(message)` after `captureStackTrace`** — it
   discards the elided stack. And don't fix that by reading `.stack` then
   assigning `.message`: V8 materializes `.stack` lazily on first access and
   caches the header with whatever message was set at read time. The final
   shape is a two-Error pattern: a probe to find the caller frame, then a
   final `Error(formattedMessage)` with its own `captureStackTrace` call.
   Both regressions surfaced via post-PR-open review and are pinned by tests.

## Artifacts

- `brief.md` — original brief (locked design).
- `phase-result.md` — implementation notes, surprises, acceptance-gate log.
