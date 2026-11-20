# Structured output on the completion client — yes, and yes to the second half

**2026-08-21.** Both halves verified against source before answering.

**Short version: yes to (1), and yes to (2) — but not as a boolean, because a boolean answers the
wrong question.** The second half is the better half of this ask and it changes the shape of the
first.

---

## The gap is real, and one path wider than you found

Confirmed: `callOpenAiCompletion`, `callOpenAiResponsesCompletion` and `callAnthropicCompletion`
build bodies carrying `model` / `messages` / `temperature` / `reasoning_effort` | `thinking` /
`max_tokens` and nothing else. Every `response_format` in the package is
`imageGenerationClient`'s `b64_json`, exactly as you said.

**There is a fourth: `callGeminiCompletion`.** It builds a `generationConfig` and passes no
response schema, so it has the same gap — and Gemini's native structured output lives inside that
same `generationConfig`, which makes it the cheapest of the four to wire, not the hardest.

Your diagnosis of the failure is right too, and worth restating because it decides what a fix has
to guarantee: `Expected ',' or '}' after property value` is a parser that read a complete value and
then met something that cannot follow it. That is a **syntactic** fault — an unescaped `"` closing
a string early — not a shape fault.

## Why "did it honour it" cannot be one boolean

You are right that a bare field would leave you where you are plus a field that reads like a
guarantee. But there are three distinct questions hiding in "did it honour it", and they have
different answers:

| question | who can answer it |
|---|---|
| did we **send** a constraint? | the client, at request-build time |
| **which** constraint did the provider apply? | the client, from the resolved model's declared capability |
| does **this response** conform to my shape? | your converter, and only your converter |

The client cannot honestly answer the third. Answering it would mean the client validating the
response against your schema — which is your converter's job, done with your converter, and we
would be re-deriving an answer you already hold. So we will not report conformance.

What we **can** report, truthfully and for free, is the **enforcement actually applied**:

- `'none'` — nothing was sent; the resolved model declares no structured-output capability
- `'json-mode'` — the provider guarantees **syntactically valid JSON**, arbitrary shape
- `'schema'` — the provider constrains generation to the supplied schema
- `'tool-forced'` — Anthropic-style forced tool use; shape comes from the tool's input schema

**That distinction is the one that resolves your case.** Your failure was syntactic, so
**`'json-mode'` alone removes it** — an unescaped quote cannot survive a mode that guarantees
parseable JSON. Shape conformance needs `'schema'` or `'tool-forced'`. So a response reporting
`'json-mode'` tells you the parse is safe and the shape still needs your converter; `'none'` tells
you to keep the full defensive path; `'schema'` tells you both are covered. That is a real
decision procedure rather than a reassuring flag.

**And it has to come back on the response, not be looked up beforehand.** `resolveProviderModel`
resolves aliases and tiers at call time, so which concrete model served your request is not
knowable to you up front — a `tier: 'advanced'` call can cascade. Pre-computing the capability from
your side is therefore not merely inconvenient, it is unsound. Your second half is the part of this
ask that makes the first half usable.

## What this will reuse rather than invent

Worth saying because it bears on how soon this can land — almost none of it is new machinery:

- **`JsonSchema` from `@fgv/ts-json-base`** is already the authoring surface for client-tool
  `parametersSchema`. The same object is both the wire schema (`toJson()`) and the reply validator
  (`validate()`), so the declaration and the check **cannot drift**. You would author the curator's
  shape once.
- **`@fgv/ts-extras-ollama`'s `chatStructured` is the in-repo precedent** for exactly this shape,
  including the "schema IS the validator" property. This would be its cloud-provider sibling.
- **Per-provider schema translation already exists** in `toolFormats.ts`, including Gemini's
  draft-07 sanitization — and it is careful in the way that matters (it strips `additionalProperties`
  / `$schema` only at schema-keyword positions, so a property legitimately *named*
  `additionalProperties` survives).
- **The capability-declaration pattern already exists** — `imageGeneration` and `embedding` are
  declared per model-prefix on the provider descriptor and resolved by longest-prefix match. A
  structured-output capability follows it exactly, which is also how the per-model truthfulness of
  the report gets its evidence.

One caution we will carry into the design from our own history: the alias-resolution bug that made
`resolveImageCapability` fall through to a catch-all `modelPrefix: ''` and return a confidently
wrong capability. A structured-output resolver must resolve the alias *first* and fail loudly on an
unknown one, never prefix-match an unresolved alias.

## Your three exclusions, all accepted

- **Not repair.** Agreed, and the boundary stays where `jsonResponse` puts it. A repair that
  silently succeeds on a wrong guess is worse than a clean parse failure — and note that with
  `'json-mode'` or better, the repair question stops arising for the syntactic class entirely.
- **Not injectable validation.** Agreed. Your converters work; the gap was that the *question* never
  carried the shape.
- **Not a retry inside the client.** Agreed, and for your reason: composing a follow-up needs the
  original intent plus the parse error, which is caller context. Yours to build.

## Answers to what you asked for

1. **Is structured output in scope for the completion client?** **Yes.** Four providers support it
   natively, the authoring primitive and the translation machinery already exist, and there is an
   in-repo precedent. Declining would be the odd choice.
2. **Can capability reporting come with it?** **Yes, and it should be in the same change rather
   than after it** — for exactly the reason you gave. Shipping the field without the report would
   hand you something that reads like a guarantee and isn't, which is a worse surface than the one
   you have now.

Queued as a stream; the brief is in-repo. We will come back with the concrete request/response
surface before implementing, since the shape of the report is the part worth agreeing on in advance
rather than discovering after.

## On the framing

The second half is what made this a good ask rather than a feature request. "We would keep the
defensive path anyway, leaving us where we are plus a field that reads like a guarantee" is the
argument — it is the reason the capability report is not a nice-to-have bolted on, and it is why we
are not going to ship half of this.
