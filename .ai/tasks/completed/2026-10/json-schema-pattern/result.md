# Result: `json-schema-pattern`

**Shipped:** `pattern`, split by trust — a host's own `RegExp` through `stringOptions({ pattern })`
is enforced and sent where the wire documents `pattern`, and `fromJson` admits a server's `pattern`
only through an injected `patternValidator`, so the library never constructs a `RegExp` at all.

Branch `json-schema-pattern`, from `d33b149e7` merged with `integration/asks` at `b7986878b`
(#740, #739, #738). Commits: `eaf47d8ff` (merge), `60ee1660e` (code and tests), `8a1c49e42` (docs,
change files, prettier), and the close-out commit. PR: #TBD.

**The live wire probe is the user's to run before merge.** This session had no provider keys; the
probe's new rows are unit-tested over synthetic responses only.

## What shipped

### `@fgv/ts-json-base`

- **Trusted path.** `IStringSchemaOptions.pattern?: RegExp`, reaching a factory only through
  `stringOptions` (a raw `pattern` is a compile error, as the lengths are).
  - Refused unless the `RegExp`'s flags are **exactly `u`**. JSON Schema patterns are ECMA-262 built
    with `u`, and the wire carries only the source, so this is the one form whose meaning is what
    the wire states. Every other flag, and no flag, is refused with `write /…/u`.
  - Source and flags are read through the built-in accessors, and matching uses the built-in `exec`,
    so own or subclass overrides of `source`, `flags`, `test` or `exec` change nothing. A `RegExp`
    re-initialised with `compile()` afterwards fails every value closed. A `Proxy` is refused.
  - `toJson()` emits `pattern: <source>`, after the lengths and before `format`.
  - **Why a `RegExp` and not a source string:** with a string the library would compile strings on
    the trusted path, and the security property would rest on which function was called. With a
    `RegExp` there is no `new RegExp` anywhere in the library (`grep -rn "new RegExp"
    libraries/ts-json-base/src/packlets` → 0), and `@rushstack/security/no-unsafe-regexp` stays clean.
- **Untrusted path.** `fromJson(json, options?: IFromJsonOptions)`, with
  `patternValidator?: SchemaPatternValidator`:

  ```ts
  type SchemaPatternPredicate = (value: string) => boolean;
  type SchemaPatternValidator = (source: string) => Result<SchemaPatternPredicate>;
  ```

  - **Without a validator, `pattern` is refused exactly as before** (`#/…: unsupported JSON Schema
    keyword 'pattern'`) by the forbidden-keyword check, before the keyword's value is read, on any
    node kind. `jsonSchemaConverter` takes no options and always refuses.
  - With one: on a string node the validator gets the source verbatim. A `Failure`, a throw or a
    non-function refuses the schema (`#/…: pattern "<src>" was refused: <msg>`). The predicate
    enforces the pattern; a throw or any answer but `true` fails the value. The source is emitted
    unchanged. Beside `enum`/`const` it is refused; on a non-string node it is neither compiled nor
    emitted. Nullable unions, `$ref` and nesting keep the validator.
- **Keywords.** New `schemaPatternConstraintKeywords = ['pattern']`; `pattern` joins
  `SchemaValidatingKeyword` and `schemaConstraintKeywords` (after the lengths), so every
  `SchemaKeywordCapabilities` table must state a rule for it. `unverifiedWireSchemaKeywords` folds
  it: `Constraints: minLength 1; pattern "^\\d+$".`

### `@fgv/ts-extras` — the per-wire decisions

All pages fetched 2026-10-18 with WebFetch (no sub-agent was used).

| wire | `pattern` | evidence |
|---|---|---|
| Responses tools + strict output, `openai` / `xai-grok` own endpoint | **fold** | [O] lists `pattern` ("A regular expression that the string must match"). [X] says "`^` and `$` are *implicit* — the pattern always matches the *entire string*". JSON Schema patterns are unanchored ([JS]), so an xAI wire would state a narrower constraint than the validator. One table serves both, and it is their intersection. |
| same wires, any other provider, `ft:` models, endpoint override | fold | unverified; [O] also lists `pattern` among the keywords fine-tuned models do not support |
| Anthropic tools (and forced-tool output) | **pass** | the pass-everything table: `input_schema` is JSON Schema [A1]; the limits apply to "JSON outputs and strict tool use" [A2] |
| Anthropic JSON outputs | **pass** | [A2] § "Pattern support (regex)": "Full matching (`^...$`) and partial matching", quantifiers, classes and groups supported; backreferences, lookaround, `\b` and large `{n,m}` not, and "Complex patterns may result in 400 errors" |
| Gemini tools and `responseSchema` | **fold** (review round 1; was pass) | [G] Schema documents the field — "`pattern` … Optional. Pattern of the Type.STRING to restrict a string to a regular expression." — but not its semantics: no dialect, and nothing on anchoring. That is the same unknown that folds the OpenAI-family table, so it folds |
| Ollama (`ts-extras-ollama`) | fold | uses `unverifiedWireSchemaKeywords` |

