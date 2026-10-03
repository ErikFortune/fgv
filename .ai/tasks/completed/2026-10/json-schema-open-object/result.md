# Result — `json-schema-open-object`

**Shipped:** an open `JsonSchema` object now keeps what its wire schema admits — undeclared keys reach the caller as validated `JsonValue` instead of being silently dropped.

Origin: ErikFortune/personaility#679. Commits on `json-schema-open-object`:
- `47b44a81`: the fix and its tests;
- `a74c87a8`: the review findings;
- `9e9fe563`: undoes two of those (see *What changed shape*);
- `5eea2cd2`: the gate-time review's changes, including the `__proto__` drop;
- `2c7bf0d3`: Copilot round 1's finding (declared and undeclared failures reported together);
- plus the finalize commits.

## What shipped

All changes are in `@fgv/ts-json-base`, `json-schema-builder` packlet:

- **Open objects pass undeclared keys through.** This covers `JsonSchema.object(props, { additionalProperties: true })` and every `fromJson` object without an explicit `additionalProperties: false`.
  - Declared properties convert through their schemas as before.
  - Every undeclared key is carried through as a `JsonValue`, validated by `Converters.jsonValue`.
  - Bad undeclared values fail with the key named. Declared and undeclared keys are validated independently and every failure from both sides is reported in one error (`mapResults` over the undeclared keys, `allSucceed` over the two sides); the result is built only when both succeed.
  - The result lists declared keys first, then undeclared keys in input order.
  - An own `"__proto__"` key is dropped at every depth (see *`__proto__`* below). The result is assembled with `Object.fromEntries`.
- **A non-object is refused.** Before, an open object converted `42`, `'hi'`, `[1]` and `true` to `{}`. It now fails with `open object: expected a JSON object, got <kind>` (`null`, `array`, or the `typeof`). `null` is accepted only by a nullable node, as before.
- **The wire schema is unchanged.**
  - A closed object emits `additionalProperties: false`.
  - An open object omits the keyword, which JSON Schema reads as open.
  - What changed is the converter: it now honours what the wire already said. Agreement is pinned by a test that reads the emitted JSON and the converter's result together.
- **Typing.**
  - New `OpenObjectStatic<P> = ObjectStatic<P> & JsonObject`.
  - Two new `object()` overloads select it when `additionalProperties: true` is a literal, with and without `nullable: true`.
  - A non-literal `boolean` still gets `ObjectStatic<P>`, so existing call shapes keep their types.
  - All additive in `etc/ts-json-base.api.md`.
- **Docs and change file.**
  - `CAPABILITIES.md` describes the open-object behaviour.
  - The change file is `minor` with a `BREAKING:` prefix: `json-schema-builder` is absent from `origin/main`, so it never shipped non-alpha.
  - **`Converters.jsonObject` drops an own `"__proto__"` key** instead of assigning it (below). Disclosed in the change file.
  - The change file also states that MCP-adapted tools, and any consumer-registered open schema, now forward undeclared keys, so a host gate that authorizes on declared fields sees keys it did not see before.

The closed default (`additionalProperties: false`) is unchanged: it is strict and rejects undeclared keys.

## Verdicts on the brief's beliefs

1. **The stripping is deliberate — correct.**
   - Both comments and `validate.test.ts:120` say so, and I confirmed it by running the code.
   - The comments were rewritten because they described the behaviour this stream removes.
2. **The defect is the wire/converter disagreement — correct.**
   - `toJson()` omitted the keyword, which JSON Schema reads as open, while the converter dropped the keys.
   - The disagreement had a second symptom the brief did not name: an open object with no declared properties accepted *any* non-object input and returned `{}`.
3. **`ObjectConverter._convert` builds from declared fields only; do not change `Converters.object` — correct.**
   - Lines 225–241 on `release` match, and `strict: false` only suppresses the unexpected-key error.
   - When `fields` is empty it never inspects `from` at all. That is the cause of the second symptom in (2).
   - `Converters.object` is untouched.
