# Stream State: result-should-not-fail

**Status:** ✅ complete — implementation committed and pushed; PR ready to open
**Branch:** `claude/implement-should-not-fail-R6KET` (cloud-agent harness suffix on `feat/result-should-not-fail`)
**Target:** `release`
**Last updated:** 2026-05-21 (implementing agent)

---

## Phase status

| Phase | Status | Notes |
|-------|--------|-------|
| Survey + clean baseline | ✅ | release HEAD `534fede8` post-substrate-prep; ts-utils build+test 100% on baseline |
| Implementation | ✅ | `shouldNotFail` on `IResult` / `Success<T>` / `Failure<T>`; inline V8 + WebKit stack parser; 4 `@internal` helpers exported with `_` prefix |
| Tests | ✅ | new `shouldNotFail.test.ts`, 31 tests, 100% coverage; covers success / failure / label / no-label / frameDepth 0-2 / 4 message-format permutations / synthesized V8 + WebKit stack strings / `captureStackTrace`-unavailable runtime path |
| Skill update | ✅ | `.claude/skills/result-pattern/SKILL.md` — added "Declaration-time fallible work" section; repositioned `.orThrow()` in the Extracting Values table |
| api-extractor + change file | ✅ | `etc/ts-utils.api.md` regenerated (additive only); `common/changes/@fgv/ts-utils/result-should-not-fail_2026-05-21-12-00.json` (type: minor) |
| Pre-PR gates | ✅ | `rushx fixlint` → `rush build` → `rushx lint` → `rushx test` all clean; full-repo `rush build` clean |
| Exit artifacts | ✅ | `phase-result.md`, `README.md`, this `state.md`; substrate migrated active → completed/2026-05 |

---

## Decisions log

### Filter on parsed function name, not raw stack line

First implementation filtered any frame line containing the substring
`shouldNotFail`. This broke immediately because the test file is named
`shouldNotFail.test.ts` and every frame in the test file was dropped. Fixed
by parsing first and filtering only when the **parsed `fn` field** contains
`shouldNotFail` — the file path is no longer inspected for the filter.

### Test design: named local functions, not test arrows

`jest-circus` invokes synchronous test bodies via a Promise microtask, so the
anonymous test arrow does not appear on V8's synchronous call stack when
`shouldNotFail` runs. Tests wrap the call in named local functions
(`namedCallSiteForStackCapture`, `labeledCallSite`, `depth2InnerWrapper`,
`depth2OuterCaller`) and assert on those names. This is also how the
`frameDepth: 2` test verifies attribution skips the inner wrapper and lands on
the named outer caller.

### `@internal` helpers exported for test coverage

`_parseStackFrame`, `_findShouldNotFailFrame`, `_formatShouldNotFailMessage`,
`_normalizeShouldNotFailFnName`, and the `_IShouldNotFailFrame` type are all
exported with underscore prefixes and `@internal` JSDoc tags. They do not
appear in the public API surface and they avoid the "no test-only exports"
rule by being part of the implementation's `@internal` contract — the same
pattern already used for `_errorMessage`. The underscore prefix on the
interface (`_IShouldNotFailFrame`) is required by api-extractor's
`ae-internal-missing-underscore` rule.

### `Error.captureStackTrace` typing

TypeScript's stdlib declares `Error.captureStackTrace` directly on the
`ErrorConstructor` interface, so the call typechecks without any cast. We
guard with `typeof Error.captureStackTrace === 'function'` for WebKit/Safari
where it is undefined.

---

## Acceptance gates

- ✅ `rush build` clean across the full repo (additive surface; downstream consumers compile unchanged).
- ✅ `rushx lint` clean in `@fgv/ts-utils` (after `rushx fixlint`).
- ✅ `rushx test` 100% across all 4 metrics in `@fgv/ts-utils`.
- ✅ `etc/ts-utils.api.md` regenerated — diff is additive only (new method on the three Result classes + `@internal` helpers).
- ✅ Rush change file added with `type: minor`.
- ✅ `/result-pattern` skill updated.
- ✅ No `any` types; no unsafe casts.
- ✅ `phase-result.md` written.
- ✅ Substrate migrated: `.ai/tasks/active/result-should-not-fail/` → `.ai/tasks/completed/2026-05/result-should-not-fail/` with polished `README.md`.
