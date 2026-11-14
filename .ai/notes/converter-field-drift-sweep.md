# Converter field-drift sweep — 2026-09-18

## Summary

- **Call sites found** (`Converters.object<...>`/`Validators.object<...>` under `libraries/*/src` and
  `tools/*/src`, excluding `test/` and `samples/`): **120**
  - Named-interface-typed (`T` resolves to a declared `interface`) — the Part A hazard zone: **97**
  - Anonymous inline-object-typed (`T` is a literal `{ … }` written at the call site): **16** — not
    subject to the hazard, because the field map *is* the type declaration; there is no independent
    `keyof T` for it to fall behind.
  - No fixed `T` at all — generic library-internal helpers (`Converters.object` overloads themselves,
    `rangeTypeOf`, the `ts-json-base` JSON-compatible/schema-builder wrappers) or ad hoc inferred
    converters: **7**
- **Interfaces resolved and field-diffed:** 96 of 97 (the one miss is `JsonWebKey`, a TypeScript
  `lib.dom` built-in, not a repo type — see Method).
- **Genuine field omissions found:** **0**
- Automated-diff false positives investigated and closed out: 3 (parser artifacts, not real drift —
  see Part A "cannot tell" below for the trail).
- **Sibling pairs checked (Part B):** 1 real domain/wire pair family (symmetric + asymmetric
  KeyStore entries), 1 naming false-positive (`IImportableJson`). **Asymmetries found: 0** — but the
  measured field counts contradict the task's stated calibration; see Part B.

