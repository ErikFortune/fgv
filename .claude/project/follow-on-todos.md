# Follow-On TODOs

Substantial feature and gap items deferred from the pre-merge hygiene pass. These require design decisions or new functionality beyond simple refactoring.

## Editing Session

- **editingSession.ts:234** — Collection mutability hardcoded to `true`. Needs mutability design.
- **editingSession.ts:266,294** — Unreachable mutability guards. Deferred until mutability is implemented.
- **editingSession.ts:274,322** — `producedToSource` conversion missing. Need to implement produced-to-source entity mapping.
- **editingSession.ts:301** — Alternatives merge logic is a stub. Needs proper merge semantics.

## User Library

- **userLibrary.ts:299** — Confection session persistence not implemented. Need serialization/deserialization round-trip.
- **userLibrary.ts:464** — Proper type guards for persisted confections. Currently uses unsafe `as unknown as` casts.

## Library Runtime

- **confectionWrapper.ts:687,974,1174** — Ingredient-type filling slot branch has `c8 ignore`. Add a confection recipe with an ingredient-type filling option to test data and write tests to cover this path, then remove the exclusion.

## Workspace / Node Factory

- **nodeFactory.ts:206** — Dual-root and multi-root directory layout modes not implemented.
- **nodeFactory.ts:220** — `ignore-errors` startup mode not implemented.
- **workspaceInit.ts:162** — Architectural delegation: workspace is doing low-level directory/file creation that should be delegated to library and user-library modules.