4. **`fromJson.ts:413` maps `!== false` to `true`, covering absent, `true` and schema-valued — partly wrong.**
   - Absent and `true` do map to `true`.
   - Schema-valued `additionalProperties` never reaches line 413. `fromJson.ts:371–373` reads the field with `Converters.boolean` and **refuses** a schema value (`schema-valued 'additionalProperties' is not supported`).
   - That refusal is pinned by `fromJson.test.ts` and by a new `openObject.test.ts` test.
   - So today the set of open nodes is exactly "absent or `true`".
5. **`ObjectStatic<P>` has no index signature — correct.**
   - It surfaced as a compile error: the first pass-through test failed with `'extra' does not exist in type …`.
   - The answer is the additive `OpenObjectStatic` plus literal-keyed overloads.
   - The implementation signature's return type is a union. Without it, the open-and-nullable overload is incompatible with the implementation (TS2394).
   - Caveat: `OpenObjectStatic` is only inhabitable when every declared property type is a `JsonValue`. That holds for every built-in factory, and it is documented in `@remarks`.

## Decision

**Chosen: (a) pass-through, plus the typing answer. The wire is left as it was.**

This is the only option that meets all three requester constraints:
- a validated call reaches the tool intact;
- nothing is refused, so the scoping constraint on refusal is moot;
- stripping a stray key from a *closed* object is unchanged.

It also fixes the side that was wrong. The wire was already truthful under JSON Schema's default; the converter was not.

Rejected:
- **(d) as first built: pass-through and an always-explicit `additionalProperties: true`.** It shipped in `47b44a81`, and `9e9fe563` reverted it after the antagonist pass found the cost.
  - `@fgv/ts-extras` sends the raw `toJson()` to Anthropic's JSON outputs (`anthropic-output-format`).
  - `structuredOutput.ts:151` records that `additionalProperties` "must be `false`" there, and that a bare `{ type: 'object' }` is accepted and constrained to `{}`. So an absent keyword is accepted, and an explicit `true` is not.
  - Anthropic JSON outputs require `additionalProperties: false`; an explicit `true` was not probed. Leaving the keyword absent keeps the request exactly as `release` sends it.
  - The requester asked for the keyword to be emitted, but that was a means: an absent keyword already says "open".
- **(b) close the wire (`additionalProperties: false` always).**
  - It makes a `dict[str, Any]` / `z.record` argument uncallable: with no declared properties, the only value a model can send is `{}`.
  - It misdescribes an MCP server's own schema back to the model.
  - It fails the requester's first constraint.
- **(c) refuse open nodes in `fromJson`.**
  - It is scoped correctly, but it is strictly worse than (a) for the same safety. It re-implements the requester's own interim.
  - It also leaves the factory's `additionalProperties: true` converter disagreeing with its own wire.
- **A third mode, "tolerate and strip", kept for factory users.**
  - Nothing uses `additionalProperties: true` outside `ts-json-base`'s own tests. I grepped `libraries/`, `tools/`, `samples/` and `apps/`. The one literal hit is a source mutant inside a string in `ts-agent-tasks/perf/mutationMatrix.js`.
  - The only truthful wire for stripping is `additionalProperties: false`, which is the closed default.
  - Consequence: an object that declares properties but omits the keyword now *keeps* stray keys. The requester called dropping them "defensible", not required, and the wire for that object says it is open.

**Interaction with "record" (schema-valued `additionalProperties`, out of scope).**
- `_convertUndeclaredKeys` validates each undeclared value with `jsonValue`, and that call is the seam.
- A schema-valued form would pass its schema there instead, and `fromJson` would stop refusing it.
- Its `toJson()` would emit the schema, and the agreement tests would gain a third column.
- Nothing here pre-empts that design.

## What changed shape after the first commit

The review loop added two things, and both were taken back out in `9e9fe563`:

