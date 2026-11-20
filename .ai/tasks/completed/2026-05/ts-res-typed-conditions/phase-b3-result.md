# Phase B-3 Result: ts-prompt-assist typed-converter consumer port

**Date:** 2026-05-19
**Branch:** `claude/ts-res-typed-conditions-b3-MXEfo`
**Status:** Complete (PR pending; orchestrator to open against
`claude/ts-prompt-assist-features`)

---

## What shipped

B-3 closes the cast-pressure failure mode in `@fgv/ts-prompt-assist`:
when a consumer supplies a `qualifierNameConverter` on the store /
fixture build, the YAML loader validates each candidate's
`conditions` keys (record form) or `qualifierName` fields (array form)
against the Converter's literal-string union at convert time. A typo'd
axis name fails at load time with a regex-matchable error.

Three additive shape changes plus the two carry-forwards from closed
PR #385:

1. **Parameterized container types** — `IPromptCandidateRecord`,
   `IStoredPromptRecord`, `IPromptFileContents`,
   `IPromptStoreFixtureSeed`, `IPromptStoreFixtureSeedRecord`, and
   `IFileTreePromptStoreCreateParams` now carry
   `TQualifierNames extends string = string`. The `conditions` field on
   `IPromptCandidateRecord` resolves to ts-res's parameterized
   `ResourceJson.Json.ConditionSetDecl<TQualifierNames>` directly — no
   local sibling types.

2. **Typed Converter sibling** — new `typedPromptFileConverter<T>(qc)`
   factory builds a `Converter<IPromptFileContents<T>>` whose candidate
   `conditions` slot is validated through
   `ResourceJson.Convert.typedConditionSetDecl(qc)`. Shares a private
   helper `_buildPromptFileContentsConverter` with the default
   `promptFileConverter`, so the body-scan and
   `outputValidations`-on-free-text rejection cannot drift between the
   typed and untyped paths.

3. **Threaded qualifier-name converter through the consumer surface** —
   `FileTreePromptStore.create` and the `IPromptStoreFixtureSeed`
   accept `qualifierNameConverter?: Converter<TQualifierNames>`. When
   supplied, the store builds a per-instance YAML converter from the
   typed sibling; when omitted, it falls back to today's
   default-string converter.

4. **F2 — `buildSimpleDescriptor` helper** carried forward verbatim
   from closed PR #385. New exported function and `IBuildSimpleDescriptorParams`
   interface. Free-text only (the `output.kind` discriminator is
   load-bearing; the helper deliberately doesn't generalize to JSON
   output).

5. **F6 — README React-wiring section** carried forward verbatim from
   closed PR #385. `ChatTone` consumer enum, `<select>` bound to it,
   `tone === 'neutral' ? {} : { tone }` qualifier wire-through, plus a
   fourth list-item under the three-things-this-pattern-earns block
   spelling out the v0.1 convention that axis NAMES are
   library-inferred while per-axis VALUE unions are a consumer concern.

The local sibling types `ITypedConditionSetDecl` and
`ITypedPromptCandidateRecord` from PR #385 were NOT carried forward —
B-2 ships the canonical primitive at the ts-res layer, so the consumer
references it directly.

---

## Consumer-pattern shape (as shipped)

```ts
import { Converters } from '@fgv/ts-utils';
import { PromptLibrary, PromptStoreFixture, buildSimpleDescriptor } from '@fgv/ts-prompt-assist';

const validNames = ['tone', 'language'] as const;
type ValidName = (typeof validNames)[number];
const qualifierNameConverter = Converters.enumeratedValue<ValidName>([...validNames]);

const seed: IPromptStoreFixtureSeed<ValidName> = {
  records: [
    {
      scope: 'global' as ScopeKey,
      id: 'greeting' as PromptId,
      descriptor: buildSimpleDescriptor({ id: 'greeting' as PromptId, title: 'Greeting' }),
      candidates: [
        { conditions: {}, body: 'Hello.' },
        // ↓ At compile time: 'tonr' is not assignable to 'tone' | 'language'.
        //   At convert time: even if a runtime cast bypassed the compile
        //   check, the YAML loader rejects the typo with /tonr/.
        { conditions: { tone: 'formal' }, isPartial: true, body: 'Greetings.' }
      ]
    }
  ],
  qualifiers: [...], // ts-res qualifier decls
  qualifierNameConverter // ← threads through to the store's YAML loader
};
const store = (await PromptStoreFixture.build(seed)).orThrow();
const library = (await PromptLibrary.create({
  store,
  qualifiers: [...validNames]
})).orThrow();
```

