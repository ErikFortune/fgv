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
   `filetree-io` skill); tests use FileTreePromptStore over
   `InMemoryFileTree` from `@fgv/ts-json-base` (no standalone
   in-memory store class — see §5.2 revised). SQL/Mongo
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

### OQ-3 — `watch()` semantics: **interface includes; no v0.1 adapter implements; event shape pinned**

**Decision (revised — Erik review 2026-05-15).**

- `IPromptStore.watch?` is on the interface as an **optional** method.
- **No v0.1 adapter implements it.** `FileTreePromptStore` leaves it
  `undefined`. There is no standalone `InMemoryPromptStore` (see §5.2 —
  tests use `FileTreePromptStore` over `InMemoryFileTree`), which also
  leaves it `undefined`.
- The `IPromptStoreEvent` shape is pinned now (see §4.5) so a future
  adapter implementing `watch` doesn't churn the type surface.
- Phase B does not exercise `watch` under tests at v0.1; the first
  concrete hot-reload consumer drives implementation in a follow-up
  stream.

**Rationale.** Earlier draft required `InMemoryPromptStore` to
implement `watch` and exercise it under tests, on the grounds that
"forcing the event shape under real code now prevents v0.2 churn."
That justification weakens when the in-memory store itself goes away
(per Erik's note: `FileTreePromptStore + InMemoryFileTree` is enough).
Pinning the event shape without exercising it is a small risk; the
shape is structurally simple (`kind`, `scope`, `id?`) and the cost of
revising one event-shape detail in v0.2 is much lower than the cost
of carrying an unmotivated `watch` impl + adapter through v0.1.

### OQ-4 — Registries: **unified `IPromptRegistry` with three typed sub-registries; qualifier config delegated to ts-res**

**Decision (revised — Erik review 2026-05-15).** Replace the three
separate registries on the create-params with **one unified
`IPromptRegistry`** exposing namespaced sub-registries:

```ts
export interface IPromptRegistry {
  readonly converters: IPromptConverterRegistry;        // output Converters by ConverterId
  readonly slotKinds: IPromptSlotKindRegistry;          // slot-kind serializers by string kind
  readonly outputValidations: IPromptOutputValidationRegistry;
}
```

**Qualifier configuration is NOT a sub-registry of `IPromptRegistry`.**
It is delegated entirely to ts-res. `PromptLibrary.create` takes a
`qualifiers: ts-res qualifier configuration` parameter directly
(see §4.1 for the exact shape — `IReadOnlyQualifierCollector` or a
declarative `IQualifierDecl[]` that the library converts on create).

**Rationale for the qualifier delegation.** ts-res's
`LiteralQualifierType` already owns the closed-value-set concept via
its type config (`TCFGJSON extends JsonObject`). A consumer adding a
"tone: formal | casual | playful" qualifier registers it ONCE in ts-
res's qualifier collector. Having a parallel `qualifierEnums` registry
in ts-prompt-assist forced consumers to register the same closed set
twice — a guaranteed drift bug. Dropping it removes the duplication
and uses the canonical primitive. Consistent with §15's "reuse where
ts-res is canonical, diverge only on file structure" principle.

**Trade-offs of unified `IPromptRegistry` (unchanged from earlier
draft).** Three sub-concerns are genuinely distinct, so keeping them
typed sub-registries preserves type safety while collapsing the
create-params noise to one `registry` param. A library-supplied
`PromptRegistry.create()` factory produces an empty unified registry
that consumers populate at boot.

**Trade-off acknowledged.** This is the largest divergence from the
proposed shape. The conceptual model is unchanged; only the API
ergonomics shift, and the qualifier duplication is eliminated.

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
export type SlotBindingKind       = 'literal' | 'resource';
export type SlotDirective         = 'constraint' | 'hint' | 'prose';
export type SlotWritability       = 'any-scope' | 'schema-only' | 'system-only';
export type OutputContractKind    = 'free-text' | 'json';
export type ResourceSubstitutionMode = 'replace' | 'inherit'; // trace-only, OQ-2
```

(`PromptCompositionMode` is **removed** — see §10.1 for rationale.
ts-res's per-candidate `isPartial` is the canonical knob for
"this variant layers on top of others vs terminates the chain.")

Each ships `allFooValues` + a Converter per repo convention.

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
  readonly output: PromptOutputContract;
  /** Optional join policy override for partial-candidate composition.
   *  See §10.1. Default: `{ separator: '\n\n', order: 'specificity-
   *  ascending', trimTrailingWhitespace: true }`. */
  readonly join?: IPromptJoinPolicy;
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

**Removed per OQ-4 revision.** ts-prompt-assist defines no qualifier-
axis registration shape of its own. Qualifier configuration is
ts-res's `IQualifierDecl` shape (from
`@fgv/ts-res/qualifiers/qualifierDecl`), validated by ts-res's own
Converters. ts-prompt-assist passes through unchanged. See §4.1
`qualifiers` create-param and §5.3 root-level `_qualifiers.yaml`.

### 3.12 Stored record (returned by the store)

```ts
import type { ResourceJson } from '@fgv/ts-res';

export interface IPromptCandidateRecord {
  /** Full ts-res `ConditionSetDecl` shape (record-sugar, record-with-
   *  details, or array form). Unlocks `operator`, `priority`,
   *  `scoreAsDefault` per condition — no narrowing vs ts-res. See
   *  §10.1 for the rationale. Empty `{}` = unconditional base. */
  readonly conditions: ResourceJson.ConditionSetDecl;
  /** When `true`, this candidate participates in chain composition —
   *  if a more-specific candidate also matches, this candidate's body
   *  layers underneath. When `false` or omitted, this candidate
   *  terminates the chain (a single complete body, no layering).
   *  Mirrors ts-res's `IResourceCandidateDecl.isPartial`. See §10.1. */
  readonly isPartial?: boolean;
  readonly body: string;
}

export interface IPromptJoinPolicy {
  /** String inserted between fragments. Default `'\n\n'`. */
  readonly separator?: string;
  /** Fragment order. `'specificity-ascending'` puts least-specific
   *  first (general guidance → specific overrides). Default. */
  readonly order?: 'specificity-ascending' | 'specificity-descending';
  /** Whether to strip trailing whitespace per fragment before joining.
   *  Default `true` (avoids accidental triple-newline gaps from YAML
   *  block scalars). */
  readonly trimTrailingWhitespace?: boolean;
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
  /** ts-res qualifier configuration. The library accepts either a
   *  pre-built `IReadOnlyQualifierCollector` (when the consumer already
   *  maintains a ts-res qualifier set) or a declarative `IQualifierDecl[]`
   *  (the library builds the collector internally via ts-res's
   *  Converters). REQUIRED — there is no default qualifier set.
   *  See OQ-4 rationale: ts-res owns qualifier value sets, including
   *  closed-value enums via `LiteralQualifierType`. ts-prompt-assist
   *  does not duplicate this surface. */
  readonly qualifiers:
    | TsRes.Qualifiers.IReadOnlyQualifierCollector
    | ReadonlyArray<TsRes.Qualifiers.IQualifierDecl>;
  /** Optional ts-res qualifier-type collector. When `qualifiers` is
   *  supplied as a pre-built `IReadOnlyQualifierCollector`, this is
   *  inferred from it. When `qualifiers` is supplied as decls, this
   *  must supply at least the qualifier types referenced by those
   *  decls (e.g. `LiteralQualifierType`, `LanguageQualifierType`).
   *  Defaults to ts-res's system qualifier types when omitted. */
  readonly qualifierTypes?: TsRes.QualifierTypes.ReadOnlyQualifierTypeCollector;
  /** Unified registry (per OQ-4). When omitted, the library uses
   *  `PromptRegistry.empty()` — fine for tests that don't exercise
   *  output validation, custom slot kinds, or output converters. */
  readonly registry?: IPromptRegistry;
  readonly safetyPolicy?: IPromptSafetyPolicy;
  /** Diagnostic logger. Receives debug-level events for: candidate
   *  materialization into the runtime resource manager, cache hits/
   *  misses (via the ts-res cache listener — see `cacheListener`
   *  below), resource-binding entry/exit, safeguard findings,
   *  Mustache template parse / render, store invocations. Receives
   *  warn-level events for stripped `disallowed` qualifiers, regex-
   *  screen matches under `onSuspicious: 'warn'`, and ignored
   *  `enforced` binding overrides. Receives error-level events for
   *  resolve failures BEFORE the Result is returned (so logging is
   *  paired with the failure return; see `/ts-utils-logging`). When
   *  omitted, defaults to `Logging.noOpLogger`. */
  readonly logger?: Logging.ILogger;
  /** Optional ts-res cache listener (`@fgv/ts-res/runtime/
   *  cacheListener`). When supplied, receives condition / conditionSet /
   *  decision cache hit/miss/error/clear events from the underlying
   *  ts-res `ResourceResolver`. Lets consumers (e.g. an editor UI
   *  mirroring ts-res-browser's step-by-step view) instrument
   *  resolution without ts-prompt-assist re-emitting the same
   *  events. When omitted, the library installs an internal listener
   *  that forwards events to `logger` at debug level. */
  readonly cacheListener?: TsRes.Runtime.IResourceResolverCacheListener;
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
  /** Per-candidate ts-res match disposition. One entry when a non-
   *  partial candidate wins alone; N entries (specificity-ascending)
   *  when partials compose into the final body. */
  readonly candidateMatches: ReadonlyArray<ICandidateMatchTraceEntry>;
}

export interface ICandidateMatchTraceEntry {
  /** Index into the record's `candidates` array. */
  readonly candidateIndex: number;
  /** ts-res aggregate match disposition for this candidate's condition
   *  set: `'match'` (all conditions matched on their qualifier values)
   *  or `'matchAsDefault'` (at least one condition matched via
   *  `scoreAsDefault`). Mirrors ts-res's `ConditionMatchType` minus
   *  the `'noMatch'` variant (filtered candidates don't appear here). */
  readonly matchType: 'match' | 'matchAsDefault';
  /** Per-condition match details, as returned by ts-res. Rich enough
   *  for an editor surface to mirror ts-res-browser's step-by-step
   *  resolution view ("qualifier X had value Y; condition matched
   *  with score Z at priority P") without re-resolving. The library
   *  forwards ts-res's `IConditionMatchResult[]` unchanged — no
   *  re-narrowing or re-shaping. */
  readonly conditions: ReadonlyArray<TsRes.Runtime.IConditionMatchResult>;
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
  readonly slotKinds: IPromptSlotKindRegistry;
  readonly outputValidations: IPromptOutputValidationRegistry;
}

export interface IPromptConverterRegistry {
  register<T>(id: ConverterId, converter: Converter<T, unknown>): Result<ConverterId>;
  get<T>(id: ConverterId): Result<Converter<T, unknown>>;
  has(id: ConverterId): boolean;
}

// Qualifier-enum registry intentionally absent — see OQ-4. Closed
// qualifier value sets live in ts-res via `LiteralQualifierType`.
// `PromptLibrary` consults the ts-res qualifier collector supplied
// on `create()` for value-set queries (editor "what values are
// valid for this axis?" hints).

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
  /** Returns the ts-res qualifier configuration this store
   *  publishes, OR `undefined` if the store carries no qualifier
   *  config (consumer supplies it directly to `PromptLibrary.create`).
   *  Returned shape is ts-res's `IQualifierDecl[]`; the library
   *  uses ts-res's Converters to build the runtime collector. */
  getQualifierConfig(): Promise<Result<ReadonlyArray<TsRes.Qualifiers.IQualifierDecl> | undefined>>;

  // Optional write surface
  put?(record: IStoredPromptRecord): Promise<Result<IStoredPromptRecord>>;
  putBindings?(record: IScopeSlotBindingsRecord): Promise<Result<IScopeSlotBindingsRecord>>;
  delete?(scope: ScopeKey, id: PromptId): Promise<Result<PromptId>>;

  // Optional change-notification surface (per OQ-3)
  watch?(handler: (event: IPromptStoreEvent) => void): IDisposable;
}
```

**Qualifier-config resolution at `PromptLibrary.create`.** The library
prefers the create-params `qualifiers` if supplied. Otherwise it calls
`store.getQualifierConfig()`; if that returns decls, the library
builds the collector via ts-res's Converters. If both are absent,
`create` fails with a clear error. Consumers that want their
qualifier config to travel with their prompts (round-trippable
data) drop a root-level `_qualifiers.yaml` in their FileTree (§5.3);
consumers that manage qualifiers in code pass the collector directly.

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
  // get / list / getBindings / getQualifierConfig implemented
  // put / putBindings / delete / watch: NOT implemented in v0.1
}
```

**Implementation rule (binding).** All file reads/writes go through
`FileTree` (per the `/filetree-io` skill). Never `node:fs` directly.
YAML parsing uses `@fgv/ts-extras`'s `yaml.yamlConverter<T>(inner)`
packlet (per §15 audit). No new `js-yaml` direct dep.

**YAML schema (locked).** See §5.3.

### 5.2 In-memory store for tests — **no standalone `InMemoryPromptStore`**

**Decision (revised 2026-05-15 per Erik review):** there is no
separate `InMemoryPromptStore` class. Tests and dev fixtures use
`FileTreePromptStore` over an `InMemoryFileTree` from
`@fgv/ts-json-base`.

**Rationale.** The proposed `InMemoryPromptStore` would duplicate
`FileTreePromptStore`'s entire read path (YAML parsing, descriptor
Converter, candidate validation, qualifier-config loading) against an
in-memory data structure. The FileTree abstraction is precisely the
seam designed for this — same store, different backend. Per
`/filetree-io`: "The convention is to use the FileTree abstraction
... so the same code works against node fs, in-memory, zip files."

**Test fixture helper.** The library ships a single small helper
`PromptStoreFixture.build(seed: IPromptStoreFixtureSeed):
Result<IPromptStore>` that:

1. Constructs an `InMemoryFileTree`.
2. Serializes the seed (descriptors / bindings / qualifier config) to
   YAML and writes the files into the tree at the expected paths.
3. Returns a `FileTreePromptStore` over that tree.

```ts
export interface IPromptStoreFixtureSeed {
  readonly records?: ReadonlyArray<IStoredPromptRecord>;
  readonly bindings?: ReadonlyArray<IScopeSlotBindingsRecord>;
  readonly qualifiers?: ReadonlyArray<TsRes.Qualifiers.IQualifierDecl>;
}

