# Result: `ts-extras-re2`

**Shipped:** `@fgv/ts-extras-re2`, the default `patternValidator` for an untrusted JSON Schema `pattern` — `re2PatternValidator` reads the source as an ECMA-262 `u`-mode pattern, rewrites it into RE2 syntax with the same meaning or refuses it, and compiles it with re2js under source-length and program-size limits.

Branch `ts-extras-re2` from `f85ed68b3` (which already contained `integration/asks`). Commits:
`513bd0d7c` (package, code and tests), `9087faf19` (docs, change files, capability routing),
`b906a0ae1` (close-out), `9048d2d83` (lint fix found by the repo-wide rebuild), and a final
result-update commit. PR: #TBD.

## Dependency checks (brief decision 2)

| check                | finding                                                                                                                                                                                                                                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| version and age      | `re2js@2.8.8`, published 2026-10-17T23:00:12Z, ~26 h old at the check (2026-10-19 01:20Z). pnpm 11.12.0's default `minimum-release-age` is `24 * 60` minutes (read from its bundled `pnpm.mjs`), and the repo sets no override. `rush add` and the repo-wide `rush install` both passed with the new lockfile entry. |
| licence              | MIT                                                                                                                                                                                                                                                                                                                  |
| runtime dependencies | none; `engines.node >=20`; ESM, CJS and UMD builds                                                                                                                                                                                                                                                                   |
| maintenance          | 49 versions since 2023-07, 35 of them in 2026, the latest two on 2026-10-17; one maintainer. GitHub was not reachable from this session, so issue and commit activity were not checked.                                                                                                                              |
| added with           | `rush add -p re2js@2.8.8`, written exactly (`"re2js": "2.8.8"`). The lockfile delta is the new project only.                                                                                                                                                                                                         |

## What shipped

`@fgv/ts-extras-re2` was registered in `rush.json` on the `base-utils` lockstep policy, and laid
out from the `ts-extras-argon2` template.

| export                                                             |                                                                                              |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `re2PatternValidator: JsonSchema.SchemaPatternValidator`           | the defaults                                                                                 |
| `createRe2PatternValidator({ maxSourceLength?, maxProgramSize? })` | `Result<JsonSchema.SchemaPatternValidator>`; fails on a limit that is not a positive integer |
| `DEFAULT_RE2_PATTERN_LIMITS`                                       | `{ maxSourceLength: 1024, maxProgramSize: 10000 }`                                           |
| `IRe2PatternValidatorOptions`                                      | options type                                                                                 |

- **Linear time.** Matching is re2js `test()`, RE2's linear-time engine.
- **Unanchored search.** `abc` matches `xxabcxx`; only `^…$` anchors.
- **ECMA meaning or refusal.** `ecmaPattern.ts` parses the source as ECMA-262 `u`-mode in a single
  pass and emits RE2 syntax. It rewrites:

  - `.` to ECMA's set, which excludes `\r`, U+2028 and U+2029 (RE2's `.` matches them);
  - `\s` and `\S` to ECMA's Unicode whitespace sets (RE2's are ASCII);
  - `\d`, `\w` and their negations to explicit ASCII ranges;
  - every non-alphanumeric literal to `\x{…}`;
  - `\uXXXX` surrogate pairs, `\u{…}`, `\cX`, `[\b]`, `[]` and `[^]`.

  It refuses, naming the construct and its index:

  - lookaround and backreferences;
  - binary properties, `Script_Extensions`, and any `Script=` value outside `ECMA_RE2_SCRIPTS`, the
    frozen allow-list of the 171 scripts both re2js 2.8.8 and V8 (Node 22) accept (review round 1;
    it replaced a deny-list);
  - non-ASCII or duplicate group names;
  - repeat counts over 1000;
  - every Annex B or RE2-only construct (`(?i)`, `(?P<`, `\Q`, `\z`, POSIX classes, `\pL`, octal,
    lone `{` `}` `]`, `\-` outside a class).

