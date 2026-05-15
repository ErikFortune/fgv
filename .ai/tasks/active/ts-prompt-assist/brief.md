# Stream Brief: ts-prompt-assist (phase A — research and design)

**Stream ID:** ts-prompt-assist
**Phase:** A — research and design
**Cluster:** `ts-prompt-assist-features` (integration branch `claude/ts-prompt-assist-features` off `release`)
**Workflow shape:** design-triage-implement-refine (consumer-port pressure-test absorbed via follow-up PRs on the same integration branch)

---

## Mission

Produce a binding `design.md` for `@fgv/ts-prompt-assist` v0.1. The library's **conceptual model is already locked** (see `design-brief.md` §"Design principles") and the proposed **data-structure shapes** have been pressure-tested against a consumer design but not against an implementation. Phase A's job is to:

1. Validate the proposed shapes against the conceptual model and against fgv repo conventions
2. Resolve the three open questions (scope encoding flexibility, resource-binding substitution merge semantics, `watch()` semantics)
3. Surface and resolve any additional questions the design-doc review missed
4. Lock the v0.1 API surface, package layout, dependency graph, and acceptance criteria
5. Hand off a `design.md` that phase B can implement without further design adjudication

**This brief is the binding contract** for phase A. The consumer-supplied `design-brief.md` (in the same directory) is the binding input — its **conceptual model** is non-negotiable; its **data-structure specifics** are proposals you may adjust where the implementation pushes back, surfacing rationale in `design.md`.

This is feature work on a brand-new active-development surface (`@fgv/ts-prompt-assist`, listed in `.ai/instructions/ACTIVE_DEVELOPMENT.md`). Per `ACTIVE_DEVELOPMENT.md`, free hand on breaking changes during v0.x; lockstep version policy means the library publishes alongside everything else.

---

## What is binding (from `design-brief.md`)

These are **not** open for redesign:

1. **Lookup-then-compose** mental model. ts-res handles qualifier-conditioned candidate selection; Mustache handles substitution; everything downstream of the substituted body is the consumer's concern.
2. **Scope-chain walking with bindings.** Caller supplies a chain (most-specific first). Bindings merge across the chain, most-specific wins, with per-binding `enforced` lock and per-slot `writableBy` tier. Caller substitutions override merged bindings except for enforced.
3. **Open qualifier metadata.** Descriptors declare `required` / `expected` / `disallowed` axes but never close the value set per axis. ts-res fallback semantics remain the substrate.
4. **Resource bindings as first-class.** A slot binding can reference another resource; library resolves recursively with cycle detection and a depth cap.
5. **Output validation library-side.** For `kind: 'json'`: strip fences → JSON.parse → registered Converter → registered output validators. Library, not consumer.
6. **Storage-agnostic via `IPromptStore`.** `FileTreePromptStore` canonical for v0.1 (via `@fgv/ts-json-base` FileTree, per the `filetree-io` skill); `InMemoryPromptStore` for tests. SQL/Mongo adapters drop in later — interface design must enable this.
7. **Standalone package above `ts-res`.** `@fgv/ts-prompt-assist` ships as `libraries/ts-prompt-assist/`, depending on `@fgv/ts-res` (and transitively `ts-utils`, `ts-extras` for Mustache, `ts-json-base` for FileTree). Cannot fold into `ts-extras` (would create a cycle since `ts-res` depends on `ts-extras`).
8. **Triple-brace Mustache canonical.** `{{{name}}}` in bodies; loader rejects `{{name}}` and `{{&name}}` tokens with a clear error citing the prompt id. Use `@fgv/ts-extras`'s `MustacheTemplate.create(...).validateAndRender(...)`.
9. **Consumer-shape-agnostic.** ScopeKey is opaque; `surface` / `slot.kind` / `slot.source` are open strings narrowed by consumer-supplied descriptor Converter at load time; closed-vocabulary registrations live in registries the consumer populates at boot.
10. **First consumer is `personaility`.** Phase A doesn't need to know personaility-specific shapes (the library is shape-agnostic), but acceptance criteria should be informed by "is this surface enough to express the listed consumer needs without forcing personaility to fork the library or pre-massage data."

---

## What is proposed (open for phase A)

You may adjust these where the design surfaces a reason. Surface the rationale in `design.md`.