export const PromptStoreFixture: {
  build(seed: IPromptStoreFixtureSeed): Promise<Result<IPromptStore>>;
};
```

This keeps the YAML round-trip path in the test loop (catches
schema drift) while reusing the canonical adapter.

`watch?` is `undefined` on the resulting store (per OQ-3 revised).

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
  # conditions: full ts-res `ResourceJson.ConditionSetDecl` (sugar, record-
  # with-details, or array form).
  # isPartial: when true, layers under any more-specific matching candidate;
  # when false / omitted, terminates the composition chain. See §10.2.

  # Base — general guidance that layers under everything:
  - conditions: {}
    isPartial: true
    body: 'Be helpful and concise.'

  # Tone layer — applies on top of base when tone qualifier matches:
  - conditions: { tone: formal }
    isPartial: true
    body: 'Use formal address. Avoid contractions.'

  # Per-condition details — operator / priority / scoreAsDefault:
  - conditions:
      tone:
        value: playful
        priority: 100
        scoreAsDefault: 0.6
    isPartial: true
    body: "Use a playful, conversational register."

  # Terminal regional override — does NOT layer; replaces base + tone:
  - conditions: { region: emea }
    body: 'EMEA compliance addendum: ...'   # isPartial omitted = terminal

  # Array form (equivalent to record-with-details):
  - conditions:
      - qualifierName: region
        value: na
      - qualifierName: tone
        value: formal
    body: 'NA formal addendum: ...'
```

