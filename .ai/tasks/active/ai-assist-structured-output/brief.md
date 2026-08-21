# Stream brief — `ai-assist-structured-output`

**Status: QUEUED 🟢 — accepted, surface to be agreed with the consumer before implementing.**
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

## Open questions — to agree with the consumer BEFORE implementing

1. **The report's home.** On the existing completion response, or a discriminated wrapper? Additive
   on the response is likely right, but it is the shape worth agreeing in advance rather than
   discovering after.
2. **Degradation posture when the resolved model cannot honour a supplied schema.** Send nothing and
   report `'none'`, or fail the call? A silent downgrade is the failure mode this whole ask exists to
   remove — but so is a call that fails where today it would have succeeded. Probably caller-chosen,
   with the strict option not the default.
3. **Does `generateJsonCompletion` adopt it?** It is the current prompt-and-parse path and the one
   whose consumers most want this. Adopting it changes behaviour for existing callers; leaving it
   means two ways to ask for JSON.
4. **Two OpenAI shapes.** Chat Completions and the Responses API express structured output
   differently. Both paths exist here, so both wire shapes must be verified against current provider
   documentation at implementation time rather than assumed.

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
- [ ] Consumer note: the agreed surface, before implementation starts
