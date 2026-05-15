# Future — fgv

Parking-lot ideas that aren't current work, aren't non-goals, but
need concrete demand or design before they can be scheduled. Items
here get promoted to `docs/WORKSTREAMS.md` when a real use case
surfaces.

---

## Entry format

```markdown
## Idea title

Description with the user's framing expanded with the design space.

**Why deferred**: why this isn't current work.

**Dependencies**: what would unblock it.

**Reference**: session / observation context.
```

---

## Generic editor UX for `@fgv/ts-prompt-assist`

The `ts-prompt-assist` library is shape-agnostic about the consumer's domain (open `surface`, `slot.kind`, `slot.source`; consumer-supplied scope hierarchy encoded into opaque `ScopeKey` strings). Editor UX for authoring prompt descriptors and scope-level binding records is **complex** — qualifier-conditioned candidate editing, slot-binding override visualization, resource-binding navigation, the `IPromptResolveTrace` "where did this value come from" view, validation against registered Converters / serializers / output validators.

The question: can the editor UX be made **generic** (shipped as `@fgv/ts-prompt-assist-ui` or similar, parameterized on consumer registries)? Or is the consumer's domain shape — closed surface enum, closed slot kinds, scope hierarchy — too inextricably tied to the UX for a generic version to be useful in practice?

Arguments for genericizing: complex UX; multiple consumers would benefit; the registries already abstract the closed-vocabulary parts.

Arguments against: every consumer's scope hierarchy is bespoke; editor screens that show "actor: user-42 → role:editor → tenant:acme → global" need consumer-specific labels and navigation; per-surface preview ("this is what the chat assistant will say") is surface-specific by definition.

**Why deferred**: only one consumer (`personaility`) so far; v0.1 hasn't shipped; the editor UX shape isn't designed yet on the consumer side either. Decide when the consumer ships its in-app editor and we can compare what's truly consumer-specific vs library-genericizable.

**Dependencies**: `ts-prompt-assist` v0.1 ships and stabilizes; consumer's in-app editor lands; second consumer surfaces (or doesn't). If a second consumer wants the same editor shape, that's strong evidence for genericizing.

**Reference**: `.ai/tasks/active/ts-prompt-assist/brief.md` (stream commission discussion).

---

## Samples app for `@fgv/ts-prompt-assist`

The `ts-prompt-assist` v0.1 stream ships only the library + test collateral. A samples app would demonstrate end-to-end usage: a small consumer with a scope hierarchy, a handful of YAML descriptors, scope-level bindings, qualifier axes, resource-binding fragments, output validation. Two shapes considered:

1. **Standalone samples app** (modeled on `ai-assist-image-generator`) — a small CLI or web app under `apps/` that exercises the library against a fixture FileTree.
2. **Folded into `ai-assist-image-generator`** — extend the existing image-generator surface to also exercise prompt-assist for the image-generation prompts themselves. Cross-pollinates the two libraries.

**Why deferred**: v0.1 hasn't shipped yet; consumer pressure-test is the primary validator. Samples app earns its keep once the library API has stabilized and we want a clean reference for new consumers to learn from.

**Dependencies**: `ts-prompt-assist` v0.1 shipped; consumer port settled enough that the API is unlikely to churn out from under the samples.

**Reference**: `.ai/tasks/active/ts-prompt-assist/brief.md` (stream commission discussion).

---

## `integrations/` top-level directory for Result-integration boundary packages

The `crypto-batch-2-webauthn` stream shipped two packages (`@fgv/ts-extras-webauthn`, `@fgv/ts-web-extras-webauthn`) whose entire mission is to wrap a well-maintained upstream library (`@simplewebauthn/*`) and adapt its throw-based API into the fgv `Result<T>` model. The package boundary is the whole product; no fgv-specific abstraction sits on top. This is structurally distinct from the libraries under `libraries/` that publish original utility primitives.

The question: does the pattern deserve its own top-level directory (e.g. `integrations/`), or is `libraries/` plus the naming convention `ts-extras-X` / `ts-web-extras-X` sufficient signal? Today the packages live in `libraries/` for consistency, but as the pattern recurs (likely candidates: future LLM provider wrappers, future credential-protocol wrappers) the structural distinction may earn its own home.

**Why deferred**: only one batch of packages so far (`-webauthn`); not enough recurrence to justify a directory rename. Decide when the second or third such package lands and the pattern is clearly distinct from "library that publishes original utilities."

**Dependencies**: at least one more Result-integration-boundary package landing; or a concrete consumer-side ergonomics complaint about discoverability of these packages.

**Reference**: `.ai/tasks/completed/2026-05/crypto-batch-2-webauthn/` (OQ-1 + followups section); cluster-close PR.
