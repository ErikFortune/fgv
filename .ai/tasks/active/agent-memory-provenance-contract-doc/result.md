# Result — `agent-memory-provenance-contract-doc`

**Outcome:** delivered. Documentation + tests only; **no behavior change**.
**Answer to PersonAIlity's question: YES on both halves, and the guarantee held under
independent verification.** Nothing contradicts the orchestrator's evidence table.

## The guarantee held

I did not take the evidence table on faith. I built the package on this branch and executed
all four rows against `lib/index.js`, then drove the same behavior end-to-end through
`FileTreeMemoryStore` on an in-memory FileTree. Full detail in `state.md`. Summary:

| Patch (`KnowledgeLwwPolicy.applyUpdate`) | Observed | Matches table |
|---|---|---|
| `{provenance: {note: null}}` | `{source:'agent', confidence:0.9}` | yes |
| `{provenance: {confidence: 0.5}}` | `{source:'agent', confidence:0.5, note:'keep me'}` | yes |
| `{provenance: null}` | fails `knowledge LWW: merge patch may not delete required field(s): provenance` | yes |
| `{tags: ['x']}` | provenance untouched | yes |

Plus: the existing record is not mutated in place, and a cleared sub-key survives the
YAML-frontmatter serialize/reload round trip.

## Three findings that extend (never contradict) the evidence table

1. **Cross-policy parity.** `TemporalVersionedPolicy` — which the brief did not mention —
   behaves identically on all four rows, as does `MemoryCapCullPolicy` when `provenance` is
   declared mutable. All three share `MERGE_PATCH_OPTIONS`; only the error-message prefix
   differs. So the contract is not `KnowledgeLwwPolicy`-specific; it is the shipped-policy
   contract. The README documents it at that level and names the two policies with a
   *pinned* (non-caller-supplied) surface.

2. **The policy-dependence caveat is sharper than "the guarantee may not apply".** With
   `MemoryCapCullPolicy.create({ mutableFields: ['body','tags'] })`, a provenance patch key
   is not merely unguaranteed — it is **inert**. A sub-key `null` does not clear, and a
   whole-block `null` is a **silent no-op, not an error**: the scoping loop drops the key
   before the merge, and `_rebuild` only guards required fields that were declared mutable.
   This is the one place a consumer could get a nasty surprise, so it is called out
   explicitly in the README, in `IMemoryCapCullPolicyParams.mutableFields`, and pinned by
   three new tests.

3. **The whole-block delete is rejected at two different layers.** At the policy layer
   `applyUpdate({provenance: null})` fails loudly. At the store layer the case is not
   expressible at all: `IMemoryEnvelope.provenance` is non-nullable and
   `envelopeConverter.convert({..., provenance: null})` fails with
   `Field provenance: Cannot convert field "source" from non-object null`. The README says
   which layer catches it rather than implying a single rejection site.

## What shipped

- **`README.md`** — new `## Record updates — the merge contract` section: RFC-7386 as a
  pinned contract (not a merge-config artifact), per-key object merge, sub-key `null`
  clearing, wholesale array replace, loud rejection of a required-field delete,
  `embeddingRef`'s optional exception, out-of-surface keys ignored. Sub-sections for
  `provenance` on the pinned surface (with a worked example) and for the policy-dependence
  caveat.
- **`writePolicy.ts` (TSDoc only)** — an `@remarks` on `IWritePolicy.applyUpdate` stating
  the four semantics plus the policy-dependence rule at the API surface; a paragraph
  appended to `KnowledgeLwwPolicy`'s existing "Merge-surface pin" remark (built on, not
  replaced, per the brief); an `@remarks` on `IMemoryCapCullPolicyParams.mutableFields`
  spelling out the caller-supplied-surface consequence.
- **`writePolicy.test.ts` (additive only — 112 added, 0 removed)** — a
  `provenance merge contract (README-pinned)` describe pinning all four evidence rows plus
  no-in-place-mutation, and a `provenance guarantees are policy-dependent (README-pinned)`
  describe pinning the inert-when-undeclared behavior and its restoration. Both name the
  README so the doc cannot silently drift.
- Rush change file (`patch`).

## No behavior change — verified mechanically

Beyond reading the diff (all three `writePolicy.ts` hunks sit inside `/** */` blocks), I
stripped block and line comments plus blank lines from `origin/release`'s `writePolicy.ts`
and from this branch's and compared: **identical**. No executable statement changed. The
test diff is 112 added / 0 removed. No other source file was touched.

## Out-of-scope observation (deliberately not fixed)

The README's status banner claimed the package ships "no store, index, retrieval, observe,
or vector code yet" — provably false; I drove the store end-to-end. Left alone it would
have made the new section incoherent, so that one clause was corrected and the heading
`B0 surface (this tier)` became `Foundational surface`. **The rest of the surface inventory
is still stale** — it lists only the `types` and `converters` packlets while the package
also ships `store`, `index`, `retrieve`, `vector`, `observe`, `ingest`, and `tools`.
Bringing it current is a separate doc chore, not this stream's scope.

## Gates

- `rushx build` — pass (no `etc/*.api.md` movement; TSDoc `@remarks` on members does not
  shift the API report)
- `rushx lint` — pass (`rushx fixlint` run before the final commit; no changes produced)
- `rushx test` — pass, **100% statements / branches / functions / lines**
- `code-reviewer` — run on the staged diff; see the PR description for the disposition
