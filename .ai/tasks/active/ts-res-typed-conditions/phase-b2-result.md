# Phase B-2 Result: Converter parameterization — typed sibling exports

**Date:** 2026-05-19
**Branch:** `chore/ts-res-typed-conditions-b2-converter-teeth`
**Status:** Complete (PR pending; orchestrator to open against
`claude/ts-prompt-assist-features`)

---

## Typed exports shipped

All typed siblings take a single `qualifierNameConverter: Converter<TQualifierNames>`
argument and return a converter whose result type is narrowed on
`TQualifierNames`. Existing untyped exports are preserved at signature and
behavior level (verified: `git diff libraries/ts-res/etc/ts-res.api.md` shows
no removed/renamed exports).

### `Conditions.Convert` (libraries/ts-res/src/packlets/conditions/convert/)

| Existing | New typed sibling | Returns |
|---|---|---|
| `conditionDecl: ObjectConverter<IConditionDecl, unknown>` | `typedConditionDecl<T>(qc)` | `Converter<IConditionDecl<T>>` |
| `validatedConditionDecl: GenericConverter<IValidatedConditionDecl, IConditionDeclConvertContext>` | `typedValidatedConditionDecl<T>(qc)` | `Converter<IValidatedConditionDecl, IConditionDeclConvertContext>` |
| `conditionSetDecl: ObjectConverter<IConditionSetDecl, unknown>` | `typedConditionSetDecl<T>(qc)` | `Converter<IConditionSetDecl<T>>` |
| `validatedConditionSetDecl: GenericConverter<IValidatedConditionSetDecl, IConditionSetDeclConvertContext>` | `typedValidatedConditionSetDecl<T>(qc)` | `Converter<IValidatedConditionSetDecl, IConditionSetDeclConvertContext>` |

Also: `IConditionDecl` and `IConditionSetDecl` are now parameterized on
`TQualifierNames extends string = string` (additive default — back-compat).

### `ResourceJson.Convert` (libraries/ts-res/src/packlets/resource-json/convert.ts)

12 typed siblings — covering every consumer entry-point converter plus all
internal converters that an entry-point composes (so the narrow flows
end-to-end without re-introducing default-`string` Converters mid-chain):

- `typedLooseConditionDecl<T>(qc)` → `Converter<Json.ILooseConditionDecl<T>>`
- `typedConditionSetDecl<T>(qc)` → `Converter<Json.ConditionSetDecl<T>>` (handles both array and record form via internal `oneOf`)
- `typedLooseResourceCandidateDecl<T>(qc)` → `Converter<Json.ILooseResourceCandidateDecl<T>>`
- `typedImporterResourceCandidateDecl<T>(qc)` → `Converter<Json.IImporterResourceCandidateDecl<T>>`
- `typedChildResourceCandidateDecl<T>(qc)` → `Converter<Json.IChildResourceCandidateDecl<T>>`
- `typedLooseResourceDecl<T>(qc)` → `Converter<Json.ILooseResourceDecl<T>>`
- `typedChildResourceDecl<T>(qc)` → `Converter<Json.IChildResourceDecl<T>>`
- `typedContainerContextDecl<T>(qc)` → `Converter<Json.IContainerContextDecl<T>>`
- `typedResourceTreeChildNodeDecl<T>(qc)` → `Converter<Json.IResourceTreeChildNodeDecl<T>>`
- `typedResourceTreeRootDecl<T>(qc)` → `Converter<Json.IResourceTreeRootDecl<T>>`
- `typedResourceCollectionDecl<T>(qc)` → `Converter<Json.IResourceCollectionDecl<T>>`
- `typedImporterResourceCollectionDecl<T>(qc)` → `Converter<Json.IImporterResourceCollectionDecl<T>>`

### Boundary rationale (what stayed default-string)

- `childConditionDecl` (`Converter<Json.IChildConditionDecl>`) — `IChildConditionDecl`
  has **no** `qualifierName` field (the record form uses the object key as
  the qualifier name and the value carries everything else). There is nothing
  to narrow; a typed sibling would be a pure no-op rename.
