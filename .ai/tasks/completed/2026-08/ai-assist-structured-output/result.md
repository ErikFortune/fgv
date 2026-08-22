# Result — `ai-assist-structured-output`

**Shipped 2026-08-22.** Additive for readers, breaking for anyone *constructing* an
`IAiCompletionResponse` (test doubles only).

## What shipped

A caller that has already declared the shape it wants can now **tell the provider**, and
learn **which enforcement was actually applied** — on all four providers plus the proxy.

- **Request:** `structuredOutput?: StructuredOutputRequest` on `IProviderCompletionParams`.
  A discriminated union: `{ mode: 'schema', schema }` (a `JsonSchema.ISchemaValidator` —
  the same object the caller validates with) or `{ mode: 'json-object' }`, each with
  `onUnsupported?: 'degrade' | 'fail'` defaulting to `'degrade'`.
- **Report:** `structuredOutput: StructuredOutputEnforcement` on `IAiCompletionResponse` —
  **required**. `'none' | 'json-mode' | 'schema' | 'tool-forced'`.
- **Capability:** `IAiProviderDescriptor.structuredOutput`, longest-prefix matched **after**
  alias resolution through the same generic helper `imageGeneration` / `embedding` use.
- **`JsonSchema.isSchemaValidator`** added to `@fgv/ts-json-base`, which is what lets
  `generateJsonCompletion` adopt the feature with no new parameter.

## Why the report is required, and why that is one decision with the default