**Verdict.** On today's `main`, this class of hazard is not currently costing anything measurable.
Every named-interface-typed `Converters.object<T>`/`Validators.object<T>` in production code across
the whole monorepo has a field map whose keys are exactly `keyof T` (module the two `extends`
cases, where inherited fields are out of this sweep's reach but were manually spot-checked and found
present). The one confirmed historical instance is `IPromptSlot.cacheStability` (#669), and it is
visibly fixed today — `descriptorConverter.ts` carries `cacheStability: EnumConvert.promptCacheStability.optional()`
and lists it in `optionalFields`. That said, the sweep is a snapshot: nothing here prevents a new
instance appearing on the next PR that adds an optional field to a converted interface, which is
exactly what happened at #669 and exactly what CI (build/lint/test, all green) does not catch. If a
gate is wanted, see the note at the end of Method.

---

## Part A — likely drift

**None found.** No named-interface-typed converter in production code omits a field that isn't
accounted for below.

---

## Part A — likely deliberate (with reasons)

These are cases the automated diff either flagged and I resolved by reading the source, or that are
structurally deliberate by design and worth recording so a future sweep doesn't re-flag them.

### 1. `IProvenance` — index signature, not a field

- Interface: `IProvenance`, `libraries/ts-agent-memory/src/packlets/types/envelope.ts:23`
- Converter: `Converters.object<IProvenance>(...)`, `libraries/ts-agent-memory/src/packlets/converters/envelopeConverter.ts:57`
- The interface carries `readonly [key: string]: unknown;` (TSDoc: *"Opaque extension payload —
  consumer-owned, never interpreted by the store."*). An index signature is not a named property a
  field map can enumerate — `FieldConverters<T>`'s homomorphic mapping only walks `keyof T`'s named
  keys, and an index signature doesn't produce one. My key-diff regex initially mis-parsed
  `[key: string]` as if it were a computed property key and flagged it "missing"; it isn't a field at
  all.
- **Assessment: likely-deliberate.** Structural, not a case the field-map mechanism can address.

### 2. `IGeminiContent.parts` — present; earlier "missing" was a parser artifact

- Interface: `IGeminiContent`, `libraries/ts-extras/src/packlets/ai-assist/completionClient.ts:247`
  (single field, `parts?: IGeminiPart[]`)
- Converter: `Validators.object<IGeminiContent>(...)`, same file, line 267:
  ```ts
  const geminiContent: Validator<IGeminiContent> = Validators.object<IGeminiContent>({
    // No non-empty constraint: `parts: []` is a shape Gemini actually returns, and rejecting it
    // here reports a schema violation for what is really "the model produced no output".
    parts: Validators.arrayOf(geminiPart).optional()
  });
  ```
- My first-pass comma-splitting field-map extractor doesn't strip comments before splitting on
  top-level commas, and the comment above `parts` contains a comma ("...actually returns, and
  rejecting it..."), which the naive splitter treated as a second field named `and`. Read directly,
  the converter has exactly the interface's one field. **Assessment: not drift — tooling artifact,
  confirmed by direct read.**

### 3. `IResponsesCompletedPayload.response` — present; earlier "missing usage" was a parser artifact

- Interface: `IResponsesCompletedPayload`, `libraries/ts-extras/src/packlets/ai-assist/streamingAdapters/openaiResponses.ts:122`
  — one field, `response: { status?; incomplete_details?; usage?: JsonObject | null }` (an inline
  object type).
- Converter: `Validators.object<IResponsesCompletedPayload>({ response: Validators.object<{...}>({ status, incomplete_details, usage }) })`,
  same file, lines 184–194. All three of the nested type's members (`status`, `incomplete_details`,
  `usage`) are present in the nested field map.
- My interface-field extractor's "attach nearest preceding TSDoc comment" heuristic mis-attributed a
  doc-comment on the *nested* `usage` field to the outer `response` field, truncating what it thought
  the segment's code was down to `usage` alone. Read directly, the interface has one top-level field
  (`response`) and the converter supplies it, fully populated. **Assessment: not drift — tooling
  artifact, confirmed by direct read.**

### 4. `IAiGeneratedImage` / `base64`, `mimeType` — inherited fields (`extends IAiImageData`), present

- Interface: `IAiGeneratedImage extends IAiImageData`, `libraries/ts-extras/src/packlets/ai-assist/model.ts:1587`
- Converter: `Validators.object<IAiGeneratedImage>(...)`, `libraries/ts-extras/src/packlets/ai-assist/imageGenerationClient.ts:210`
- `base64` and `mimeType` are declared on the parent `IAiImageData`, not on `IAiGeneratedImage`
  itself; my extractor only reads a single interface's own body, so it reported them as "extra in the
  map, not in the interface" (backwards from a possible-omission finding, but flagging the same root
  limitation). The converter supplies both. **Assessment: not drift — extends-chain is outside this
  sweep's reach; confirmed present by direct read.** This is the one case in the whole scan where the
  "extends" limitation (see Method) was actually exercised, so it's recorded here rather than silently
  passed over.

### 5. `crypto-utils/converters.ts:112` — `jsonWebKeyShape` narrows `JsonWebKey` to `kty` only, by explicit design

- `T` here is `JsonWebKey`, a TypeScript `lib.dom.d.ts` built-in (not a repo interface — my automated
  interface-resolution pass correctly reported it unresolved, and I read the source by hand instead).
- ```ts
  /**
   * In-place shape check for a JSON Web Key. Asserts only that the input is a
   * non-array object whose `kty` discriminator is a string; every other JWK
   * field passes through untouched. This is intentionally **not** a true JWK
   * validator — per-algorithm correctness (RSA `n`/`e`, EC `crv`/`x`/`y`,
   * key-size constraints, etc.) is delegated to `crypto.subtle.importKey` at
   * first use, which is the authoritative checker. The "shape" suffix in the
   * name is the warning sign for readers expecting full validation.
   */
  export const jsonWebKeyShape: Validator<JsonWebKey> = Validators.object<JsonWebKey>({
    kty: Validators.string
  } as Validation.Classes.FieldValidators<JsonWebKey>);
  ```
  (`libraries/ts-extras/src/packlets/crypto-utils/keystore/converters.ts:96–114`)
- The `as FieldValidators<JsonWebKey>` cast is there for exactly the reason this sweep exists —
  `JsonWebKey`'s many optional fields (`alg`, `e`, `n`, `d`, `crv`, `x`, `y`, `k`, `use`, `key_ops`,
  `kid`, …) would otherwise all need entries per the homomorphic mapped type, and the author is
  deliberately opting out with a documented rationale rather than an unexplained cast.
  **Assessment: likely-deliberate — explicitly designed and documented as a partial shape check, not
  a full validator, with the "why" spelled out.** This is the single best example in the repo of the
  *right* way to do what #669 did *wrong*: same shape (fewer field-map entries than `keyof T`), but
  here it's a named, load-bearing, and reasoned decision rather than an accidental omission.

