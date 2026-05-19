# B-2 design notes — pre-implementation

Captured before implementation kickoff. Implementation will happen on a fresh branch.

## OQ-1 — surface shape: Candidate D (selected)

In addition to A/B/C from the brief, a fourth shape:

**Candidate D — sibling `typed*` exports.** Leave the existing `conditionDecl` /
`conditionSetDecl` / `resourceCollectionDecl` exports exactly as they are. Add
sibling `typedConditionDecl<T>(qualifierNameConverter)` /
`typedConditionSetDecl<T>(...)` / `typedResourceCollectionDecl<T>(...)` that
return parameterized Converters narrowed on `TQualifierNames`.

Internally the typed siblings call a single parameterized core; the existing
untyped exports become thin wrappers over that same core with the default
`string` parameter. Effectively Candidate C's parameterized core with
back-compat-preserving wrappers, exposed under new export names rather than
mutating the existing call-site shape.

### Comparison

- **vs A (context-field opt-in):** no threading a new context field through
  every internal cascade — the typed siblings pass `qualifierNameConverter`
  positionally into the shared core. The opt-in seam lives in the export
  name (discoverable in the API surface), not in a buried context field.
- **vs B (factory bundle):** no aggregate factory object. Each typed sibling
  is independently tree-shakeable and sits next to its untyped twin in the
  API report, which is more discoverable.
- **vs C (generic on existing exports):** non-breaking. Existing
  `conditionDecl.convert(x)` call sites stay valid — no required parens
  retouch across the cluster's consumer surface.

### Tradeoffs accepted

- Doubles the named exports at each cascade level (one `typedX` per `X`).
  Acceptable cost given the export names are the opt-in signal.
- Implementation must factor a shared parameterized core; the untyped
  exports and typed siblings both delegate to it. This is the same
  factoring Candidate C would require, minus the call-site breakage.

## OQ-2 — `QualifierCollector` surface change

Hypothesis from B-1's writeup: no change required. To be verified
empirically as step 1 of implementation (read `IReadOnlyQualifierCollector`
surface; confirm the typed Converter can layer a narrow check on top of the
existing `qualifiers.validating.get(decl.qualifierName)` call without
demanding new collector methods). If wrong, amend brief before continuing.

## OQ-3 — cast-pressure regression test home

Lean: ts-res, with a synthetic consumer setup. Proves the primitive works
regardless of B-3 port state and keeps the regression in the package that
owns the primitive. To be confirmed at implementation time.
