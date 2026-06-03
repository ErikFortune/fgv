# Stream state: `discriminated-object-self-fix`

**Status:** 🟢 implementation complete
**Last updated:** 2026-06-03 (implementation agent)

---

## Phase status

| Phase | Status | Notes |
|---|---|---|
| Implementation | 🟢 ready | Small focused fix on `Converters.discriminatedObject` + supporting overloads on `BaseConverter.convert` (and `ValidatorBase.validate` if symmetric). Single PR direct to `release`. |

---

## Decisions log

| Decision | Rationale |
|---|---|
| Fix the primitive instead of working around in `json-schema-derives-t` (Erik 2026-06-03) | "That's just a bug in the discriminatedObject. Let's just fix it (in a separate PR) instead of creating debt, carrying debt and then clearing debt." Lazy-thunk closure works as a workaround but accumulates a known-recurring-idiom debt. Fixing the primitive once removes the workaround everywhere. |
| Direct to release, no integration branch | Small focused change on established surface. Same posture as other small ts-utils fixes; integration branch adds overhead without value. |
| Additive overload on `BaseConverter.convert` (and `Validator.validate` if needed) | Lets `discriminatedObject` pass the outer `self` to arms without changing existing call-site behavior. Default `selfOverride ?? this` preserves current semantics for callers that don't opt in. |
| `json-schema-derives-t` (PR #441) revision waits for this | Out of scope for this stream. Once this lands on release, the integration branch `json-schema-derives-t` merges release, and the revision agent picks up the fixed primitive. |
| `code-reviewer` + agent-driven Copilot review loop required | Per L32 + L33; small-focused-diff is the canonical case. |
| `ValidatorBase.validate` did NOT need a `selfOverride` parameter (implementation finding) | `ValidatorBase.validate` already passes `self` correctly via the `GenericValidator._validator(from, context, this)` call pattern — the `self` is always the validator itself. `Validator.validate` is not called from `discriminatedObject` (only `.convert()` is). The `Validator.convert` method does not need `selfOverride` either: in `discriminatedObject`, when an arm is a `Validator`, we call `arm.convert(from, context)` without `self` (since validators are in-place and don't support the outer-converter recursion pattern). Converter arms — the recursive case — use `arm.convert(from, context, self)` via the new `BaseConverter.convert` overload. |
| `BaseConverter.convert` exact signature: `convert(from: unknown, context?: TC, selfOverride?: Converter<T, TC>): Result<T>` | Third parameter defaults to `undefined`; implementation uses `selfOverride ?? this` as the `self` passed to `_converter`. Strictly additive — existing two-parameter call sites are unaffected. |
| `Converter` interface `convert` updated to include `selfOverride?: Converter<T, TC>` | Required for TypeScript to allow three-argument calls to `arm.convert(from, context, self)` when `arm` is typed as `Converter<T, TC>`. Since the third parameter is optional, all existing call sites remain valid. |
| `discriminatedObject` body: discriminate between Converter and Validator arms | `isValidator(arm)` check at call site: validators get `arm.convert(from, context)` (no self); converters get `arm.convert(from, context, self)`. This is type-safe and avoids needing to change the `Validator.convert` interface. The recursive-via-self pattern is a converter-arm pattern; validator arms have no need to recurse through the outer dispatcher. |

---

## Origin

PR #441 review (2026-06-03) surfaced the procedural `_parseNode` switch inside `fromJson` as exactly the manual-type-check anti-pattern fgv forbids. Discussion converged on building `fromJson` via `Converters.discriminatedObject` instead — but recursion into nested schemas needs the per-arm body to reach the outer dispatcher. Inspection of `discriminatedObject`'s implementation showed it drops `self` (and `context`) at the per-arm dispatch (`return converter.convert(from)`). Every other Converter combinator threads `self` correctly. Erik called the omission a bug and asked for a focused fix here so the json-schema-derives-t revision builds on the corrected primitive.

---

## History

| Date | Event | Notes |
|---|---|---|
| 2026-06-03 | Stream commissioned + substrate prepped | brief.md + state.md; implementation agent to follow. |
| 2026-06-03 | Implementation complete | Three-part fix: `Converter` interface + `BaseConverter.convert` gain optional `selfOverride`; `discriminatedObject` body rewritten to thread `self` and `context` to per-arm calls; validator/converter arms discriminated at call site. Recursive-tree test added; all existing tests pass; `basicConverters.ts` + `baseConverter.ts` + `converter.ts` at 100% coverage. `minor` change file created. PR pending. |

---

## PRs

| Phase | PR | Status |
|---|---|---|
| Substrate prep + implementation | (this PR) | open → release |
