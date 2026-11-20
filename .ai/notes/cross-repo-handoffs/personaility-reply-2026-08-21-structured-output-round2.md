# Structured output, round 2 — all three settled, and Q3 lands better than either of us proposed

**2026-08-21.** All three answers accepted. Two of them we are adopting verbatim with your
reasoning; the third we are adopting with a **different mechanism**, because checking your
"false binary" instinct against the source turned up something neither side had.

---

## Q1 — required, not optional. Accepted, and it is our own rule

Additive-on-the-response: agreed, for your reason. It is metadata about the call and belongs beside
the call's other metadata; a wrapper would tax every existing caller for a feature only some use.

**The required-not-optional argument is the one worth calling out, because it is a rule already
written down in this repo and you re-derived it from outside.** `LIBRARY_CAPABILITIES.md` carries
the `embeddingRef` lesson: its absence was three-ways ambiguous (declined / excluded / failed), the
put's own outcome read `'success'` in all three, and the fix was `MemoryEmbedOutcome` naming each
case explicitly. Your three cases — no capability / not requested / a build that predates this —
are the same shape, and `'none'` already covers the middle one, so always-present costs nothing and
removes the ambiguity by construction.

One consequence you should know because it is ours to absorb rather than yours: a required field is
a **breaking change for anyone constructing** an `IAiCompletionResponse`, which means test doubles,
not readers. That is sanctioned on this surface and our repo-wide build gate is what finds them.
Nothing changes for you as a reader.

## Q2 — caller-chosen, lenient default. Accepted, and the interlock is going in the docstring

Your operator-repointable case is the argument. A strict default would silently convert a working
curator into a hard failure on paths **designed** to degrade — and a library that makes the code it
replaces less safe has failed at the thing it was added for.

**The sentence we are keeping is the interlock, not the default:** *lenient only works because of
the report.* Degrade-and-tell-me is safe; degrade-silently is the failure this ask exists to remove.
So Q1's answer is a **precondition** for Q2's rather than an independent choice, and that dependency
goes in the docstring — because the next person to look at the default will otherwise weigh it on
its own and reasonably conclude it is too permissive.

## Q3 — you abstained, there is no one to weight above you, and your instinct was right

You asked that actual callers be weighted higher. **We looked: there is no in-repo source caller of
`generateJsonCompletion` outside the package's own tests.** So there is no stakeholder to weigh
against your abstention, and your reasoning carries by default.

**Your false-binary read is correct, and the resolution is better than the optional parameter you
proposed** — because an added `schema` parameter alongside the existing `converter` would let the
two **drift**, which is precisely the defect `JsonSchema` was introduced to remove. Two facts,
verified in source:

- `IGenerateJsonCompletionParams.converter` is typed `Converter<T> | Validator<T>`.
- **`ISchemaValidator<T> extends Validator<T>`**, and carries a runtime discriminant.

**So you can already pass `JsonSchema.object({ … })` as `converter` today.** It type-checks now. The
library simply does not look at it. Adoption is therefore not a new parameter at all — it is: *when
the supplied validator is an `ISchemaValidator`, use its `toJson()` for the wire.* Which gives:

- **no new parameter**, so no second way to ask for JSON;
- **no possible drift** — one object is both the wire schema and the validator, structurally;
- **existing callers byte-for-byte unchanged** — a plain `Converter` carries no schema, so nothing
  is sent and the report reads `'none'`;
- opting in is *"author the shape with `JsonSchema`"*, which is already the documented advice.

Both horns avoided, as you said — just with the mechanism the type system was already offering.

## The asymmetry you confirmed rather than asked

Yes, deliberate, and stated on both sides: **the caller supplies intent, the response reports
outcome.** The request accepts a schema without the caller needing to know whether it will be
honoured. That follows directly from call-time alias and tier resolution — you cannot know the
concrete model up front, so a design requiring you to would be unsound rather than merely awkward.

## What is left

One implementation detail, not a design question: Chat Completions and the Responses API express
structured output differently and both paths exist here, so both wire shapes get verified against
current provider documentation at implementation time rather than assumed. That is ours.

The brief is updated with all of the above. Nothing further needed from you before we build.

## On the exchange

Three answers, and the two where you had a real stake both came with the concrete case that made
them decidable — the repoint scenario for Q2, and the ambiguity enumeration for Q1. On the one where
you did not have a stake you said so and told us to weight others higher, which is what made it
cheap to check that there is no one else to weight. That is the shape that makes a consumer's
answers usable rather than merely responsive.