- The internal `conditionSetDeclFromArray` / `conditionSetDeclFromRecord`
  module-private converters in `resource-json/convert.ts` — these are not
  exported. The typed equivalents (`_typedConditionSetDeclFromArray` /
  `_typedConditionSetDeclFromRecord`) are also module-private and composed
  into the public `typedConditionSetDecl`.

### Implementation pattern (factoring observation)

I considered factoring a shared `_makeX<T>(qc)` core per converter and having
both the default export and the typed sibling delegate to it. That works for
the basic `strictObject` cases but produced an undesired side effect: the
default export's return type widens from `ObjectConverter<X, unknown>` to
`Converter<X, unknown>` (because a function's declared return type defaults
to the broader interface). `ObjectConverter` carries additional methods
(`.partial()`, etc.) that consumers may use, so the widening would be a real
public-surface narrowing.

Instead I kept each default export as the original literal
`Converters.strictObject(...)` (preserving `ObjectConverter`) and have the
typed sibling construct a fresh `strictObject(...)` with the typed
`qualifierName` slot. The object literal is duplicated once per shape — a
small repetition that buys exact signature preservation for the default
exports. For the `Converters.generic(...)`-based converters
(`validatedConditionDecl`, `validatedConditionSetDecl`, the tree-recursive
ones, the collection ones), I did factor the body into a shared
parameterized helper (`_validatedConditionDeclBody`,
`_validatedConditionSetDeclBody`) because their return type is already
`Converter`, so no surface-narrowing concern.

---

## OQ-2 empirical finding: no `QualifierCollector` surface change required

Verified by reading `libraries/ts-res/src/packlets/qualifiers/qualifierCollector.ts:63`:

```ts
export interface IReadOnlyQualifierCollector extends Collections.IReadOnlyValidatingCollector<Qualifier> {
  // ...
}
```

The existing `IConditionDeclConvertContext.qualifiers.validating.get(name)`
call in `_validatedConditionDeclBody` already performs collector-membership
narrowing — it returns a `Failure` for unknown names. The typed sibling
**layers** a Converter-level literal-set narrow on top of that collector
check: the typed `qualifierNameConverter` rejects typo'd names at convert
time (before the collector ever sees them), AND the same name then passes
into `.validating.get(...)` for membership verification. Both checks
compose cleanly; neither needs the other to change.

Code evidence (`conditions/convert/decls.ts:84-122`): the
`_validatedConditionDeclBody` helper accepts an `innerConditionDecl: Converter<IConditionDecl<TQualifierNames>>`
parameter and otherwise threads through the unchanged collector lookup. No
collector method was added, removed, or modified.

**Conclusion:** the hypothesis from B-1's writeup ("no `QualifierCollector`
surface change required for B-2") held empirically. The typed sibling
contract is "convert-time narrow + same collector check"; no surface
extension needed.

---

## Cast-pressure regression test design

Two test files, both using the same synthetic-consumer pattern:

- `libraries/ts-res/src/test/unit/conditions/typedConvert.test.ts` — exercises
  the four `Conditions.Convert` typed siblings.
- `libraries/ts-res/src/test/unit/resource-json/typedConvert.test.ts` —
  exercises all 12 `ResourceJson.Convert` typed siblings.

**Synthetic consumer:**

```ts
const validNames = ['tone', 'language'] as const;
type ValidName = (typeof validNames)[number];
const qualifierNameConverter = Converters.enumeratedValue<ValidName>(validNames);
```

**Three assertion shapes per converter:**

1. **Convert-time rejection** — a JSON value carrying a typo'd qualifier name
   (e.g. `'tonr'`) is passed to the typed converter; the test asserts
   `toFailWith(/tonr/)`. This is the load-bearing assertion: it proves the
   typed converter rejects the typo *at convert time*, not just at compile
   time.
