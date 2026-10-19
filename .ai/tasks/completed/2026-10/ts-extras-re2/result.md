# Result: `ts-extras-re2`

**Shipped:** `@fgv/ts-extras-re2`, the default `patternValidator` for an untrusted JSON Schema `pattern` — `re2PatternValidator` reads the source as an ECMA-262 `u`-mode pattern, rewrites it into RE2 syntax with the same meaning or refuses it, and compiles it with re2js under source-length and program-size limits.

Branch `ts-extras-re2` from `f85ed68b3` (which already contained `integration/asks`). Commits:
`513bd0d7c` (package, code and tests), `9087faf19` (docs, change files, capability routing), and the
close-out commit. PR: #TBD.

## Dependency checks (brief decision 2)

| check | finding |
|---|---|
| version and age | `re2js@2.8.8`, published 2026-10-17T23:00:12Z, ~26 h old at the check (2026-10-19 01:20Z). pnpm 11.12.0's default `minimum-release-age` is `24 * 60` minutes (read from its bundled `pnpm.mjs`), and the repo sets no override. `rush add` and the repo-wide `rush install` both passed with the new lockfile entry. |
| licence | MIT |
| runtime dependencies | none; `engines.node >=20`; ESM, CJS and UMD builds |
| maintenance | 49 versions since 2023-07, 35 of them in 2026, the latest two on 2026-10-17; one maintainer. GitHub was not reachable from this session, so issue and commit activity were not checked. |
| added with | `rush add -p re2js@2.8.8`, written exactly (`"re2js": "2.8.8"`). The lockfile delta is the new project only. |

## What shipped

`@fgv/ts-extras-re2` was registered in `rush.json` on the `base-utils` lockstep policy, and laid
out from the `ts-extras-argon2` template.

| export | |
|---|---|
| `re2PatternValidator: JsonSchema.SchemaPatternValidator` | the defaults |
| `createRe2PatternValidator({ maxSourceLength?, maxProgramSize? })` | `Result<JsonSchema.SchemaPatternValidator>`; fails on a limit that is not a positive integer |
| `DEFAULT_RE2_PATTERN_LIMITS` | `{ maxSourceLength: 1024, maxProgramSize: 10000 }` |
| `IRe2PatternValidatorOptions` | options type |

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
  - binary properties, `Script_Extensions`, and `Script=` values that RE2 would resolve as a category
    or a binary property;
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
- Property tables come from re2js (Unicode 17) and not the host engine's version. Node 22 has
  Unicode 16. I checked every code point: the categories agree apart from code points newly
  assigned in Unicode 17.
- Named groups: `(?<name>…)` is accepted with ASCII `[A-Za-z_][A-Za-z0-9_]*` names only, and emitted
  as RE2's `(?P<name>…)`.

## Tests

156 tests in two files, at 100% statements, branches, functions and lines.

`re2PatternValidator.test.ts` (149 tests):

- **Search and anchoring.** This includes `$` never matching before a trailing newline.
- **Catastrophic patterns.** Seven run on inputs of at least 100,000 characters: `(a+)+$`,
  `^(a|a)*$`, `(.*a){20}` both ways, `(x+x+)+y`, `\d+…\d+$` and `^(\w+\s?)*$`. Each asserts by
  operation, not wall clock: the input length is asserted, and the predicate returns the expected
  answer.
- **Set equivalence against V8.** Fourteen patterns are compared with V8 `/…/u` literals over every
  BMP code point and every 251st astral one: `\s`, `\S`, `.`, `\d`, `\D`, `\w`, `\W`, plus class and
  negated-class forms.
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

GATES-PLACEHOLDER

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

## Review

Sub-agents were limited to `web-fetch`, so no independent `code-reviewer` pass ran. I did a
deliberate self-review before measuring coverage; `state.md § Review` lists what it changed. **The
gate-time review is the first independent one.** Suggested focus areas:

- the class and quantifier state machine in `ecmaPattern.ts`;
- the `RE2_NON_SCRIPT_NAMES` deny-list. It mirrors re2js 2.8.8's tables and must be re-checked on
  every bump.

## Not done / deferred

- No browser test. re2js supports browsers, and the README says this package is tested on Node only.
- No compile cache. This is deliberate; see the README's not-in-scope list.