**Note on capability surface.** The schema delegates to ts-res's
`ConditionSetDecl`, so `operator`, `priority`, and `scoreAsDefault` are
all available to prompt authors without ts-prompt-assist re-narrowing.
See §10.1 for the full inherited-vs-not capability table.

Scope-level bindings file: `<root>/<scope-encoding>/_bindings.yaml`
(schema matches `IScopeSlotBindingsRecord`).

**Root-level qualifier configuration file** (optional):
`<root>/_qualifiers.yaml`. Schema is ts-res's `IQualifierDecl[]` shape
under a single `qualifiers:` key:

```yaml
# <root>/_qualifiers.yaml
qualifiers:
  - name: tone
    typeName: literal:tone           # references a LiteralQualifierType
                                     # registered in the QualifierTypeCollector
                                     # with values [formal, casual, playful]
    defaultPriority: 500
  - name: region
    typeName: territory              # ts-res system type
    defaultPriority: 800
  - name: lang
    typeName: language               # ts-res system type
    defaultPriority: 1000
    defaultValue: en
```

Schema validation reuses ts-res's `qualifierDecl` Converter from
`@fgv/ts-res/qualifiers/convert` — no ts-prompt-assist re-narrowing.
The file is OPTIONAL: consumers who supply
`IPromptLibraryCreateParams.qualifiers` directly in code can omit it.
**There is no per-scope qualifier registration** (ts-res qualifier
config is global to the resolver; per-scope axes would force a fork
of ts-res's qualifier model that v0.1 has no use case to justify).

**Filename-id consistency rule.** The descriptor's `id` field MUST equal
the filename stem (`<prompt-id>` in the path). Loader rejects mismatches
loudly. Underscore-prefixed filenames (`_bindings.yaml`,
`_qualifiers.yaml`) are reserved (scope-level for `_bindings`, root-
level for `_qualifiers`).

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

### 10.1 ts-res capability surface (what passes through unchanged)

The prompt YAML schema **delegates conditions to ts-res's
`ResourceJson.ConditionSetDecl`** rather than re-narrowing to a sugar-
only flat record. Anything ts-res accepts in a `ConditionSetDecl`,
candidates in this schema accept — record-sugar, record-with-details,
or array form.

**Capability reuse table (revised — `isPartial` IS reused).** The
earlier draft lumped `isPartial` and `ResourceValueMergeMethod`
together as "JSON-shape-aware, not reusable." That was wrong:
`isPartial` is a **control-flow knob** (does this candidate terminate
the chain, or layer with more-specific matches?) — the value shape is
irrelevant. `ResourceValueMergeMethod` IS shape-aware (`augment` =
JSON deep-merge, `delete` = property removal). The two come apart.

| ts-res capability | v0.1 status | Rationale |
|---|---|---|
| `ConditionOperator` | **Reused as-is.** | Inherited via `ConditionSetDecl`. |
| `priority` per condition | **Reused as-is.** | Inherited via `ConditionSetDecl`. |
| `scoreAsDefault` per condition | **Reused as-is.** Interacts with the chain walker per §10.6. | Inherited via `ConditionSetDecl`. |
| **`IResourceCandidateDecl.isPartial`** | **Reused as-is.** Per-candidate chain-termination control. | Control-flow, not shape-aware. Strictly more expressive than a per-prompt binary "single-best vs concat-everything." Replaces the dropped `compositionMode` field. |
| `ResourceValueMergeMethod` (`augment` / `delete` / `replace`) | **Not reused.** | `augment` and `delete` are JSON-property operations with no string analogue. `replace` is exactly what `isPartial: false` already expresses. |
| `IResourceCandidateDecl.json` (arbitrary JSON body) | **Not reused.** Prompt candidate body is `string` (Mustache template). | Bodies feed Mustache then become slot values; JSON has no path through the substitution pipeline at v0.1. |

### 10.2 `compositionMode` is removed (was: `'single-best' \| 'concat-fragments'`)

The earlier draft had `IPromptDescriptor.compositionMode` as a per-
prompt binary controlling whether resolve returns one body or
concatenates all matches. **That field is dropped.** ts-res's per-
candidate `isPartial` is strictly more expressive:

| Author intent | Earlier draft | v0.1 (locked) |
|---|---|---|
| "Best match wins, alone." | `compositionMode: single-best` | All candidates' `isPartial` omitted / `false`. |
| "Layer all matches together." | `compositionMode: concat-fragments` | All candidates `isPartial: true` except the terminal. |
| "Layer SOME variants on a base; specific overrides terminate." | **Inexpressible.** | Author marks `isPartial: true` surgically per candidate. |

The third case is real (the chat-app use case Erik raised:
"tenant override fragment layers on top of global base; a tenant-
specific regional override terminates the chain"). The earlier
`compositionMode` shape couldn't express it without splitting the
prompt id, forking the descriptor, or hand-orchestrating in the
consumer — exactly the pain the library is supposed to eliminate.

**Semantics (locked):**

1. ts-res selects matching candidates per the qualifier context.
2. Walk those candidates in **specificity-ascending order** (least-
   specific first). Collect bodies until a candidate with
   `isPartial !== true` is encountered — that candidate is the
   terminal; collection includes it and stops.
3. If all matching candidates are `isPartial: true`, the chain ends
   at the most-specific match (no terminal needed — every fragment
   participates).
4. If only one candidate matches and it is `isPartial: true` or
   omitted, that candidate's body is the result (no join needed).
5. Bodies are joined per `IPromptDescriptor.join` (default
   `{ separator: '\n\n', order: 'specificity-ascending',
   trimTrailingWhitespace: true }`).
6. Mustache substitution runs **once on the joined body** (consistent
   slot rendering across fragments).

**Default join policy rationale.** `\n\n` is the canonical LLM
paragraph break — fragments read as paragraphs. Specificity-ascending
order puts general guidance first and specific overrides last,
matching the "later instructions take precedence" pattern most LLMs
treat as natural. `trimTrailingWhitespace: true` defuses YAML block-
scalar trailing-newline quirks that would otherwise produce triple-
newline gaps.

### 10.3 Chain walking is independent of intra-record candidate composition

The scope-chain walker (§10.4) picks the winning scope's
`IStoredPromptRecord`. ts-res then operates **within that record's
candidate set** — chain composition via `isPartial` happens inside one
scope's record. **`isPartial` does NOT trigger cross-scope fallback**;
the chain walker still stops at the first scope with a record for the
id.

If an author wants a tenant scope to layer fragments on top of the
global scope's body, they ship a record at the tenant scope whose
candidates reference the global as a **resource binding** (§7), not
via cross-scope candidate layering. The two mechanisms are orthogonal:

| Want | Use |
|---|---|
| Layer variants of one body within one scope | per-candidate `isPartial` within the record |
| Compose a tenant body on top of a global fragment | resource binding (§7) — fragment lives as its own prompt id |

### 10.4 Cross-scope behavior

1. **No cross-scope body merging.** If the winning scope's record has
   no matching candidate under the qualifier context, ts-res's
   in-record fallback applies (matches the empty-conditions base if
   one exists; fails otherwise). The library does NOT fall through to
   another scope to find a candidate. Failure surfaces as
   `prompt '<id>' scope '<scope>': no candidate matched qualifiers
   <ctx>; record has no base candidate`.
2. **Binding merge IS cross-scope.** Bindings merge across the entire
   chain (most-specific wins, `enforced` higher-scope locks).
3. **Caller-substitution interaction.** Caller `substitutions` override
   merged bindings per slot. Exception: if the merged binding has
   `enforced: true`, the caller substitution is ignored and a
   `safeguardFindings` entry records the override attempt with
   `kind: 'enforced-override-ignored'`, `disposition: 'info'`.

**Trace `safeguardFindings.kind` union, finalized:**
`'max-length' | 'suspicious-pattern' | 'screening-skipped' |
'enforced-override-ignored'`.

### 10.6 `scoreAsDefault` and the chain walker

`scoreAsDefault` lets a candidate "softly match" when its qualifier is
absent from the resolve context (ts-res semantics, unchanged). This is
an **intra-record** behavior: within the winning scope's record, ts-res
picks the candidate per its normal scoring, with `scoreAsDefault`
participating when the qualifier is absent.

`scoreAsDefault` does NOT trigger cross-scope fallback. The chain
walker still stops at the first scope with a record for the id (§10.4).
If author wants a "soft default" variant available everywhere, they
ship it in the base scope as a candidate with `scoreAsDefault` set;
more-specific scopes can override with their own record (full
replacement) or simply add bindings (per §1 / OQ-2).

The trace surfaces ts-res's match disposition per resolved candidate
(`'match' | 'matchAsDefault'`) on the `IResolvedPrompt` so editor
surfaces can show "this candidate matched as default" without re-
querying ts-res. Field name pinned: `IPromptResolveTrace.candidateMatchType:
'match' | 'matchAsDefault'`. Added to §4.2's `IPromptResolveTrace`
shape (phase B implements alongside the other trace fields).

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
2. **`PromptLibrary.resolve` end-to-end** against
   `FileTreePromptStore` over `InMemoryFileTree`:
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
8. **ts-res cache-listener integration.** `PromptLibrary` accepts an
   `IResourceResolverCacheListener` (per §4.1); when omitted, the
   library installs an internal listener that forwards events to
   the supplied `ILogger` at debug level. Tests verify the wire-
   through (subscribed listener receives hit/miss events on the
   conditions / conditionSet / decision caches).
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
    + `PromptStoreFixture.build` over `InMemoryFileTree` + a tiny
    example) so the first-consumer port
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
- **B.1 — Types + test fixture + `PromptLibrary.resolve`
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

## 15. ts-res `import` packlet audit — deliberate divergence

Phase A re-audit (post-orchestrator prompt) of the loader design against
`libraries/ts-res/src/packlets/import/`. Verdict: **partial overlap; the
loader does NOT reinvent ts-res import — they target different access
patterns and shapes. The lower-level primitives ts-res import depends on
are the right reuse target.** Divergence is deliberate; rationale below.

### 15.1 What ts-res `import` is

Read `importManager.ts`, `importable.ts`, `fsItem.ts`,
`importers/{pathImporter,fsItemImporter,jsonImporter,collectionImporter}.ts`.
The import packlet is a **builder pipeline** that ingests sources of
several types — `'path'`, `'fsItem'`, `'json'`, `'resourceCollection'`,
`'resourceTree'` — into a `ResourceManagerBuilder`. Pipeline shape:

1. `PathImporter` — given a path string + `FileTree`, walks the tree,
   emits `IImportableFsItem` per file.
2. `FsItemImporter` — given an `FsItem` (which has already parsed
   condition tokens out of the filename, e.g. `greeting.lang-en.yaml`
   → `baseName: 'greeting'`, `conditions: [{lang: 'en'}]`), reads the
   file, optionally runs a `fileContentConverter: Converter<JsonValue>`
   over the raw content (this is the YAML-to-JSON seam), emits
   `IImportableJson`.
3. `JsonImporter` — converts the JSON into ts-res `ResourceDeclTree` /
   `ResourceDeclCollection` shapes.
4. `CollectionImporter` — adds the decls into the
   `ResourceManagerBuilder`.

The whole pipeline is **builder-oriented**: push N sources in,
`ResourceManagerBuilder` accumulates, then `ResourceManager.create()`
freezes it. There is no per-scope segmentation; ts-res's
`ResourceManager` is global to the build.

### 15.2 What ts-prompt-assist's `FileTreePromptStore` needs

Different shape, different access pattern:

1. **Access is lookup-oriented**, not build-oriented. `IPromptStore` is
   `get(scope, id)` / `list(filter)` / `getBindings(scope)` /
   `getQualifierConfig()`. The store does not own a
   `ResourceManagerBuilder`; it owns per-(scope, id) records.
2. **Data shape is broader than ts-res candidates**. Each YAML file
   contains prompt-specific metadata (title, slots, output contract,
   safeguards, examples, output validations) that ts-res does not
   model, **plus** the candidates array (`{conditions, body}` pairs)
   which IS ts-res-shaped. The candidate sub-shape is a subset of
   `ResourceJson.ResourceDeclCollection`; the descriptor metadata
   has no ts-res analogue.
3. **Per-scope segmentation is first-class**. The chain walker
   consults scope records in order. A scope is a distinct directory
   under `<root>/`; conceptually each scope is its own resource set.
   ts-res import has no notion of scope-scoped builders.
4. **Filename conventions differ**. ts-res's `FsItem` parses condition
   tokens **out of the filename** (e.g. `.lang-en.yaml` → a
   condition). ts-prompt-assist puts conditions **inside** the YAML
   as a per-candidate `conditions:` block (one file per `(scope, id)`,
   N candidates within). Filename in ts-prompt-assist carries only the
   prompt id, plus the reserved `_bindings` / `_qualifiers` records.

### 15.3 Where the overlap genuinely IS, and how to handle it

The overlap is at the **lower-level primitives**, not at the
ImportManager pipeline:

| Need | ts-res import's path | Right primitive for ts-prompt-assist |
|---|---|---|
| Walk a `FileTree` | `PathImporter` (wraps `FileTree`) | `FileTree` from `@fgv/ts-json-base` **directly** (per `/filetree-io` skill) |
| Read a file, parse YAML → typed value | `FsItemImporter` + a `fileContentConverter` | `@fgv/ts-extras`'s **`yaml.yamlConverter<T>(inner)`** (resolves NQ-2) |
| JSON → ts-res candidate decls | `JsonImporter` + `ResourceJson` converters | **Reuse `ResourceJson.ResourceDeclCollection` converters** for the candidates sub-shape only (see §15.5) |
| Build a ts-res ResourceManager for candidate selection | `CollectionImporter` → `ResourceManagerBuilder` | **Phase B integration question — see §15.5 / NQ-5 below** |

**Concretely, `FileTreePromptStore` consumes:**

- `FileTree` directly (not via `PathImporter`).
- `@fgv/ts-extras`'s `yaml.yamlConverter<IStoredPromptRecord>(promptRecordConverter)`
  to read each `<prompt-id>.yaml` and produce a typed record in one shot.
  This resolves NQ-2: no new direct `js-yaml` dep; the ts-extras `yaml`
  packlet is the canonical primitive (per `/published-primitives-reflex`).
- `@fgv/ts-extras`'s `yaml.yamlConverter<IScopeSlotBindingsRecord>(...)`
  for `_bindings.yaml`.
- `@fgv/ts-extras`'s `yaml.yamlConverter<...>(...)` wrapping ts-res's
  own `qualifierDecl` Converter for `<root>/_qualifiers.yaml` (when
  the consumer ships qualifier config in the FileTree — see §5.3).

**`FileTreePromptStore` does NOT instantiate `ImportManager`,
`PathImporter`, `FsItemImporter`, `JsonImporter`, or
`CollectionImporter`.** The ImportManager pipeline is the wrong shape:
its output target is a `ResourceManagerBuilder`, not a lookup-oriented
store keyed by `(scope, id)`. Forcing the prompt-store data into the
import pipeline would require either:

- Inventing a new `IImporter` whose target is "a `(scope, id) →
  IStoredPromptRecord` map" — which is just `FileTreePromptStore`
  itself wearing a hat. No reuse.
- Discarding the descriptor metadata, slots, output contract, bindings,
  axes (everything that's not ts-res candidates). The import pipeline
  has no slot for these.
- Adopting the filename-token convention for conditions, which breaks
  the YAML schema locked in §5.3 and forces filename-encoded conditions
  (per-candidate `conditions:` blocks become impossible; only one
  candidate per file via filename tokens).

None of these are wins.

### 15.4 Deliberate divergence — recorded rationale

| Divergence | Rationale |
|---|---|
| `FileTreePromptStore` uses `FileTree` directly, not `PathImporter` | `PathImporter` is glue between a path string and an `IImportableFsItem` queue. ts-prompt-assist's store iterates known directory shapes (`<scope>/<id>.yaml`) and has no need for the queue / dispatch indirection. |
| `FileTreePromptStore` uses `@fgv/ts-extras/yaml.yamlConverter` directly, not `FsItemImporter`'s `fileContentConverter` seam | Same primitive, lower coupling. The `fileContentConverter` exists in `FsItemImporter` precisely so YAML can be plumbed into the import pipeline; in ts-prompt-assist we want YAML→typed-record without the pipeline. |
| Per-candidate `conditions:` block in YAML, not filename-encoded conditions | One YAML file per `(scope, id)` co-locates descriptor + all candidates (round-trip-friendly across FileTree / SQL / Mongo). Filename-encoded conditions force one-candidate-per-file and lose round-tripping through key/value backends. The descriptor needs to travel with the candidates. |
| `IPromptStore.get(scope, id)` instead of building a global ts-res `ResourceManager` at store creation | Per-scope segmentation is first-class to the conceptual model. A single global ResourceManager cannot represent the scope chain — the chain walker needs distinct per-scope record sets. |
| No reuse of `ImportManager` / `CollectionImporter` | They target `ResourceManagerBuilder`, not the prompt-store's `(scope, id) → record` map. See §15.3. |

This divergence aligns with `/published-primitives-reflex`: we are NOT
reimplementing utility-shaped code (FileTree walking, YAML parsing, ts-
res candidate decl validation). We ARE refusing to adopt a builder-
pipeline framing that doesn't fit the store's access pattern.

### 15.5 Candidate → ts-res resolve handoff — **Option C (lazy materialization into a shared ResourceManager)**

**Decision (revised 2026-05-15 per Erik review).** The library
maintains **one long-lived runtime resource manager** for the entire
PromptLibrary instance. The `IPromptStore` is the **source of truth**.
Resources materialize into the runtime **on demand** — a chain-walked
record gets ingested into the runtime the first time anyone asks for
it; subsequent resolves with different qualifier contexts hit ts-res's
intrinsic O(1) caches.

This is a third option, materially better than the earlier-drafted A
and B, in two ways: (i) ts-res's condition / conditionSet / decision
caches (its `IResourceResolverCacheListener` substrate) are shared
across **all** prompts, so resolving any prompt warms the qualifier
machinery for every other prompt; (ii) the store-record-to-resource
materialization happens at most once per `(scope, id, record-hash)`,
not per resolve.

**Architecture pin (locked):**

1. **One shared, long-lived `ResourceManagerBuilder` + `ResourceManager`
   pair** inside `PromptLibrary`. Built once at `PromptLibrary.create`
   with the qualifier configuration (per OQ-4 revised). Initially
   empty of resources.
2. **Per-resolve flow:**
   a. Chain walker queries `IPromptStore` for `(scope, id)` records.
      Finds the winning scope's record.
   b. Compute `key = (scope, id, Crc32Normalizer.computeHash(
      record.candidates))`.
   c. Look the key up in `PromptLibrary`'s materialized-resource map.
      On hit: skip to step (e).
   d. **Cache miss:** validate `record.candidates` via ts-res's
      `ResourceJson` candidate-decl Converters; synthesize a ts-res
      resource id (e.g. `<scope-encoded>/<promptId>`); add the resource
      into the runtime via the long-lived builder; record `key` in the
      materialized-resource map.
   e. Ask the ts-res `ResourceResolver` to resolve the synthesized id
      against the caller's qualifier context. ts-res's internal caches
      (condition / conditionSet / decision) deliver O(1) on warm
      qualifier values.
3. **No output caching.** The library does NOT cache rendered prompt
   bodies, substituted bodies, or post-`validateAndRender` output.
   Outputs are combinatorial across the open qualifier space; caching
   them would be unbounded and the cache-hit ratio asymptotes toward
   zero as the qualifier set grows. ts-res's intra-resolution caches
   are the right cache level — they're keyed on shapes (conditions,
   condition sets, decisions) whose cardinality is bounded by the
   prompt corpus, not by the open qualifier-value space.
4. **Invalidation.** When the store changes (any future hot-reload
   path), the materialized-resource entries for affected
   `(scope, id)` pairs are evicted; ts-res's caches drop too via the
   `cacheClear` listener event. v0.1 has no hot-reload, so the
   materialized map only grows.
5. **Resource binding inner resolves use the same shared runtime** —
   nothing special. The inner prompt id is materialized on first
   access just like a top-level resolve.

**Mustache template cache (separate, unchanged).** Parsed
`MustacheTemplate` instances are still cached by `(promptId,
bodyHash)` with `templateCacheSize` LRU (§6). This is a parse cache,
not an output cache — cardinality bounded by the prompt-corpus body
count, fully appropriate to cache.

**Phase B implementation latitude.** Option C is the architectural
target. If phase B finds ts-res's `ResourceManagerBuilder` does not
yet support **incremental add-after-build** (i.e. adding a new
resource to an already-built runtime without rebuilding), phase B
MAY:

- (i) Extend ts-res with an incremental-add API. Additive; in cluster
  scope per the active-development surface for `ts-prompt-assist`.
  Preferred.
- (ii) Implement a periodic rebuild strategy (e.g. rebuild on first
  miss after N misses, or amortize via builder-batch). Acceptable
  v0.1 fallback if (i) is too large for the cluster.
- (iii) Fall back to Option A (per-resolve construction with hash-
  keyed cache). Acceptable last-resort v0.1 fallback; phase B
  documents the gap in `TECH_DEBT.md` so the v0.2 cycle can pick up
  Option C.

The store interface (§4.6) is **identical** under all three paths —
plain `IStoredPromptRecord` returned. The choice is internal to
`PromptLibrary`. So evolving from a fallback to the target is
non-breaking to consumers.

**NQ-5 (revised, recorded in state.md):** "Verify ts-res's runtime
supports incremental resource add-after-build (or that adding it is
additive). If yes, lock Option C. If the add-after-build API gap is
larger than cluster scope can accommodate, phase B picks (ii) or
(iii) per the latitude above."

**Why not Option A or B (recorded so this isn't re-litigated):**

- **Option A** (per-resolve transient ts-res `Resource`) discards
  ts-res's intra-resolution caches between resolves — every resolve
  rebuilds the condition / conditionSet / decision caches from
  scratch. Wasteful, especially when prompts share qualifier axes
  (the common case).
- **Option B** (store eagerly builds per-scope ResourceManagers) puts
  ts-res construction logic into every `IPromptStore` implementation.
  Every SQL / Mongo adapter would need its own ts-res ingestion
  pipeline. Violates the brief's binding rule "Storage-agnostic via
  `IPromptStore`."
- **Option C** centralizes the ts-res integration in the library
  (one place), shares caches across all resources (best warm-cache
  behavior), and keeps the store interface plain-data
  (adapter-friendly).

### 15.6 Adjustments to earlier sections

- **§5.1 `FileTreePromptStore`:** YAML parsing via
  `@fgv/ts-extras`'s `yaml.yamlConverter<T>(inner)` packlet (per
  Erik's note: ts-extras's wrapper is a simple js-yaml wrapper not
  hoisted into ts-json-base specifically because of the dep). No new
  direct `js-yaml` dep at the ts-prompt-assist level. **NQ-2
  resolved.**
- **§10 composition semantics:** the candidate-to-ts-res handoff is
  **Option C** (lazy materialization into a shared long-lived
  ResourceManager) per §15.5. The store returns plain
  `IStoredPromptRecord`; `PromptLibrary` ingests on demand into one
  shared runtime. ts-res's intrinsic caches deliver O(1) on warm
  qualifier shapes.
- **§3.12 `IStoredPromptRecord.candidates`:** remains
  `ReadonlyArray<IPromptCandidateRecord>` (plain JSON-shaped); does
  NOT become a ts-res `Resource` or `ResourceDeclCollection` on the
  store surface. The library does the lifting at resolve time.
- **§11.2 dependencies:** `@fgv/ts-extras`'s `yaml` packlet is the
  YAML loader. No new direct `js-yaml` dep at this level.
- **NQ-1 (extractJsonText):** Erik confirms — phase B exports
  `extractJsonText` publicly from `@fgv/ts-extras/ai-assist` if
  it's currently internal. Additive in ts-extras; in cluster scope.
- **NQ-3 (IFileTreeItem path):** Erik confirms the
  `@fgv/ts-json-base/file-tree` path is correct; phase B picks up
  the exact symbol name (`FileTree.FileTreeItem` per ts-res's import
  packlet usage at `libraries/ts-res/src/packlets/import/
  importManager.ts:53` — `params.fileTree?: FileTree.FileTree`).

---

## 16. New questions surfaced (none binding-blocking)

These are minor or have Erik-confirmed dispositions; phase B picks them
up as they arise. None gate the design lock.

- **~~NQ-1 extractJsonText~~** — **resolved.** Erik approves exporting
  `extractJsonText` publicly from `@fgv/ts-extras/ai-assist` (additive
  in ts-extras; in cluster scope as a small follow-on commit).
- **~~NQ-2 YAML loader~~** — **resolved by §15 audit.** Use
  `@fgv/ts-extras`'s `yaml` packlet (`yamlConverter<T>(inner)`). It's
  a thin wrapper over js-yaml not hoisted into ts-json-base because of
  the dep; ts-prompt-assist consumes it directly.
- **~~NQ-3 IFileTreeItem~~** — **resolved.** Path is
  `@fgv/ts-json-base/file-tree` (Erik confirms). Symbol is
  `FileTree.FileTreeItem` (matches ts-res import packlet usage at
  `libraries/ts-res/src/packlets/import/importManager.ts:53`).
- **`PromptRegistry.empty()` vs `.create()`.** §4.3 ships both; the
  intent is `.empty()` is infallible (returns the instance, not
  `Result`), `.create()` is the standard fallible factory. Phase B
  may collapse to just `.create()` if the infallible path turns out
  to never be needed.
- **NQ-5 (revised) — ts-res incremental resource add-after-build.**
  §15.5 commits to **Option C** (lazy materialization into a shared
  long-lived `ResourceManager`). Phase B verifies that ts-res's
  runtime supports incremental adds (or that adding it is additive in
  cluster scope). Phase B implementation latitude is documented in
  §15.5: prefer (i) extend ts-res additively; acceptable fallbacks
  (ii) periodic-rebuild or (iii) Option A (per-resolve transient)
  with `TECH_DEBT.md` entry.