2. **Convert-time acceptance of valid names** — a JSON value carrying a name
   in the literal-string union (`'tone'` or `'language'`) is accepted, and
   the narrowed return type carries that union through. Inside
   `toSucceedAndSatisfy`, an assignment `const narrowed: ValidName = converted.qualifierName;`
   exercises the type-level narrow (would fail compile if the result type
   were still `string`).
3. **Back-compat documentation** — the default untyped export (e.g.
   `conditionDecl`, `looseConditionDecl`) accepts `'tonr'` without complaint
   at the convert level. This documents the baseline: B-2 adds an opt-in,
   does NOT change the default. (For `validatedConditionDecl` the
   collector-membership check still rejects unknown names — but that's
   pre-existing teeth, not B-2 teeth.)

The resource-json file also covers the record-form (`{ tonr: 'formal' }`)
path, the array-form (`[{ qualifierName: 'tonr', value: 'formal' }]`) path,
nested candidate conditions, nested tree-node recursion, and the
importer-collection mix of loose + child resources — i.e. every JSON shape a
consumer might author.

100% coverage on both new test files (verified by `rushx test` reporting
`100 | 100 | 100 | 100` across all four metrics for every changed file).

---

## Surprises

1. **Default-export return-type narrowing risk.** First implementation
   factored a shared `_makeConditionDecl<T>(qc)` and made the default
   `conditionDecl = _makeConditionDecl(Converters.string)`. The api-extractor
   diff caught that the default's return type went from
   `ObjectConverter<IConditionDecl, unknown>` to
   `Converter<IConditionDecl<string>, unknown>` — a public-surface narrowing.
   Restructured to keep each default export as the literal `strictObject`
   call (preserving `ObjectConverter`) and have typed siblings build their
   own `strictObject`. The duplication cost is acceptable; the surface
   preservation is non-negotiable for the back-compat acceptance criterion.

2. **`@link` JSDoc warnings on new exports.** Following B-1's lesson,
   `@link` cross-package refs (`{@link @fgv/ts-utils#Converter | ...}`) and
   even some namespaced refs (`{@link Conditions.Convert.typedConditionDecl | ...}`)
   produce api-extractor unresolved-link warnings. Replaced all new
   `@link` references in introduced JSDoc with backtick-quoted type names.
   Pre-existing `@link` refs in unchanged JSDoc (e.g. on `conditionDecl`,
   `validatedConditionDecl`) were left alone — those warnings are baseline,
   not new. Final count: 849 warnings — matches the B-1-post-merge baseline
   exactly. No new ones.

3. **Threading depth shallower than estimated.** The B-1 result's "Open
   Questions for B-2" estimated 4-6 internal files affected. Actual count:
   3 source files (`conditions/convert/decls.ts`,
   `conditions/convert/conditionSetDecls.ts`,
   `resource-json/convert.ts`) plus the two type files
   (`conditions/conditionDecls.ts`, `conditions/conditionSetDecls.ts`)
   that grew an additional type parameter on `IConditionDecl` / `IConditionSetDecl`.
   The cascade is shallower than expected because the typed siblings are
   peer factories that compose lower-level typed siblings via parameter
   passing — there is no internal mutable state that would force a wider
   ripple.

4. **`Normalized.*` vs `Json.*<T>` return types.** Existing
   `resource-json/convert.ts` exports return `Converter<Normalized.X>` where
   `Normalized.X` is structurally identical to `Json.X<string>` (the B-1
   default-instantiation of the parameterized Json type). The typed siblings
   return `Converter<Json.X<T>>` directly — slightly different type
   identities, but a consumer who uses both gets compatible types because
   `Normalized.X` and `Json.X<string>` are mutually assignable in either
   direction. No `Normalized.*` types needed re-aliasing; the divergence is
   purely cosmetic at the call site.

