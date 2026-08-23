# `nullable` shipped — and you were right to make us check the OpenAI premise

**2026-08-23.** Shipped as **#655**. Every claim in your ask held against source; the one
thing you asked us to verify independently rather than take from you turned up a correction
you will want.

---

## What you can write now

```ts
JsonSchema.object({
  statement: JsonSchema.string({ nullable: true }),
  polaritySignal: JsonSchema.enumOf(['pos', 'neg'], { nullable: true }),
  matchedId: JsonSchema.string({ nullable: true })
});
```

`Static<>` widens to `| null`, the validator accepts `null`, and the wire carries
`type: ['string', 'null']` with the key **still in `required`**. Your twelve absent-able
fields keep their semantics; no sentinel, no converter mapping an empty string back to
absence.

That third row of your table is now the clean answer rather than the compromise: **schema** on
all five capable providers.

## The correction: `nullable: true` is the wrong *wire* spelling

You proposed an option named `nullable` that emits `type: ['string','null']`. That is exactly
what shipped — but the two are different dialects, and it matters more than a naming nit:

**OpenAI ignores `{"type": "string", "nullable": true}`.** It is the OpenAPI 3.0 keyword, not
draft-07, and strict mode does not honour it. Only the union array works.

So the option's name is the OpenAPI spelling while its emission is the draft-07 one. That is
on the option's own TSDoc and pinned by a test asserting the emitted keys never contain
`nullable`. Worth knowing if you ever hand-write a schema alongside an authored one — the
hand-written one will look right and do nothing.

## Three things your ask did not have, all in our code

**1. Our own parser refused our own emitter.** `fromJson` rejected union `type` arrays
outright, and `callProxiedCompletion` reconstitutes forwarded schemas with it — so a nullable
schema would have broken over the proxy, which is the path you already use. `fromJson` now
admits exactly `[<type>, 'null']` (either order) and still refuses every other union. Pinned
by a round-trip suite that we watched fail against the old parser first.

**2. Gemini needs the opposite spelling, and it would have broken.** `toGeminiParameterSchema`
passed `type` through verbatim, and Gemini's OpenAPI 3.0 subset **rejects** the union array.
The two dialects are mutually exclusive — OpenAI ignores the keyword, Gemini rejects the
union — so the adapter now translates, including dropping the `null` member from a nullable
enum's values. Without this, the change that unblocked your fifth provider would have broken
one of the four that work today.

**3. A nullable `enum` carries `null` in `enum` as well as `type`.** Otherwise a reader
consulting one half rejects the value the other half allows. `fromJson` requires the two to
agree and fails loudly when they do not.

## On the design choice

We landed where you did — a flag on the options bag rather than a `nullable(...)` wrapper —
but for a reason you did not give, and it is the deciding one. The object factory builds
`required` by reading `prop._type !== 'optional'`. A wrapper would make `nullable(optional(x))`
present the wrong discriminant to its parent, the key would land in `required`, and the field
would **silently stop being optional**: no error, no failing test, wrong schema. Your
"probably simpler and closer to how the subset is shaped" was also true.

## What we did not touch, and why your instinct was right

You said explicitly you were **not** asking us to relax `hasOptionalProperties`. Correct — and
the reason is sharper than either of us put it.

That docstring rejects "rewriting optional to required-and-nullable" because doing so
**changes what the model must emit**, so the reply would no longer satisfy the caller's own
validator. That objection is about **the library silently rewriting a schema you authored as
optional**. It evaporates when **you** author nullable, because then the validator and the
wire schema are the same object and cannot disagree about it.

**Your ask is not a reversal of that refusal — it is what makes keeping it affordable.** There
is now a test asserting a nullable-and-required schema reaches OpenAI as `'schema'`, sitting
directly beside the one asserting an optional schema degrades. If either ever changes, the
other will say so.

`onUnsupported` is unchanged, and we did not add schema inference from a `Converter` — you
talked yourselves out of asking, and you were right: a `Converter` is a parser, not a
declaration.

## One thing worth saying

You sent this with the OpenAI premise flagged as "worth verifying on your side rather than
taking from us". That is the second ask in two days where the thing that made it cheap to act
on was you naming which part of it you were not sure of. The correction above is the direct
payoff, and it is not one we would have gone looking for if you had simply asserted it.
