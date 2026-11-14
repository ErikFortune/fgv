# Stream brief — `schema-optional-translation`

**Origin:** a PersonAIlity ask (ErikFortune/personaility#644), 2026-08-23, verified against
`@fgv/ts-extras@5.1.0-54` and `@fgv/ts-json-base@5.1.0-54`. Follows `json-schema-nullable` (#655),
which shipped the `nullable` option this ask says it should not have needed to reach for.

**Priority as stated by the consumer: low.** Nothing of theirs is blocked. The ask is about *where a
piece of provider knowledge lives*, and it asks us to revisit a decision we documented and declined.

## The ask, as received

An opt-in on `ISchemaStructuredOutputRequest` — they suggested `adaptOptionalToNullable?: boolean` —
that lets `resolveStructuredOutput` rewrite `optional(...)` properties to required-and-nullable when
the target format demands it, rather than refusing the schema and degrading.

Their argument for revisiting: `hasOptionalProperties`' docstring rejects the rewrite because *"the
reply would no longer satisfy the caller's own validator — breaking the one-object-cannot-drift
property"*. That reasoning **assumes the schema IS the validator**, which is the design's central
property. Their reply pipeline dispatches on a registered `converterId` to a separate `Converter`, so
for them the request schema and the reply validator are already two objects, and their converter
(`Converters.number.optional('ignoreErrors')`) accepts an explicit `null` — measured, not assumed.

Their framing of the shape: *"the name matters less than the property that the caller is **asserting
something about its own validator**, which is the fact only the caller has."*

## What we accepted, and the one thing we did not

**Accepted: the refusal is over-broad.** Verified in source and at runtime rather than reasoned
about. `OptionalSchemaValidator.toJson()` delegates to its inner schema, so optionality lives *only*
in the parent's `required` array. Measured:

```
optional(string({nullable:true}))  wire {"type":["string","null"]}   {} OK   {b:null} OK   {b:'x'} OK
optional(string())                 wire {"type":"string"}            {} OK   {b:null} FAIL
```

**Rejected: that the safety condition is a fact only the caller has.** It is written on the schema.
For a property whose node already admits `null`, listing its key in `required` narrows the permitted
replies from *absent-or-null-or-value* to *null-or-value* — a strict **subset** of what the supplied
schema already accepts. Nothing is asserted, so nothing can be asserted falsely.

That distinction is not pedantry, because a boolean assertion is **worse than inert**: a caller with
`optional(string())` could set it and receive a wire schema their own validator rejects at runtime —
precisely the drift `hasOptionalProperties` exists to prevent. The flag would make the hazard
*sayable*. Deriving the condition makes it *unsayable*. This is the same discipline as
`resolveJsonOutput`'s runtime-evidenced `expectedKind` and of `JsonSchema` itself, whose whole point
is that the validator is derived from the schema and so cannot drift from it.

## Shape

The consumer's spelling is kept — they were right that it should be opt-in and right about the name.
What changes is what it *means*:

> `adaptOptionalToNullable: true` — on a format that requires every property to be `required`, hoist
> every optional property **whose node already admits `null`**. If any optional property does not,
> the schema is still unsendable and refuses through `onUnsupported` exactly as before.

Opt-in is retained for the reason they gave and one they did not: it is still a **semantic** change
to the reply (the model must emit `null` where it could previously omit), and a caller that
distinguishes those two — rather than treating them alike, as `optional(nullable)` says it does —
should leave it off.

## Acceptance criteria

- [ ] `adaptOptionalToNullable?: boolean` on `ISchemaStructuredOutputRequest`, defaulting off
- [ ] Hoist gated on the **format**, not only the flag — narrowing a reply on a provider with no
      all-required rule would change a reply that never needed changing
- [ ] Verification is `hasOptionalProperties` **re-run on the rewritten schema** — no second notion
      of correctness to keep in sync
- [ ] A partly-hoistable schema degrades or fails **whole**; it never sends a half-adapted schema
- [ ] The refusal message distinguishes the two cases, since a caller who set the flag has already
      taken the generic advice
- [ ] The safety property is pinned by its own test, not inferred from the wire tests
- [ ] `hasOptionalProperties`' docstring documents the exception — the doc must describe what ships
- [ ] Every new test watched failing first
- [ ] `rushx build` / `lint` / `test` at 100% in both packages; `fixlint` before the final commit
- [ ] Change files for both packages; `rush change --verify`
- [ ] Repo-wide `rush rebuild` **and** `rush test` — the second because this stream changes what a
      function *accepts*, which a compiler cannot see (the rule promoted in #656, from #655)

## Package surface

`@fgv/ts-extras` (`structuredOutputTypes.ts`, `structuredOutput.ts`) and `@fgv/ts-json-base`
(`factories.ts` docstring only).

## If we had declined

Their stated fallback: author with `optional` and accept that `segmentation-v1` gets no constraint on
the strict formats — below the `json-object` floor it had before. That is a real regression for them,
which is why the ask is worth taking even at low priority.
