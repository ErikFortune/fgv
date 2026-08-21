# Stream brief — `ai-assist-structured-output`

**Status: READY 🟢 — accepted, surface settled with the consumer 2026-08-21. Nothing blocks implementation.**
Filed 2026-08-21 from a PersonAIlity ask.
**Shape:** additive on `@fgv/ts-extras/ai-assist`, across four completion paths, with a capability
axis on the provider descriptors.

## The ask, verified against `5.1.0-51` / `release`

| claim | verdict |
|---|---|
| `callOpenAiCompletion` / `callOpenAiResponsesCompletion` / `callAnthropicCompletion` carry no structured-output field | ✅ bodies carry `model` / `messages` / `temperature` / `reasoning_effort`\|`thinking` / `max_tokens` only |
| the only `response_format` in the package is image generation | ✅ all occurrences in `imageGenerationClient.ts` (`b64_json`) |
| `jsonResponse` scopes itself to wrapper-stripping, repair out of scope | ✅ stated at `jsonResponse.ts:30` |
| both providers support this natively | ✅ (and so do the other two) |

**One correction, in their favour: there is a fourth path.** `callGeminiCompletion` builds a
`generationConfig` and passes no response schema. Gemini's native structured output lives *inside*
that same `generationConfig`, so it is the cheapest of the four to wire rather than an extra cost.

**The reported failure is syntactic, not structural.** `Expected ',' or '}' after property value`
is a parser that read a complete value and then met content that cannot follow it — an unescaped
`"` closing a string early. This matters for the design: a JSON-mode guarantee (syntactic validity,
arbitrary shape) is **sufficient to remove their observed failure**; schema constraint is what
additionally buys shape.

## Mission

Let a caller that has already declared the shape it wants **tell the provider**, and let it learn
**which enforcement was actually applied** — so it can decide whether its defensive path is still
needed on a per-response basis.

## Design direction

### The request side

An optional structured-output field on the completion request, carrying a
`JsonSchema.ISchemaValidator<T>` (from `@fgv/ts-json-base`) — **the same object the caller
validates with**, so the wire schema and the check cannot drift. This is exactly the property
`@fgv/ts-extras-ollama`'s `chatStructured` already has, and this stream is its cloud sibling.

A weaker `'json-object'` mode (no schema, syntactic guarantee only) must also be expressible, both
because the consumer explicitly offered it as a floor and because it is the only mode some
model/provider pairs support.

### The report side — the load-bearing half

**Not a boolean.** Three questions hide inside "did it honour it", with different owners:

| question | answerable by |
|---|---|
| did we send a constraint? | the client, at request-build time |
| which constraint did the provider apply? | the client, from the resolved model's declared capability |
| does *this response* conform to my shape? | the caller's converter, and nothing else |

The client must **not** report the third: doing so means re-validating against the caller's schema,
re-deriving an answer the caller already holds. Report the enforcement instead:

- `'none'` — nothing sent; the resolved model declares no capability
- `'json-mode'` — syntactically valid JSON guaranteed, arbitrary shape
- `'schema'` — generation constrained to the supplied schema
- `'tool-forced'` — Anthropic-style forced tool use; shape from the tool's input schema

**It must ride on the response, not be a lookup.** `resolveProviderModel` resolves aliases and
tiers at call time, so the concrete model that served a request is not knowable to the caller up
front (a `tier` request can cascade). A caller pre-computing capability from its own side would be
unsound, which is precisely why the consumer's second half is a precondition for the first being
usable rather than a nice-to-have.

### What it reuses

- **`JsonSchema`** — already the client-tool `parametersSchema` authoring surface; `toJson()` for
  the wire, `validate()` for the reply, `Static<typeof schema>` for `T`.
- **`toolFormats.ts`'s Gemini draft-07 sanitizer** — already strips `additionalProperties` / `$schema`
  at schema-keyword positions only (a property legitimately *named* `additionalProperties`
  survives). Reusable rather than re-derivable.
- **The per-modality capability pattern** — `imageGeneration` / `embedding` are declared per
  model-prefix on `IAiProviderDescriptor` and longest-prefix matched. A `structuredOutput`
  capability follows it exactly, and is what gives the report its per-model evidence.

**Carry forward the alias-resolution lesson.** `resolveImageCapability` once fell through to a
catch-all `modelPrefix: ''` for an unresolved alias and returned a confidently wrong capability. The
structured-output resolver must resolve the alias **first** and fail loudly on an unknown one.

## Settled — answered by the consumer 2026-08-21

**1. The report's home: additive on the existing response, and REQUIRED rather than optional.**
Additive because a wrapper would make every existing caller unwrap to pay for a feature only some
use, and the type-level payoff a wrapper buys is not the payoff wanted — the caller validates
through its converter regardless. What it needs is metadata about the call, beside the call's other
metadata.

