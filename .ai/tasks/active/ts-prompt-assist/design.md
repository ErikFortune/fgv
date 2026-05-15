# `@fgv/ts-prompt-assist` v0.1 — Locked Design

**Stream:** ts-prompt-assist
**Phase:** A — design lock
**Status:** binding for phase B
**Last updated:** 2026-05-15

This document is the binding design for `@fgv/ts-prompt-assist` v0.1. Phase B
implements against this surface without re-litigating decisions. Where this
design adjusts the proposed shapes from `design-brief.md`, rationale is
inline. Where this design transcribes binding conceptual rules from
`brief.md`, those rules pass through unchanged.

---

## 1. What is binding (transcribed from brief.md §"What is binding")

These rules are non-negotiable for v0.1. Re-litigating any of these is a
policy decision routed to the orchestrator, not a design decision.

1. **Lookup-then-compose.** ts-res handles qualifier-conditioned candidate
   selection; Mustache handles substitution; everything downstream of the
   substituted body is the consumer's concern.
2. **Scope-chain walking with bindings.** Caller supplies a chain
   (most-specific first). Bindings merge across the chain, most-specific
   wins, with per-binding `enforced` lock and per-slot `writableBy` tier.
   Caller substitutions override merged bindings except for `enforced`.
3. **Open qualifier metadata.** Descriptors declare `required` / `expected`
   / `disallowed` axes but never close the value set per axis. ts-res
   fallback semantics remain the substrate.
4. **Resource bindings as first-class.** A slot binding can reference
   another resource; library resolves recursively with cycle detection and
   a depth cap.
5. **Output validation library-side.** For `kind: 'json'`: strip fences →
   `JSON.parse` → registered Converter → registered output validators.
   Library, not consumer.
6. **Storage-agnostic via `IPromptStore`.** `FileTreePromptStore` is the
   canonical v0.1 adapter (via `@fgv/ts-json-base` FileTree, per the
   `filetree-io` skill); `InMemoryPromptStore` for tests. SQL/Mongo
   adapters drop in later.
7. **Standalone package above `ts-res`.** Ships as `libraries/ts-prompt-
   assist/`, depending on `@fgv/ts-res` and transitively `ts-utils`,
   `ts-extras` (Mustache), `ts-json-base` (FileTree).
8. **Triple-brace Mustache canonical.** `{{{name}}}` in bodies; loader
   rejects `{{name}}` and `{{&name}}` tokens with a clear error citing the
   prompt id. Rendering uses an extended `@fgv/ts-extras` `MustacheTemplate`
   primitive (see §6 and §11).
9. **Consumer-shape-agnostic.** `ScopeKey` is opaque; `surface`,
   `slot.kind`, `slot.source` are open strings narrowed by consumer-
   supplied descriptor Converter at load time; closed-vocabulary
   registrations live in registries the consumer populates at boot.
10. **First consumer is an agent chat application.** The library is shape-
    agnostic; acceptance criteria are informed by "is this surface enough
    to express the consumer's listed needs without forking or pre-
    massaging data."

---

## 2. Resolved open questions

Each decision is final for the stream. Phase B does not re-open these.

### OQ-1 — Scope encoding flexibility: **flat default, function-override escape hatch**

**Decision.** Ship the proposed `scopeEncoding` / `scopeDecoding` function
options on `FileTreePromptStore.create`. **Default** treats `ScopeKey` as
already a path-safe string (single directory segment per scope). Document
the path-safety contract: the default rejects encodings containing `/`,
`\`, `\0`, leading `.`, characters outside the POSIX portable filename
set, or any segment matching reserved Windows device names
(`CON`, `PRN`, `AUX`, `NUL`, `COM1`–`COM9`, `LPT1`–`LPT9`, case-insensitive).
Violations fail loudly at store-`create` time when scanning the root, with
the offending encoding cited in the error.

Consumers needing hierarchical-directory layouts (e.g.
`tenant/acme/role/editor/`) supply their own `scopeEncoding` (returning a
string containing `/`) and matching `scopeDecoding`. The default contract
documents that the encoder's output is consumed directly as a FileTree
sub-path; consumers using nested encodings own validation of each segment.

**Rationale.** The brief identifies the first consumer's scope strings as
simple (`'global'`, `'tenant:acme'`). Forcing a richer abstraction now
adds API surface that no v0.1 consumer needs. The function pair gives a
clean escape hatch when nested encoding is later wanted. Tightening the
default contract (rejected character set) is cheaper than relaxing it
later — failing fast at load time is what "loud" should mean.

**Note on `ScopeKey.colon`.** The illustrative `'tenant:acme'` encoding in
the brief uses `:`, which is path-safe on POSIX but not Windows
(reserved). The default contract therefore also **rejects `:`** in
encoded scope segments. Consumers wanting colon-style encoding either
replace with a different separator (e.g. `'tenant.acme'` or `'tenant--
acme'`) or supply a `scopeEncoding` that escapes the colon.

### OQ-2 — Resource-binding substitution merge semantics: **strict (replace)**

**Decision.** When `IResourceSlotBinding.substitutions` is supplied, those
substitutions **entirely replace** the parent's substitutions for the
inner resolve. When `substitutions` is omitted, the parent's
substitutions flow in unchanged.

**Rationale.** The brief authorizes strict as the recommended default
("relaxing later is additive; tightening later is breaking"). The clean
mental model is: a shared fragment with explicit `substitutions` declares
"call me with exactly these inputs" — the fragment's correctness can be
reasoned about against the supplied set, not against an unknown caller
context. Layered semantics couple fragment authoring to parent context,
which defeats the "shared fragment" use case. If a real v0.2 case
emerges where most-of-parent-plus-overrides is what's wanted, adding a
discriminator (e.g. `substitutionMode?: 'replace' | 'layer'`) is
additive.

**Trace surfacing.** Each `resourceBindingResolutions[]` trace entry
records the substitution mode it used (`'replace' | 'inherit'`), so
editor surfaces can show "this inner resolve saw a fresh substitution
set" vs "this inner resolve inherited the parent's substitutions."

### OQ-3 — `watch()` semantics: **interface includes; FileTreePromptStore stubs; InMemory implements; event shape pinned**

**Decision.**

- `IPromptStore.watch?` is on the interface as an **optional** method.
- `FileTreePromptStore` v0.1 does **not** implement `watch` (the property
  is `undefined`). Documented as "supplied by a future stream"; consumers
  that need hot-reload either use `InMemoryPromptStore` (during dev) or
  supply their own adapter.
- `InMemoryPromptStore` **implements** `watch` and tests exercise it.
  This forces the event shape to be exercised by real code at v0.1, even
  though the canonical adapter doesn't fire events.
- The event shape is pinned now (see §5 type spec).

**Rationale.** Omitting `watch` from the interface entirely means adding
it later is a breaking change to the interface (every adapter must adopt
it). Optional-on-interface + pinned event shape costs nothing now and
prevents that churn. Forcing `InMemoryPromptStore` to implement it
exercises the event shape under tests so we surface design gaps now, not
at the first hot-reload consumer.