- Field names (e.g. `writableBy`, `enforced`, `directive`, `compositionMode`)
- Knob placement (e.g. should `templateCacheSize` and `resourceBindingDepthLimit` live on `create()` params or on a separate `IPromptLibraryConfig`?)
- Recursion semantics for resource bindings (especially the `substitutions?` merge semantics — see OQ-2)
- Discriminated-union tagging (e.g. `kind: 'literal' | 'resource'` on `SlotBinding`)
- Output-contract shape (currently `kind: 'free-text' | 'json'`; the brief hints at growth to `'json-array' | 'json-stream'` — verify the union is shaped to grow cleanly)
- `IPromptStore` method signatures (especially `watch?` semantics; see OQ-3)
- Trace shape (`IPromptResolveTrace` / `IBindingTraceEntry`) — is this rich enough for the editor surfaces personaility will build?
- Registry shapes (`IPromptShapeRegistry`, `ISlotKindRegistry`, `IPromptOutputValidationRegistry`) — three separate registries vs unified? Phase A should adjudicate.
- Type names where they read awkwardly (the brief uses `IPromptDescriptor`, `IPromptSlot`, etc. — flag any that feel off)

If you find yourself wanting to revise something **binding** (lookup-then-compose, resource bindings, scope chain, output validation), **STOP and surface to the orchestrator** before diverging. Conceptual model changes are policy decisions, not design decisions.

---

## Open questions (must resolve in phase A)

### OQ-1: Scope encoding flexibility

`FileTreePromptStore` takes `scopeEncoding(scope: ScopeKey) => string` and `scopeDecoding(encoded: string) => Result<ScopeKey>` functions. Default: treat ScopeKey as path-safe string already.

