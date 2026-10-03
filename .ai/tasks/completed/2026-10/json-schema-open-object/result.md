# Result — `json-schema-open-object`

**Shipped:** an open `JsonSchema` object now keeps what its wire schema admits — undeclared keys reach the caller as validated `JsonValue` instead of being silently dropped, and `toJson()` states `additionalProperties` either way.

Origin: ErikFortune/personaility#679. Commits on `json-schema-open-object`: `47b44a81` (fix + tests),
`a74c87a8` (review findings), plus this finalize commit.

## What shipped

`@fgv/ts-json-base`, `json-schema-builder` (and one line in `converters`):

- **Open objects pass undeclared keys through.** `JsonSchema.object(props, { additionalProperties: true })`,
  and every `fromJson` object without an explicit `additionalProperties: false`, converts declared
  properties through their schemas as before, then carries every undeclared key through as a
  `JsonValue` validated by `Converters.jsonValue`. Bad undeclared values fail with the key named, and
  all of them are reported (`mapResults`).
- **A non-object is refused.** Before, an open object converted `42`, `'hi'`, `[1]`, `true` to `{}`.
  It now fails with `open object: expected a JSON object, got <kind>`. `null` is accepted only by a
  nullable node, as before.
- **`toJson()` always states `additionalProperties`** (`true` or `false`), so the wire and the
  converter can be compared without inferring a default.
- **Typing:** new `OpenObjectStatic<P> = ObjectStatic<P> & JsonObject`. Two new `object()` overloads
  select it when `additionalProperties: true` is a literal (with and without `nullable: true`). A
  non-literal `boolean` still gets `ObjectStatic<P>`, so existing call shapes keep their types. All of
  this is additive in `etc/ts-json-base.api.md`.
- **A latent defect fixed in passing (disclosed in the change file):** `Converters.jsonObject` assigned
  `obj[name] = v`, so a parsed `"__proto__"` key replaced the copy's prototype and the key vanished
  from the output. It now uses `Object.defineProperty`. This became reachable through the new
  pass-through path at any nesting depth, which is why it is fixed here rather than deferred.
- `CAPABILITIES.md` describes the open-object behaviour. The change file is `minor` with a `BREAKING:`
  prefix: `json-schema-builder` is absent from `origin/main`, so it never shipped non-alpha.

The closed default (`additionalProperties: false`) is unchanged: strict, and it rejects undeclared keys.

## Verdicts on the brief's beliefs

1. **Stripping was deliberate — correct.** Both comments and `validate.test.ts:120` say so, and I
   confirmed it by running the code. Those comments were rewritten because they described the
   behaviour this stream removes.
2. **The defect is the wire/converter disagreement — correct.** `toJson()` omitted the keyword
   (JSON Schema: open) while the converter dropped the keys. One addition: the disagreement had a
   second symptom the brief did not name. An open object with no declared properties accepted *any*
   non-object input and returned `{}`.
3. **`ObjectConverter._convert` builds from declared fields only; do not change `Converters.object` —
   correct.** Lines 225–241 on `release` match. `strict: false` only suppresses the unexpected-key
   error. When `fields` is empty it never inspects `from` at all, which is the cause of the extra
   symptom in (2). `Converters.object` is untouched.
4. **`fromJson.ts:413` maps `!== false` to `true`, covering absent, `true` and schema-valued —
   partly wrong.**
   - Absent and `true` do map to `true`.
   - Schema-valued `additionalProperties` never reaches line 413. `fromJson.ts:371–373` reads the
     field with `Converters.boolean` and **refuses** a schema value (`schema-valued
     'additionalProperties' is not supported`). That is pinned by `fromJson.test.ts` and by a new
     test in `openObject.test.ts`.
   - So today the open-node set is exactly "absent or `true`".