### OQ-4 — Registries: **unified `IPromptRegistry` with namespaced sub-registries**

**Decision.** Replace the three separate registries
(`IPromptShapeRegistry`, `ISlotKindRegistry`, `IPromptOutputValidationRegistry`)
on the create-params with **one unified `IPromptRegistry`** exposing
namespaced sub-registries:

```ts
export interface IPromptRegistry {
  readonly converters: IPromptConverterRegistry;        // output Converters by ConverterId
  readonly qualifierEnums: IPromptQualifierEnumRegistry; // closed qualifier value sets by AxisName
  readonly slotKinds: IPromptSlotKindRegistry;          // slot-kind serializers by string kind
  readonly outputValidations: IPromptOutputValidationRegistry;
}
```

Each sub-registry is still its own typed interface (no `any`-typed
omnibus map). `PromptLibrary.create` takes a single `registry?:
IPromptRegistry` param instead of three.

**Rationale.**

- The three sub-concerns are genuinely distinct (output Converters,
  qualifier enums, slot-kind serializers, output validators), so a flat
  bag would collide ids across concerns. Keeping them typed sub-
  registries preserves type safety.
- But the create-params noise of three separate registry params is real,
  especially when the consumer registers a handful of things across all
  four namespaces at boot. One `registry` param + sub-registry property
  access reads cleanly and lets the consumer pre-build a configured
  registry once and pass it around.
- The "qualifier enums" namespace was implicit in the original
  `IPromptShapeRegistry` (Converters + enums together). Splitting it
  cleanly is part of this decision — Converters and qualifier-value-set
  enums are different concerns (one transforms output, the other
  constrains qualifier values).
- A library-supplied `PromptRegistry.create()` factory produces an
  empty unified registry that consumers populate at boot.

**Trade-off acknowledged.** This is the largest divergence from the
proposed shape. The conceptual model is unchanged; only the API
ergonomics shift.

### OQ-5 — Output-contract growth path: **drop the generic; keep minimal `'free-text'`; single `converterId` for `'json'`; `outputValidations` stays on the descriptor**

**Decision.**

```ts
export type FreeTextOutputKind  = 'free-text';
export type JsonOutputKind      = 'json';
export type OutputContractKind  = FreeTextOutputKind | JsonOutputKind;

export interface ITextOutputContract {
  readonly kind: FreeTextOutputKind;
}

export interface IJsonOutputContract {
  readonly kind: JsonOutputKind;
  readonly converterId: ConverterId;
}

export type PromptOutputContract = ITextOutputContract | IJsonOutputContract;
```

- **Drop the generic parameter on `IJsonOutputContract`.** It does not
  carry weight at v0.1 (single `kind: 'json'`). When a second JSON
  variant arrives (`'json-array'` / `'json-stream'`), it ships as a new
  member of the `PromptOutputContract` union with its own interface
  (e.g. `IJsonArrayOutputContract { kind: 'json-array'; ... }`).
  Discriminated-union extension is additive and idiomatic; the generic
  was solving a problem that didn't exist.
- **Keep `'free-text'` minimal.** Just the `kind` discriminator at v0.1.
  Character-count assertions, language-tag declarations, trailing-
  newline contracts all belong in a follow-up if a consumer asks; none
  are blocking the pressure-test port.