**Decide:**
- Does the default cover the realistic v0.1 use case (the consumer's scope strings will be simple, e.g. `'global'`, `'tenant:acme'`)?
- Or does the design need richer abstraction — e.g. nested directories mirroring scope structure (`tenant/acme/role/editor/`) — to handle hierarchical scope keys cleanly on disk?
- If the default is sufficient: document the path-safety contract clearly (what chars are rejected, what the consumer is responsible for).
- If not: pick the richer abstraction shape now.

Surface the choice in `design.md` with rationale.

### OQ-2: Resource-binding substitution merge semantics

`IResourceSlotBinding.substitutions?` flows into the referenced resource's resolve. Two candidate semantics:

- **Strict (proposed default):** binding subs **replace** parent subs entirely for the inner resolve. Cleanest mental model; enables clear "I'm reusing this fragment with totally different inputs" use case.
- **Relaxed:** binding subs **layer over** parent subs, per-key. Inner resolve sees parent subs unless the binding overrides a specific key. Useful if shared fragments commonly want most of parent's context but override one or two keys.

**Decide:** which semantics for v0.1. Document use cases that motivate the choice. (If you can't pick confidently, document both and recommend strict — relaxing later is additive; tightening later is breaking.)

### OQ-3: `watch()` semantics

Hot-reload (`IPromptStore.watch?(handler)`) is anticipated but no concrete consumer demand yet.

**Decide:**
- v0.1 ships `watch?` as optional, unimplemented on `FileTreePromptStore`, fully implemented on `InMemoryPromptStore` (tests exercise it)?
- Or omit from the interface entirely until a concrete consumer asks?
- If the interface includes it: pin the event shape (`IPromptStoreEvent`) now so future implementations don't churn the type surface.

Recommend the most conservative shape that doesn't paint v0.2 into a corner.

### OQ-4 (orchestrator-flagged): Are the three registries the right shape?

The brief proposes three separate registries: `IPromptShapeRegistry` (Converters + qualifier enums), `ISlotKindRegistry` (slot-kind serializers), `IPromptOutputValidationRegistry` (output validators).

**Audit:**
- Is the split clean (each registry owns a distinct concern), or do they bleed into each other?
- Would a unified `IPromptRegistry` with namespaced sub-registries (`registry.converters`, `registry.serializers`, `registry.validators`, `registry.enums`) be more ergonomic for consumers?
- Three separate `create()` params (`shapeRegistry`, `slotKindRegistry`, `outputValidations`) feels noisy — would one unified registry param simplify the API?

Decide and document.

### OQ-5 (orchestrator-flagged): Output-contract growth path

The brief proposes `OutputContractKinds = 'free-text' | 'json'` with a comment that it's poised to grow (`'json-array', 'json-stream'`). The `IJsonOutputContract<TKIND extends JsonOutputKinds>` shape carries a generic parameter for forward-compatibility.

**Decide:**
- Is the generic parameter pulling its weight at v0.1, or does it complicate the type without benefit until the second JSON variant arrives?
- For the `'free-text'` kind: anything beyond the `kind` discriminator (e.g. character-count assertion, language tag, trailing-newline contract)? Or strictly minimal for v0.1?
- For the `'json'` kind: is the single `converterId` enough, or should there be a stream of post-converter validators inline (e.g. `validators: ConverterId[]`) vs the current `outputValidations: ReadonlyArray<string>` on the descriptor?

---

## Phase A deliverables

By the end of phase A, the artifact set is:

1. **`design.md`** at `.ai/tasks/active/ts-prompt-assist/design.md`. Sections:
   - "What is binding" (transcribed verbatim or near-verbatim from this brief, for the implementer's reference)
   - "Resolved open questions" — OQ-1 through OQ-5 (plus any new ones surfaced)
   - "Final type system" — branded scalars, string unions, interfaces, discriminated unions (with `allFooValues` arrays + Converter sketches where appropriate; phase B writes the actual Converters)
   - "Final library API" — `PromptLibrary` class shape, `IPromptStore` interface, registries
   - "Storage adapter shapes" — `FileTreePromptStore` create params + the locked YAML schema; `InMemoryPromptStore` create params
   - "Mustache rules" (locked) — double-brace rejection, triple-brace canonical, template caching params
   - "Resource-binding semantics" (locked) — cycle detection, depth limit, sub-merge semantics, trace structure
   - "Output validation pipeline" (locked) — fence strip, parse, convert, validate
   - "Input safeguard primitives" (locked) — length cap, regex screen, source-aware skipping, anti-jailbreak hook
   - "Composition semantics" (locked) — `single-best` vs `concat-fragments`, scope-chain interaction
   - "Package surface declaration" — `libraries/ts-prompt-assist/` layout, `package.json` dependencies, rush.json registration, version-policy assignment (`base-utils`), tag (`libraries`)
   - "v0.1 acceptance criteria" — refined from the design brief's proposal (the implementer will be held to these)
   - "Out-of-scope for v0.1" — same shape as the brief but tightened by your decisions
   - "Implementation phasing recommendation" (optional but useful) — suggest a phase B breakdown (e.g. B.1 types + InMemoryStore + resolve → B.2 FileTreePromptStore + YAML → B.3 output validation + safeguards → B.4 docs + api-extractor + change file)

2. **Updated `state.md`** at `.ai/tasks/active/ts-prompt-assist/state.md` — your decision log, open questions resolved, any new questions raised, PR pointer.

3. **PR opened against `claude/ts-prompt-assist-features`** (NOT `release`). The integration branch will be created by the orchestrator before phase A kickoff (off post-merge `release` HEAD).

---

## Phase A acceptance criteria

- [ ] `design.md` covers every section listed above
- [ ] OQ-1 through OQ-5 each have a recorded decision with rationale
- [ ] Any binding-rule diversion was surfaced to the orchestrator before being baked in (default: no diversions)
- [ ] Phase B implementer can pick up `design.md` cold and produce v0.1 without further design adjudication
- [ ] `state.md` records the decision log, any new questions raised, and the PR link
- [ ] PR opened against `claude/ts-prompt-assist-features` (integration branch)
- [ ] No production code in this phase — design + state only

---

## Required reading (priority order)

1. `.ai/tasks/active/ts-prompt-assist/brief.md` (this file) — binding phase A contract
2. `.ai/tasks/active/ts-prompt-assist/design-brief.md` — consumer-supplied design brief (binding input)
3. `.ai/instructions/CODING_STANDARDS.md` — Result pattern, no `any`, Converters/Validators, factory pattern, MessageAggregator
4. `.ai/instructions/TESTING_GUIDELINES.md` — Result matchers from `@fgv/ts-utils-jest`, 100% coverage discipline
5. `.ai/instructions/ACTIVE_DEVELOPMENT.md` — confirms `ts-prompt-assist` is on the free-hand active surface
6. `.ai/instructions/LIBRARY_CAPABILITIES.md` — survey of existing fgv primitives you'll lean on (Result, Converters, FileTree, MustacheTemplate, Hash, logging, ts-res)
7. `libraries/ts-res/` — especially `runtime/`, `resource-json/`, `import/` packlets — the resource resolution machinery you're delegating to. Read the public API; you don't need to understand the internals.
8. `libraries/ts-extras/src/packlets/mustache/` (if it exists) — `MustacheTemplate` shape. If the packlet lives elsewhere in `ts-extras`, grep for it.
9. `libraries/ts-json-base/src/packlets/file-tree/` — `FileTree` interface (canonical for all I/O)
10. `libraries/ts-app-shell/` — new-library scaffolding precedent (`package.json`, `tsconfig.json`, `config/rig.json`, `config/api-extractor.json`, `eslint.config.js`). Match this shape for `ts-prompt-assist`'s scaffolding.
11. `.ai/conventions/workflow/` — workflow shape conventions; `kickoff-prompt-shape.md` if relevant

---

## Skills to load (when conditions trigger)

- `/result-pattern` — load before writing any function signature returning `Result<T>` (every public method)
- `/type-safe-validation` — load before designing Converters / Validators for the YAML descriptor format and the registries
- `/filetree-io` — load before designing the `FileTreePromptStore` adapter; the FileTree abstraction is canonical, not `node:fs`
- `/published-primitives-reflex` — load before sketching any helper that might already exist in `ts-utils` or `ts-extras`
- `/ts-utils-logging` — load before designing the logger injection points
- `/value-hashing` — load if any structural-equality concerns surface (e.g. de-duping resource-binding traces)

---

## Branch + PR posture

- **Base branch:** `claude/ts-prompt-assist-features` (integration branch off `release`). The orchestrator creates this branch before phase A commission; do not branch off `release` directly.
- **Work branch:** `claude/ts-prompt-assist-phase-a` (or harness-auto-suffixed; document the actual branch in state.md)
- **PR target:** `claude/ts-prompt-assist-features`
- One PR for phase A. Implementing agent does NOT need to land production code; design + state are the deliverables.

---

## Sequencing + cluster posture

This stream operates on an integration branch (`claude/ts-prompt-assist-features`) because the cluster is expected to be multi-stream:

- **Phase A** (this stream) → `design.md` + state
- **Phase B** — implementation against locked design (separate stream commission post-triage)
- **Refine** — consumer-port pressure-test feedback absorbed as 1–2 follow-up PRs on the same integration branch
- Possible future streams: samples app, generic editor UX (queued in `docs/FUTURE.md`; not commissioned)

The integration branch promotes to `release` when the consumer port has settled and the API is stable enough for an alpha publish (target: `5.1.0-29` or later; possibly accumulating to `6.0` based on API-stability evidence). All cluster streams target the integration branch, not `release`.

Independent of in-flight work (`ai-assist-thinking-events` queued; no conflicting surface).

---

## Don't

- Don't write production code in phase A. `design.md` + `state.md` only.
- Don't diverge from the binding conceptual model — STOP and surface to the orchestrator if you find yourself wanting to revise §"What is binding".
- Don't pick "we'll figure it out in phase B" as a resolution for OQ-1 through OQ-5. Phase A's job is to lock these.
- Don't introduce dependencies beyond `@fgv/ts-utils`, `@fgv/ts-res`, `@fgv/ts-extras`, `@fgv/ts-json-base`, and standard heft/jest/ts toolchain. If you need anything else (a YAML parser, etc.), surface as an OQ.
- Don't worry about `c8 ignore` directives or coverage in phase A — those are phase B concerns.
- Don't pre-empt phase B's implementation phasing if you're not confident; the "Implementation phasing recommendation" section is optional.

---

## Resume protocol

If the session ends mid-phase: read `brief.md` (this file) + `design-brief.md` + `state.md` to resume. State.md records which sections of `design.md` are drafted vs pending.

---

## Missing-input rule

If a required-reading file is missing, conflicts with this brief, or you find a binding-rule conflict you can't resolve without orchestrator input, **STOP and report**. Do not improvise on binding decisions.