- **Limits.**
  - The source length is checked before parsing.
  - The program size is checked after compiling.
  - RE2's own limit on the product of nested repeats, 1000, also applies.
- **Never throws.** The engine is wrapped in `captureResult`. The predicate returns `true` only for
  a match, so a non-string or an engine error answers `false`.

### Dialect differences, as documented in the README

- `\d`, `\w`, `\b`: **no difference.** They are ASCII in both dialects, because a schema pattern has
  no `i` flag.
- `\p{…}`: General_Category values are accepted, short or long, alone or as `gc=`/`General_Category=`.
  `Script=`/`sc=` takes long names only, because RE2 has no four-letter aliases, so `sc=Grek` is
  refused. Binary properties and `scx` are refused.
- Property tables come from re2js (Unicode 17) and not the host engine's. Node 22 has Unicode 16.
  **`\p{…}` membership can differ between engines on some code points**, in two ways. Over every
  code point, comparing categories `L Ll Lu Lo LC Lm M N Nd P S Z C Cn`:
  - **Version skew.** Code points that Unicode 17 assigned and V8 still calls `Cn`. There are 4,803
    for `Cn`, 4,644 for `L`, and so on.
  - **One reclassification.** U+0295 is `Lo` in re2js and `Ll`/`LC` in V8.

  *This corrects the first version of this file, which said the categories agreed "apart from code
  points newly assigned in Unicode 17". That missed U+0295 (review round 1, P2-2).*
- Named groups: `(?<name>…)` is accepted with ASCII `[A-Za-z_][A-Za-z0-9_]*` names only, and emitted
  as RE2's `(?P<name>…)`.

## Tests

178 tests in three files, at 100% statements, branches, functions and lines (156 before review
round 1, which added `unicodeTables.test.ts`).

`re2PatternValidator.test.ts` (149 tests):

- **Search and anchoring.** This includes `$` never matching before a trailing newline.
- **Catastrophic patterns.** Seven run on inputs of at least 100,000 characters: `(a+)+$`,
  `^(a|a)*$`, `(.*a){20}` both ways, `(x+x+)+y`, `\d+…\d+$` and `^(\w+\s?)*$`. Each asserts by
  operation, not wall clock: the input length is asserted, and the predicate returns the expected
  answer.
- **Set equivalence against V8.** Fourteen patterns are compared with V8 `/…/u` literals. The
  sample is every BMP code point plus every 251st astral one; it is a sample, not the whole space.
  The patterns are `^\s$`, `^\S$`, `^.$`, `^\d$`, `^\D$`, `^\w$`, `^\W$`, `^[\s]$`, `^[^\s]$`,
  `^[\S]$`, `^[\D]$`, `^[^\W]$`, `^[\s\S]$` and `^[^]$`. `\p{…}` is **not** in this sweep; see
  `unicodeTables.test.ts` below.
- **Construct equivalence.** Twenty-nine constructs are each compared with a V8 literal on chosen inputs.
  They cover escapes, surrogates, properties, scripts and class edge cases.
- **Refusals.** 72 refusal cases, plus the length and program-size limits and a non-string source.
- **The predicate** is checked with non-string input.
- **Limits.** `createRe2PatternValidator` is tested with tighter and looser limits, and with five
  invalid ones.

`integration.test.ts` (7 tests):

- `fromJson` with `re2PatternValidator`:
  - enforcement, with the pattern emitted unchanged;
  - a search;
  - a lookahead refusal, with the path;
  - `(a+)+$` on a long value;
  - a nullable node.
- `adaptMcpTools` against a real in-memory MCP server:

  - the `code` and `redos` tools are adapted and enforced;
  - the `lookahead` tool is skipped with its reason;
  - without the validator, all three tools are skipped.

  `ts-extras-mcp` and `@modelcontextprotocol/sdk` are devDependencies of this package only. No
  dependency was added to `ts-json-base` or `ts-extras-mcp`.

