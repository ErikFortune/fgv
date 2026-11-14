# State: `json-schema-constraints`

Worker-owned. The brief is frozen; questions and deviations are recorded here.

## Progress

| step | commit | status |
| --- | --- | --- |
| 1. node and enforcement (`ts-json-base`) | `043f56acb` | done |
| 2. round trip and `fromJson` | `a204da3f6` | done |
| 3. capability tables and fold (`ts-json-base`, `ts-extras`, `ts-extras-ollama`) | `60d96f869` | done |
| 4. downstream fixtures and docs | `a21d378f9`, plus the close-out commit | done |

The tests for commit 1 land in commit 2: one table-driven suite (`constraints.test.ts`) drives every
case through both the factory and `fromJson`, so it could not be split without duplicating it.

## Deviations from the brief, with reasons

1. **The fold transform lives in `ts-json-base`, not `AA`.** Decision 9 makes fold "one shared
   transform", and decision 10 applies it to `ts-extras-ollama` too. That package depends on
   `ts-json-base` only, not on `ts-extras`. Putting the transform in `AA` would mean either a second
   copy in Ollama or a new heavyweight dependency. `JsonSchema.adaptSchemaKeywords` sits beside the
   emitter, since it walks the grammar `toJson()` emits. The per-format **tables** are in `AA`
   (`schemaKeywords.ts`), as decision 7 asks. Ollama's one-line all-fold table is in
   `ts-extras-ollama`.
2. **The OpenAI-family tables are per provider as well as per wire format.** Decision 7 assumed one
   table per format. The Responses wire (`toResponsesApiTools`) and the Chat Completions strict wire
   (`openai-json-schema`) are shared by every `apiFormat: 'openai'` provider: Groq, Mistral,
   `openai-compat` and Ollama's compatibility endpoint, as well as OpenAI and xAI. Mistral even
   declares `openai-json-schema` structured output. Only OpenAI's and xAI's documentation could be
   read; `docs.mistral.ai` is blocked by the egress proxy. Decision 8 says unverified keywords fold,
   so the OpenAI/xAI intersection table applies only to `openai` and `xai-grok`, and every other
   provider on those wires folds everything. Doing this needed the provider id at the tool
   formatter, so `IAiApiConfig` and `IStreamApiConfig` (both internal) gained an optional
   `providerId`. If it is absent, every keyword folds.
3. **Factories throw on an incoherent option set.** Decision 4 says the factory "fails
   construction". The factories return `ISchemaValidator<T>`, not `Result`, and changing that would
   break every caller in the repo. Schemas are declared, typically as module-level constants, so an
   incoherent set is an authoring error, and `orThrow()` is the repo's sanctioned setup-time throw.
   One internal check (`constraints.ts`) is shared by the factory (which throws) and `fromJson`
   (which returns a `Failure` naming the path).
4. **The fold sentence covers annotations too.** It always reads `Constraints: …`, even when what is
   folded is `title` or `examples`, so there is one fixed sentence shape.
5. **`format` beside a `$ref` stays refused.** Decision 6 extends `$ref`-sibling precedence to the
   new annotations: `title`, `default` and `examples` now replace the target's. `format` applies
   only to strings and the target need not be one, so it remains a refused sibling, as before.

## Open questions

- `TECH_DEBT.md`: the P3 covers more than the constraint class (`const`, array and key-count
  keywords, and the object-key and array keywords). It is marked resolved **for the constraint
  class**, and the rest is left open. The brief said "marked resolved", but closing it fully would
  have been false.
- `LIBRARY_CAPABILITIES.md`: no shortcut's line changed. The router is at 22,639/24,000 characters,
  so a new shortcut for `adaptSchemaKeywords` was not added. The detail is in
  `ts-json-base/CAPABILITIES.md`. `verify-capability-docs.mjs` passes.
- Layer-1 review: the kickoff forbids sub-agents, so no independent `code-reviewer` ran. A
  self-review against the rubric was done inline. Its findings, all applied, were: optional
  parameters that are never undefined were made required, which removed dead branches; a tie
  branch in `_tighter` that could never fire was removed; dynamic `RegExp`s in tests were replaced;
  and cross-package `{@link}`s were replaced with code spans. **The gate-time independent review
  is therefore the only one.**
