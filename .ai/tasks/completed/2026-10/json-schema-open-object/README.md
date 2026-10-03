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

Open objects pass undeclared keys through, each validated as `JsonValue`; declared properties
convert as before. A non-object input is refused rather than becoming `{}` (an open object with no
declared properties used to accept `42`). **The wire schema is unchanged** — it was already right; the
converter was the side that lied. Additive typing: `OpenObjectStatic<P> = ObjectStatic<P> & JsonObject`
and two `object()` overloads keyed on a literal `additionalProperties: true`. The closed default is
unchanged.

## What changed shape

- The brief believed `fromJson` mapped schema-valued `additionalProperties` to `true`; it refuses it
  earlier.
- It missed the non-object-to-`{}` symptom.
- Emitting `additionalProperties: true` explicitly (the requester's proposal) was built and reverted:
  `ts-extras` sends `toJson()` raw to Anthropic JSON outputs, which require
  `additionalProperties: false`; an explicit `true` was not probed.
- A `Converters.jsonObject` `__proto__` fix (define as data) was built and reverted: the second
  repo-wide run showed `ts-agent-tasks` pins the key disappearing. The gate-time review's third option
  shipped instead: `jsonObject`, and an open object's top level, **drop** an own `__proto__` key, so
  own keys are unchanged and no prototype is set.
- The reviewer's object-spread suggestion was tried and reverted: down-levelled spread is
  `Object.assign`, which assigns a top-level `__proto__`.

## Decision

Pass-through, plus the typing answer, wire left as it was. Rejected: an always-explicit keyword
(Anthropic JSON outputs require `false`; `true` unprobed), closing the wire (makes a `dict[str, Any]` argument uncallable), refusing open nodes in
`fromJson` (the requester's own interim, strictly worse for the same safety), a "tolerate and strip"
mode (unused, and its only truthful wire is the closed default). Full reasoning in `result.md`.

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
- **Structured output does not refuse an open object on OpenAI strict formats** (pre-existing,
  `ts-extras`, out of scope).
- **The checked-in typedoc pages** under `libraries/ts-json-base/docs/` still carry the old option
  text. They were not regenerated, matching #655 and #659.
- **PersonAIlity #679 can close citing this stream's merge commit.** The hub's interim refusal of open
  nodes can then be lifted.
