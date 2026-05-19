# `ts-res-typed-conditions` (completed stream)

Three-sub-phase stream that taught `@fgv/ts-res` to honor qualifier-name semantics at both the **type level** (Decl-tree cascade) and the **runtime level** (Converter pipeline), then ported `@fgv/ts-prompt-assist` to consume the new primitives directly — closing the cast-pressure failure mode end-to-end.

**Completed:** 2026-05-19
**Cluster:** `ts-prompt-assist-features`
**Integration branch:** `claude/ts-prompt-assist-features`
**Stream-level outcome:** see [`result.md`](./result.md).

## Why this stream existed

The closed PR #386 attempted to parameterize `@fgv/ts-res`'s Decl types on a `TQualifierNames` literal-string union but only got the leaf types — the container types (resource-candidate, resource, collection, tree-root) weren't threaded, so the narrow had no flow path from any realistic authoring chain. Meanwhile, the Converter pipeline had no opt-in path to validate qualifier names against a consumer's declared literal set at JSON-load time — so even when a consumer narrowed axis names in code, the narrow evaporated at the Converter boundary, and a typo in YAML silently fell through to the base candidate at resolve time.

That failure mode (round-2 finding F1 in the cluster's pressure-test docs) needed ownership at the right layer: `@fgv/ts-res` owns the qualifier-name concept (registered via `QualifierCollector`), so it should own the discipline that enforces it — not consumer libraries reimplementing partial-shape local sibling types.

## What shipped

| Sub-phase | What | PR | Merged |
|---|---|---|---|
| B-1 | Decl-tree cascade — 17 types in `resource-json/` + `conditions/` parameterized on `TQualifierNames extends string = string`. Two latent fixes (`getKeyFromLooseDecl` undefined-handling; type-guard runtime soundness) carried forward from #386. | #391 | `c688292d` |
| B-2 | Converter parameterization — 16 typed sibling Converters (4 in `Conditions.Convert`, 12 in `ResourceJson.Convert`) that take a `qualifierNameConverter: Converter<TQualifierNames>` and narrow their return type accordingly. Existing untyped exports preserved at signature + behavior level. | #394 | `f32ba55f` |
| B-3 | `@fgv/ts-prompt-assist` consumer port — 6 container types parameterized; `typedPromptFileConverter<T>` factory; `qualifierNameConverter?` threaded through `FileTreePromptStore.create` and `PromptStoreFixture.build`. F2 (`buildSimpleDescriptor`) + F6 (README React-wiring) absorbed verbatim from closed PR #385; F1 local sibling types from #385 NOT carried forward (B-2 ships the canonical primitive). | #395 | pending |

Substrate prep PR #390 added the brief + state.md before B-1 commission.

## Artifacts

| File | Purpose |
|---|---|
| [`brief.md`](./brief.md) | Stream brief — mission, sub-phase shape, in-scope/out-of-scope paths, acceptance criteria, decision-track input. |
| [`state.md`](./state.md) | Stream state — phase status, decisions log, history, PR table. |
| [`phase-b2-brief.md`](./phase-b2-brief.md) | B-2 sub-brief — three candidate surface shapes enumerated (Options A/B/C). |
| [`phase-b2-design-notes.md`](./phase-b2-design-notes.md) | B-2 design notes — selects Candidate D (sibling `typed*` exports over a shared core, defaults preserved). |
| [`phase-b1-result.md`](./phase-b1-result.md) | B-1 result — full type list, fix-up rounds, Copilot-review absorptions. |
| [`phase-b2-result.md`](./phase-b2-result.md) | B-2 result — typed export catalog, factoring observation on default-export return-type narrowing, OQ-2 empirical resolution, drift-hazard markers. |
| [`phase-b3-result.md`](./phase-b3-result.md) | B-3 result — consumer-pattern shape, F2/F6 absorption notes, cast-pressure regression test design, bindings/qualifiers widening decision. |
| [`result.md`](./result.md) | Stream-level consolidated result across all three sub-phases — outcome, surface-preservation table, decisions log, lessons captured, open questions for cluster close. |

## Stream-level lessons (for the next stream that does parameterization work)

1. **Trace every Decl flow before parameterizing.** B-1's first cut missed `IResourceTreeRootDecl.resources` / `children`; B-3 picked this up by tracing every spot a Decl flows through the store/fixture path before parameterizing the seed types. Without the trace pass, the narrow evaporates mid-pipeline and you ship a story that compiles but doesn't enforce.

2. **Typed/untyped pair drift hazards demand explicit markers.** B-2's review surfaced this. The resolution — a `// keep in sync with X` marker above every typed sibling, plus a drift-hazard paragraph in the typed block preamble — is now a documented pattern. B-3 inherits the same idiom via the shared `_buildPromptFileContentsConverter` core.

3. **"No manual casts beyond `@ts-expect-error`" pushes for cleaner internal-shape design.** B-3's first cut had a `params as IFileTreePromptStoreCreateParams<string>` cast in the static `create`. Refactoring to an internal `IInternalStoreParams` interface that carries the pre-built converter eliminated the cast and produced a cleaner separation between public surface and internal wiring.

4. **API-extractor regen catches `@public`-placement bugs.** B-3's regen surfaced an `@public` placement issue (an inserted interface above the class doc block stripped the release tag). The warning gate caught it before reviewers saw it.

5. **Stream-level lockstep version discipline is load-bearing.** All three sub-phases shipped as additive — zero removed/renamed exports across `@fgv/ts-res` and `@fgv/ts-prompt-assist`. The cluster's other concurrent streams rebased cleanly across each sub-phase merge as a result.

## Cluster-close handoff

The stream's `result.md` enumerates three open questions for the cluster-close prep:

1. Whether to parameterize `IPromptStore` itself on `TQualifierNames` (suggests deferring as FUTURE — convert-time teeth already carry the safety; threading the parameter through the resolve packlet's surface is significant).
2. `tools/ts-res-cli` adoption of typed Converters (state.md F-1) — opportunistic followup chore.
3. Round-2 finding F5 (typed qualifier VALUES, not just names) — confirm v0.2 scoping at cluster close.

## Held PRs unblocked

- **PR #385** (round-2 absorb F1+F2+F6) — superseded by this stream's consolidation. F2 + F6 carried forward into B-3 verbatim; F1's local sibling types replaced by ts-res's parameterized primitives. PR #385 can be closed without merge.
- **PR #384** (sample app + round-2 findings) — rebases onto post-B-3 HEAD; lands last in the cluster-close sequence.