5. **`ObjectStatic<P>` has no index signature — correct, and it surfaced as a compile error.** The
   first pass-through test did not type-check (`'extra' does not exist in type …`). The fix is the
   additive answer above: `OpenObjectStatic` plus literal-keyed overloads, so no established export
   changes.
   - The implementation signature's return type is a union. Without it the open-and-nullable overload
     is incompatible with the implementation (TS2394).
   - Caveat: `OpenObjectStatic` is only inhabitable when every declared property type is a
     `JsonValue`. That holds for every built-in factory and is documented in `@remarks`.

## Decision

**Chosen: (d) — (a) pass-through, plus the wire always stating the keyword, plus the typing answer.**
- It is the only option that satisfies all three requester constraints at once:
  - a validated call reaches the tool intact;
  - nothing is refused, so the refusal-scoping constraint is moot;
  - stripping a stray key from a *closed* object is unchanged.
- It makes the converter agree with the wire. The wire was already truthful under JSON Schema's
  default. It was the converter that lied.

Rejected:
- **(a) alone, wire unchanged.** Correct behaviour, but it leaves agreement to be inferred from a
  default. The emitted keyword costs nothing:
  - the Gemini and Ollama sanitizers in `ts-extras` strip `additionalProperties` at any value;
  - OpenAI strict mode rejects an open object whether the keyword is absent or `true`, so that
    behaviour is unchanged.
- **(b) close the wire (`additionalProperties: false` always).** It makes a `dict[str, Any]` / `z.record`
  argument uncallable: with no declared properties, the only value a model can send is `{}`. It also
  misdescribes an MCP server's own schema back to the model. This fails the requester's first
  constraint.
- **(c) refuse open nodes in `fromJson`.** It is scoped correctly, but it is strictly worse than (a) for
  the same safety. The requester's hub already does this as an interim, and fgv would only be
  re-implementing that interim. It also leaves the factory's `additionalProperties: true` still
  disagreeing with its own wire.
- **A third mode, "tolerate and strip", kept for factory users.** No consumer in the repo uses
  `additionalProperties: true` outside `ts-json-base`'s own tests (grep over `libraries/`, `tools/` and
  `samples/`). A stripping mode would also need a wire spelling that tells the truth, which is
  `additionalProperties: false`, and at that point it is just the closed default. Not built.
  - Consequence: an object that declares properties and has an **absent** `additionalProperties` now
    keeps stray keys instead of dropping them. The requester called dropping there "defensible", not
    required.
  - The wire for that object says it is open, so keeping the keys is the truthful behaviour.

**Interaction with "record" (schema-valued `additionalProperties`, out of scope):**
`_withUndeclaredKeys` validates each undeclared value with `jsonValue`, and that call is the seam.
A schema-valued `additionalProperties` would pass its schema there instead, and `fromJson` would stop
refusing it. Nothing here pre-empts that design. Its `toJson()` would emit the schema rather than a
boolean, and the agreement tests would need a third column.

## Revert results

Each fix component was reverted alone, and the `json-schema-builder` (+ `converters`) tests were run
each time:

| revert | red tests |
|---|---|
| whole fix (new tests on `release` @ `3515f456`) | 20: every open-object reproduction, factory and agreement test; the closed-shape controls stayed green |
| R1: open branch returns the declared-only converter | 17: both requester reproductions, all fromJson open cases, the factory pass-through tests, and all 5 open "convert keeps what wire admits" agreement tests, plus the 2 updated pre-existing tests |
| R2: old `toJson()` (keyword only when false) | 6: all 5 "wire states additionalProperties" agreement tests, plus `toJson.test.ts` "states the keyword" |
| R3: drop the `isJsonObject` guard | 1: "a non-object is refused" |
| R4: build the result by assignment instead of `Object.fromEntries` | 1: top-level `__proto__` test |
| R5: `Converters.jsonObject` back to `obj[name] = v` | 2: the new `converters.test.ts` `__proto__` test and the nested-`__proto__` open-object test |

R1–R4 were measured against `47b44a81` and R5 against the review-fix tree. The agreement tests were
restructured after R1 and R2; they assert the same pairings declaratively.

