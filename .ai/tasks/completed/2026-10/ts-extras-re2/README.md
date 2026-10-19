# `ts-extras-re2`: an RE2-backed `patternValidator` for untrusted JSON Schema `pattern`

**Shipped 2026-10-19** onto `integration/asks` (PR #746).
Origin: user decisions 1 and 3, 2026-10-18 and 2026-10-19. It follows `json-schema-pattern` (#742),
which made `fromJson` and `adaptMcpTools` refuse `pattern` unless a validator is injected.

---

## What it is

A server's `pattern` has to be run in-process on model output. On a backtracking engine that is a
ReDoS vector. This package is the validator to inject: RE2 via re2js, a pure-JS port with linear
matching time.

## What shipped

- **`@fgv/ts-extras-re2`**, which exports:
  - `re2PatternValidator`;
  - `createRe2PatternValidator({ maxSourceLength?, maxProgramSize? })`;
  - `DEFAULT_RE2_PATTERN_LIMITS` (1024 / 10000);
  - `IRe2PatternValidatorOptions`.
- **ECMA meaning or refusal.** The source is parsed as ECMA-262 `u` mode and rewritten into RE2
  syntax that matches the same strings. `.`, `\s` and `\S` become ECMA's sets.
  - Refused: lookaround, backreferences, binary properties, `scx`, non-ASCII group names, and
    Annex B or RE2-only syntax.
- **Search semantics.** Patterns are unanchored. The validator never throws, and a predicate fails
  closed.
- **Dependency.** `re2js@2.8.8`, exact: MIT, no dependencies, ~26 h old at the check, which passes
  pnpm 11's one-day default.

## Where to look

- `result.md`: the dependency checks, the dialect differences, the tests, the gates, and what the
  brief got wrong.
- `state.md`: the reasons behind the names, the translator design, and the review caveat (no
  independent reviewer was available to the worker).
- Package docs: `libraries/ts-extras-re2/README.md` (the dialect table) and `CAPABILITIES.md`.