- [O] https://developers.openai.com/api/docs/guides/structured-outputs § "Supported properties"
- [X] https://docs.x.ai/docs/guides/structured-outputs
- [A1] https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools (as cited by #734)
- [A2] https://platform.claude.com/docs/en/build-with-claude/structured-outputs § "JSON Schema limitations"
- [G] https://ai.google.dev/api/generate-content § Schema
- [JS] https://json-schema.org/draft/2020-12/json-schema-validation § 6.3.3 ("regular expressions
  are not implicitly anchored") and https://json-schema.org/draft/2020-12/json-schema-core § 6.4
  (ECMA-262 dialect, "SHOULD be built with the "u" flag")

The TSDoc on `IStringSchemaOptions.pattern` and `schemaPatternConstraintKeywords` says the wire
receives ECMAScript source and that provider engines implement dialects of it.

### `@fgv/ts-extras-mcp`

`IAdaptMcpToolsOptions.patternValidator?: JsonSchema.SchemaPatternValidator`, passed to `fromJson`.
Without it a `pattern` tool stays skipped, with the unchanged reason, so `UNADAPTABLE_TOOLS` and its
`pattern_tool` still hold. With it the tool is adapted. New tests in `shapes.test.ts`, with a real
in-memory server:

- the default skip, with nothing compiled;
- adaptation, where the validator gets the server's source exactly;
- a validator refusal, which skips the tool with its reason;
- on Anthropic: the wire carries the pattern, a breaking call never reaches the server, and a
  matching call is forwarded;
- on OpenAI: the wire folds it into the description, and the validator still refuses a breaking call.

### `samples/testbed` — wire probe

Two fixtures were added, sending the same JSON
`{ v: { type: 'string', pattern: '^[a-z]+$' } }`:

- `pattern-host` is built by `stringOptions({ pattern: /^[a-z]+$/u })`.
- `pattern-fromJson` is read by `fromJson` with `probePatternValidator`, which compiles only the
  probe's own pattern, from a literal.

`IWireProbeFixture` gains an optional `build`, and `readFixture` is now the one reader. The
comparison reads the library tables, so the new `pattern` rows are compared with no probe change.
New unit tests:

- both fixtures emit the same wire and enforce the pattern;
- `ourVerdict` gives pass on Anthropic tools and Anthropic JSON outputs, and adapt on OpenAI, xAI
  and Gemini;
- xAI accepting the fold is `conservative`;
- Anthropic JSON outputs rejecting the pass is `unsafe` on both rows.

## The security pin

`pattern.test.ts` › "refused by default — a pathological pattern is never compiled". With
`jest.spyOn(globalThis, 'RegExp')` installed, `fromJson` is called on `(a+)+$` in a property, on a
non-string `pattern`, on a number node and beside an enum, each with no options and with `{}`. The
spy records **zero** calls, and all eight results are the default refusal. The results are asserted
after the spy is restored, because the matchers' own `instanceof RegExp` sees the spy. A second test
injects a validator that does not use `RegExp`. Across `fromJson`, `toJson()` and two validations
(one a long `aaa…!`), the spy again records zero calls, and the validator is called exactly
once, with the source.

## Fixtures touched

**Default-refusal pins, kept unchanged and still green:**

- `ts-json-base` `smallerShapes.test.ts` › "pattern stays refused";
- `fromJson.test.ts` (the `pattern` forbidden case);
- `ts-extras-mcp` `mcp.test.ts` (both `pattern` skips);
- `endToEnd.test.ts` `pattern_tool` in `UNADAPTABLE_TOOLS`;
- `samples/testbed` `mcpProbe` skip fixtures.

**Updated deliberately:**

- `ts-json-base` `keywordAdaptation.test.ts`: `passAll` states `pattern: 'pass'`, which the total
  table type requires.
- `ts-extras` `schemaKeywords.test.ts`: the `everything` tool schema and the structured-output
  schema gain a `pattern` property. Each per-wire expectation now pins it:
  - fold on OpenAI/xAI tools and strict output;
  - fold on Gemini tools and `responseSchema`;
  - pass on Anthropic JSON outputs;
  - pass on Anthropic tools and forced tool, through `toJson()` equality.

  The folded-validator test also checks `pattern`.
- `samples/testbed` `wireProbe.test.ts`:
  - fixtures are read through `readFixture`;
  - the all-accepting run counts `agrees 24` (was 22).
- `samples/testbed` README: the fixture description.

## Docs

- `ts-json-base` `CAPABILITIES.md`: the `json-schema-builder` row and the shortcut.
- `ts-extras` `CAPABILITIES.md`: the per-wire `pattern` sentence.
- `ts-extras-mcp` `CAPABILITIES.md`: the `adaptMcpTools` signature, the subset list and a `pattern`
  paragraph.
- `fromJson.ts` header: the `FORBIDDEN_KEYWORDS` block, which explains the gate and the default
  refusal, and the `fromJson` TSDoc.
- `docs/FUTURE.md`: `pattern` moved to the shipped line. The deferred bullet is now the next stream,
  a separate RE2 package (e.g. `@fgv/ts-extras-re2`, on the `ts-extras-argon2` pattern) that exports
  a `SchemaPatternValidator`.
- `docs/TECH_DEBT.md`: no entry names JSON Schema `pattern`, so it is unchanged.
- `LIBRARY_CAPABILITIES.md`: unchanged. The JSON Schema shortcut names `JsonSchema` / `fromJson`,
  which still route correctly.
- Change files, all `minor`:
  - `ts-json-base`, `BREAKING (implementers only)`, because a hand-written table must now state
    `pattern`;
  - `ts-extras`;
  - `ts-extras-mcp`.

## Gates

Logs are in `jsp-logs/` under this session's scratchpad. The repo-wide `test` ran longer than the 10-minute foreground limit, so it was run as a tracked background command and awaited to exit before anything else; nothing was left running.
Every log is graded by grep and checked for NUL padding (`wc -c` equals `tr -d '\0' | wc -c`).

| gate | result |
|---|---|
| per-package `rushx test` (`ts-json-base`, `ts-extras`, `ts-extras-mcp`, `ts-extras-ollama`, `testbed`) | exit 0; no `not met`; 100% coverage |
| `rushx build` (the same packages) | exit 0; the only notices are the expected API-signature updates (`ts-json-base`, `ts-extras-mcp`) |
| `rushx fixlint` and `rushx lint` (`ts-json-base`, `ts-extras`, `ts-extras-mcp`, `testbed`) | exit 0; 0 warnings |
| prettier | 2.8.8, the `rush-prettier` autoinstaller, run on every changed `.ts` file |
| `etc/*.api.md` `ae-*` | `ts-json-base` 2 / 35 / 212 (`forgotten-export` / `unresolved-inheritdoc-reference` / `unresolved-link`), identical to `origin/integration/asks`; `ts-extras-mcp` gains one line, no `ae-` |
| repo-wide `install-run-rush.js rebuild` | exit 0; error grep 0; `warning` (-i) 1, the symlink notice; 0 `ae-` lines; `SUCCESS: 38 operations`; no NUL padding |
| repo-wide `install-run-rush.js test` | exit 0; `SUCCESS: 37 operations` (10m42s); error grep 0; `warning` (-i) 1, the symlink notice; 0 `ae-` lines; no NUL padding; no flake this run |
| `change --verify --target-branch origin/integration/asks` | passes (change files for `ts-json-base`, `ts-extras`, `ts-extras-mcp`, all `minor`) |
| `verify-capability-docs`, `generate-capability-feed --check` | `verify-capability-docs` 0 failed; feed regenerated, then `--check` 0 stale |

## What the brief got wrong, or left open

1. **"Accepts a `RegExp` (or a source string)", and "flags that cannot be expressed on the wire are
   refused".** No flag can be stated on the wire. But JSON Schema specifies `u`, so a `RegExp`
   *without* `u` also means something other than its source on the wire: `\p{L}` and `.` read
   differently. So the rule is "exactly `u`", which also refuses `/abc/`. That costs hosts a `u`, and
   it buys a `RegExp` that is never recompiled, which is what keeps the library free of `new RegExp`.
2. **"It must compile."** A `RegExp` is already compiled. What needs checking is that it is a real
   `RegExp`, read through accessors a subclass cannot override, and still the same `RegExp` at match
   time.
3. **OpenAI passes `pattern`, but the OpenAI-family table folds it.** The brief's rule is "pass where
   the docs say supported". OpenAI and xAI both list it, but xAI documents implicit anchoring, which
   changes what the keyword means. One table serves both providers.
4. **Gemini names no regex dialect.** I passed it under the brief's rule; review round 1 folded it,
   per this package's own rule (pass only where the keyword is documented with JSON Schema
   semantics). An enforcement probe — an unanchored pattern — could justify passing it later
   (`docs/FUTURE.md`).