## Gates

All runs were from the repo root, with logs in a per-worktree scratch directory. Each log was graded
by grep: `not met|FAILURE|Operations failed|error TS` returned 0, case-insensitive `warning`
returned 0 apart from Rush's tracked-symlink notice, and no log had NUL padding.

| gate                                                           | result                                                                                                                                                                                                                                                                                                |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| package `build` / `lint` / `test`                              | exit 0, with 0 warnings; 156 tests (178 after review round 1); 100% statements, branches, functions and lines                                                                                                                                                                                                                    |
| repo-wide `install`                                            | exit 0 with the new lockfile entry (release-age policy active)                                                                                                                                                                                                                                        |
| repo-wide `rebuild`                                            | first run **SUCCESS WITH WARNINGS**: the package's own `no-bitwise` lint warning in `_hexValue`. Fixed in `9048d2d83`, and the re-run was **SUCCESS: 39 operations**, 0 warnings                                                                                                                      |
| repo-wide `test`                                               | 38 of 39 green. The failure was ts-extras `md5Normalizer.browser` › "should handle large objects efficiently", a known load-sensitive test, and it blocked 21 dependents. `rush test --from @fgv/ts-extras` re-ran ts-extras and every dependent: **SUCCESS: 28 operations**, 0 errors and 0 warnings |
| `rush change --verify --target-branch origin/integration/asks` | exit 0. Change files: `ts-extras-re2` `minor`, `ts-json-base` and `ts-extras-mcp` `none` (CAPABILITIES-only edits)                                                                                                                                                                                    |
| `verify-capability-docs`                                       | 0 failed; router at 23,118 of 24,000 characters                                                                                                                                                                                                                                                       |
| `generate-capability-feed --check`                             | 0 stale                                                                                                                                                                                                                                                                                               |
| prettier 2.8.8 (`rush prettier`, plus `--check` on the docs)   | clean                                                                                                                                                                                                                                                                                                 |
| `etc/ts-extras-re2.api.md`                                     | new file, with 0 `ae-*` entries                                                                                                                                                                                                                                                                       |

## Docs

- New `libraries/ts-extras-re2/README.md`, with the dialect table, the dependency posture and the
  not-in-scope list, and `CAPABILITIES.md`.
- `LIBRARY_CAPABILITIES.md`: a package row and the shortcut "Accepting untrusted JSON Schema
  `pattern`?" → `re2PatternValidator` · `ts-extras-re2`.
- `ts-json-base` and `ts-extras-mcp` `CAPABILITIES.md` name `re2PatternValidator` as code spans.
- `docs/FUTURE.md`: the RE2 item is marked shipped. The Gemini and xAI enforcement-probe remainder
  is kept.
- Not in the brief, for accuracy:
  - an `ACTIVE_DEVELOPMENT.md` row for the new package;
  - a `result-integration-boundary.md` instance entry and its dependency-posture list.

## What the brief got wrong

- **"Document the `\d`/`\w` Unicode classes" assumes a difference that does not exist.** Both
  dialects are ASCII here. The real differences are `.` and `\s`, and the validator closes them by
  rewriting rather than documenting. The README states both.
- re2js is a pure-JS port, so it is not a "native" engine. The old FUTURE.md text said native; the
  brief already said pure JS.

`unicodeTables.test.ts` (22 tests, added in review round 1):

- **Every allowed script compiles in both engines.** Each name compiles as `\p{Script=…}` in V8 and
  as `\p{…}` in re2js.
- **Every allowed script is a script in re2js.** An `RE2Set` over all 171 names is swept over every
  BMP code point and every 13th astral one. For each code point, it must report the same script as
  V8, or none, unless one engine has not assigned that code point. Every script must have at least
  one member in the sample. This ties the list to re2js's own table.

  I mutation-checked it: adding `Emoji` to the list fails three tests (compile, sweep and refusal).
