# Phase B-1 Result: Decl-tree cascade — parameterize containers on TQualifierNames

**Date:** 2026-05-19
**Branch:** `chore/ts-res-typed-conditions-b1-cascade`
**Status:** Complete

---

## Types Parameterized

All types now parameterized on `TQualifierNames extends string = string` (final list reflects the original commission plus the fix-up round absorbing Copilot review findings):

**Leaf types (ported from PR #386):**
1. `ILooseConditionDecl<TQualifierNames extends string = string>` — `qualifierName: TQualifierNames`
2. `ConditionSetDeclAsArray<TQualifierNames extends string = string>` — `ReadonlyArray<ILooseConditionDecl<TQualifierNames>>`
3. `ConditionSetDeclAsRecord<TQualifierNames extends string = string>` — `Readonly<Partial<Record<TQualifierNames, string | IChildConditionDecl>>>`
4. `ConditionSetDecl<TQualifierNames extends string = string>` — union of the two above

**Container types (full cascade, completing what #386 missed):**
5. `IChildResourceCandidateDecl<TQualifierNames extends string = string>` — `conditions?: ConditionSetDecl<TQualifierNames>`
6. `ILooseResourceCandidateDecl<TQualifierNames extends string = string>` — extends `IChildResourceCandidateDecl<TQualifierNames>`; redeclares `conditions` field explicitly
7. `IImporterResourceCandidateDecl<TQualifierNames extends string = string>` — extends `IChildResourceCandidateDecl<TQualifierNames>`
8. `IContainerContextDecl<TQualifierNames extends string = string>` — `conditions?: ConditionSetDecl<TQualifierNames>`
9. `IChildResourceDecl<TQualifierNames extends string = string>` — `candidates?: ReadonlyArray<IChildResourceCandidateDecl<TQualifierNames>>`
10. `ILooseResourceDecl<TQualifierNames extends string = string>` — extends `IChildResourceDecl<TQualifierNames>`; redeclares `candidates`
11. `IResourceCollectionDecl<TQualifierNames extends string = string>` — `context`, `candidates`, `resources`, `collections` all threaded
12. `IImporterResourceCollectionDecl<TQualifierNames extends string = string>` — same fields threaded
13. `IResourceTreeChildNodeDecl<TQualifierNames extends string = string>` — `resources?` / `children?` threaded *(added in fix-up round; Copilot finding #1)*
14. `IResourceTreeRootDecl<TQualifierNames extends string = string>` — extends `IResourceTreeChildNodeDecl<TQualifierNames>` *(restructured in fix-up round so root-level resources/children inherit threading via the parent; Copilot finding #1)*

**Type aliases also parameterized:**
15. `IImporterResourceDecl<TQualifierNames extends string = string>` — union of `ILooseResourceDecl<TQualifierNames> | IChildResourceDecl<TQualifierNames>`

**Type guard functions also parameterized + soundness-fixed:**
16. `isLooseResourceCandidateDecl<TQualifierNames>` — preserves narrowing through generic param; runtime check tightened from `'id' in decl` to `'id' in decl && typeof decl.id === 'string'` *(fix-up round; Copilot findings #7 + #9)*
17. `isLooseResourceDecl<TQualifierNames>` — same parameterization + same soundness fix

The brief named 9 container interfaces; the final count is 17 distinct items because the type guards, the union alias, and `IResourceTreeChildNodeDecl` (caught by Copilot review as a missing rung of the cascade) all needed updating to thread the parameter correctly. All remain backward-compatible at the type level; the type-guard soundness fix is a runtime change on previously-malformed inputs (decls with `id: undefined`), disclosed in the PR description.

---

## getKeyFromLooseDecl Fix (carried from #386)

`ConditionSet.getKeyFromLooseDecl` at `conditionSet.ts:200-225` converted from `Array.map` to `for...of` loop with an explicit `undefined`-value guard. This handles the case where `Object.entries` on `Readonly<Partial<Record<...>>>` produces `[string, V | undefined]` entries — the `Partial` widening is now type-accurate, and the runtime guard correctly skips keys explicitly set to `undefined`. The `c8 ignore` directive on the guard is appropriate per the evaluation addendum (reaching a `[key, undefined]` entry requires deliberately setting a key to `undefined`, which is unusual enough to be defensive code).

---

## Subtleties Encountered

**Inheritance pattern choices:** For interfaces that extend another parameterized interface (e.g. `ILooseResourceCandidateDecl extends IChildResourceCandidateDecl<TQualifierNames>`), the decision was to both declare the type parameter on the child AND re-declare the parameterized fields. This provides explicitness for readers and avoids interface members having different effective types depending on how the interface is used.

**`ILooseResourceCandidateDecl.conditions` re-declaration:** This interface extends `IChildResourceCandidateDecl<TQualifierNames>` (which already declares `conditions?: ConditionSetDecl<TQualifierNames>`) but also re-declares `conditions` explicitly. This pre-existed in the HEAD code and was preserved.

**API extractor `conditionDecl` discrepancy:** The pre-existing `ts-res.api.md` incorrectly showed `conditionDecl: ObjectConverter<ILooseConditionDecl, unknown>` but the actual source type was `IConditionDecl`. After parameterizing `ILooseConditionDecl`, api-extractor produced the correct `IConditionDecl` declaration. This is a pre-existing api.md inaccuracy being corrected, not a regression.

**Unresolved-link warnings (resolved in fix-up round):** Three new api-extractor warnings initially appeared for `@link ConditionSetDeclAsArray`, `@link ConditionSetDeclAsRecord`, and `@link ILooseConditionDecl` in the new `@remarks` JSDoc. The fix-up round replaced these `@link` references with backtick-quoted type names; api-extractor now emits no B-1-introduced warnings. Two pre-existing warnings (`FileTree`, `Converters`) remain — unrelated to this PR; flagged for a future cleanup chore.

---

## Downstream Consumer Verification

`rush build --from @fgv/ts-res` built all 11 downstream consumers successfully:
- `@fgv/ts-prompt-assist` ✅
- `@fgv/ts-res-cli` ✅
- `@fgv/ts-res-tutorial` ✅
- `@fgv/ts-res-ui-components` ✅
- `@fgv/ts-res-browser` ✅
- `@fgv/ts-res-browser-cli` ✅
- `@fgv/ts-res-ui-playground` ✅
- (plus upstream dependencies from cache)

No downstream consumer needed any changes. The `extends string = string` defaults preserved all existing call sites.

---

## API Extractor Diff Summary

Changes to `libraries/ts-res/etc/ts-res.api.md`:
- **Added:** `<TQualifierNames extends string = string>` type parameter to 10 interface/type declarations (+ 2 type guard functions and 1 union type alias)
- **Changed:** `ConditionSetDeclAsRecord` from `Record<string, ...>` to `Readonly<Partial<Record<TQualifierNames, ...>>>` (the `Partial` tightening from #386)
- **Changed:** `conditionDecl: ObjectConverter<ILooseConditionDecl, unknown>` → `conditionDecl: ObjectConverter<IConditionDecl, unknown>` (pre-existing api.md inaccuracy corrected by the parameterization; source was always `IConditionDecl`)
- **No removed exports**
- **No renamed exports**
- **No new unresolved-link warnings** after fix-up round (initial three replaced with backtick refs; two pre-existing warnings on `FileTree` / `Converters` remain, unrelated to this PR)

---

## Open Questions for B-2

1. **Converter parameterization shape:** The evaluation addendum (Q2) sketches `qualifierNameConverter?: Converter<QualifierName>` as an optional field on `IConditionDeclConvertContext`. The sub-brief names this as OQ-1. The B-2 agent should read the evaluation addendum's Q2 sketch carefully — the default (`Converters.string` + branded cast) preserves existing behavior; the opt-in path requires consumer to supply `Converters.enumeratedValue([...] as const)`. No `QualifierCollector` surface changes appear to be required for B-2 per the evaluation (Q5 analysis).

2. **The 4–6 internal file estimate from evaluation Q5:** The affected files are `conditions/convert/decls.ts` (`validatedConditionDecl` context interface), `conditions/convert/conditionSetDecls.ts`, and the cascade up through `ResourceJson` converters. The B-2 agent should verify this estimate before starting.