- **`outputValidations` stays on the descriptor**, not inline on the
  `IJsonOutputContract`. Rationale: a `'free-text'` output can also
  legitimately carry post-render validators in the future (e.g.
  "string-length within bounds", "matches at least one of these
  regexes"). Hanging validators off the descriptor (cross-kind) instead
  of off the JSON contract keeps that growth path open. Phase A
  pinned: `readonly outputValidations?: ReadonlyArray<string>` on
  `IPromptDescriptor`.

**Rationale.** v0.1 ships the simplest shape that's forward-compatible.
Discriminated-union members are cheap to add; generics that don't
distinguish anything at v0.1 are cognitive overhead.

### OQ-6 — Mustache canonical form: **extend `MustacheTemplate.create` with `escape?` option (shape a)**

**Decision.** Extend `@fgv/ts-extras`'s `MustacheTemplate` with an
**additive** option on `MustacheTemplate.create`:

```ts
export type MustacheEscapeStrategy = 'html' | 'none' | ((value: string) => string);

export interface IMustacheTemplateOptions {
  readonly tags?: readonly [string, string];
  readonly includeComments?: boolean;
  readonly includePartials?: boolean;
  /** Escape strategy applied to double-brace `{{name}}` tokens at
   *  render time. Default: `'html'` (mustache.js default, back-compat).
   *  - `'html'`: standard mustache.js HTML escape.
   *  - `'none'`: verbatim passthrough. Suitable for LLM-prompt and
   *    other non-HTML targets where `& → &amp;` is wrong.
   *  - `(value) => string`: custom escape function.
   *  Note: triple-brace `{{{name}}}` tokens are always unescaped
   *  regardless of this option (standard mustache.js semantics). */
  readonly escape?: MustacheEscapeStrategy;
}
```

**Implementation note for phase B (ts-extras side).** mustache.js's
escape configuration is implemented two ways: (i) the global
`Mustache.escape` function (mutable; unsuitable for per-template
scoping), or (ii) a `Mustache.Writer` instance with an overridden
`escapedValue` method (per-instance, no global state mutation). v0.1
**must use the Writer-instance approach** — each `MustacheTemplate`
holds its own `Writer` configured with its escape strategy and renders
through `writer.render(template, context)` instead of
`Mustache.render(...)`. No global state mutation; concurrent renders
with different escape strategies are safe.

**Default preserves existing behavior.** Existing callers of
`MustacheTemplate.create(template)` without options continue to get HTML
escape (mustache.js default). `ts-prompt-assist` passes
`{ escape: 'none' }`.

**Double-brace rejection lives in `ts-prompt-assist`, not `ts-extras`.**
The "reject `{{name}}` and `{{&name}}` tokens" policy is a
ts-prompt-assist concern (LLM-prompt author discipline), not a Mustache-
primitive concern. Other consumers of the extended `MustacheTemplate`
(with `escape: 'none'`) may legitimately want double-brace tokens (they
render unescaped because of the escape strategy). `ts-prompt-assist`'s
descriptor Converter performs the rejection by inspecting
`template.extractVariables()` and failing on any token whose
`tokenType === 'name'` (escaped form) or `tokenType === '&'`. See §6.

**Why shape (a), not (b) or (c).**

- Shape (b) (strict-passthrough mode flag that *also* rejects double-
  brace at parse time) couples the escape policy with author-discipline
  enforcement. Author discipline is ts-prompt-assist's concern, not
  ts-extras's — other future consumers may want `escape: 'none'`
  without the discipline lock.
- Shape (c) (sibling `PassthroughMustacheTemplate` class) adds type
  surface for no semantic gain — the only difference between the two
  classes would be a hard-coded escape strategy.
- Shape (a) keeps the canonical primitive single, makes the escape
  policy first-class on the type surface, and gives all future "render
  Mustache for not-HTML" consumers the same primitive.

**Cluster-scope ts-extras change is strictly additive.** No removed,
renamed, or behavior-changed exports. `MustacheTemplate.create()` with
no options still returns the existing behavior. The change fits the
"additive change on established surface" pattern (per
`ACTIVE_DEVELOPMENT.md` / `CODING_STANDARDS.md` §"Extending Core
Libraries Over Working Around Them"). See §11 below for the cluster-
scope summary.

---

## 3. Final type system

This section locks the exported type surface for v0.1. Phase B writes
the Converters/Validators that produce these values from YAML.

### 3.1 Branded scalars

```ts
import { Brand } from '@fgv/ts-utils';

export type PromptId      = Brand<string, 'PromptId'>;
export type SlotName      = Brand<string, 'SlotName'>;
export type ResourceId    = Brand<string, 'ResourceId'>;
export type ConverterId   = Brand<string, 'ConverterId'>;
export type SerializerId  = Brand<string, 'SerializerId'>;
export type ValidatorId   = Brand<string, 'ValidatorId'>;    // NEW: was open string
export type AxisName      = Brand<string, 'AxisName'>;
export type ScopeKey      = Brand<string, 'ScopeKey'>;
```

`ValidatorId` is new vs the brief — the brief used an open `string` for
output-validation ids. Branding aligns it with the rest of the id
surface, catches typos at the call site, and matches `ConverterId` /
`SerializerId` conventions. Each branded scalar ships a Converter
(`Convert.promptId`, etc.) per repo convention.

### 3.2 String-union types (closed within the library)

```ts
export type PromptCompositionMode = 'single-best' | 'concat-fragments';
export type SlotBindingKind       = 'literal' | 'resource';
export type SlotDirective         = 'constraint' | 'hint' | 'prose';
export type SlotWritability       = 'any-scope' | 'schema-only' | 'system-only';
export type OutputContractKind    = 'free-text' | 'json';
export type ResourceSubstitutionMode = 'replace' | 'inherit'; // trace-only, OQ-2
```

Each ships `allFooValues` + a Converter (e.g.
`Convert.promptCompositionMode`) per repo convention. Phase B writes
the Converters; this design locks the value sets.

### 3.3 Open string fields (consumer-narrowed)

These remain `string` at the library boundary; consumer narrows via the
descriptor Converter at load time:

- `IPromptDescriptor.surface`
- `IPromptSlot.kind`
- `IPromptSlot.source`

### 3.4 Output contract (per OQ-5)

```ts
export interface ITextOutputContract {
  readonly kind: 'free-text';
}

export interface IJsonOutputContract {
  readonly kind: 'json';
  readonly converterId: ConverterId;
}

export type PromptOutputContract = ITextOutputContract | IJsonOutputContract;
```

### 3.5 Qualifier metadata

```ts
export interface IExpectedQualifierAxis {
  readonly name: AxisName;
  readonly description?: string;
  readonly suggestedValues?: ReadonlyArray<string>;
}

export interface IPromptQualifierMetadata {
  readonly required?: ReadonlyArray<AxisName>;
  readonly expected?: ReadonlyArray<IExpectedQualifierAxis>;
  readonly disallowed?: ReadonlyArray<AxisName>;
}

export type IQualifierContext = Readonly<Record<string, string>>;
```

### 3.6 Slot bindings (discriminated union)

```ts
export interface ILiteralSlotBinding {
  readonly kind: 'literal';
  readonly value: string;
  readonly directive: SlotDirective;
  readonly enforced?: boolean;
}

export interface IResourceSlotBinding {
  readonly kind: 'resource';
  readonly resourceId: ResourceId;
  readonly qualifiers?: IQualifierContext;
  readonly scopeOverride?: ReadonlyArray<ScopeKey>;
  /** When supplied, replaces (does NOT layer over) the parent's
   *  substitution map for the inner resolve. See OQ-2. */
  readonly substitutions?: PromptSubstitutions;
  readonly directive: SlotDirective;
  readonly enforced?: boolean;
}

export type SlotBinding = ILiteralSlotBinding | IResourceSlotBinding;

/** Caller-supplied substitutions. A bare string is sugar for
 *  `{ kind: 'literal', value, directive: 'prose' }`. */
export type PromptSubstitutions = Readonly<Record<string, string | SlotBinding>>;
```

### 3.7 Slot

```ts
export interface IPromptSlot {
  readonly name: SlotName;
  readonly description: string;
  readonly required?: boolean;           // default true
  readonly defaultBinding?: SlotBinding;
  readonly kind?: string;                // default 'string'
  readonly serializerId?: SerializerId;
  readonly allowedDirectives?: ReadonlyArray<SlotDirective>; // default any
  readonly writableBy?: SlotWritability; // default 'any-scope'
  readonly maxLength?: number;
  readonly source?: string;
}
```

### 3.8 Examples

```ts
export interface IPromptExamplePair {
  readonly input: unknown;
  readonly output: unknown;
}

export interface IPromptExampleSet {
  readonly conditions: Readonly<Record<string, string>>;
  readonly pairs: ReadonlyArray<IPromptExamplePair>;
}
```

### 3.9 Descriptor

```ts
export interface IPromptDescriptor {
  readonly id: PromptId;
  readonly title: string;
  readonly description?: string;
  readonly schemaVersion: '1';
  readonly surface: string;                       // open; consumer-narrowed
  readonly qualifiers?: IPromptQualifierMetadata;
  readonly slots: ReadonlyArray<IPromptSlot>;
  readonly compositionMode: PromptCompositionMode;
  readonly output: PromptOutputContract;
  readonly safeguards?: IPromptSafeguardOverrides;
  readonly examples?: ReadonlyArray<IPromptExampleSet>;
  readonly outputValidations?: ReadonlyArray<ValidatorId>;
}
```

### 3.10 Scope-level binding record

```ts
export interface IScopeSlotBindingsRecord {
  readonly scope: ScopeKey;
  readonly bindings: ReadonlyMap<SlotName, SlotBinding>;
}
```

### 3.11 Qualifier axis registration

```ts
export type QualifierAxisType = 'string' | 'enum' | 'numeric';

export interface IQualifierAxisRegistration {
  readonly name: AxisName;
  readonly priority: number;
  readonly type: QualifierAxisType;
  readonly description?: string;
  /** For `type: 'enum'`: inline closed values, OR a reference to a
   *  shape-registry enum id (the registry resolves at boot). Exactly
   *  one of `values` or `enumRef` is required for `type: 'enum'`. */
  readonly values?: ReadonlyArray<string>;
  readonly enumRef?: AxisName;
}
```

(`QualifierAxisType` is a closed value set; ships `allQualifierAxisTypeValues`
+ Converter.)

### 3.12 Stored record (returned by the store)

```ts
export interface IPromptCandidateRecord {
  readonly conditions: Readonly<Record<string, string>>;
  readonly body: string;
}

export interface IStoredPromptRecord {
  readonly scope: ScopeKey;
  readonly id: PromptId;
  readonly descriptor: IPromptDescriptor;
  readonly candidates: ReadonlyArray<IPromptCandidateRecord>;
}
```

---

## 4. Final library API

### 4.1 `PromptLibrary` (the main entry point)

```ts
export interface IPromptLibraryCreateParams {
  readonly store: IPromptStore;
  /** Unified registry (per OQ-4). When omitted, the library uses
   *  `PromptRegistry.empty()` — fine for tests that don't exercise
   *  output validation, custom slot kinds, or qualifier enums. */
  readonly registry?: IPromptRegistry;
  readonly safetyPolicy?: IPromptSafetyPolicy;
  readonly logger?: Logging.ILogger;
  /** Default 5. Resource bindings exceeding this depth fail loudly. */
  readonly resourceBindingDepthLimit?: number;
  /** Default 256. LRU cap on parsed Mustache templates. */
  readonly templateCacheSize?: number;
}

export class PromptLibrary {
  public static create(params: IPromptLibraryCreateParams): Promise<Result<PromptLibrary>>;

  public describe(id: PromptId): Result<IPromptDescriptor>;

  public resolve(req: IPromptResolveRequest): Promise<Result<IResolvedPrompt>>;

  public resolveAndValidateOutput<T>(
    req: IPromptResolveRequest,
    rawOutput: string
  ): Promise<Result<T>>;
}

export interface IPromptResolveRequest {
  readonly id: PromptId;
  /** Most-specific to most-general. */
  readonly chain: ReadonlyArray<ScopeKey>;
  readonly qualifiers: IQualifierContext;
  readonly substitutions?: PromptSubstitutions;
}

export interface IResolvedPrompt {
  readonly id: PromptId;
  readonly body: string;
  readonly descriptor: IPromptDescriptor;
  readonly trace: IPromptResolveTrace;
}
```

### 4.2 Trace

```ts
export interface IBindingTraceEntry {
  readonly source: 'caller-sub' | 'binding' | 'default' | 'empty';
  readonly winningScope?: ScopeKey; // when source === 'binding'
  readonly directive: SlotDirective;
  readonly value: string;            // post-serialization, pre-Mustache
  /** True iff the merged binding had `enforced: true` (caller subs were
   *  rejected). False otherwise. */
  readonly wasEnforced: boolean;
}

export interface IResourceBindingTraceEntry {
  readonly slot: SlotName;
  readonly resourceId: ResourceId;
  readonly depth: number;
  readonly substitutionMode: ResourceSubstitutionMode; // 'replace' | 'inherit'
  /** Recursive trace for the inner resolve. */
  readonly innerTrace: IPromptResolveTrace;
}

export interface IPromptResolveTrace {
  readonly winningScope: ScopeKey;
  readonly scopesConsulted: ReadonlyArray<ScopeKey>;
  readonly mergedBindings: ReadonlyMap<SlotName, IBindingTraceEntry>;
  readonly resourceBindingResolutions: ReadonlyArray<IResourceBindingTraceEntry>;
  /** Slot values rejected by safeguards (length cap, regex screen). */
  readonly safeguardFindings: ReadonlyArray<ISafeguardFinding>;
}

export interface ISafeguardFinding {
  readonly slot: SlotName;
  readonly kind: 'max-length' | 'suspicious-pattern' | 'screening-skipped';
  readonly disposition: 'warn' | 'reject' | 'info';
  readonly detail: string;
}
```

**Adjustments vs the brief.** Added `wasEnforced` to
`IBindingTraceEntry`, full `innerTrace` on resource-binding entries
(editor surfaces will want to drill in), and a `safeguardFindings`
array so the editor can show "this value was truncated / rejected /
flagged" without re-running screening.

### 4.3 Registry shapes (per OQ-4)

```ts
export interface IPromptRegistry {
  readonly converters: IPromptConverterRegistry;
  readonly qualifierEnums: IPromptQualifierEnumRegistry;
  readonly slotKinds: IPromptSlotKindRegistry;
  readonly outputValidations: IPromptOutputValidationRegistry;
}

export interface IPromptConverterRegistry {
  register<T>(id: ConverterId, converter: Converter<T, unknown>): Result<ConverterId>;
  get<T>(id: ConverterId): Result<Converter<T, unknown>>;
  has(id: ConverterId): boolean;
}

export interface IPromptQualifierEnumRegistry {
  register(name: AxisName, values: ReadonlyArray<string>): Result<AxisName>;
  get(name: AxisName): Result<ReadonlyArray<string>>;
  has(name: AxisName): boolean;
}

export interface IPromptSlotKindRegistry {
  register(kind: string, serializer: ISlotSerializer): Result<string>;
  get(kind: string): Result<ISlotSerializer>;
  has(kind: string): boolean;
}

export interface ISlotSerializer {
  serialize(value: unknown): Result<string>;
}

export interface IPromptOutputValidationRegistry {
  register(id: ValidatorId, validator: IPromptOutputValidator): Result<ValidatorId>;
  get(id: ValidatorId): Result<IPromptOutputValidator>;
  has(id: ValidatorId): boolean;
}

export interface IPromptOutputValidator {
  validate(output: unknown, context: IOutputValidationContext): Result<unknown>;
}

export interface IOutputValidationContext {
  readonly promptId: PromptId;
  readonly substitutions: ReadonlyMap<SlotName, IBindingTraceEntry>;
}

export class PromptRegistry implements IPromptRegistry {
  public static create(): Result<PromptRegistry>;
  public static empty(): PromptRegistry; // infallible, for tests
  // ...
}
```

**Adjustment vs the brief.** Each `register` returns the registered id
(not `Result<void>` — the brief's signature was `Result<void>`, which
the repo's coding standards call an anti-pattern). `get` returns
`Result<T>` (failure on miss), not `Result<T | undefined>` — the brief
mixed the two; `Result<T> + has()` is the cleaner pair.

`IPromptOutputValidator.validate` returns `Result<unknown>` instead of
`Result<void>` (anti-pattern); validators may return a normalized form
of the output (e.g. coerced types) that the next validator in the
chain sees.

### 4.4 Safety types

```ts
export type SuspiciousDisposition = 'warn' | 'reject';

export interface IPromptSafetyPolicy {
  readonly defaultMaxLength: number;
  readonly suspiciousPatterns: ReadonlyArray<RegExp>;
  /** Slot-source values eligible for regex screening. */
  readonly screenedSources: ReadonlyArray<string>;
  readonly onSuspicious: SuspiciousDisposition;
  /** Optional pre-render seam: consumer-supplied text injected before
   *  the resolved body. Library does NOT ship default content. Called
   *  with the descriptor; consumer returns the per-surface framing. */
  readonly antiJailbreakPreface?: (descriptor: IPromptDescriptor) => Result<string>;
}

export interface IPromptSafeguardOverrides {
  readonly defaultMaxLength?: number;
  readonly skipInjectionScreening?: boolean;
}
```

### 4.5 `IPromptStoreEvent` (pinned per OQ-3)

```ts
export type PromptStoreEventKind =
  | 'descriptor-changed'
  | 'descriptor-removed'
  | 'bindings-changed'
  | 'qualifier-axes-changed';

export interface IPromptStoreEvent {
  readonly kind: PromptStoreEventKind;
  readonly scope: ScopeKey;
  /** Set for descriptor-changed / descriptor-removed; undefined for
   *  bindings-changed / qualifier-axes-changed (those events are
   *  scope-scoped, not id-scoped). */
  readonly id?: PromptId;
}

export interface IDisposable {
  dispose(): void;
}
```

Ships `allPromptStoreEventKindValues` + Converter.

### 4.6 `IPromptStore` (locked)

```ts
export interface IPromptStoreListFilter {
  readonly id?: PromptId;
  readonly scope?: ScopeKey;
}

export interface IPromptStore {
  get(scope: ScopeKey, id: PromptId): Promise<Result<IStoredPromptRecord | undefined>>;
  list(filter?: IPromptStoreListFilter): Promise<Result<ReadonlyArray<IStoredPromptRecord>>>;
  getBindings(scope: ScopeKey): Promise<Result<IScopeSlotBindingsRecord | undefined>>;
  getQualifierAxes(scope: ScopeKey): Promise<Result<ReadonlyArray<IQualifierAxisRegistration>>>;

  // Optional write surface
  put?(record: IStoredPromptRecord): Promise<Result<IStoredPromptRecord>>;
  putBindings?(record: IScopeSlotBindingsRecord): Promise<Result<IScopeSlotBindingsRecord>>;
  delete?(scope: ScopeKey, id: PromptId): Promise<Result<PromptId>>;

  // Optional change-notification surface (per OQ-3)
  watch?(handler: (event: IPromptStoreEvent) => void): IDisposable;
}
```

**Adjustments vs the brief.** Write methods return the written/deleted
value (no `Result<void>`); the brief had `Result<void>` which is an
anti-pattern. `get` returning `Result<T | undefined>` is preserved
because "no record at this scope" is a normal chain-walk outcome, not a
failure.

---

## 5. Storage adapter shapes

### 5.1 `FileTreePromptStore`

```ts
import type { IFileTreeItem } from '@fgv/ts-json-base/file-tree';

export interface IFileTreePromptStoreCreateParams {
  /** Root directory under which scope-encoded sub-trees live. */
  readonly root: IFileTreeItem;
  /** Default: identity (treat ScopeKey as path-safe; see OQ-1 contract). */
  readonly scopeEncoding?: (scope: ScopeKey) => string;
  /** Default: identity, validated against the path-safety contract. */
  readonly scopeDecoding?: (encoded: string) => Result<ScopeKey>;
  readonly logger?: Logging.ILogger;
}

export class FileTreePromptStore implements IPromptStore {
  public static create(
    params: IFileTreePromptStoreCreateParams
  ): Promise<Result<FileTreePromptStore>>;
  // get / list / getBindings / getQualifierAxes implemented
  // put / putBindings / delete / watch: NOT implemented in v0.1
}
```

**Implementation rule (binding).** All file reads/writes go through
`FileTree` (per the `/filetree-io` skill). Never `node:fs` directly.
The descriptor / bindings / axes are YAML; v0.1 uses `js-yaml` (already
a transitive dep via `@fgv/ts-json-base`'s YAML support — phase B
verifies and surfaces if not). YAML choice surfaces here because the
brief doesn't pre-pick one; if `@fgv/ts-json-base` doesn't already
provide a YAML loader, phase B surfaces to the orchestrator before
adding a new dep.

**YAML schema (locked).** See §5.3.

### 5.2 `InMemoryPromptStore`

```ts
export interface IInMemoryPromptStoreSeed {
  readonly records?: ReadonlyArray<IStoredPromptRecord>;
  readonly bindings?: ReadonlyArray<IScopeSlotBindingsRecord>;
  readonly axes?: ReadonlyArray<{ readonly scope: ScopeKey; readonly axes: ReadonlyArray<IQualifierAxisRegistration> }>;
}

export class InMemoryPromptStore implements IPromptStore {
  public static create(seed?: IInMemoryPromptStoreSeed): Result<InMemoryPromptStore>;
  // Implements ALL methods including watch (per OQ-3).
}
```

### 5.3 YAML descriptor schema (locked for v0.1)

One file per `(scope, prompt-id)`. Descriptor + candidates co-located so
the record round-trips through any backend without external metadata.

```yaml
# <root>/<scope-encoding>/<prompt-id>.yaml
schemaVersion: '1'
id: <prompt-id>
title: <string>
description: <string>          # optional
surface: <string>              # consumer-narrowed
compositionMode: single-best | concat-fragments
qualifiers:                    # optional, IPromptQualifierMetadata shape
  required: [<axis>, ...]
  expected:
    - name: <axis>
      description: <string>
      suggestedValues: [<string>, ...]
  disallowed: [<axis>, ...]
slots:                         # required
  - name: <slot-name>
    description: <string>
    required: true | false     # optional, default true
    kind: <string>             # optional, default 'string'
    serializerId: <id>         # required iff kind != 'string'
    allowedDirectives: [constraint, hint, prose]  # optional
    writableBy: any-scope | schema-only | system-only # optional, default any-scope
    maxLength: <number>        # optional
    source: <string>           # optional
    defaultBinding:            # optional, SlotBinding shape
      kind: literal | resource
      ...
output:                        # required
  kind: free-text | json
  converterId: <id>            # required iff kind: json
safeguards:                    # optional
  defaultMaxLength: <number>
  skipInjectionScreening: <bool>
examples:                      # optional
  - conditions: {...}
    pairs:
      - input: <any>
        output: <any>
outputValidations: [<validator-id>, ...]   # optional
candidates:                    # required
  - conditions: {...}          # ts-res qualifier conditions; empty {} = base
    body: |
      Body text with {{{slotName}}} triple-brace tokens.
```

Scope-level bindings file: `<root>/<scope-encoding>/_bindings.yaml`
(schema matches `IScopeSlotBindingsRecord`).

Scope-level qualifier axes file:
`<root>/<scope-encoding>/_qualifiers.yaml` (schema matches
`{ scope: ScopeKey; axes: ReadonlyArray<IQualifierAxisRegistration> }`).

**Filename-id consistency rule.** The descriptor's `id` field MUST equal
the filename stem (`<prompt-id>` in the path). Loader rejects mismatches
loudly. Underscore-prefixed filenames (`_bindings.yaml`,
`_qualifiers.yaml`) are reserved for scope-level metadata.

---

## 6. Mustache rules (locked)

1. **Triple-brace canonical.** Every `{{...}}` token in a candidate
   `body` must be `{{{name}}}` (unescaped). `{{name}}` and `{{&name}}`
   are rejected at load time.
2. **Rejection mechanism.** The descriptor Converter (or a dedicated
   body validator invoked from it) parses each candidate body via
   `MustacheTemplate.create(body, { escape: 'none' })`, inspects
   `template.extractVariables()`, and fails the load if any variable's
   `tokenType` is `'name'` (escaped form) or `'&'` (ampersand-unescape
   form). Error message: `prompt '<id>' candidate <i>: body uses token
   '{{<name>}}' (or '{{&<name>}}'); use triple-brace '{{{<name>}}}'`.
3. **Rendering.** `PromptLibrary.resolve` renders via
   `MustacheTemplate.create(body, { escape: 'none' }).validateAndRender(context)`.
   Missing-variable errors surface with the prompt id and the missing
   token name.
4. **Template cache.** Parsed `MustacheTemplate` instances cached by
   `(promptId, bodyHash)`. Hash uses
   `Hash.Crc32Normalizer.computeHash(body)` (per the `/value-hashing`
   skill — never `JSON.stringify`-compare). LRU bounded by
   `templateCacheSize` (default 256). Cache key intentionally includes
   `promptId` so the same body across different prompts doesn't cross-
   pollute trace context.
5. **Sections and partials.** Phase A does not pre-emptively reject `#`,
   `^`, `!`, `>` tokens. Authoring guidance documents that v0.1
   targets named-variable substitution only; section / partial use is
   out of scope for the consumer narrowing, but the loader does not
   actively reject them (forward-compat). Section / partial behavior
   under `escape: 'none'` is whatever standard mustache.js does.

---

## 7. Resource-binding semantics (locked)

1. **Recursive resolve.** Inner resolve uses the parent's scope chain
   unless `scopeOverride` is set, and the parent's qualifier context
   unless `qualifiers` is set. The `substitutions` field follows OQ-2
   (strict replace when supplied; inherit when omitted).
2. **Cycle detection.** Track currently-resolving
   `(scopeChainHash, promptId)` pairs using
   `Hash.Crc32Normalizer.computeHash` on the chain (per
   `/value-hashing`). A cycle → fail with:
   `prompt '<id>': cycle detected in resource binding chain: <a> → <b>
   → ... → <a>`.
3. **Depth limit.** Configurable via
   `IPromptLibraryCreateParams.resourceBindingDepthLimit`, default `5`.
   Exceeded → fail with: `prompt '<id>': resource binding depth limit
   (<n>) exceeded`.
4. **Sub-prompt body fills the slot.** The inner resolve's `body`
   string becomes the value substituted into the parent's slot, framed
   by the binding's `directive`. The inner resolve is fully evaluated
   (including its own resource bindings) before the value flows up.
5. **Trace.** Each resource binding produces one
   `IResourceBindingTraceEntry` carrying depth, the substitution mode
   actually used (`'replace'` or `'inherit'`), and the inner
   `IPromptResolveTrace` recursively.
6. **Output-contract restriction.** v0.1: resource bindings reference
   only descriptors with `output.kind: 'free-text'`. Referencing a
   `'json'`-output descriptor fails at resolve time with a clear
   error. Rationale: a JSON-output descriptor's output validators run
   against parsed JSON output, not against a substituted body
   fragment — semantics are unclear and no v0.1 consumer needs it.
   Forward-compatible: a future option could relax to "treat as raw
   stringified output," but adding it later is additive.

---

## 8. Output validation pipeline (locked)

For `output.kind: 'json'`, `resolveAndValidateOutput<T>(req, rawOutput)`:

1. **Strip code fences.** Reuse
   `@fgv/ts-extras/ai-assist`'s `extractJsonText` (per
   `LIBRARY_CAPABILITIES.md`'s "don't reimplement fence-stripping" rule).
   If `extractJsonText` is not yet exported from a stable location
   suitable for cross-library consumption, phase B surfaces the gap and
   either extends the export or briefly inlines, documenting in
   `TECH_DEBT.md`.
2. **`JSON.parse`.** Failure → `Result<fail>` with the prompt id and
   first 200 characters of raw output.
3. **Resolve the descriptor's `output.converterId`.** Failure
   (unregistered) → `Result<fail>` with the prompt id and the missing
   id.
4. **Run the Converter.** Failure → `Result<fail>` with the prompt id
   and the Converter's error chain (via `.withErrorFormat`).
5. **Run descriptor `outputValidations[]` in order.** Each id resolves
   against `registry.outputValidations`. Each validator receives the
   current accumulator (initially the Converter output) and an
   `IOutputValidationContext` carrying `promptId` and the resolved
   substitution map. Successful validators return a (possibly
   normalized) value used as the next validator's input. Failures
   aggregate via `MessageAggregator` (per `/result-pattern`); if any
   validator fails, the overall result is `Result<fail>` with the
   aggregated message; if all pass, the final accumulator is the
   typed `T`.
6. **Return `Result<T>`.**

For `output.kind: 'free-text'`: returns `rawOutput` verbatim wrapped in
`succeed(rawOutput as unknown as T)`. The library does NOT run
`outputValidations` for free-text in v0.1 — the loader rejects free-
text descriptors that declare `outputValidations` with a clear error.
(Forward-compat: when post-render free-text validators land in v0.2,
this check relaxes; descriptors won't need to change.)

---

## 9. Input safeguard primitives (locked)

Per-call, after substitution context is built, before Mustache renders:

1. **Per-slot length cap.** Slot's `maxLength` if set; else
   `safeguards.defaultMaxLength` from the descriptor if set; else the
   safety policy's `defaultMaxLength`. Overflow rejects with:
   `prompt '<id>': slot '<slot>' exceeds maxLength <n> (got <m>)`.
   Recorded in `trace.safeguardFindings` with `kind: 'max-length'`,
   `disposition: 'reject'`.
2. **Regex screening.** Slot values whose `source` is in
   `safetyPolicy.screenedSources` are scanned against
   `safetyPolicy.suspiciousPatterns`. Matches are collected. Per the
   policy's `onSuspicious`:
   - `'warn'`: log via `logger`, record `disposition: 'warn'` in
     `safeguardFindings`, continue.
   - `'reject'`: fail the resolve, record `disposition: 'reject'`.
3. **Source-aware skipping.** Slots whose `source` is NOT in
   `screenedSources` (or whose descriptor / safeguard sets
   `skipInjectionScreening: true`) skip screening; recorded with
   `kind: 'screening-skipped'`, `disposition: 'info'`.
4. **Anti-jailbreak framing seam.** If
   `safetyPolicy.antiJailbreakPreface` is supplied, it is called once
   with the descriptor and prepended to the rendered body (with a
   newline separator). The library ships no default text. The hook is
   the only seam for consumer-supplied framing.
5. **Ordering.** Length cap before regex screen (cheap reject first);
   anti-jailbreak preface AFTER Mustache render (the preface text is
   not subject to substitution; it frames the rendered prompt).

---

## 10. Composition semantics (locked)

1. **`single-best`.** Library calls ts-res's best-match candidate
   selector. One candidate wins; its body is the unsubstituted source.
2. **`concat-fragments`.** Library calls ts-res's "all matching
   candidates" selector. Candidates are joined least→most-specific
   (per ts-res's specificity ordering) with a single `\n` separator.
   Substitution runs **once on the concatenated body**, not per
   fragment (so a slot referenced in any fragment renders consistently
   across the assembled output).
3. **Chain walking is independent of intra-record qualifier
   resolution.** The chain walker selects the winning scope's
   `IStoredPromptRecord`; ts-res then operates within that record.
4. **No cross-scope body merging.** If the winning scope's record has
   no matching candidate under the qualifier context, ts-res's
   in-record fallback applies (matches the empty-conditions base if
   one exists; fails otherwise). The library does NOT fall through to
   another scope to find a candidate. Failure surfaces as
   `prompt '<id>' scope '<scope>': no candidate matched qualifiers
   <ctx>; record has no base candidate`.
5. **Binding merge IS cross-scope.** Bindings merge across the entire
   chain (most-specific wins, `enforced` higher-scope locks).
6. **Caller-substitution interaction.** Caller `substitutions` override
   merged bindings per slot. Exception: if the merged binding has
   `enforced: true`, the caller substitution is ignored and a
   `safeguardFindings` entry records the override attempt with
   `kind: 'screening-skipped'`, `disposition: 'info'`. (Re-using
   `screening-skipped` is wrong; phase A pins a dedicated kind:
   `'enforced-override-ignored'` — added to the `kind` union in §4.2.)

**Trace `safeguardFindings.kind` union, finalized:**
`'max-length' | 'suspicious-pattern' | 'screening-skipped' |
'enforced-override-ignored'`.

---

## 11. Package surface declaration

### 11.1 Layout

```
libraries/ts-prompt-assist/
├── README.md
├── package.json
├── tsconfig.json
├── eslint.config.js
├── config/
│   ├── rig.json
│   └── api-extractor.json
├── src/
│   ├── index.ts
│   ├── packlets/
│   │   ├── types/              # branded scalars, unions, interfaces
│   │   │   ├── index.ts
│   │   │   ├── ids.ts
│   │   │   ├── enums.ts
│   │   │   ├── bindings.ts
│   │   │   ├── descriptor.ts
│   │   │   └── ...
│   │   ├── converters/         # YAML → typed Converters
│   │   │   ├── index.ts
│   │   │   ├── descriptorConverter.ts
│   │   │   ├── bindingsConverter.ts
│   │   │   ├── axesConverter.ts
│   │   │   └── bodyTokenScanner.ts   # rejects double-brace
│   │   ├── registry/           # IPromptRegistry + sub-registries
│   │   │   ├── index.ts
│   │   │   ├── promptRegistry.ts
│   │   │   ├── converterRegistry.ts
│   │   │   ├── qualifierEnumRegistry.ts
│   │   │   ├── slotKindRegistry.ts
│   │   │   └── outputValidationRegistry.ts
│   │   ├── store/              # IPromptStore + adapters
│   │   │   ├── index.ts
│   │   │   ├── interfaces.ts
│   │   │   ├── inMemoryPromptStore.ts
│   │   │   └── fileTreePromptStore.ts
│   │   ├── resolve/            # PromptLibrary + chain walker
│   │   │   ├── index.ts
│   │   │   ├── promptLibrary.ts
│   │   │   ├── chainWalker.ts
│   │   │   ├── bindingMerger.ts
│   │   │   ├── resourceBindingResolver.ts
│   │   │   └── mustacheCache.ts
│   │   ├── safeguards/         # length cap, regex screen, preface
│   │   │   └── index.ts
│   │   └── output/             # fence strip, parse, convert, validate
│   │       └── index.ts
│   └── test/
│       └── unit/packlets/...   # mirrors src/packlets/
└── lib/                        # build output
```

### 11.2 `package.json` (key fields)

```json
{
  "name": "@fgv/ts-prompt-assist",
  "version": "5.1.0",
  "description": "ts-res-driven prompt resolution with Mustache substitution",
  "main": "lib/index.js",
  "types": "lib/index.d.ts",
  "sideEffects": false,
  "dependencies": {
    "@fgv/ts-utils": "workspace:*",
    "@fgv/ts-res": "workspace:*",
    "@fgv/ts-extras": "workspace:*",
    "@fgv/ts-json-base": "workspace:*",
    "tslib": "^2.8.1"
  },
  "devDependencies": {
    "@fgv/heft-dual-rig": "workspace:*",
    "@fgv/ts-utils-jest": "workspace:*"
  }
}
```

**YAML dependency note.** Phase B verifies whether `@fgv/ts-json-base`
already exposes a YAML loader (the `json-file` packlet may). If not,
adding `js-yaml` is a new direct dep — phase B surfaces to the
orchestrator before adding. The brief's §"Don't" enumerates the
permitted dep set; `js-yaml` is the most plausible new dep and the
brief explicitly calls it out as "surface as an OQ."

### 11.3 `rush.json` registration

```json
{
  "packageName": "@fgv/ts-prompt-assist",
  "projectFolder": "libraries/ts-prompt-assist",
  "shouldPublish": true,
  "versionPolicyName": "base-utils",
  "tags": ["libraries"]
}
```

### 11.4 ts-extras `mustache` packlet changes (cluster-scope, additive)

The `ts-prompt-assist-features` cluster includes one additive change to
`@fgv/ts-extras`'s `mustache` packlet (per OQ-6):

- `IMustacheTemplateOptions` gains `escape?: MustacheEscapeStrategy`
  (default `'html'`, back-compat).
- `MustacheEscapeStrategy` exported from the `mustache` packlet.
- `MustacheTemplate.render` and `MustacheTemplate.validateAndRender`
  internally render via a `Mustache.Writer` instance configured with
  the escape strategy (no `Mustache.escape` global mutation).
- TSDoc on the new option calls out the LLM-prompt use case and
  documents that triple-brace `{{{name}}}` is always unescaped
  regardless of strategy.

**No removed, renamed, or behavior-changed exports.** Callers of
`MustacheTemplate.create(template)` without options continue to
receive HTML-escape behavior. This is the additive pattern endorsed by
`CODING_STANDARDS.md §"Extending Core Libraries Over Working Around
Them"` for the established surface.

**Phase B implementation order.** ts-extras change lands first
(small additive PR or first commit); `ts-prompt-assist` consumes the
extended API from the start.

---

## 12. v0.1 acceptance criteria

The cluster integration branch is ready for promotion to `release`
(alpha cut) when:

1. **Type system implemented.** Every type from §3 is exported with
   `allFooValues` arrays + Converters for each string-union, branded
   scalars validated, discriminated-union Converters route on `kind`.
2. **`PromptLibrary.resolve` end-to-end** against `InMemoryPromptStore`:
   chain walk, qualifier-conditioned candidate selection (both
   composition modes), binding merge with `enforced` lock, caller-sub
   override (except `enforced`), Mustache render via the extended
   `MustacheTemplate` with `escape: 'none'`, full `IPromptResolveTrace`
   returned.
3. **`FileTreePromptStore` works** against `FsTree` (smoke test) and
   `InMemoryFileTree` (full coverage). Loads YAML descriptors, scope-
   level binding records, qualifier-axis registrations. Rejects bodies
   containing double-brace or ampersand-unescape tokens with the prompt
   id in the error.
4. **`resolveAndValidateOutput<T>` works** for `kind: 'json'` (strip
   fences → parse → Converter → outputValidations chain) and
   `kind: 'free-text'` (returns raw).
5. **Resource bindings resolve recursively** with cycle detection and
   depth cap. `IResourceBindingTraceEntry.innerTrace` is populated. OQ-2
   strict-replace semantics tested.
6. **Input safeguards** (length cap, regex screen, source-aware
   skipping, anti-jailbreak preface seam) implemented and surfaced in
   `trace.safeguardFindings`.
7. **Unified `IPromptRegistry`** with four typed sub-registries; library
   accepts a single `registry` create-param.
8. **`InMemoryPromptStore.watch`** fires `IPromptStoreEvent` on `put` /
   `putBindings` / `delete`; tests exercise subscribe / unsubscribe.
9. **ts-extras `mustache` packlet extension** lands in the cluster:
   additive `escape` option on `MustacheTemplate.create`, Writer-based
   per-instance escape, no global mutation, existing tests still pass.
10. **100% test coverage** across statements / branches / functions /
    lines for `ts-prompt-assist` and for the new lines in ts-extras.
11. **No `console.*`, no `node:fs`, no `any`, no `JSON.stringify`
    structural-equality** in source or tests (Crc32Normalizer.computeHash
    instead).
12. **Result pattern end-to-end.** No exceptions out of public methods.
13. **TSDoc on every exported symbol.** API Extractor passes.
14. **`rushx build && rushx lint && rushx test` pass** in both
    `libraries/ts-extras` and `libraries/ts-prompt-assist`.
15. **Pressure-test handoff package.** A short README in
    `libraries/ts-prompt-assist/` documents quick-start (`PromptLibrary`
    + `InMemoryPromptStore` + a tiny example) so the first-consumer port
    can begin without reading the design doc.

---

## 13. Out of scope for v0.1

- SQL / Mongo store adapters. Interface designed to admit them; not
  shipped.
- Editor UI helpers. Consumer's app concern.
- `FileTreePromptStore.watch`. Stubbed `undefined`; future stream.
- `FileTreePromptStore.put / putBindings / delete`. Read-only at v0.1.
- Schema-version migration. Only `'1'` supported; v2 migration story
  ships with v2.
- Cross-scope body merging. Bindings merge across scopes; bodies do
  not.
- Resource bindings referencing `'json'`-output descriptors.
- Post-render validators for `'free-text'` output.
- LLM-call orchestration (provider, model, retry, cost). Consumer
  runtime.
- Default anti-jailbreak text. Library exposes the seam; consumer
  supplies content.
- Section / partial Mustache tokens (`#`, `^`, `>`) — not actively
  rejected, but not exercised by v0.1 tests; consumer narrowing is
  on named-variable substitution.
- Hot-reload via `IPromptStore.watch?` on the FileTree adapter.

---

## 14. Implementation phasing recommendation (advisory)

Optional but recommended phase B breakdown. The implementing agent owns
the actual sequence.

- **B.0 — ts-extras Mustache extension.** Tiny additive PR or first
  commit: `escape?: MustacheEscapeStrategy` option on
  `MustacheTemplate.create`, Writer-based per-instance escape, tests
  cover `'html'` (existing), `'none'`, and custom-function variants.
  Must land before B.1 needs it.
- **B.1 — Types + `InMemoryPromptStore` + `PromptLibrary.resolve`
  happy path.** Branded scalars, Converters for all string-unions,
  discriminated-union Converters, `IPromptDescriptor` Converter,
  unified `PromptRegistry`, chain walker, binding merger (without
  resource bindings yet), Mustache render, trace. Tests cover both
  composition modes, binding merge with `enforced`, caller-sub
  override.
- **B.2 — Resource bindings.** Recursive resolver, cycle detection,
  depth cap, OQ-2 strict-replace, inner-trace surfacing.
- **B.3 — `FileTreePromptStore` + YAML loader.** YAML schema, filename-
  id consistency check, double-brace rejection in the descriptor
  Converter (via `bodyTokenScanner`), smoke test against `FsTree`,
  full coverage against in-memory FileTree.
- **B.4 — Output validation pipeline.** Fence strip, parse, Converter,
  `outputValidations[]` chain via `MessageAggregator`, the resource-
  binding-to-`'json'`-descriptor rejection.
- **B.5 — Safeguards.** Length cap, regex screen, source-aware
  skipping, anti-jailbreak preface seam, `safeguardFindings` trace
  entries.
- **B.6 — Docs + API Extractor + change file.** README quick-start,
  TSDoc audit, API Extractor signoff, rush change file. Pressure-test
  handoff package ready.

Each B.x can be a single commit on the integration branch or, if
preferred, its own PR. The cluster acceptance criteria are
non-negotiable per §12; the breakdown above is one valid path through
them.

---

## 15. New questions surfaced (none binding-blocking)

These are minor; phase B can either decide or surface to the
orchestrator as they arise. None gate the design lock.

- **`extractJsonText` re-export shape.** §8 step 1 reuses
  `@fgv/ts-extras/ai-assist`'s `extractJsonText`. Phase B verifies
  this is a stable public export; if it's currently `internal`, phase
  B either promotes it (additive in ts-extras) or inlines minimally
  with a `TECH_DEBT.md` entry.
- **YAML loader dep.** §11.2 documents — phase B verifies
  `@fgv/ts-json-base/json-file` covers YAML; if not, adding `js-yaml`
  is a new direct dep and phase B surfaces.
- **`IFileTreeItem` exact import path.** §5.1 sketches the type from
  `@fgv/ts-json-base/file-tree`. Phase B verifies the exact exported
  symbol name and adjusts.
- **`PromptRegistry.empty()` vs `.create()`.** §4.3 ships both; the
  intent is `.empty()` is infallible (returns the instance, not
  `Result`), `.create()` is the standard fallible factory and matches
  the family convention. Phase B may collapse to just `.create()` if
  the infallible path turns out to never be needed. Default keep both.