5. **The proxy path.** `callProxiedCompletion` sends `toJson()`, and a proxy that reconstitutes the
   schema with `fromJson` now refuses a host `pattern` unless the proxy injects a validator. From the
   proxy's side that schema is client input, so refusal is the right default. It is recorded here,
   not changed.

## Review

No independent `code-reviewer` ran, because the kickoff forbade sub-agents. My own pass over the
diff changed four things:

- `throw` in the trusted matcher became a `Result`;
- an unreachable defensive branch, which would have needed a `c8 ignore`, was designed out with the
  pattern gate;
- the `new RegExp` copy was removed (lint, and the invariant);
- the `SchemaPatternValidator` TSDoc no longer claims "called once per node", which the `_reshape`
  re-parse contradicts.

An independent gate-time review is the orchestrator's.

## Review round 1

The orchestrator's deep review found no P1s and confirmed the no-untrusted-`RegExp` claim. Base
re-merged with `integration/asks` (#741, `ts-agent-memory` only) in `1a00c3546`.

| finding | resolution |
|---|---|
| **P2** Gemini passed `pattern` although it documents neither dialect nor anchoring, contradicting `schemaPatternConstraintKeywords`' own rule | `geminiSchemaKeywords.pattern` is now `'fold'`, with its TSDoc giving the reason. Tests updated: Gemini tools and `responseSchema` fold it, and the probe's `ourVerdict` is `adapt` on Gemini. The probe's unsafe-pass test now uses Anthropic JSON outputs. Docs updated: the citation table above, `ts-extras` `CAPABILITIES.md`, the change file, the ledger, `README.md` and `meta.yaml`. `docs/FUTURE.md` notes that an enforcement probe could justify passing it later. |
| **P3.1** compile-swap: the built-in `exec` reads `lastIndex` before matching, so a `lastIndex` whose `valueOf` calls `compile()` swapped the pattern after the form check. Reproduced: `^a$` matched `"b"` | Before each match, `lastIndex` is set to the primitive `0` with `Reflect.set`, and the match runs only if it reads back as `0`. The form is checked again after the match. A frozen `RegExp` with a non-zero `lastIndex` fails closed. Two tests cover this: one reproduces the attack (the `valueOf` is never called, and `"b"` is refused), and one covers the frozen case. |
| **P3.2** a validator returning something that is not a `Result` threw a `TypeError` | The returned value is checked to be a `Success`/`Failure` before use, through a `Validators.isA` (ts-utils has no `isResult`). A non-`Result` is refused with `#/…: pattern "<src>" was refused: the pattern validator returned <kind>, not a Result`. A non-function predicate gets its own message. A predicate that returns a non-boolean at validation time now fails the value with `the pattern predicate for "<src>" returned <value>, not a boolean`. Each case is tested, including `undefined`, `null` and an array. One caveat: a `Result` from a different installed copy of `@fgv/ts-utils` is refused too, and the message says so. |
| **P3.3** MCP tests | Two tests added. A validator that throws at admission skips the tool with its reason. A predicate that throws at `execute` produces a correctable tool error: the server is not called and no `error` event is emitted. |
| **P3.4** the held-pattern shape was retyped inline | `IHeldPattern` (`@internal`) moved to `options.ts`, so it is exported from the barrel, and the `_read` / `_createWithMatcher` signatures now name it. `_createWithMatcher` takes `(opts, source, matches)`. The `api.md` `ae-*` counts are unchanged from the base (2 / 35 / 212). |

### Gates, round 1

I checked every log for NUL padding and found none.

| gate | result |
|---|---|
| `ts-json-base`, `ts-extras`, `ts-extras-mcp`, `testbed`: build, fixlint, lint, test | exit 0 each; 0 lint warnings; coverage 100%; no `not met` |
| `etc/*.api.md` `ae-*` | `ts-json-base` 2 / 35 / 212, the same as the base; `ts-extras-mcp` 0, the same as the base |
| repo-wide `rebuild` | exit 0; `SUCCESS: 38 operations`; error grep 0; `warning` (-i) 1, the symlink notice; 0 `ae-` lines |
| repo-wide `test` | **First run:** 17 operations passed. `@fgv/ts-extras` failed one wall-clock test in `safer-fetch/saferFetchRetry.test.ts`, "an exhausted deadline fails with the attempt's own failure": it expected 1 call and got 2. This stream does not touch that code, and `ts-extras`'s own `rushx test` passed earlier in this round. The 20 operations that depend on `ts-extras` were blocked. **Re-run** with `test --from @fgv/ts-extras`, which covers the failed package and every blocked one: exit 0, `SUCCESS: 27 operations`, error grep 0, `warning` 1 (the symlink notice). This test is not on the known-flake list. |
| `change --verify --target-branch origin/integration/asks` | passes |
| `verify-capability-docs` / `generate-capability-feed --check` | 0 failed / 0 stale |