**Required, not optional, and their argument is the repo's own.** An optional field makes absence
three-ways ambiguous — no capability / not requested / a build predating the feature — and
disambiguating exactly that is why the report was asked for. `'none'` already expresses "no
constraint sent", so always-present costs nothing and removes the ambiguity by construction. This
is precisely the `embeddingRef` lesson in `LIBRARY_CAPABILITIES.md`, where a three-ways-ambiguous
absence was fixed by `MemoryEmbedOutcome` naming each case explicitly. Same shape, same remedy.

*Implementation note:* a required field is breaking for anyone **constructing** an
`IAiCompletionResponse` — test doubles, not readers. `ai-assist` is on the active-development
surface so that is sanctioned, and the repo-wide `rush rebuild` gate is what finds the doubles.

**2. Degradation posture: caller-chosen, lenient default — and the two answers are coupled.**
Their concrete case: brain slots are operator-repointable, so a hub can point a high-quality slot
at a local model with no schema support. A strict default would silently convert a working curator
into a hard failure on paths **designed** to degrade (segmenter floors to a mechanical chunker,
extractor returns no facts) — making the library less safe than the code it replaces. Strict must
still exist: for output that is persisted or put on a wire, an unconstrained generation that parses
is worse than an error, because it is wrong quietly.

**The interlock is load-bearing and belongs in the docstring:** lenient-by-default is only safe
*because the report is required*. Degrade-and-tell-me is safe; degrade-silently is the failure this
whole ask exists to remove. Q1's answer is a precondition for Q2's, not an independent choice.

**3. `generateJsonCompletion` adoption: yes — and the mechanism is cleaner than the false binary.**
The consumer explicitly abstained (they call `PromptLibrary.resolveJsonOutput` over a raw
completion) and asked that actual callers be weighted higher, while noting the dilemma looked like a
false binary: adopt as an optional parameter, no schema ⇒ today's behaviour byte-for-byte.

They are right that it is a false binary, and the resolution is better than an added parameter —
**which would reintroduce drift between converter and schema, the exact defect `JsonSchema` exists
to remove.** The relevant facts, verified:

- `IGenerateJsonCompletionParams.converter` is typed `Converter<T> | Validator<T>`.
- **`ISchemaValidator<T> extends Validator<T>`**, and carries a **runtime discriminant**.

So a caller can **already pass `JsonSchema.object({...})` as `converter` today** and it type-checks;
the library simply does not look. Adoption is therefore: *when the supplied validator is an
`ISchemaValidator`, use its `toJson()` for the wire.* That yields **no new parameter, no possible
drift** (one object is both wire schema and validator), and **existing callers unchanged
byte-for-byte** — a plain `Converter` carries no schema, so nothing is sent and the report reads
`'none'`. Opting in is "author the shape with `JsonSchema`", which `LIBRARY_CAPABILITIES.md` already
instructs callers to do.

**4. Two OpenAI shapes.** Still open as an implementation detail rather than a design question:
Chat Completions and the Responses API express structured output differently, and both paths exist
here. Verify both against current provider documentation at implementation time rather than
assuming.

**Confirmed asymmetry, deliberate on both sides.** The request accepts a schema without the caller
needing to know whether it will be honoured: **the caller supplies intent, the response reports
outcome.** That is exactly the design, and it follows from call-time alias/tier resolution — the
caller cannot know the concrete model up front, so requiring it to would be unsound.

## Explicitly NOT in scope

All three of the consumer's own exclusions, accepted for their reasons:

- **Repair.** The `jsonResponse` boundary stays. Note that with `'json-mode'` or better, the
  syntactic repair question stops arising at all.
- **Injectable validation.** Converters already work; the gap was the *question* not carrying the
  shape.
- **Retry inside the client.** Composing a follow-up needs original intent plus parse error — caller
  context. Theirs to build, and they are.

Also out: streaming structured output (the streaming adapters are a separate surface and a separate
set of provider constraints).

## Gates

- [ ] `rushx build` / `lint` / `test` at 100% coverage in `@fgv/ts-extras`
- [ ] Repo-wide `rush rebuild` — this widens a descriptor shape that `samples/testbed` consumes
- [ ] Change file for `@fgv/ts-extras`
- [ ] A test per provider path proving the field reaches the wire body in that provider's shape
- [ ] A test proving the reported enforcement matches what was actually sent, **per mode** — and
      one proving an unresolved alias fails loudly rather than prefix-matching a catch-all
- [ ] Live testbed verification per provider: the wire shapes are the class of thing unit tests
      cannot confirm, and this package's history says so
- [x] Consumer note: the agreed surface — settled in round 2, see
      `.ai/notes/cross-repo-handoffs/personaility-reply-2026-08-21-structured-output-round2.md`