Three questions hide inside *"did it honour my schema"*, with different owners: **did we
send a constraint** (the client knows), **which constraint did the provider apply** (the
client knows, from the resolved model's capability), and **does this response conform**
(the caller's converter knows, and nothing else). The library answers the first two and
deliberately not the third — reporting conformance would re-derive an answer the caller
already holds, from their own schema.

It rides on the **response** rather than being a lookup because `resolveProviderModel`
resolves aliases and tiers at *call* time and a `tier` request can cascade: the concrete
model that will serve a request is not knowable up front, so requiring a caller to compute
capability themselves would be unsound.

Required-not-optional removes a three-ways-ambiguous absence (no capability / not requested
/ a build predating the feature) — the `MemoryEmbedOutcome` remedy applied to the same
defect. And **lenient-by-default is only safe because the report is required**:
degrade-and-tell-me is safe, degrade-silently is the failure this exists to remove. The
consumer asked those as two questions; they are one.

## Two bugs found in this stream's own implementation, before any test ran

Both were found by re-reading the implementation, not by the suite — worth recording
because both would have produced a **confidently wrong report**, which is the single thing
this feature exists to prevent.

**1. The OpenAI wire format is not a function of the model alone.** `callProviderCompletion`
routes to `/responses` when the call carries server tools **or** the model is Responses-only,
and to `/chat/completions` otherwise — so the same model takes different endpoints on
different calls, and those endpoints spell structured output differently (`response_format`
vs `text.format`). A capability keyed on the model could not name the right one. Emitting
`response_format` into a `/responses` body is **silently ignored by the provider**: the
request would look constrained, the reply would not be, and the report would say `'schema'`.

Fixed with an `effectiveFormat` coercion driven by the route, which the dispatcher computes
once and shares with the switch that uses it, so the two cannot disagree. The OpenAI
descriptor's second capability entry was then **deleted** — with the route supplying that
axis, a declaration of it would be a second source of truth. Pinned by a test that calls the
*same* model twice, with and without tools, asserting the two distinct wire shapes.

**2. `JSON.stringify(undefined)` returns `undefined`, not a string, and does not throw.** So
`captureResult(() => JSON.stringify(typed.input))` wrapped it as a **Success**, putting
`undefined` behind a `content: string` contract with nothing downstream to catch it — for a
forced `tool_use` block carrying no `input`, i.e. exactly the malformed-response case that
extractor exists to be honest about. Fixed with a `typeof json === 'string'` check; pinned
by two tests asserting a **Failure** explicitly, since `toSucceedWith({ content: undefined })`
would have passed against the broken version.

## The `code-reviewer` pass — three P2s, four P3s, all resolved

**P2, doc-block theft (`model.ts`).** The new `structuredOutput` property was inserted
between `responsesOnlyModelPrefixes`' TSDoc and its declaration. Only the last block before a
declaration attaches, so `responsesOnlyModelPrefixes` silently lost its documentation
entirely — visible in `etc/ts-extras.api.md` as a flip to `// (undocumented)`. **Second
instance of this pattern in two days** (the `result.ts` split took `Success`'s block 24 hours
earlier). The shape: a text insertion anchored on an `export`/declaration line lands *inside*
the preceding symbol's documentation.

**P2, orphaned docstring (`registry.ts`).** The same insertion left
`resolveEmbeddingCapability`'s original 22-line block dangling above the new functions while
a thinner replacement I had written attached to the function. Restored the original — it is
the richer of the two and the one already reviewed — and deleted the duplicate.

**P2, and the one that mattered: `generateJsonCompletion` could constrain the request to a
schema that does not validate the reply.** `pipeline` prefers `jsonConverter` and ignores
`converter` entirely when both are supplied, but the inference read `converter` regardless.
A schema-shaped `converter` alongside a different `jsonConverter` would send a constraint
unrelated to what checks the response — **the exact drift this design exists to remove, in
the one place two validation paths coexist.** Gated on `jsonConverter === undefined`. Two
tests added and **watched failing** against the ungated version first.

**P3s, all applied.** The Anthropic tools-channel invariant spanned two files with nothing
asserting it at the call site — a guard now sits there, unreachable by design and
`c8`-ignored with the reason stated. A comment claimed Gemini expresses structured output
"through the tools channel"; it does not (`responseMimeType`/`responseSchema` live in
`generationConfig`), and conflating a wire-level clash with an API-level mutual exclusivity
would mislead the next maintainer. `SCHEMA_NODE_TYPES` was a `Set` built from an array
literal, which catches a *removed* member but not an *added* one, so a new schema kind would
have made `isSchemaValidator` silently reject valid validators — now a total
`Record<SchemaNodeType, true>`, which fails to compile instead. And the streaming scope
boundary is now documented rather than merely true.

**One thing the review's fix introduced that the review did not catch**, found while applying
it: the total-`Record` membership test was written as `_type in SCHEMA_NODE_TYPES`, and `in`
walks the prototype chain — `{ _type: 'constructor' }` would have passed. Changed to an
indexed read compared to `true`, and pinned by a test over `constructor` / `toString` /
`hasOwnProperty` / `valueOf`.

## Where the extension went, and why

`generateJsonCompletion` adoption needed a way to ask *"is this validator an authored
schema?"*. The hand-rolled option was a `'_type' in v` check inside `ts-extras`. Per
`CODING_STANDARDS.md` § "Extending Core Libraries Over Working Around Them", it went into
`@fgv/ts-json-base` as `JsonSchema.isSchemaValidator` instead — additive, and the guard is
about `JsonSchema`'s own type, so a consumer-side reimplementation would have been the
canonical primitive's job done badly.

It narrows to `ISchemaValidator<unknown>`, not `ISchemaValidator<T>`. `_type` is a
node-*kind* discriminant carrying no evidence about `T`, which lives only in the erased
`__staticType` phantom; a guard claiming `T` would be asserting rather than checking.

## An api.md corruption worth knowing about

Mid-stream, `etc/ts-extras.api.md` was found rewritten into a **degraded report** — 868 lines
of real API surface replaced by 132 relative-path re-exports (`import { AiPrompt } from
'./model'`), the API Extractor signature of an unresolved rollup. Committing it would have
shipped a gutted public-API report.

It was a partial-build artifact (a build racing with concurrent edits), confirmed by a clean
rebuild restoring the correct report. **The tell is `grep -c "from './" etc/*.api.md`: 0 on a
healthy report.** Worth a glance whenever an api.md diff looks structurally odd rather than
just larger.

## The `max-lines` prerequisite fired twice

The `wc -l` sweep that widened the `TECH_DEBT` entry found three `ai-assist` **test** files at
0–3 lines of headroom and named this stream as what would hit them, so they were split first
(**#650**) — that half worked.

What the sweep did not predict: `model.ts`, listed at **1957 with 43 lines of headroom**, went
to **2132**. `rushx build` reports that as a warning; `rush rebuild` fails on it. The remedy
was a clean cut rather than one chosen under pressure — the structured-output types depend on
nothing in `model.ts`, so they became `structuredOutputTypes.ts` — but the honest reading is
that **the sweep belongs at the start of every stream, not once**, since a stream that adds
types to a shared model file will consume more headroom than a `wc -l` snapshot suggests.

## Gates

- [x] `rushx build` / `lint` / `test` at **100%** coverage in `@fgv/ts-extras` — **2733 tests**
- [x] `rushx build` / `lint` / `test` at **100%** in `@fgv/ts-json-base`
- [x] Repo-wide `rush rebuild` — exit 0, **zero warnings**
- [x] Change files for `@fgv/ts-extras`, `@fgv/ts-json-base`, `@fgv/ts-app-shell`
- [x] A test per provider path proving the field reaches the wire body in that provider's shape
- [x] A test proving the reported enforcement matches what was sent, per mode; plus one proving
      an unresolved alias does not prefix-match a catch-all
- [x] `code-reviewer` on the final diff; all findings resolved (3 P2, 4 P3), none dispositioned away
- [ ] **Live testbed verification per provider.** Not run — no API keys in this environment.
      The wire shapes are exactly the class of thing unit tests cannot confirm, and this
      package's history says so explicitly. **This box stays open**: the four request bodies are
      pinned by tests against the shapes as documented, which is evidence the code does what it
      intends and *not* evidence the providers accept it.