5. **Two siblings collide on the same simple name across namespaces.**
   `Conditions.Convert.typedConditionSetDecl` (returns
   `Converter<IConditionSetDecl<T>>` — object form with `conditions` field)
   and `ResourceJson.Convert.typedConditionSetDecl` (returns
   `Converter<Json.ConditionSetDecl<T>>` — array | record form) are both
   public. api-extractor disambiguates them as `typedConditionSetDecl` and
   `typedConditionSetDecl_2` in the api.md report — same pattern as the
   pre-existing `conditionSetDecl` / `conditionSetDecl_2` collision. No
   action required (the public namespace paths
   `Conditions.Convert.X` vs `ResourceJson.Convert.X` keep them distinct
   for consumers).

---

## Open questions surfaced for Phase B-3 (ts-prompt-assist port)

1. **Recommended ts-prompt-assist consumer pattern:** the consumer authors
   a `qualifiersConverter` once (e.g.
   `Converters.enumeratedValue(['tone', 'language', ...] as const)`),
   threads it into `PromptStoreFixture.build` / `FileTreePromptStore` to
   produce a typed `PromptLibrary<T>` whose seeded YAML and on-the-wire
   stored prompts validate against the same literal-string union end-to-end.
   The B-3 brief should specify which surfaces of the store layer take the
   `qualifierNameConverter` — likely `FileTreePromptStore.create` and
   `PromptStoreFixture.build`.

2. **Drop-the-local-types checklist for B-3:** PR #385 (held) introduced
   `ITypedConditionSetDecl` / `ITypedPromptCandidateRecord` as
   ts-prompt-assist-local shims. B-3 should:
   - Remove those local types.
   - Re-route consumers to `ResourceJson.Json.ConditionSetDecl<T>` and
     `Json.ILooseResourceCandidateDecl<T>` directly.
   - Re-route the JSON validation chain to use
     `ResourceJson.Convert.typedLooseResourceCandidateDecl(qc)` or
     `typedConditionSetDecl(qc)` as appropriate.

3. **YAML loader signature:** the YAML loader path that builds a
   `IResourceCollectionDecl` from authored YAML can now take an optional
   `qualifierNameConverter` and produce a narrowed
   `IResourceCollectionDecl<T>`. B-3 should expose this through the
   `FileTreePromptStore.create` API and the `PromptStoreFixture.build`
   factory. The default (no converter) keeps today's permissive string
   behavior.

4. **Whether `_bindings.yaml` / `_qualifiers.yaml` loaders should accept
   the same `qualifierNameConverter`** for cross-file axis-name consistency
   — out of scope here, surface in the B-3 brief.

5. **Existing ts-res-cli adoption (F-1 in state.md):** not blocking B-3, but
   a followup chore to opportunistically thread the typed converters
   through the CLI's bundle/import path would catch typo'd axis names at
   compile time in CLI consumer YAML — worth queuing as a tech-debt entry
   once B-3 ships.

---

## Acceptance gates

| Gate | Status |
|---|---|
| `rush build` (entire repo from `@fgv/ts-res`) | ✅ all 11 downstream consumers compile unchanged |
| `rushx lint` (in `@fgv/ts-res`) | ✅ passes (exit 0) |
| `rushx fixlint` run before final commit | ✅ ran during iteration |
| `rushx test` (in `@fgv/ts-res`) | ✅ passes; 100% coverage on statements / branches / functions / lines |
| Cast-pressure regression test exists | ✅ two files; 16 typed converters × 2-3 assertion shapes each |
| `etc/ts-res.api.md` regenerated cleanly | ✅ only adds: new `typed*` exports + the `<T>` parameter on `IConditionDecl` / `IConditionSetDecl`; no removed/renamed exports; 849 unresolved-link warnings = pre-existing baseline |
| Rush change file added | ✅ `common/changes/@fgv/ts-res/chore-ts-res-typed-conditions-b2-converter-teeth_2026-05-19-12-00.json` (type: minor) |
| No `any` types; no manual casts | ✅ implementation contains zero `as any` / unsafe casts |
| `phase-b2-result.md` written | ✅ this file |
