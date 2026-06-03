# Stream brief: `discriminated-object-self-fix`

**Status:** 🟢 ready to commission
**Workflow shape:** single implementation PR direct to `release` (small focused fix on established surface; no integration branch overhead)
**Package surface:** `@fgv/ts-utils` — `conversion/basicConverters.ts` (`discriminatedObject`) + supporting test surface. Possibly `conversion/baseConverter.ts` if a public `convert(from, context?, self?)` overload is needed; the agent decides.

---

## Mission

Fix `Converters.discriminatedObject` so the per-arm converter invocation threads `self` correctly. Today (`basicConverters.ts:911`) the body does `return converter.convert(from)` — dropping `self` and `context`. Every other `Converter` combinator in `baseConverter.ts` correctly threads `self` through to its body. `discriminatedObject` is the outlier; the omission breaks recursive discriminated-union parsers because arms can't reach the outer dispatcher for recursion.

**The forcing function**: `json-schema-derives-t` (PR #441) revision needs to express the JSON-Schema-spec parser as `Converters.discriminatedObject('type', { array: ..., object: ..., ... })` where the `array` and `object` arms recurse to the outer parser for nested schemas. With `self` not threaded, the arms have no way to reach the outer; the workaround would be a lazy-thunk closure (`let outerConverter; const recurse = (json) => outerConverter.convert(json); outerConverter = Converters.discriminatedObject(...)`) — a real idiom but a workaround. Fixing the primitive removes the workaround.

Erik's call (2026-06-03): "that's just a bug in the discriminatedObject. Let's just fix it (in a separate PR) instead of creating debt, carrying debt and then clearing debt."

---

## Locked design

### The fix

`Converters.discriminatedObject` body, currently:

```ts
return new BaseConverter((from: unknown) => {
  // ... validation ...
  return converter.convert(from);
});
```

After:

```ts
return new BaseConverter<T, TC>((from: unknown, self, context?: TC) => {
  // ... validation as before ...
  const arm = converters[discriminatorValue];
  // Pass the outer self through to the arm so recursive discriminated-union
  // parsers can reach the dispatcher via self.
  return arm.convert(from, context, self);
});
```

This requires the per-arm `Converter` / `Validator` to accept a `self` override on its `convert` / `validate` method. **Check the existing surface**: `BaseConverter.convert(from, context)` may not take a `self` parameter today. If so, add an optional third parameter:

```ts
public convert(from: unknown, context?: TC, selfOverride?: Converter<T, TC>): Result<T> {
  return this._converter(from, selfOverride ?? this, context);
}
```

Mirror on `Validator` (`validatorBase.ts`) if its public `validate` similarly drops `self`.

**Both changes are strictly additive at every call site**: existing call sites that don't pass `selfOverride` are unaffected (defaults to `this` as today). New call sites in `discriminatedObject` opt in.

### Test surface

Add a focused test in `basicConverters.test.ts` that demonstrates recursive parsing through `discriminatedObject`. Minimal shape — a tree:

```ts
interface ITreeNode {
  type: 'leaf' | 'branch';
  value?: number;       // on leaf
  left?: ITreeNode;     // on branch
  right?: ITreeNode;
}

// Build a recursive tree-parser with the now-self-aware discriminatedObject
let treeConverter: Converter<ITreeNode>;
treeConverter = Converters.discriminatedObject<ITreeNode>('type', {
  leaf: Converters.object<ITreeNode>({
    type: Converters.enumeratedValue(['leaf']),
    value: Converters.number
  }),
  branch: Converters.generic<ITreeNode>((from, self) =>
    // `self` here is the outer `treeConverter` passed by the fix
    /* parse { type:'branch', left, right } using self.convert(...) for children */
  )
});

// Verify nested input round-trips
expect(treeConverter.convert(nestedInput)).toSucceedWith(expected);
```

The test must exercise: (a) self is non-undefined inside the arm, (b) self is the outer `discriminatedObject` Converter (not the arm), (c) recursive `self.convert(...)` from inside an arm resolves nested inputs correctly.

### Documentation

Update `discriminatedObject`'s TSDoc to note that `self` is threaded to arms, enabling recursive parsers. Brief, one-sentence addition.

---

## Acceptance criteria

- [ ] `Converters.discriminatedObject` threads `self` and `context` to per-arm `convert` / `validate` invocations.
- [ ] `BaseConverter.convert` (and `ValidatorBase.validate` if needed) accepts an optional `selfOverride` parameter; default behavior unchanged.
- [ ] Recursive-discriminated-union test added; passes.
- [ ] Existing `discriminatedObject` test suite continues to pass; coverage stays at 100%.
- [ ] `rush build` passes monorepo-wide (additive — no caller breaks).
- [ ] `rushx lint` + `rushx fixlint` in `libraries/ts-utils`.
- [ ] `rushx test` passes monorepo-wide with full coverage.
- [ ] api-extractor report regenerated (`libraries/ts-utils/etc/ts-utils.api.md`).
- [ ] `minor` rush change file for `@fgv/ts-utils` (additive surface).
- [ ] No `any` types. No `Result<void>`.
- [ ] **`code-reviewer` agent run on the final diff** per L32; findings resolved / dispositioned in PR description.
- [ ] **Copilot review loop driven** per L33; stopped on diminishing returns or 10-round cap; status in PR description.

---

## Out of scope

- **`json-schema-derives-t` revision** — PR #441 revision waits for this stream to land, then resumes. Do NOT touch `libraries/ts-json-base/src/packlets/json-schema-builder/` or `.ai/tasks/active/json-schema-derives-t/` in this stream.
- **`discriminatedObject` API redesign** — this is a small fix to the existing signature, not a rethink. If a redesign is warranted (e.g. typed discriminator inference per arm), surface as separate scoping.
- **Other Converter combinators** — `arrayOf`, `objectOf`, etc. already thread `self` correctly (verified). Only `discriminatedObject` is the outlier; don't sweep others.
- **Lazy-thunk closure pattern documentation** — once this lands, the lazy-thunk pattern is no longer needed for `discriminatedObject` recursion. No doc update needed.

---

## Reading list (start here)

1. `libraries/ts-utils/src/packlets/conversion/basicConverters.ts:880-925` — current `discriminatedObject` implementation; lines 906–925 are the body to fix.
2. `libraries/ts-utils/src/packlets/conversion/baseConverter.ts:80-100` — `ConverterFunc<T, TC>` signature; confirms `self` is part of the contract.
3. `libraries/ts-utils/src/packlets/validation/validatorBase.ts` — symmetric Validator surface; check if `validate()` needs the same `selfOverride` overload.
4. `libraries/ts-utils/src/test/unit/conversion/basicConverters.test.ts` — existing `discriminatedObject` tests; add the recursive case alongside.
5. `.ai/instructions/CODING_STANDARDS.md` — Result pattern, lint gates, review-loop discipline (L32 + L33).
6. `.ai/instructions/ACTIVE_DEVELOPMENT.md` — `ts-utils` is established surface; additive-only; "extend the primitive, don't work around it" is the doctrine driving this stream.

## Reference for design context

- PR #441 (current `json-schema-derives-t` implementation) — the `_parseNode` switch is exactly the procedural inspection pattern this fix retires for the next stream's revision.
- 2026-06-03 conversation (Erik flagged the procedural matching in PR #441; this stream is the upstream primitive fix).

---

## PRs

| Phase | PR | Status |
|---|---|---|
| Substrate prep + implementation | (this PR) | open → release |