## Gates

- `ts-json-base`: `heft build --clean` reports **0 errors, 0 warnings** (the first run after the API
  change prints api-extractor's "updating api.md" warning; a re-run is clean). `eslint src`: 0.
  `heft test --clean`: **1216 passed, 0 failed, 100 / 100 / 100 / 100 coverage, 0 warnings**.
- `verify-capability-docs.mjs`: 0 failed.
- Repo-wide `install-run-rush.js test` on `47b44a81`: **SUCCESS: 36 operations**, 0 error lines,
  nothing restored from cache. The only `warning` line is Rush's pre-existing "1 Git-tracked
  symlinks" notice, which is not a build or test warning.
- Repo-wide `install-run-rush.js test` on `a74c87a8`: GATE2.
- `rush change --verify --target-branch origin/release`: CHANGEVERIFY.

## Consumers whose tests changed

**None outside `ts-json-base`.** Both repo-wide runs were green with no consumer edits. That includes:
- `ts-extras-mcp`, whose adapted MCP tools now pass undeclared keys through and emit
  `additionalProperties: true`;
- `ts-extras` ai-assist;
- `ts-agent-tasks`;
- `ts-agent-memory`.

Inside `ts-json-base`, three existing tests pinned the old boundary and were updated:
- `validate.test.ts` "additionalProperties: true ignores unknown fields" now carries the fields
  through;
- `fromJson.test.ts` "object without additionalProperties:false is lenient" now expects the extra key;
- `toJson.test.ts` "additionalProperties: true omits the keyword" now states the keyword.

## `code-reviewer` (layer 1), run on `47b44a81` before coverage closure

No P1s.
- **P2, nested `__proto__` lost via `jsonObject`:** fixed (above).
- **P2, the repo-wide test is required:** done, twice.
- **P2, `CAPABILITIES.md`:** updated.
  - The checked-in typedoc pages under `libraries/ts-json-base/docs/` still carry the old option
    text.
  - Not regenerated, and that is deliberate: the two previous `json-schema-builder` streams (#655,
    #659) did not regenerate them either. Regenerating would add hundreds of unrelated diffs to this
    PR.
- **P3, typing of `_withUndeclaredKeys`:** applied (`T extends object`, typed entries, no `any` leak).
  - The reviewer's suggested `{ ...converted, ...Object.fromEntries(extras) }` was **tried and
    reverted**. Compiled down-level, the spread becomes `Object.assign`, which sets a top-level
    `__proto__` as the prototype. The R4 test caught it. The docstring now says why spread is not
    used.
- **P3, implementation-signature union:** kept. It is sound and invisible to callers.
- **P3, `OpenObjectStatic` non-JSON edge:** documented in `@remarks`.
- **P3, error context:** applied.
- **P3, key order:** documented (declared keys first, then undeclared).
- **P3, `{@link}` to a private function:** changed to a code span.
- **P3, `optionalFields:` → `.optional()`:** declined.
  - The lines predate this stream, and the diff only re-indents them.
  - Optionality here is detected from the schema node (`_type === 'optional'`), not authored by a
    caller, so the type-safety hole the convention guards against does not apply.
  - Migrating is a separate refactor of `_buildObjectConverter`.
- **P3, test structure:** applied. The agreement tests are declarative with an `open` column, the
  non-object cases use `test.each`, and `wireAdmitsKeys` uses `isJsonObject`. All five missing
  scenarios were added: nested non-JSON extra, aggregated errors, declared optional key, nested
  closed object, nested `__proto__`.

## What the brief got wrong

- **Belief 4:** schema-valued `additionalProperties` is refused upstream of line 413, not mapped to
  `true`.
- **Belief 2/3 omission:** the brief did not name the second symptom, an open object converting a
  non-object input to `{}`.
- **The brief's framing that the stripping was an intentional design to preserve.** It was
  intentional, but nothing outside the package's own tests depended on it, so (a) needed no stop.
