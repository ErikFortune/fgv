# `json-schema-open-object`: open `JsonSchema` objects keep what their wire admits

**Shipped 2026-10-03** via ErikFortune/fgv#&lt;PR&gt; (number filled when the PR opens). Origin:
ErikFortune/personaility#679.

---

## What it is

`JsonSchema.object(props, { additionalProperties: true })` emitted a wire schema that omitted the
keyword, and by JSON Schema's default that tells a model the object is open. `fromJson` maps an absent
`additionalProperties` to the same option. The converter underneath was `Converters.object`, which
builds its result from declared fields only. So a model that filled an open object (a pydantic
`dict[str, Any]`, a zod `z.record`) saw its call reported as a success, and the tool received `{}`.

## What shipped

- **Open objects pass undeclared keys through.** Each one is validated as `JsonValue`; declared
  properties convert as before.
- **A non-object input is refused** rather than becoming `{}`. Before this fix, an open object with
  no declared properties accepted `42`.
- **`toJson()` always states `additionalProperties`.**
- **Additive typing:**
  - `OpenObjectStatic<P> = ObjectStatic<P> & JsonObject`;
  - two `object()` overloads keyed on a literal `additionalProperties: true`.
- **A latent `Converters.jsonObject` fix.** A parsed `"__proto__"` key used to replace the copy's
  prototype; the key is now defined as data.

The closed default is unchanged.

## What changed shape

- **The brief was wrong about schema-valued `additionalProperties`.** It believed `fromJson` mapped
  that case to `true`. In fact `fromJson` refuses it earlier.
- **The brief missed a second symptom:** the non-object-to-`{}` conversion.
- **The `__proto__` fix was not in the brief.** It became reachable through pass-through.
- **The reviewer's object-spread suggestion was tried and reverted.** Compiled down-level, a spread
  becomes `Object.assign`, which reintroduces the `__proto__` problem.

## Decision

Option (d) was chosen: pass-through, plus the keyword always on the wire, plus the typing answer.

Rejected:

- **Closing the wire (b).** It makes a `dict[str, Any]` argument uncallable.
- **Refusing open nodes in `fromJson` (c).** This is the requester's own interim, and it is strictly
  worse for the same safety.
- **A "tolerate and strip" mode.** Nothing uses it, and the only truthful wire spelling for it is the
  closed default.

The full reasoning is in `result.md`.

## Files

- `brief.md`, `state.md`, `result.md`: the frozen brief, the working record, and the outcome. The
  outcome carries the belief verdicts, the revert matrix, the gate counts and the review
  disposition.
- Code:
  - `libraries/ts-json-base/src/packlets/json-schema-builder/{factories,types}.ts`
  - `libraries/ts-json-base/src/packlets/converters/converters.ts`
  - tests under `libraries/ts-json-base/src/test/unit/` (`json-schema-builder/openObject.test.ts` is
    new).

## Left open

- **Schema-valued `additionalProperties` ("record").** It is still refused. It is one of the separate
  asks queued on `integration/asks`, and `_withUndeclaredKeys` is the seam it would extend.
- **The checked-in typedoc pages** under `libraries/ts-json-base/docs/` still carry the old option
  text. They were not regenerated, matching #655 and #659.
- **PersonAIlity #679 can close citing this stream's merge commit.** The hub's interim refusal of open
  nodes can then be lifted.