- **`toJson()` always stating the keyword.** Reverted for the Anthropic reason above. It cost nothing to remove: the converter change is what fixes the defect.
- **A `Converters.jsonObject` `__proto__` fix.**
  - `code-reviewer` found that `jsonObject` copies with `obj[name] = v`. A parsed nested `"__proto__"` therefore becomes the copy's prototype instead of a key. The open-object path reaches this through `jsonValue` for nested values.
  - Fixing it (`Object.defineProperty`) turned the second repo-wide run red. `ts-agent-tasks` `kindRegistry.test.ts` ("a __proto__ key in details reaches the registered converter neutralized") pins the key disappearing. With the fix, a strict downstream converter refuses it instead.
  - That is a contract question on an established converter with a known consumer, outside this stream's surface. The brief also limits consumer edits to test updates this behaviour forces.
  - Reverted in `9e9fe563` and recorded as a TECH_DEBT P3.
  - **Resolved in `5eea2cd2` by a third option from the gate-time review: drop the key.** `jsonObject` now skips an own `"__proto__"` key. The result's own keys are exactly what `release` produced (no `__proto__` key), and no prototype is ever set. The `ts-agent-tasks` pin passes unedited. The open object's top level drops it too, rather than carrying it as data: a data key named `__proto__` is re-read as a prototype by any caller that `Object.assign`s or spreads the arguments. The TECH_DEBT entry is removed.
  - The top level of an open object is unaffected: it is built with `Object.fromEntries`.
- **The reviewer's suggested `{ ...converted, ...Object.fromEntries(extras) }` was tried and reverted.**
  - Compiled down-level, the spread becomes `Object.assign`, which assigns a top-level `__proto__`.
  - The R4 test caught it, and the docstring says why spread is not used.

## Revert results

Each fix component was reverted on its own, and the `json-schema-builder` tests were run each time.

| revert | measured on | red tests |
|---|---|---|
| whole fix (new tests on `release` @ `3515f456`) | `47b44a81`'s tests | 20 red: every open-object reproduction, factory and agreement test. The closed-shape controls stayed green. |
| R1: open branch returns the declared-only converter | `47b44a81` | 17 red: 5 fromJson reproductions; 5 factory tests (pass-through, validate/convert agreement, non-object, bad undeclared value, `__proto__`); 5 open agreement tests; plus the 2 updated pre-existing tests |
| R3: drop the `isJsonObject` guard | `47b44a81` | 1 red: "a non-object is refused". It is now a `test.each` of 5 cases, all of which exercise it. |
| R4: build the result by assignment instead of `Object.fromEntries` | `47b44a81` | 1 red: the top-level `__proto__` test |
| R6: emit `additionalProperties: true` for an open object | `9e9fe563` | 6 red: all 5 open "the wire reads as open" agreement tests, plus `toJson.test.ts` "omits the keyword" |
| R7: `jsonObject` stops dropping `__proto__` | `5eea2cd2` | 2 red: `converters.test.ts` "drops an own __proto__ key … at any depth", and the nested open-object test |
| R8: open object stops dropping a top-level `__proto__` | `5eea2cd2` | 1 red: "a top-level __proto__ key is dropped" |
| R9: validate undeclared keys only after declared fields succeed (the pre-Copilot behaviour) | `2c7bf0d3` | 1 red: "a bad declared field does not hide bad undeclared values". The failure was `Field query: "7": not a string`, naming neither undeclared key |