### 6. `AggregatedResultMap` JSON converters — `metadata` deliberately routed around the field map

Not a Part A finding in the strict sense (`T` at both call sites is an anonymous inline object type,
`{ isMutable; id; entries }` / `{ isMutable; id; items }`, not the named
`IAggregatedResultMapJsonEntryWithEntries` / `...WithItems` interfaces that document the JSON format
— so there's no `keyof T` for the compiler to check against). Worth recording anyway because it's the
shape this sweep is watching for and looks like a miss at a glance:

```ts
// libraries/ts-utils/src/packlets/collections/aggregatedResultMap.ts:1060
const baseConverter = Converters.object<{
  isMutable: boolean;
  id: TCOLLECTIONID;
  entries: KeyValueEntry<string, unknown>[];
}>({
  isMutable: Converters.boolean,
  id: collectionIdConverter,
  entries: entriesArrayConverter
});
```

`IAggregatedResultMapJsonEntryWithEntries` (the documented JSON format, same file, line 91) has a
fourth field, `readonly metadata?: unknown`. The `baseConverter` above never mentions it — but
`metadata` is read separately, off the raw `from` value, via `_extractSourceMetadata(from)` a few
lines down (line 1072), then converted through a caller-supplied `metadataConverter` whose type
(`TMETADATA`) can't be expressed as a static field-map entry generically. **Assessment:
likely-deliberate** — the split exists because `metadata`'s type is a generic parameter unknown to
the field map, not because it was forgotten; the code immediately downstream proves it's handled.

---

## Part A — cannot tell

None. Every omission the automated diff surfaced was resolved (as deliberate, or as a tooling
artifact) by reading the source directly; nothing was left ambiguous.

---

## Part B — sibling pairs

Searched all `interface`/`type` declarations in production code (`libraries/*/src`, `tools/*/src`,
excluding `test/`, `samples/`, `lib/`, `dist/`) for the `I<X>Json` / `I<X>Raw` / `I<X>Dto` /
`I<X>Legacy` / `I<X>Wire` naming pattern. Two real name-suffix hits, one is a false positive for the
"domain type / wire format" pairing this part is looking for, one is the genuine calibration pair.

### `IImportableJson` — naming false positive, not a domain/wire pair

- `libraries/ts-res/src/packlets/import/importable.ts:61`: `IImportableJson extends IImportable { type: 'json'; json: JsonValue; context?: ImportContext }`
- This is **not** "the JSON-serialized form of `IImportable`" — it's one variant of a discriminated
  union (`IImportablePath`, `IImportableFsItem`, `IImportableJson`, `IImportableResourceCollection`,
  …), named `...Json` because the payload it carries *is* a JSON value, not because it's a wire
  encoding of the base shape. It has **no converter at all** — every use (`fsItemImporter.ts`,
  `jsonImporter.ts`) constructs it as a plain object literal. Not in scope for this sweep's hazard
  (no field map to fall behind), and not a sibling-converter risk. Flagging so a future sweep doesn't
  waste time re-discovering the same naming coincidence.

### `IKeyStoreSymmetricEntry` / `IKeyStoreSymmetricEntryJson` and `IKeyStoreAsymmetricEntry` / `IKeyStoreAsymmetricEntryJson`

`libraries/ts-extras/src/packlets/crypto-utils/keystore/model.ts`. This is the pair the task named as
calibration. Only the `...Json` shapes have converters (`keystoreSymmetricEntryJson` at
`keystore/converters.ts:136`, `keystoreAsymmetricEntryJson` at `keystore/converters.ts:171`); the
domain shapes (`IKeyStoreSymmetricEntry`, `IKeyStoreAsymmetricEntry`) are never independently parsed
from `unknown` — every construction site in `keyStore.ts` builds them as object literals from
already-validated JSON plus in-memory-only data (e.g. the decoded key bytes). So there is exactly one
converter per family, not two — the safe shape the task description calls the "real-world working"
pattern, not the "recurring miss" one.

**Symmetric — domain (`model.ts:150`) vs JSON (`model.ts:289`): 7 fields each, identical name sets.**

| field | domain optional? | JSON optional? | in `keystoreSymmetricEntryJson` field map? |
|---|---|---|---|
| `name` | no | no | yes |
| `type` | no | no | yes |
| `key` | no (domain: `Uint8Array`) | no (JSON: base64 `string`) | yes |
| `description` | yes | yes | yes |
| `metadata` | yes | yes | yes |
| `createdAt` | no | no | yes |
| `updatedAt` | yes | yes | yes |

No asymmetry.

**Asymmetric — domain (`model.ts:207`) vs JSON (`model.ts:342`): 8 fields each, identical name sets.**

| field | domain optional? | JSON optional? | in `keystoreAsymmetricEntryJson` field map? |
|---|---|---|---|
| `name` | no | no | yes |
| `type` | no | no | yes |
| `id` | no | no | yes |
| `algorithm` | no | no | yes |
| `publicKeyJwk` | no | no | yes |
| `escrowedPrivateKeyJwk` | yes | yes | yes |
| `description` | yes | yes | yes |
| `createdAt` | no | no | yes |

No asymmetry.

**This contradicts the task's stated calibration.** The task says: *"I measured both at 5 fields —
i.e. currently in sync."* Reading `model.ts` directly today (lines 150, 207, 289, 342, confirmed by
both the automated extractor and a manual `Read` of lines 195–294), the symmetric family has **7**
fields and the asymmetric family has **8**, not 5. The two pairs are still in sync with each other (no
asymmetry — that half of the calibration holds), but the field count does not match what was
reported. Plausible explanations, in order of likelihood: the count predates fields added later
(`metadata`/`updatedAt` on the symmetric side, `escrowedPrivateKeyJwk` on the asymmetric side, both of
which read as later additions given their TSDoc — `escrowedPrivateKeyJwk`'s doc describes an "opt-in"
affordance and versioned vault behavior, `metadata`'s doc references a `setSecretMetadata` method as
if added after the base shape); or a miscount at the time of the original check. Either way: the
**in-sync conclusion stands**, the **field count does not**, and this is exactly the kind of
"show your working" the task asked for when the check disagreed.