The same `qualifierNameConverter` is also accepted directly by
`FileTreePromptStore.create` for the FsTree path. The seed-side
generic parameter `IPromptStoreFixtureSeed<ValidName>` and the
runtime converter `qualifierNameConverter` are independent — a
consumer who wants only compile-time discipline can annotate the seed
type without supplying the Converter, or vice versa. The cast-pressure
regression test exercises the full path: typed seed plus typed
Converter, with a runtime-cast escape-hatch (`as unknown as
IPromptCandidateRecord<ValidName>`) proving the Converter rejects
typos that bypass the compile check.

---

## F2 / F6 absorption notes

**F2 — `buildSimpleDescriptor`.** Brought forward verbatim from PR
#385 (commit `20780782`). No reshaping needed: the helper's contract
is independent of the typed-conditions work, and the descriptor
returned doesn't carry any qualifier-name parameterization (the
`output: { kind: 'free-text' }` discriminator is what matters, and the
slots / qualifier metadata fields are unchanged). The three tests
from #385 are mirrored in `b3TypedConditions.test.ts`.

**F6 — README React-wiring section.** Brought forward verbatim. The
`ChatTone = 'neutral' | 'formal'` example pattern composes cleanly
with the new `qualifierNameConverter` story — the consumer-supplied
enum still authors per-axis VALUE unions next to the wiring module,
and the new B-3 surface adds an optional Converter for the
axis-NAME side. The list-item callout ("axis NAMES are
library-inferred while per-axis VALUE unions are a consumer concern")
still applies as written.

---

## Cast-pressure regression test design

Two test files share the regression coverage:

- **`b3TypedConditions.test.ts`** (new) — the dedicated B-3 surface.
  Three sub-blocks:

  - **`buildSimpleDescriptor (F2)`** — three positive tests mirroring
    #385's coverage of the helper.
  - **`cast-pressure regression (B-3)`** — eight tests exercising:
    - `typedPromptFileConverter` rejecting record-form typos at convert
      time with `/tonr/`.
    - Same rejection for the array form.
    - Acceptance of valid axis names through the typed converter.
    - The default `promptFileConverter` accepting the same typo
      (back-compat baseline — documents that the default path is
      permissive and the teeth live on the opt-in path).
    - `FileTreePromptStore.create({ qualifierNameConverter })` rejecting
      a YAML round-trip with `/tonr/` at `store.get()` time.
    - The same store accepting a valid YAML.
    - `PromptStoreFixture.build` threading the Converter through
      end-to-end for a structurally valid seed.
    - `PromptStoreFixture.build` catching a runtime-cast escape-hatch
      typo (`as unknown as IPromptCandidateRecord<ValidName>`) at
      `store.get()` — the load-bearing assertion that the convert-time
      teeth are tighter than the seed-type compile check.
  - **`compile-time seed-type discipline (B-3)`** — three smoke tests
    using `@ts-expect-error` on the typo branch and verifying the
    default `string` parameter remains permissive.

- **`foundation.test.ts`** (existing) — the existing 164 tests stay
  unchanged; coverage of `IPromptCandidateRecord` /
  `IStoredPromptRecord` flows unchanged through the default `string`
  parameter (back-compat verified).

Synthetic consumer used throughout the new file:

```ts
const validNames = ['tone', 'language'] as const;
type ValidName = (typeof validNames)[number];
const qualifierNameConverter: Converter<ValidName> =
  Converters.enumeratedValue<ValidName>([...validNames]);
```

100% coverage on all four metrics (statements / branches / functions /
lines) across every changed file, verified by `rushx test`.

---

## `_bindings.yaml` / `_qualifiers.yaml` widening decision

**Narrow scope held.** The bindings and qualifiers loaders were NOT
threaded with the `qualifierNameConverter`.

Rationale:

- `_bindings.yaml` carries slot-name → SlotBinding entries. The key is
  a `SlotName` (Mustache-name production), not a qualifier name.
  Nothing to narrow.
- `_qualifiers.yaml` carries `Qualifiers.IQualifierDecl[]` — the
  authority that DEFINES the axis-name set. The qualifierNameConverter
  is a downstream consumer of that set; threading it into the
  qualifiers loader would invert the dependency direction.
- The cast-pressure regression test passes end-to-end with the narrow
  scope, including the YAML round-trip path that was the original
  failure mode #385's local types tried to close.

If a future story needs cross-file axis-name consistency on the
bindings side (e.g. validating that scope-level binding records
reference only known qualifiers), that's a different concern and
warrants its own surface — surface as a FUTURE entry rather than
bundling here.

---

## Surprises

1. **Variance between parameterized record types and the store's
   open-shape return.** Parameterizing `IStoredPromptRecord<TQualifierNames>`
   with `default = string` made the store's `IPromptStore.get` return
   `Promise<Result<IStoredPromptRecord<string> | undefined>>` — same
   shape as today. A typed-converter-built store produces records that
   are runtime-narrowed (the YAML loader rejects out-of-set keys) but
   typed at the open `string` lower bound at the IPromptStore
   interface boundary. This composes cleanly: a consumer who wants the
   narrow on the consumer-side can annotate
   `(await store.get(...)).orThrow().candidates[0].conditions as
   ConditionSetDecl<'tone'>` — but the convert-time teeth ensure that
   the cast cannot smuggle invalid axis names through.

2. **Constructor-cast avoidance.** Initial implementation introduced
   `params as IFileTreePromptStoreCreateParams<string>` in the static
   `create` to fan a `TQualifierNames`-parameterized public input down
   to a constructor accepting the open shape. Refactored to an
   internal `IInternalStoreParams` interface that carries the
   pre-built `promptYamlConverter: Converter<IPromptFileContents>` so
   the constructor never sees the type-parameterized form. Closed the
   one manual-cast point that the B-3 brief specifically flagged ("no
   manual casts beyond `@ts-expect-error`").

3. **`@public` placement.** Splitting the YAML-converter build out of
   the constructor required adding a private `IInternalStoreParams`
   interface above the class. Initially I left the class's
   `/** @public */` doc block ABOVE the new interface, which left the
   class without its `@public` release tag and produced an
   api-extractor warning. Moved the interface to before the class doc
   block so the `@public` tag flows back to the class. Trivial but
   caught by the api-extractor warning gate.

4. **File-size lint cap.** Adding the B-3 tests directly to
   `foundation.test.ts` pushed it past the 2000-line max-lines lint
   rule. Split the new tests into a dedicated
   `b3TypedConditions.test.ts` — cleaner organization anyway since the
   typed-converter pipeline is a distinct feature surface from
   foundation. `foundation.test.ts` is now back at 1736 lines.

5. **`_typedLooseCandidateBodyConverter` indirection.** Originally I
   considered factoring `looseCandidateBodyConverter` into a shared
   helper that took the conditions Converter as a parameter, then
   instantiating it twice (once with default, once with the typed
   sibling). The default path needed to preserve its `Converter` typing
   over the conditions slot (which is `ResourceJson.Normalized.ConditionSetDecl`,
   not the typed `Json.ConditionSetDecl<T>`), so I kept the default
   converter inline as `Converters.object<IPromptCandidateRecord>(...)`
   and made the typed sibling a separate private function. This
   mirrors the pattern from B-2 (typed siblings as fresh literals,
   not factored-out cores).

---

## Open questions for the cluster close

1. **Should `IPromptStore` itself be parameterized on
   `TQualifierNames`?** The convert-time teeth make the runtime narrow
   load-bearing, but the IPromptStore.get return type is the open
   `IStoredPromptRecord<string>` — a typed-store consumer who wants
   their `store.get()` calls to return narrowed records needs to cast.
   Threading `TQualifierNames` through the IPromptStore interface
   would tighten this but expands the parameterization surface
   significantly (every internal call site of the resolve packlet
   would carry the parameter). Suggest deferring as FUTURE rather than
   bundling into cluster close.

2. **`tools/ts-res-cli` adoption** (state.md F-1) — the CLI's import
   path could opportunistically thread the typed converters now that
   B-2 ships them. Still a tech-debt chore rather than a blocker; queue
   for after the cluster lands.

3. **Round-2 finding F5 (typed qualifier VALUES, not just names)** —
   the README's new list-item explicitly forward-references this. The
   cluster close is the right time to confirm whether F5 stays
   v0.2-scoped or whether a v0.1 stub is warranted.

---

## Acceptance gates

| Gate | Status |
|---|---|
| `rush build` passes full repo | ✅ — all 27 packages build clean |
| `rushx lint` passes in `@fgv/ts-prompt-assist` | ✅ (exit 0) |
| `rushx fixlint` ran before final commit | ✅ |
| `rushx test` passes with 100% coverage on all 4 metrics | ✅ — 178 tests, 100/100/100/100 |
| Cast-pressure regression test rejects typo at convert time | ✅ — `b3TypedConditions.test.ts` cast-pressure regression block |
| api-extractor regenerated | ✅ — additive diff only: new `TQualifierNames` params, new `buildSimpleDescriptor` / `IBuildSimpleDescriptorParams` / `typedPromptFileConverter` / `qualifierNameConverter` field. No removed/renamed exports. |
| Rush change file added (`minor`) | ✅ — `chore-ts-res-typed-conditions-b3_2026-05-19-00-00.json` |
| `phase-b3-result.md` written | ✅ — this file |
| state.md updated | (pending — flip B-3 row to ✅ with PR link after PR opens) |
| `docs/WORKSTREAMS.md` updated | (pending — flip stream-level entry to ✅ after PR merges) |
| No `any` types; no manual casts beyond `@ts-expect-error` | ✅ — internal store params refactor eliminated the one cast point |
| Local sibling types removed | ✅ — `ITypedConditionSetDecl` / `ITypedPromptCandidateRecord` from PR #385 are NOT in the implementation; references go directly to `ResourceJson.Json.ConditionSetDecl<T>` |

---

## Files changed (summary)

| File | Change |
|---|---|
| `src/packlets/types/descriptor.ts` | Parameterized `IPromptCandidateRecord` / `IStoredPromptRecord`; added `IBuildSimpleDescriptorParams` + `buildSimpleDescriptor` |
| `src/packlets/converters/descriptorConverter.ts` | Parameterized `IPromptFileContents` + `buildStoredPromptRecord`; new `typedPromptFileConverter<T>` factory; private `_buildPromptFileContentsConverter` + `_typedLooseCandidateBodyConverter` helpers |
| `src/packlets/store/fileTreePromptStore.ts` | Parameterized `IFileTreePromptStoreCreateParams<TQualifierNames>`; added `qualifierNameConverter?` field; refactored ctor to take a per-instance `promptYamlConverter` built from typed/default factory |
| `src/packlets/fixture/promptStoreFixture.ts` | Parameterized `IPromptStoreFixtureSeed<TQualifierNames>` + `IPromptStoreFixtureSeedRecord<TQualifierNames>`; added `qualifierNameConverter?` to seed; threaded through to `FileTreePromptStore.create` |
| `src/test/unit/b3TypedConditions.test.ts` (new) | 14 tests covering F2, cast-pressure regression, and compile-time seed-type discipline |
| `README.md` | F6 React-wiring update (verbatim from #385) |
| `etc/ts-prompt-assist.api.md` | api-extractor regen (additive only) |
| `common/changes/@fgv/ts-prompt-assist/chore-ts-res-typed-conditions-b3_*.json` | Rush change file (minor) |