R2 (the old omit-when-open `toJson()`, measured against `47b44a81`'s always-emit) and R5 (the define-as-data `jsonObject` fix) concerned code that `9e9fe563` removed. R4's top-level test now asserts a drop (R8). R6 is the current wire's guard.

## Gates

- **`ts-json-base` on `2c7bf0d3`:** `heft test --clean` 1218 passed, 0 failed, coverage 100/100/100/100, 0 warnings; `eslint` 0; `etc/ts-json-base.api.md` unchanged.
- **`ts-json-base` on `5eea2cd2`:** `heft test --clean` 1217 passed, 0 failed, coverage 100/100/100/100, 0 warnings; `eslint src` 0; `etc/ts-json-base.api.md` unchanged by this commit.
- **`ts-json-base` on `9e9fe563`:**
  - `heft build --clean`: 0 errors, 0 warnings.
  - `eslint src`: 0.
  - `heft test --clean`: **1214 passed, 0 failed; coverage 100 / 100 / 100 / 100; 0 warnings.**
- **`verify-capability-docs.mjs`:** 0 failed.
- **Repo-wide `install-run-rush.js test`:**
  - On `47b44a81`: **SUCCESS: 36 operations**, 0 error lines, nothing from cache. The only `warning` line is Rush's pre-existing "1 Git-tracked symlinks" notice.
  - On `a74c87a8`: **FAILURE.** `@fgv/ts-agent-tasks` had 1 test failing (the `__proto__` pin above), and `@fgv/testbed` was blocked. This led to `9e9fe563`.
  - On `9e9fe563`: **SUCCESS: 36 operations** (+1 no-op), 0 error lines, nothing from cache, log free of NUL padding. The only `warning` line is the same symlink notice.
  - On `5eea2cd2`: **SUCCESS: 36 operations** (+1 no-op), 0 error lines, nothing from cache, no NUL padding, the same lone symlink notice. `ts-agent-tasks` (including the `__proto__` pin, unedited), `ts-extras-mcp` and `testbed` completed.
  - On `2c7bf0d3`: **SUCCESS: 36 operations** (+1 no-op), 0 error lines, nothing from cache, no NUL padding, the same lone symlink notice; `ts-json-base`, `ts-agent-tasks`, `ts-extras-mcp` and `testbed` completed.
- **`rush change --verify --target-branch origin/release`:** passes; it finds the `ts-json-base` change file, the only package touched.

## Consumers whose tests changed

**None outside `ts-json-base`.** The `47b44a81`, `9e9fe563` and `5eea2cd2` runs were green with no consumer edits, covering:
- `ts-extras-mcp`, whose adapted MCP tools now pass undeclared keys through;
- `ts-extras` ai-assist;
- `ts-agent-tasks`;
- `ts-agent-memory`.

The one consumer break found was caused by the first `jsonObject` change. It was reverted rather than editing the consumer, and the drop that replaced it keeps that consumer green.

Inside `ts-json-base`, two existing tests pinned the old boundary and were updated:
- `validate.test.ts`: "additionalProperties: true ignores unknown fields" now "carries unknown fields through".
- `fromJson.test.ts`: "object without additionalProperties:false is lenient" now expects the extra key.

`toJson.test.ts` is unchanged from `release`.

## `code-reviewer` (layer 1), run on `47b44a81` before coverage closure

No P1s.

- **P2 — nested `__proto__` via `jsonObject`.** Fixed as define-as-data, reverted, then resolved as drop in `5eea2cd2` (see above).
- **P2 — repo-wide test.** Run three times.
- **P2 — `CAPABILITIES.md`.** Updated.
  - The checked-in typedoc pages under `libraries/ts-json-base/docs/` still carry the old option text. Not regenerated, deliberately: #655 and #659 did not regenerate them either, and doing so adds hundreds of unrelated diffs.
- **P3 — typing of `_withUndeclaredKeys`** (since split into `_convertOpenObject` / `_convertUndeclaredKeys`). Applied: `T extends object`, typed entries, no leaked `any`. The spread variant was rejected, as above.
- **P3 — implementation-signature union.** Kept. It is sound and invisible to callers.
- **P3 — `OpenObjectStatic` non-JSON edge.** Documented.
- **P3 — error context.** Applied.
- **P3 — key order.** Documented.
- **P3 — `{@link}` to a private function.** Changed to a code span.
- **P3 — `optionalFields:` → `.optional()`.** Declined.
  - The lines predate this stream; the diff only re-indents them.
  - Optionality here is detected from the schema node (`_type === 'optional'`), not authored by a caller, so the type-safety hole the convention guards against does not arise.
- **P3 — tests.** Applied:
  - the agreement tests are declarative, with an `open` column;
  - the non-object cases use `test.each`;
  - `wireAdmitsKeys` uses `isJsonObject`;
  - added scenarios: nested non-JSON extra, aggregated errors, declared optional key, nested closed object.

## Antagonist pass on the finalize artifacts

An independent read-only reviewer was briefed to refute these artifacts. Its findings:

- **The second gate's outcome was asserted before it finished.** True; the second gate then failed. The claims are corrected above.
- **An explicit `true` may break Anthropic JSON outputs** (they require `false`; `true` not probed). Acted on: `9e9fe563`.
- **Structured output does not refuse an open object for OpenAI strict.**
  - True and pre-existing: `hasOptionalProperties` / `adaptOptionalToNullable` never look at `additionalProperties`, so an open schema reaches OpenAI strict as an opaque 400.
  - Unchanged by this stream, since the wire is unchanged. Listed under *Open*.
- **The Ollama sanitizer's location.** The claim is no longer made.
- **The revert table's counts and names.** Corrected above.
- **The one perf-script hit in the consumer grep.** Noted above.
- **`fromJson` builds `properties` by assignment.**
  - Pre-existing: a declared MCP property literally named `__proto__` is not an own key, so the open-object path treated it as undeclared.
  - Resolved by the same drop: an open object now drops such a key rather than carrying it.

## Gate-time review (orchestrator), applied in `5eea2cd2`

No P1s. Applied:
- **Nested `__proto__`: drop, not define.** Item 1 succeeded. The repo-wide run was green and the TECH_DEBT P3 is removed. The request placed `Converters.jsonObject` and its test in `@fgv/ts-utils`. They are in `@fgv/ts-json-base` (`converters.ts`); `ts-utils` has no `jsonObject`. So the test is in `ts-json-base`'s `converters.test.ts`, `ts-utils` is untouched, and no second change file was needed. `etc/ts-json-base.api.md` is unchanged.
- **Docs:** the `IObjectSchemaOptions` "never drops a key" is qualified for `__proto__`; the Anthropic claim is restated as "requires `false`; an explicit `true` was not probed" in `factories.ts` and `CAPABILITIES.md`; the change file names the host-gate consequence.
- **P3s:** `succeed<[string, JsonValue]>([key, v])`; the refusal says `got null` for `null`.

## Copilot round 1 (PR #720), applied in `2c7bf0d3`

One finding, real: undeclared keys were validated only inside `declared.convert(from).onSuccess(...)`, so a failing declared field hid every bad undeclared value — contradicting the "all of them are reported" claim. `_convertOpenObject` now converts both sides independently, aggregates their failures with `allSucceed`, and builds the result only when both succeed. The new test (one bad declared field, two bad undeclared values) asserts all three appear; R9 shows it red against the old shape.

## Open

- Schema-valued `additionalProperties` ("record") is still refused. It is a separate ask on `integration/asks`.
- Structured output (`ts-extras`) does not refuse an open object on OpenAI strict formats. This is pre-existing, and the brief puts `ts-extras` out of scope.
- The typedoc pages were not regenerated.
- PersonAIlity #679 can close citing the merge commit, and the hub's interim refusal of open nodes can lift.

## What the brief got wrong

- **Belief 4:** schema-valued `additionalProperties` is refused upstream of line 413; it is not mapped to `true`.
- **Belief 2/3 omission:** the brief missed the second symptom, an open object converting a non-object to `{}`.
- **Implicit framing:** the brief and the requester both assumed the wire needed to change. It did not. The wire was right, and the converter was the side that disagreed.