No other domain/wire-style sibling pairs matching the requested suffix convention were found in
production code — see Method for the search that established this.

---

## Method and its limits

**How `T` was resolved.** Not a TypeScript AST/compiler pass — a two-stage bespoke masking parser
(brace/bracket/paren-depth counter operating on a version of each file with comment and
string/template-literal content blanked out, so stray characters like apostrophes-as-quotes or
commas-in-comments can't desynchronize the depth counter):

1. Regex-locate every `Converters.object` / `Validators.object` call in production `.ts`/`.tsx` under
   `libraries/*/src` and `tools/*/src` (path filtered to exclude any `/test/` or `/samples/`
   component). Extract the explicit type argument (if any, from `<...>`) and the field map (the first
   top-level `{ ... }` object-literal argument, if the call passes one directly — no field map that
   is `Converters.object<T>(someVariable)` was found in this sweep, so that gap was not exercised).
2. For each named type argument, strip generics/namespacing to a bare identifier and `grep` for
   `(export )?interface <Name>` across the whole repo (not just the same package — types are
   sometimes declared and converted in different packlets). 95 of 96 named types resolved this way;
   the one miss, `JsonWebKey`, is a TypeScript `lib.dom.d.ts` built-in with no repo declaration, and
   was handled by direct read (see Part A #5).
3. For each resolved interface, extract its own top-level members (name + optional-marker + nearest
   preceding TSDoc), and diff `keyof T` against the field map's keys.

**What this approach would MISS, stated explicitly (per the task's ask):**

- **Inherited members from `extends`.** The extractor reads only the interface's own body; a field
  declared on a parent is invisible to it. This surfaced exactly once (`IAiGeneratedImage extends
  IAiImageData`, Part A #4) and was resolved by hand — but if a converter *had* dropped an inherited
  field, this sweep's automation alone would not have caught it. There were only 2 `extends` cases
  among the 96 resolved interfaces (`IImportableJson extends IImportable` being the other, which has
  no converter at all), so the blind spot was narrow here, but it is real and unaudited in general.
- **Converters built by a helper function rather than a literal at the call site.** Five call sites
  (`Converters.object` in `ts-utils/basicConverters.ts` ×2, `ts-json-base/json-compatible/validators.ts`,
  `ts-json-base/json-schema-builder/factories.ts`, `ts-extras/conversion/converters.ts`'s
  `rangeTypeOf`) are the library's own generic passthrough machinery — `T` is a type *parameter*, not
  a fixed interface, so there is nothing concrete to diff. These are correctly out of scope for this
  hazard (the field-map/interface pairing is decided by each *caller* of the helper, not by the
  helper itself), but they were not diffed against anything downstream — i.e., this sweep did not
  chase every call site of e.g. `rangeTypeOf<T>` to see whether any of *those* omit fields, because at
  that point the pattern is "generic converter combinator," not "`Converters.object<T>` with a fixed
  `T`," and is outside what the task asked for.
- **Spread field maps** (`Converters.object<T>({ ...someBase, extra: ... })`). None were found in
  production code (checked explicitly — zero `...` spread keys across all 120 call sites), so this
  gap was not exercised, but the extractor would mis-handle one if it existed: a spread key is
  recorded as a literal `...SPREAD...` marker and would show every base-object field as "missing"
  rather than resolving the spread.
- **`Converters.generic` bodies that hand-build an object.** Entirely out of scope by construction —
  `Converters.generic<T>((from) => ...)` has no field map for the homomorphic-mapped-type hazard to
  apply to; a hand-rolled object literal inside a generic body can omit whatever it wants and the
  compiler's structural check on the return type would catch a *missing required* field but not an
  optional one, same root cause as the `FieldConverters` hazard but via a different mechanism. This
  sweep did not attempt to enumerate `Converters.generic` call sites — doing so properly would be a
  materially different (and larger) sweep.
- **Types aliased or re-exported under a different name than their declaration.** The grep-based
  interface locator matches on the *declared* name; if a converter's type argument were a `type Foo =
  SomeOtherName` alias, the locator would find the alias's own (likely trivial) declaration rather
  than resolving through to the real shape. This was not observed in the 96 resolved cases (none of
  the located declarations were themselves aliases requiring a further hop), but the sweep did not
  explicitly test for it.
- **Two named-comment-attribution bugs in the field-extraction regex** (documented in Part A #2 and
  #3) were found and manually corrected for *those two call sites specifically* by direct read, but
  the underlying heuristic (attach the nearest preceding `/** ... */` block as a field's TSDoc, then
  slice the code starting after it) is structurally fragile for any interface member whose *type* is
  itself an inline object literal carrying internal doc comments on its own members. There could be
  other members elsewhere in the repo with the same shape that were not manually re-verified beyond
  the field lists that came back clean — the fix was targeted, not systemic, so a residual risk of
  the same class of false-negative (under-counting a field, not over-counting) exists for interfaces
  not directly re-read by hand. All 96 resolved interfaces' *lists of field names* were sanity-checked
  by eyeballing the printed JSON for implausible entries (single-character or all-lowercase-word
  "fields," duplicate keys, missing expected names) before accepting the diff; none surfaced.
- **Unresolved converters: 1** (`JsonWebKey`, handled manually, see above). No converters were left
  entirely unexamined.

**Part B's search** was a `grep -rnE` over `interface`/`type` declarations for the five named suffixes
(`Json`, `Raw`, `Dto`, `Legacy`, `Wire`), not a semantic "does this look like a wire format" pass — so
it would miss a pair using a different naming convention entirely (e.g. `IFooV1`/`IFooV2`,
`IFooStored`, `IFooOnDisk` with no shared suffix in this list). A supplementary grep for
`Persisted|Serialized|Stored|Payload` was run and found only the AI-provider streaming `*Payload`
interfaces, which are wire types in their own right (no separate domain sibling to compare against —
already covered under Part A), not additional sibling pairs.

**If a gate is wanted going forward:** the two real false-positive classes found here (comment-comma
splitting, nested-doc-comment attribution) are exactly the kind of thing a proper TS-AST-based lint
rule (walking the actual `FieldConverters<T>` call and comparing against the real `keyof T` via the
type checker, not a text heuristic) would not have — and such a rule is also the only way to close the
`extends`-chain and `Converters.generic` blind spots identified above. This sweep is evidence the
*current* state is clean, not evidence that a text-based sweep is an adequate substitute for a
compiler-level check going forward.