- **Refusals.** `Beria_Erfe`, `Sidetic`, `Tai_Yo` and `Tolong_Siki` are refused as `Script=` and as
  `sc=`, although re2js compiles them. So are the names `Emoji`, `Alphabetic`, `Any`, `Assigned`, `Lu`,
  `Letter`, `Grek` and `Nonexistent`.
- **re2js-side pins, independent of the host.** U+0295 is `Lo` and not `Ll`/`LC`; U+A7CE is `L` and not
  `Cn`.
- **A host sweep for `L`, `Ll`, `LC`, `Lo` and `Cn`.** It pins U+0295 as the only difference that is
  not version skew. It runs only when `process.versions.unicode === '16.0'`, and is skipped on any
  other host, because the expected set depends on the host's Unicode version. CI's Node 24 may skip
  it; the re2js-side pins still run there.

## Review

Sub-agents were limited to `web-fetch`, so no independent `code-reviewer` pass ran. I did a
deliberate self-review before measuring coverage; `state.md § Review` lists what it changed. **The
gate-time review is the first independent one.** Suggested focus areas:

- the class and quantifier state machine in `ecmaPattern.ts`;
- the `RE2_NON_SCRIPT_NAMES` deny-list. It mirrors re2js 2.8.8's tables and must be re-checked on
  every bump. *It was replaced in review round 1; see below.*

### Review round 1 (orchestrator, on `a75fa771e`): no P1s, three P2s, three P3s

- **P2-1 (applied).** The `Script=` deny-list let through Unicode 17 scripts that V8 rejects.
  - It was replaced with `ECMA_RE2_SCRIPTS`, a frozen list of 171 names. They are re2js 2.8.8's 175
    script-table names minus the four V8 rejects (`Beria_Erfe`, `Sidetic`, `Tai_Yo`, `Tolong_Siki`).
  - I generated the list by reading re2js's `SCRIPTS` table and test-compiling each name with
    `new RegExp('\\p{Script=…}', 'u')` on Node 22.
  - **To regenerate on a re2js bump,** repeat that and replace the literal.
  - `RE2_NON_SCRIPT_NAMES` is gone. `state.md` still describes it, as it was authored in flight.
- **P2-2 (applied).** The category claim is corrected above. The README now says plainly that
  `\p{…}` membership can differ, and why. The optional sweep was added as a host-gated test, plus
  pins on the re2js side.
- **P2-3 (applied).** The `RE2Set` sweep ties every allowed name to re2js's script table.
- **P3, imperative `isFailure` loops (dispositioned, unchanged).** The loops are in `translate()`
  and `_class()`. They drive a cursor over shared parser state: each step consumes input, and the
  next step depends on where it stopped. A chained form would need a recursive or reduce-based
  driver that hides that ordering for no gain. Each loop has a single early return.
- **P3, translation blow-up (applied).** This is now in the README's limits section. 512 `\S`
  (1024 characters) translate to 89,088 characters of RE2 and compile and check in 56 ms. 1024 `.`
  give 58,368 characters in 19 ms. The growth is linear and bounded by `maxSourceLength` and
  `maxProgramSize`.
- **P3, sweep precision (applied).** The set-equivalence description above now names the 14
  patterns and the sample, and says `\p{}` is not covered there.

**Lint directives added** (this is a disposition, not a silent disable). `unicodeTables.test.ts`
disables two rules on one line each, both with stated reasons:

- `@rushstack/packlets/mechanics`, to import the internal allow-list. The repo does the same in
  `ts-agent-tasks` tests.
- `@rushstack/security/no-unsafe-regexp`, so the host engine can compile property escapes. The
  names come from the frozen list and from literals, never from input. The V8 check the review asked
  for cannot be written without a `RegExp` built at run time.

The library source still constructs no `RegExp`.

## Not done / deferred

- No browser test. re2js supports browsers, and the README says this package is tested on Node only.
- No compile cache. This is deliberate; see the README's not-in-scope list.
