# `discriminated-object-self-fix` — shipped

**Shipped:** 2026-06-03 via PR #442 direct to `release`.

**Package surface:** `@fgv/ts-utils` — `conversion/converter.ts` (interface), `conversion/baseConverter.ts` (implementation), `conversion/basicConverters.ts` (`discriminatedObject` body), tests, api-extractor report, `minor` rush change file.

---

## What shipped

A three-part additive fix to `Converters.discriminatedObject` so per-arm converter invocations thread `self` (and `context`) — bringing the primitive in line with every other Converter combinator and unblocking recursive discriminated-union parsers.

### 1. `Converter.convert` interface — gained an optional third parameter

```ts
public convert(
  from: unknown,
  context?: TC,
  selfOverride?: Converter<T, TC>
): Result<T>;
```

Strictly additive. Existing two-parameter call sites compile and behave identically; the new parameter is only inspected by callers that opt in.

### 2. `BaseConverter.convert` — implementation honors `selfOverride`

```ts
public convert(from: unknown, context?: TC, selfOverride?: Converter<T, TC>): Result<T> {
  return this._converter(from, selfOverride ?? this, context ?? this._defaultContext);
}
```

When `selfOverride` is `undefined` (the existing caller path), `_converter` receives `this` as the `self` parameter — bit-identical to pre-fix behavior. Only when a caller (like the new `discriminatedObject` body) supplies an override does the alternative path engage.

### 3. `Converters.discriminatedObject` — rewritten body threads `self` to arms

Before:

```ts
return new BaseConverter((from: unknown) => {
  // ... validation ...
  return converter.convert(from);      // dropped self and context
});
```

After:

```ts
return new BaseConverter<T, TC>((from: unknown, self, context) => {
  // ... validation ...
  const arm = converters[discriminatorValue];
  return isValidator(arm)
    ? arm.convert(from, context)        // validator arms: in-place, no recursion semantics
    : arm.convert(from, context, self);  // converter arms: pass outer self for recursion
});
```

The arm now receives both `context` and (for converter arms) the **outer** `self` — i.e. the `discriminatedObject` converter itself, not the arm. Per-arm bodies built with `Converters.generic((from, self) => ...)` can now `self.convert(...)` to recurse through the outer dispatcher.

The `isValidator(arm)` discriminator at the call site keeps the validator-arm path unchanged: validators are for in-place type checking and don't participate in the recursion-via-self pattern, so they continue receiving the two-argument call. Type-safe and avoids needing to extend `Validator.convert` with a `selfOverride` parameter it would never use.

## `ValidatorBase.validate` — no change needed (implementation finding)

Inspection during implementation confirmed `ValidatorBase.validate` already threads `self` correctly via the existing `this._validator(from, context, this)` call pattern. There was no symmetric bug in the validator surface. The decisions log captures the analysis; no validator-side code change shipped.

## Tests added — 5 new cases in `converters.basic.test.ts`

1. **Validator-arm path** — exercises the `isValidator(arm)` branch in the dispatch body.
2. **`self` identity assertion** — captures `self` from inside an arm body via `Converters.generic`; asserts `capturedSelf === outerDiscriminatedObjectConverter` (not the arm itself).
3. **Leaf parsing** — base recursive case: the recursive converter resolves leaf nodes correctly.
4. **Shallow nesting** — branch with two leaf children round-trips through the recursive dispatch.
5. **Deep nesting** — 3-level deep branch round-trips, proving unbounded recursion through `self` works as expected.

## Origin

Surfaced 2026-06-03 during `json-schema-derives-t` (PR #441) review. The procedural `_parseNode` switch inside `fromJson` is the manual-type-check-with-cast anti-pattern fgv forbids per `CODING_STANDARDS.md` § Type-Safe Validation. The correct shape for the JSON-Schema-spec parser is `Converters.discriminatedObject('type', { array: ..., object: ..., ... })` where the `array` and `object` arms recurse to the outer dispatcher for nested schemas — but recursion through `self` was blocked by the per-arm `converter.convert(from)` call in `discriminatedObject` dropping `self`.

Erik called the omission a bug rather than a design tradeoff: every other Converter combinator (`arrayOf`, `objectOf`, `oneOf`, `optional`, …) threads `self` correctly per code inspection. The "extend the primitive, don't work around it" doctrine from `CODING_STANDARDS.md` said fix the primitive once rather than accumulating a lazy-thunk-closure workaround in every recursive parser. This stream is that fix.

## Gates (all passed before merge)

- `rush build` clean monorepo-wide.
- `rushx build` / `rushx lint` clean in `libraries/ts-utils`.
- `rushx fixlint` run before final commit.
- `rushx test` — 158 tests pass; `basicConverters.ts` / `baseConverter.ts` / `converter.ts` at 100% statements / branches / functions / lines.
- api-extractor report regenerated (`libraries/ts-utils/etc/ts-utils.api.md`).
- `minor` rush change file for `@fgv/ts-utils`.
- No `any`; no `Result<void>`; Result-pattern conformance preserved.
- `code-reviewer` agent gate (L32): run on final diff; no P1 findings; minor P2/P3 observations addressed (TSDoc on `selfOverride`; `isValidator` discriminator chosen over a parallel `selfOverride` on `Validator`).
- Copilot review loop (L33): driven on the open PR.

## Sequencing downstream

This fix unblocks the `json-schema-derives-t` revision. Once `release` merges into the `json-schema-derives-t` integration branch, the revision agent rewrites the json-schema-builder packlet against the corrected target — schema factories return Validators composing `Validators.*`, `jsonSchemaConverter` built via `Converters.discriminatedObject` with arms recursing through `self` directly (no lazy-thunk workaround), `toJson` collapses onto each schema-builder value, no procedural inspection of `JsonObject` anywhere.

## PRs

| Phase | PR | Status |
|---|---|---|
| Substrate prep + implementation + cluster-close | #442 | merged to `release` 2026-06-03 |
