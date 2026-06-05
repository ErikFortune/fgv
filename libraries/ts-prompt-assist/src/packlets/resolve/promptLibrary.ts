/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Hash, Logging, Normalizer, Result, captureResult, fail, mapResults, succeed } from '@fgv/ts-utils';
import { sanitizeJsonObject } from '@fgv/ts-json-base';
import {
  QualifierTypes,
  Qualifiers,
  ResourceCandidate,
  ResourceJson,
  ResourceManagerBuilder,
  ResourceTypes,
  Resources,
  Runtime
} from '@fgv/ts-res';
import { PromptId, ScopeKey, SlotName } from '../types';
import { IPromptCandidateRecord, IPromptDescriptor, IStoredPromptRecord } from '../types';
import { PromptSubstitutions } from '../types';
import {
  IPromptLibraryQualifiersInput,
  IPromptResponseBase,
  IPromptSafetyPolicy,
  IQualifierContext
} from '../types';
import {
  IBindingTraceEntry,
  ICandidateMatchTraceEntry,
  IPromptResolveTrace,
  IResolvedPrompt,
  ISafeguardFinding
} from '../types';
import { IPromptStore } from '../store';
import { IPromptRegistry } from '../registry';
import {
  IPromptObservationBase,
  IPromptObservationRecord,
  IPromptObserver,
  IPromptOutputObservation,
  IPromptResolveObservation
} from '../observe';
import { applySafeguards } from '../safeguards';
import { assertOutputValidationsCompatible, runOutputValidationPipeline } from '../output';
import { walkScopeChain } from './chainWalker';
import { IBindingMergeResult, mergeBindings } from './bindingMerger';
import { MustacheTemplateCache } from './mustacheCache';
import { joinBodies } from './candidateSelector';
import {
  IResourceBindingResolveResult,
  IResourceBindingStackFrame,
  buildCycleKey,
  formatCycleError,
  resolvePendingResourceBindings
} from './resourceBindingResolver';

/**
 * Type-level helper: derive the `TQualifierNames` string union from a mixed
 * `(string | IQualifierDecl)[]` literal-typed array. Bare-string
 * elements contribute their own string-literal type; decl elements
 * contribute their `.name` literal. Falls back to `string` when the
 * array element type is unconstrained.
 *
 * @public
 */
export type InferQualifiers<Q extends ReadonlyArray<string | Qualifiers.IQualifierDecl>> =
  Q[number] extends infer E
    ? E extends string
      ? E
      : E extends { readonly name: infer N }
      ? N extends string
        ? N
        : never
      : never
    : never;

/**
 * Type-level helper used by `PromptLibrary.create`'s decl-array
 * inference branch. When `Q` is a `ReadonlyArray<string | IQualifierDecl>`,
 * derives the `TQualifierNames` union via {@link InferQualifiers}; when `Q` is a
 * pre-built `IReadOnlyQualifierCollector`, the collector type does not
 * expose its axis-name union at the type level, so `TQualifierNames` defaults to
 * `string`.
 *
 * @public
 */
export type InferQualifiersFromCreate<
  Q extends Qualifiers.IReadOnlyQualifierCollector | ReadonlyArray<string | Qualifiers.IQualifierDecl>
> = Q extends ReadonlyArray<string | Qualifiers.IQualifierDecl> ? InferQualifiers<Q> : string;

/**
 * ts-res resource type name the library synthesizes for prompt records.
 * Prompts are stored as JSON resources with shape `\{ body: string \}`;
 * the ts-res `JsonResourceType` (from `@fgv/ts-res`'s `ResourceTypes`
 * namespace) is appropriate.
 */
const PROMPT_RESOURCE_TYPE_NAME: string = 'json';

/**
 * Default per-resolve resource-binding depth limit (design §4.1). The
 * value is wired through `IPromptLibraryCreateParams` so B-2 can
 * enforce it without reshaping the API; B-1b itself only stores the
 * value.
 */
const DEFAULT_RESOURCE_BINDING_DEPTH_LIMIT: number = 5;

/**
 * Parameters for {@link PromptLibrary.create}.
 *
 * @remarks
 * `TResponse` is the consumer-extended response union. Defaults to the open
 * `\{ kind: string \}` lower bound for consumers who only use free-text
 * output.
 *
 * @public
 */
export interface IPromptLibraryCreateParams<
  TResponse extends IPromptResponseBase = IPromptResponseBase,
  TQualifierNames extends string = string
> {
  /** Backing store. v0.1 ships `FileTreePromptStore`; consumers can implement custom adapters. */
  readonly store: IPromptStore;
  /**
   * ts-res qualifier configuration. Accepts either a pre-built
   * `IReadOnlyQualifierCollector` (when the consumer already maintains a
   * ts-res qualifier set) or a mixed array of bare axis-name strings
   * and / or `IQualifierDecl`s (the library builds the collector
   * internally via ts-res's `Qualifiers.QualifierCollector.create`,
   * which synthesizes `LiteralQualifierType`s for bare strings). REQUIRED
   * per design §4.1.
   *
   * @remarks
   * On the decl-array path, the `TQualifierNames` type parameter is inferred
   * from the array element types via the static `PromptLibrary.create`
   * factory — e.g. `\{ qualifiers: ['language', 'tone'] \}` infers
   * `TQualifierNames = 'language' | 'tone'` and tightens
   * `IPromptResolveRequest.qualifiers` accordingly. On the
   * pre-built-collector path, `TQualifierNames` falls back to `string`; consumers
   * can specify it explicitly if they want the typed benefit on that
   * path.
   */
  readonly qualifiers: IPromptLibraryQualifiersInput<TQualifierNames>;
  /**
   * Optional ts-res qualifier-type collector. When `qualifiers` is
   * supplied as a pre-built `IReadOnlyQualifierCollector`, this is
   * inferred from it. When `qualifiers` is supplied as decls and any
   * element is an `IQualifierDecl`, `qualifierTypes` must supply the
   * qualifier types referenced by those decls. Bare-string elements
   * synthesize a `LiteralQualifierType` automatically.
   */
  readonly qualifierTypes?: QualifierTypes.ReadOnlyQualifierTypeCollector;
  /** Unified registry. Optional; defaults to an empty registry. */
  readonly registry?: IPromptRegistry<TResponse>;
  /**
   * Optional ts-res cache listener. Receives condition / conditionSet /
   * decision cache hit/miss/error/clear events from the underlying
   * `ResourceResolver`. When omitted, the library installs no listener.
   */
  readonly cacheListener?: Runtime.IResourceResolverCacheListener;
  /**
   * Diagnostic logger. Defaults to `Logging.NoOpLogger`. B-1b wires the
   * parameter but does not emit events yet; B-2 / B-4 will populate
   * resource-binding entry/exit, cache events, and safeguard findings
   * per design §4.1.
   */
  readonly logger?: Logging.ILogger;
  /**
   * Default 5. Resource bindings exceeding this depth fail loudly in
   * B-2. B-1b wires the parameter so consumers can pin the value before
   * B-2 lands.
   */
  readonly resourceBindingDepthLimit?: number;
  /** Default 256. LRU cap on parsed Mustache templates. */
  readonly templateCacheSize?: number;
  /**
   * Optional safety policy per design §4.4. When omitted, no global
   * defaultMaxLength applies (per-slot and per-descriptor caps still do),
   * no regex screening runs, and no anti-jailbreak preface is injected.
   */
  readonly safetyPolicy?: IPromptSafetyPolicy;
  /**
   * Optional observers fired once per public `resolve` / `resolveJsonOutput` /
   * `resolveFreeTextOutput` call (never for nested resource-binding resolves).
   * Purely additive — when absent, no observation records are produced and
   * existing behavior is unchanged. Observer errors never affect the resolve
   * result; they are swallowed and logged to {@link IPromptLibraryCreateParams.logger | logger}
   * at `warn`. See {@link IPromptObserver} and {@link PromptObservationStore}.
   */
  readonly observers?: ReadonlyArray<IPromptObserver>;
}

/**
 * Resolve request supplied to {@link PromptLibrary.resolve},
 * {@link PromptLibrary.resolveJsonOutput}, and
 * {@link PromptLibrary.resolveFreeTextOutput}.
 * @public
 */
export interface IPromptResolveRequest<TQualifierNames extends string = string> {
  /** Prompt id to resolve. */
  readonly id: PromptId;
  /** Scope chain — most-specific to most-general. The walker uses the first scope with a record. */
  readonly chain: ReadonlyArray<ScopeKey>;
  /**
   * Caller-supplied qualifier context, fed to ts-res's candidate selector.
   *
   * @remarks
   * Defaults to the loose shape `Readonly<Partial<Record<string, string>>>`
   * (identical to {@link IQualifierContext}) so legacy callers compile
   * unchanged. When `TQualifierNames` is narrowed (typically via inference on
   * `PromptLibrary.create` with a string-literal decl array), this
   * narrows to `Readonly<Partial<Record<TQualifierNames, string>>>`, surfacing
   * misspelled qualifier-axis names at compile time.
   */
  readonly qualifiers: Readonly<Partial<Record<TQualifierNames, string>>>;
  /** Optional caller substitutions, applied to slots not locked by an `enforced` scope binding. */
  readonly substitutions?: PromptSubstitutions;
}

/**
 * Internal record of a materialized ts-res resource for a given prompt
 * record. Built lazily on first resolve of `(scope, id, candidate-hash)`.
 */
interface IMaterializedPrompt {
  readonly synthId: string;
  readonly resource: Resources.Resource;
  /**
   * Map from each ts-res `ResourceCandidate` (by reference identity) to
   * the original index in the prompt record's `candidates` array. ts-res
   * sorts its built `resource.candidates` by priority, not insertion
   * order — the map preserves the descriptor's authored order so trace
   * entries cite the correct candidate index.
   */
  readonly candidateOriginIndex: ReadonlyMap<ResourceCandidate, number>;
}

/**
 * Main entry point per design §4.1.
 *
 * @remarks
 * Generic over `TResponse extends \{ kind: string \}` so the JSON output
 * pipeline (B-4) wires up without any cast.
 *
 * Holds one long-lived ts-res `ResourceManagerBuilder` (imported from
 * `@fgv/ts-res`) for the lifetime of the instance (per design
 * §15.5 Option C / §17.1). Prompt records materialize into the builder
 * on first resolve via `addLooseCandidate`; subsequent resolves reuse
 * the cached materialization and ride ts-res's intrinsic O(1)
 * condition / conditionSet / decision caches.
 *
 * @public
 */
export class PromptLibrary<
  TResponse extends IPromptResponseBase = IPromptResponseBase,
  TQualifierNames extends string = string
> {
  private readonly _store: IPromptStore;
  private readonly _registry?: IPromptRegistry<TResponse>;
  private readonly _mustacheCache: MustacheTemplateCache;
  private readonly _descriptorCache: Map<string, IPromptDescriptor>;
  private readonly _qualifierCollector: Qualifiers.IReadOnlyQualifierCollector;
  private readonly _qualifierTypes: QualifierTypes.ReadOnlyQualifierTypeCollector;
  private readonly _builder: ResourceManagerBuilder;
  private readonly _materialized: Map<string, IMaterializedPrompt>;
  /**
   * Synth-resource-id reservations keyed by the same canonical cache
   * key the `_materialized` map uses. Populated BEFORE the first
   * materialization attempt for a key and never overwritten on
   * subsequent retries, so a malformed record that fails mid-walk reuses
   * the same synth id on every retry. This bounds the orphan-resource
   * count in the long-lived `_builder` to one per distinct malformed
   * canonical key, rather than one per retry attempt.
   */
  private readonly _synthIdByKey: Map<string, string>;
  /**
   * Normalizer used to compute RFC 8785 canonical-JSON strings for true
   * structural equality. Used for descriptor cross-scope equality checks
   * in `_populateDescriptorCache`, for the materialized-resource cache
   * key, and for resource-binding cycle-detection keys. No hash function
   * participates — equality of canonical-JSON strings is exact structural
   * equality, so the base `Normalizer` (canonicalize only) is the right
   * primitive.
   */
  private readonly _normalizer: Normalizer;
  /**
   * Monotonic counter feeding the synthesized ts-res resource id
   * (`prompt_<n>`). Sequential ids guarantee no collisions across
   * materialized prompts, so distinct records never share a ts-res
   * resource.
   */
  private _nextSynthIdSerial: number;
  private readonly _cacheListener?: Runtime.IResourceResolverCacheListener;
  private readonly _safetyPolicy?: IPromptSafetyPolicy;
  /**
   * Observers fired once per public resolve / output call. Empty when the
   * consumer supplied none — the fan-out fast-paths out without allocating.
   */
  private readonly _observers: ReadonlyArray<IPromptObserver>;
  /**
   * Per-instance monotonic counter feeding every observation record's `seq`.
   * A single authority (not per-store) so a `'resolve'` record and its linked
   * `'json-output'` / `'free-text-output'` record share a consistent `seq`
   * space across every observer the record fans out to — which is what makes
   * `IPromptOutputObservation.linkedResolveSeq` correlation work.
   */
  private _nextObservationSeq: number;
  /**
   * Injected clock stamping observation records. Private (not a `create`
   * param) so the additive DI surface stays a single `observers?` field.
   */
  private readonly _observationNow: () => number;
  /**
   * Set of RFC 8785 canonical-JSON keys for descriptors that have
   * already passed the loader-side compatibility check (see
   * `assertOutputValidationsCompatible` in the `output` packlet).
   * Keying by canonical content (NOT prompt id) makes the cache
   * immune to a same-id-different-descriptor scenario across
   * scopes — different descriptors produce different keys; a
   * subsequent descriptor revision is automatically a cache miss.
   * Invoked from both `describe` and `resolve` (and indirectly from
   * `resolveJsonOutput` / `resolveFreeTextOutput` via `resolve`), so
   * the cache amortises across all entry points.
   */
  private readonly _validatedRegistryKeys: Set<string>;
  /**
   * Per-instance resource-binding depth limit. Exposed as public readonly
   * so B-2's recursive resource-binding resolver can pin against the
   * same value the consumer supplied.
   */
  public readonly resourceBindingDepthLimit: number;
  /**
   * Diagnostic logger. Exposed as public readonly so internal helpers
   * (and B-2 / B-4 follow-ons) can emit events without re-threading the
   * value through every API.
   */
  public readonly logger: Logging.ILogger;

  private constructor(params: {
    readonly store: IPromptStore;
    readonly registry?: IPromptRegistry<TResponse>;
    readonly mustacheCache: MustacheTemplateCache;
    readonly qualifierCollector: Qualifiers.IReadOnlyQualifierCollector;
    readonly qualifierTypes: QualifierTypes.ReadOnlyQualifierTypeCollector;
    readonly builder: ResourceManagerBuilder;
    readonly cacheListener?: Runtime.IResourceResolverCacheListener;
    readonly logger: Logging.ILogger;
    readonly resourceBindingDepthLimit: number;
    readonly safetyPolicy?: IPromptSafetyPolicy;
    readonly observers: ReadonlyArray<IPromptObserver>;
  }) {
    this._store = params.store;
    this._registry = params.registry;
    this._mustacheCache = params.mustacheCache;
    this._descriptorCache = new Map();
    this._qualifierCollector = params.qualifierCollector;
    this._qualifierTypes = params.qualifierTypes;
    this._builder = params.builder;
    this._materialized = new Map();
    this._synthIdByKey = new Map();
    this._normalizer = new Normalizer();
    this._nextSynthIdSerial = 0;
    this._cacheListener = params.cacheListener;
    this.logger = params.logger;
    this.resourceBindingDepthLimit = params.resourceBindingDepthLimit;
    this._safetyPolicy = params.safetyPolicy;
    this._validatedRegistryKeys = new Set();
    this._observers = params.observers;
    this._nextObservationSeq = 0;
    this._observationNow = () => Date.now();
  }

  /**
   * Family-convention factory.
   *
   * @remarks
   * Two overloads:
   *
   * 1. **Decl-array inference**: when `qualifiers` is supplied as a
   *    `ReadonlyArray<string | IQualifierDecl>`, `TQualifierNames` is inferred
   *    from the array element types. Bare-string elements contribute
   *    their string-literal type directly; `IQualifierDecl` elements
   *    contribute their `name` literal. A call like
   *    `PromptLibrary.create(\{ qualifiers: ['language', 'tone'] \})`
   *    infers `TQualifierNames = 'language' | 'tone'` so the request side rejects
   *    `\{ tonr: 'formal' \}` at compile time.
   *
   * 2. **Pre-built collector**: when `qualifiers` is a
   *    `IReadOnlyQualifierCollector`, the collector type does not
   *    expose its axis-name union at the type level, so `TQualifierNames`
   *    defaults to `string`. Consumers wanting the typed benefit on
   *    this path can specify `TQualifierNames` explicitly.
   */
  public static async create<
    TResponse extends IPromptResponseBase = IPromptResponseBase,
    const Q extends
      | Qualifiers.IReadOnlyQualifierCollector
      | ReadonlyArray<string | Qualifiers.IQualifierDecl> =
      | Qualifiers.IReadOnlyQualifierCollector
      | ReadonlyArray<string | Qualifiers.IQualifierDecl>
  >(
    params: IPromptLibraryCreateParams<TResponse, InferQualifiersFromCreate<Q>> & {
      readonly qualifiers: Q;
    }
  ): Promise<Result<PromptLibrary<TResponse, InferQualifiersFromCreate<Q>>>>;
  public static async create<TResponse extends IPromptResponseBase = IPromptResponseBase>(
    params: IPromptLibraryCreateParams<TResponse, string>
  ): Promise<Result<PromptLibrary<TResponse, string>>> {
    return Promise.resolve(
      validateResourceBindingDepthLimit(params.resourceBindingDepthLimit).onSuccess((depthLimit) =>
        buildQualifierCollector(params.qualifiers, params.qualifierTypes).onSuccess((qualifierInfo) =>
          buildResourceTypes().onSuccess((resourceTypes) =>
            ResourceManagerBuilder.create({
              qualifiers: qualifierInfo.qualifiers,
              resourceTypes
            })
              .withErrorFormat((msg) => `prompt library: failed to build ts-res manager: ${msg}`)
              .onSuccess((builder) =>
                MustacheTemplateCache.create(params.templateCacheSize).onSuccess((mustacheCache) =>
                  succeed(
                    new PromptLibrary<TResponse, string>({
                      store: params.store,
                      registry: params.registry,
                      mustacheCache,
                      qualifierCollector: qualifierInfo.qualifiers,
                      qualifierTypes: qualifierInfo.qualifierTypes,
                      builder,
                      cacheListener: params.cacheListener,
                      logger: params.logger ?? new Logging.NoOpLogger(),
                      resourceBindingDepthLimit: depthLimit,
                      safetyPolicy: params.safetyPolicy,
                      observers: params.observers ?? []
                    })
                  )
                )
              )
          )
        )
      )
    );
  }

  /**
   * Returns the descriptor for a prompt by id, searching across all scopes.
   * Convenience for editor surfaces that don't want to specify a scope chain.
   *
   * @remarks
   * Cache key is `id` alone. To honor the design's invariant that
   * descriptors for the same id are identical across scopes, the load-
   * time check validates that all `store.list({ id })` entries are
   * structurally equal (via RFC 8785 canonical-JSON) and fails loudly on
   * drift. The cache survives subsequent calls; consumers wanting to
   * drop an entry (e.g. after a write through a future write-capable
   * adapter) call {@link PromptLibrary.invalidateDescriptor}.
   */
  public async describe(id: PromptId): Promise<Result<IPromptDescriptor>> {
    const cached = this._descriptorCache.get(id);
    if (cached !== undefined) {
      return succeed(cached);
    }
    return (await this._store.list({ id }))
      .withErrorFormat((msg) => `prompt '${id}': store.list failed: ${msg}`)
      .onSuccess((list) => this._populateDescriptorCache(id, list));
  }

  /**
   * Drops the descriptor cache entry for `id`. Intended for consumers
   * driving a future write-capable adapter; the v0.1 read-only
   * `FileTreePromptStore` never needs this.
   */
  public invalidateDescriptor(id: PromptId): void {
    this._descriptorCache.delete(id);
  }

  /**
   * Number of prompt records currently materialized into the long-lived
   * ts-res builder. Mirrors the observability surface ts-res exposes
   * for its own caches; useful for editor surfaces and tests that need
   * to verify materialization deduplication is working.
   */
  public get materializedCount(): number {
    return this._materialized.size;
  }

  /**
   * Resolves a prompt against the supplied chain + qualifier context +
   * caller substitutions. Returns the rendered body plus full trace.
   *
   * @remarks
   * Resource bindings declared on the resolved record are recursively
   * resolved (depth-capped per {@link PromptLibrary.resourceBindingDepthLimit}; cycle-
   * detected via RFC 8785 canonical-JSON keys on
   * `\{ chain, id \}` pairs). The inner resolves flow through the same
   * long-lived ts-res `ResourceManagerBuilder` so materialization caches
   * hit across the recursion.
   */
  public async resolve(req: IPromptResolveRequest<TQualifierNames>): Promise<Result<IResolvedPrompt>> {
    return (await this._resolveObserved(req)).result;
  }

  /**
   * Runs the depth-0 resolve and fires the single `'resolve'` observation
   * (success or failure), returning both the result and the observation's
   * `seq` so the output methods can cross-link their own records via
   * `linkedResolveSeq`. The observation fires here — at the public-method
   * boundary — never inside the re-entrant `_resolveInternal`, so nested
   * resource-binding resolves roll up under the outer record's
   * `trace.resourceBindingResolutions[].innerTrace` rather than firing their
   * own observation.
   */
  private async _resolveObserved(req: IPromptResolveRequest<string>): Promise<{
    readonly result: Result<IResolvedPrompt>;
    readonly resolveSeq: number;
    readonly resolveDurationMs: number;
  }> {
    // Pay nothing in the additive-default (no-observers) path: skip the clock
    // reads and record build entirely.
    const observing = this._observers.length > 0;
    const startedAt = observing ? this._observationNow() : 0;
    const result = await this._resolveInternal(req, 0, []);
    if (!observing) {
      return { result, resolveSeq: 0, resolveDurationMs: 0 };
    }
    // Capture the resolve-computation duration BEFORE awaiting observer
    // dispatch, so the reported `durationMs` reflects only the computation
    // (matching the documented `IPromptObservationBase.durationMs` semantic).
    // Output observations downstream fold this duration into their own
    // duration without double-counting observer-dispatch latency.
    const resolveDurationMs = this._observationNow() - startedAt;
    const record = this._buildResolveObservation(req, result, resolveDurationMs);
    await this._observe(record);
    return { result, resolveSeq: record.seq, resolveDurationMs };
  }

  /**
   * Wide-shape internal resolve. The public {@link PromptLibrary.resolve}
   * entry accepts `IPromptResolveRequest<TQualifierNames>` — the typed
   * `TQualifierNames` belongs at the public API where the caller commits
   * to a context shape. Private internals (here and downstream:
   * `_resolveOnce`, `_resolveResourceBindings`, `_renderResolved`) take
   * the wide `IPromptResolveRequest<string>` because ts-res's resolver
   * consumes qualifier values as a plain string-keyed map regardless of
   * the public `TQualifierNames` parameter — and because the resource-
   * binding inner-resolve path re-enters this method with the wider
   * shape from `resourceBindingResolver` (which has no `TQualifierNames`).
   * The public typed shape assigns cleanly to this wider shape
   * (`Partial<Record<TQualifierNames, string>>` is a subtype of
   * `Partial<Record<string, string>>`), so no cast is needed at the
   * public-API boundary OR at the resource-binding re-entry boundary.
   */
  private async _resolveInternal(
    req: IPromptResolveRequest<string>,
    depth: number,
    stack: IResourceBindingStackFrame[]
  ): Promise<Result<IResolvedPrompt>> {
    if (depth > this.resourceBindingDepthLimit) {
      return fail(
        `prompt '${req.id}': resource binding depth limit (${this.resourceBindingDepthLimit}) exceeded`
      );
    }
    const keyResult = buildCycleKey(this._normalizer, req.chain, req.id);
    /* c8 ignore next 6 - defensive: canonicalize on a sanitized chain/id pair does not fail for any input the type system allows */
    if (keyResult.isFailure()) {
      return fail(`prompt '${req.id}': failed to build cycle-detection key: ${keyResult.message}`);
    }
    const key = keyResult.value;
    if (stack.some((f) => f.key === key)) {
      // The cycle branch is only reached when the stack already has at
      // least one frame, so `stack[0]` is defined — the outermost prompt
      // (the original public-`resolve` request) is what the error cites.
      return fail(formatCycleError(stack[0].id, stack, req.id));
    }
    stack.push({ key, id: req.id });
    try {
      return await this._resolveOnce(req, depth, stack);
    } finally {
      stack.pop();
    }
  }

  private async _resolveOnce(
    req: IPromptResolveRequest<string>,
    depth: number,
    stack: IResourceBindingStackFrame[]
  ): Promise<Result<IResolvedPrompt>> {
    return (await walkScopeChain(this._store, req.id, req.chain))
      .onSuccess((walked) =>
        this._validateAgainstRegistry(walked.record.descriptor).onSuccess(() => succeed(walked))
      )
      .onSuccess((walked) =>
        mergeBindings(req.chain, walked.scopeBindings, walked.record.descriptor.slots, req.substitutions)
          .withErrorFormat((msg) => `prompt '${req.id}': ${msg}`)
          .onSuccess((mergeResult) => succeed({ walked, mergeResult } as const))
      )
      .thenOnSuccess(async ({ walked, mergeResult }) =>
        (await this._resolveResourceBindings(req, mergeResult, depth, stack)).onSuccess((rb) =>
          succeed({ walked, mergeResult, rb } as const)
        )
      )
      .thenOnSuccess(async ({ walked, mergeResult, rb }) =>
        this._materializeIfNeeded(walked.record)
          .onSuccess((materialized) =>
            this._resolveCandidates(walked.winningScope, req.id, walked.record, materialized, req.qualifiers)
          )
          .thenOnSuccess(async (matches) => this._renderResolved(req, walked, mergeResult, matches, rb))
      );
  }

  private async _resolveResourceBindings(
    req: IPromptResolveRequest<string>,
    mergeResult: IBindingMergeResult,
    depth: number,
    stack: IResourceBindingStackFrame[]
  ): Promise<Result<IResourceBindingResolveResult>> {
    if (mergeResult.pendingResourceBindings.length === 0) {
      return succeed({ traceEntries: [], rewrites: new Map<SlotName, string>() });
    }
    return resolvePendingResourceBindings({
      pending: mergeResult.pendingResourceBindings,
      outerChain: req.chain,
      outerQualifiers: req.qualifiers,
      outerSubstitutions: req.substitutions,
      outerId: req.id,
      depth,
      stack,
      // `innerReq.qualifiers` already has the wide shape
      // `Readonly<Partial<Record<string, string>>>`, which matches the
      // widened `_resolveInternal` signature directly — no cast needed.
      innerResolve: (innerReq, innerDepth, innerStack) =>
        this._resolveInternal(innerReq, innerDepth, innerStack)
    });
  }

  /**
   * Resolves a prompt and validates the LLM's raw JSON output against the
   * descriptor's `'json'` output contract.
   *
   * @remarks
   * Runtime-verifies the resolved descriptor's `output.kind === 'json'`
   * AND that `descriptor.output.converterId`'s recorded producing kind
   * equals the supplied `expectedKind` literal. Either failure rejects
   * with a clear error citing the prompt id plus the actual-vs-expected
   * kinds — there is no caller-asserted `T` boundary on this method.
   *
   * On success, the pipeline strips fences via
   * `AiAssist.fencedStringifiedJson` (from `@fgv/ts-extras`), parses JSON,
   * dispatches through the registered Converter looked up by
   * `(converterId, kind)`, and runs the descriptor's typed validator
   * chain. Per design §17.2.4 the chain enforces a belt-and-suspenders
   * kind check: the loader-side compatibility check rejected drift at
   * descriptor load (belt — invoked from `resolve` / `describe`); each
   * validator additionally re-checks `value.kind` against its `appliesTo`
   * at the point of invocation (suspenders).
   *
   * @param req - The resolve request — id, scope chain, qualifier
   * context, and optional substitutions.
   * @param rawOutput - The raw LLM response string.
   * @param expectedKind - The response-union discriminator the descriptor
   * is expected to produce. `K` is inferred from the literal argument;
   * the return type narrows to `Extract<TResponse, \{ kind: K \}>`
   * automatically.
   * @returns On success, the validated response narrowed to the
   * `TResponse` member discriminated by `K`. On failure, a `Result.fail`
   * carrying the prompt id + stage that failed.
   *
   * @public
   */
  public async resolveJsonOutput<K extends TResponse['kind']>(
    req: IPromptResolveRequest<TQualifierNames>,
    rawOutput: string,
    expectedKind: K
  ): Promise<Result<Extract<TResponse, { kind: K }>>> {
    const observing = this._observers.length > 0;
    const { result: resolveResult, resolveSeq, resolveDurationMs } = await this._resolveObserved(req);
    // Output-phase timer starts AFTER _resolveObserved returns so the resolve
    // record's observer-dispatch latency doesn't leak into the output record's
    // durationMs. The output record's reported duration is resolveDurationMs +
    // (now - outputStartedAt) — the computation time across both phases,
    // excluding observer dispatch.
    const outputStartedAt = observing ? this._observationNow() : 0;
    const outcome = resolveResult.onSuccess((resolved) => {
      const output = resolved.descriptor.output;
      if (output.kind !== 'json') {
        return fail<Extract<TResponse, { kind: K }>>(
          `prompt '${req.id}': resolveJsonOutput called on a descriptor whose output.kind is '${output.kind}' (expected 'json')`
        );
      }
      const registry = this._registry;
      if (registry === undefined) {
        return fail<Extract<TResponse, { kind: K }>>(
          `prompt '${req.id}': output.kind 'json' requires a registry; none supplied to PromptLibrary.create`
        );
      }
      return registry.converters
        .getKind(output.converterId)
        .withErrorFormat((msg) => `prompt '${req.id}': output.converterId '${output.converterId}': ${msg}`)
        .onSuccess<Extract<TResponse, { kind: K }>>((producingKind) => {
          if (producingKind !== expectedKind) {
            return fail(
              `prompt '${req.id}': output.converterId '${output.converterId}' produces kind '${producingKind}'; resolveJsonOutput was called with expectedKind '${expectedKind}'`
            );
          }
          return runOutputValidationPipeline<TResponse>({
            descriptor: resolved.descriptor,
            contract: output,
            registry,
            rawOutput,
            substitutions: resolved.trace.mergedBindings
          }).onSuccess((value) => {
            // Localized typed narrow — NOT `as unknown as ...`. Runtime
            // evidence: `producingKind === expectedKind` checked above
            // means the Converter's recorded kind equals `K`. The
            // pipeline's belt + suspenders re-verify that the runtime
            // `value.kind` matches each validator's `appliesTo`, so a
            // Converter that lies about its produced kind fails at the
            // suspenders inside `runOutputValidationPipeline` before
            // reaching here. Any value that arrives is structurally
            // compatible with the narrowed union member.
            return succeed(value as Extract<TResponse, { kind: K }>);
          });
        });
    });
    if (observing) {
      await this._observeOutput(
        req,
        'json-output',
        rawOutput,
        outcome,
        resolveSeq,
        resolveDurationMs + (this._observationNow() - outputStartedAt)
      );
    }
    return outcome;
  }

  /**
   * Resolves a prompt and returns the LLM's raw free-text output verbatim.
   *
   * @remarks
   * Runtime-verifies the resolved descriptor's `output.kind === 'free-text'`.
   * If the descriptor declares `'json'` output, rejects with a clear error
   * citing the prompt id and actual kind — the caller is using the wrong
   * method.
   *
   * Per design §8 the library does not run output validation on free-text
   * in v0.1; the descriptor Converter already rejected free-text
   * descriptors that declare `outputValidations`, so there is no validator
   * chain to run here. The raw output is returned verbatim.
   *
   * @param req - The resolve request — id, scope chain, qualifier
   * context, and optional substitutions.
   * @param rawOutput - The raw LLM response string.
   * @returns On success, `rawOutput` verbatim. On failure, a `Result.fail`
   * carrying the prompt id + reason.
   *
   * @public
   */
  public async resolveFreeTextOutput(
    req: IPromptResolveRequest<TQualifierNames>,
    rawOutput: string
  ): Promise<Result<string>> {
    const observing = this._observers.length > 0;
    const { result: resolveResult, resolveSeq, resolveDurationMs } = await this._resolveObserved(req);
    // Output-phase timer starts AFTER _resolveObserved returns; see the
    // matching block in `resolveJsonOutput` for the durationMs semantic.
    const outputStartedAt = observing ? this._observationNow() : 0;
    const outcome = resolveResult.onSuccess((resolved) => {
      const output = resolved.descriptor.output;
      if (output.kind !== 'free-text') {
        return fail<string>(
          `prompt '${req.id}': resolveFreeTextOutput called on a descriptor whose output.kind is '${output.kind}' (expected 'free-text')`
        );
      }
      return succeed(rawOutput);
    });
    if (observing) {
      await this._observeOutput(
        req,
        'free-text-output',
        rawOutput,
        outcome,
        resolveSeq,
        resolveDurationMs + (this._observationNow() - outputStartedAt)
      );
    }
    return outcome;
  }

  private _populateDescriptorCache(
    id: PromptId,
    list: ReadonlyArray<IStoredPromptRecord>
  ): Result<IPromptDescriptor> {
    if (list.length === 0) {
      return fail(`prompt '${id}': not found in any scope`);
    }
    const first = list[0];
    // Use RFC 8785 canonical-JSON strings (not CRC32 hashes) for the
    // cross-scope equality check. CRC32 is not collision-resistant, so
    // two structurally-different descriptors could share a hash and the
    // id-only `_descriptorCache` would silently return the wrong
    // descriptor for one of the scopes. Canonical-JSON comparison is
    // exact: equal strings ⇔ structurally-equal values.
    //
    // Sanitize through `JSON.parse(JSON.stringify(...))` first so an
    // in-memory descriptor with explicit-`undefined` optional fields
    // (TypeScript-valid but not JSON-representable) doesn't trip
    // `canonicalize`'s "cannot serialize undefined" guard.
    return this._descriptorCanonical(first.descriptor)
      .withErrorFormat((msg) => `prompt '${id}': failed to canonicalize descriptor: ${msg}`)
      .onSuccess((firstCanonical) => {
        for (let i = 1; i < list.length; i++) {
          const result = this._descriptorCanonical(list[i].descriptor).withErrorFormat(
            (msg) => `prompt '${id}': failed to canonicalize descriptor: ${msg}`
          );
          /* c8 ignore next 3 - defensive: canonicalize after sanitize does not fail for any descriptor shape produced by descriptorConverter */
          if (result.isFailure()) {
            return fail<IPromptDescriptor>(result.message);
          }
          if (result.value !== firstCanonical) {
            return fail<IPromptDescriptor>(
              `prompt '${id}': descriptors at scopes '${first.scope}' and '${list[i].scope}' are not structurally equal; descriptor must be identical across all scopes that carry the id`
            );
          }
        }
        return this._validateAgainstRegistry(first.descriptor).onSuccess(() => {
          this._descriptorCache.set(id, first.descriptor);
          return succeed(first.descriptor);
        });
      });
  }

  private _descriptorCanonical(descriptor: IPromptDescriptor): Result<string> {
    return sanitizeJsonObject(descriptor).onSuccess((sanitized) => this._normalizer.canonicalize(sanitized));
  }

  private _materializeIfNeeded(record: IStoredPromptRecord): Result<IMaterializedPrompt> {
    // Materialization-cache key uses RFC 8785 canonical-JSON over
    // (scope, id, candidates). String equality of canonical-JSON is
    // exact structural equality — no false positives from CRC32
    // collisions across distinct records. Synth resource ids are
    // sequential, not content-derived, so distinct records never share
    // a ts-res resource even when their cache keys happen to share
    // bytes.
    // Sanitize before canonicalize so in-memory records with
    // explicit-`undefined` optional fields (e.g. an authored
    // `IPromptCandidateRecord.isPartial: undefined`) don't trip
    // `canonicalize`'s rejection of `undefined`.
    return sanitizeJsonObject({ scope: record.scope, id: record.id, candidates: record.candidates })
      .onSuccess((sanitized) => this._normalizer.canonicalize(sanitized))
      .withErrorFormat((msg) => `prompt '${record.id}' scope '${record.scope}': canonicalize failed: ${msg}`)
      .onSuccess((cacheKey) => {
        const cached = this._materialized.get(cacheKey);
        if (cached !== undefined) {
          return succeed(cached);
        }
        // Reserve (or reuse) the synth id for this cache key BEFORE
        // attempting materialization. If the materialization fails
        // mid-walk and the caller retries, we want the same synth id
        // both times so ts-res's per-candidate dedup (by condition-set
        // key) makes retries idempotent. Without the reservation, every
        // retry would allocate a new id and leave another orphan
        // resource in the long-lived builder.
        let synthId = this._synthIdByKey.get(cacheKey);
        if (synthId === undefined) {
          synthId = `prompt_${this._nextSynthIdSerial++}`;
          this._synthIdByKey.set(cacheKey, synthId);
        }
        return this._addCandidatesToBuilder(record, synthId).onSuccess((candidateOriginIndex) =>
          this._builder
            .getBuiltResource(synthId)
            .withErrorFormat(
              (msg) => `prompt '${record.id}' scope '${record.scope}': ts-res build failed: ${msg}`
            )
            .onSuccess((resource) => {
              const entry: IMaterializedPrompt = {
                synthId,
                resource,
                candidateOriginIndex
              };
              this._materialized.set(cacheKey, entry);
              return succeed(entry);
            })
        );
      });
  }

  private _addCandidatesToBuilder(
    record: IStoredPromptRecord,
    synthId: string
  ): Result<ReadonlyMap<ResourceCandidate, number>> {
    // Two-phase materialization. Phase 1 validates each candidate's
    // condition-set declaration shape (no builder mutation) AND every
    // condition's qualifier name is registered in the library's
    // qualifier collector. Phase 2 commits the pre-validated decls via
    // `addLooseCandidate` sequentially. Together these foreclose the
    // dominant phase-2 failure mode — unknown-qualifier errors after
    // earlier candidates already committed — so a malformed record
    // never leaves orphan candidates / conditions / decisions behind
    // in the long-lived builder. (Residual mid-phase-2 failures from
    // internal ts-res errors remain possible but rare; the synth-id
    // reservation map keeps retries from compounding.)
    return mapResults(
      record.candidates.map((candidate, index) =>
        toLooseDecl(candidate, synthId, index).onSuccess((decl) =>
          this._validateDeclQualifiers(decl, record.id, index).onSuccess(() => succeed(decl))
        )
      )
    ).onSuccess((decls) => this._commitDecls(record, decls));
  }

  private _validateDeclQualifiers(
    decl: ResourceJson.Json.ILooseResourceCandidateDecl,
    promptId: PromptId,
    index: number
  ): Result<true> {
    // `toLooseDecl` ran `ResourceJson.Convert.conditionSetDecl.convert`
    // which always returns the normalized array form, so the union
    // type's record branch is unreachable here. Narrow with
    // `Array.isArray` rather than asserting.
    const conditions = decl.conditions;
    /* c8 ignore next 3 - defensive: `ResourceJson.Convert.conditionSetDecl` always normalizes to the array form; this branch guards the union-type's record/undefined arm that callers can no longer produce here */
    if (conditions === undefined || !Array.isArray(conditions)) {
      return succeed(true as const);
    }
    for (const condition of conditions) {
      if (!this._qualifierCollector.hasNameOrToken(condition.qualifierName)) {
        return fail(
          `prompt '${promptId}' candidate ${index}: unknown qualifier '${condition.qualifierName}'`
        );
      }
    }
    return succeed(true as const);
  }

  private _commitDecls(
    record: IStoredPromptRecord,
    decls: ReadonlyArray<ResourceJson.Json.ILooseResourceCandidateDecl>
  ): Result<ReadonlyMap<ResourceCandidate, number>> {
    const map = new Map<ResourceCandidate, number>();
    for (let index = 0; index < decls.length; index++) {
      const addResult = this._builder
        .addLooseCandidate(decls[index])
        .asResult.withErrorFormat(
          (msg) => `prompt '${record.id}' candidate ${index}: addLooseCandidate failed: ${msg}`
        );
      /* c8 ignore next 3 - defensive: phase-1 pre-validates qualifier names against the registered collector, so `addLooseCandidate` only fails here on internal ts-res errors (which the test suite cannot reliably provoke) */
      if (addResult.isFailure()) {
        return fail(addResult.message);
      }
      // ts-res dedupes candidates with identical condition sets — if
      // the author wrote two candidates whose conditions collapse to
      // the same key, the second `addLooseCandidate` call returns the
      // first one. Keep the FIRST authored origin index so the trace
      // points to the candidate that actually wins ts-res's dedupe.
      if (!map.has(addResult.value)) {
        map.set(addResult.value, index);
      }
    }
    return succeed(map);
  }

  private _resolveCandidates(
    scope: ScopeKey,
    promptId: PromptId,
    record: IStoredPromptRecord,
    materialized: IMaterializedPrompt,
    qualifiers: IQualifierContext
  ): Result<
    ReadonlyArray<{
      readonly candidate: IPromptCandidateRecord;
      readonly index: number;
      readonly matchType: 'match' | 'matchAsDefault';
      readonly conditions: ReadonlyArray<Runtime.IConditionMatchResult>;
    }>
  > {
    return Runtime.ValidatingSimpleContextQualifierProvider.create({
      qualifiers: this._qualifierCollector,
      qualifierValues: { ...qualifiers }
    })
      .withErrorFormat((msg) => `prompt '${promptId}' scope '${scope}': qualifier context invalid: ${msg}`)
      .onSuccess((contextProvider) =>
        Runtime.ResourceResolver.create({
          resourceManager: this._builder,
          qualifierTypes: this._qualifierTypes,
          contextQualifierProvider: contextProvider,
          listener: this._cacheListener
        })
          .withErrorFormat((msg) => `prompt '${promptId}' scope '${scope}': resolver creation failed: ${msg}`)
          .onSuccess((resolver) =>
            resolver
              .resolveDecision(materialized.resource.decision.baseDecision)
              /* c8 ignore next 4 - defensive: resolveDecision failures map to "no candidate matched" via the empty-indices branch in projectMatches; an outright failure requires an internal ts-res error */
              .withErrorFormat(
                (msg) => `prompt '${promptId}' scope '${scope}': decision resolution failed: ${msg}`
              )
              .onSuccess((resolution) =>
                projectMatches(scope, promptId, record, materialized, resolution, resolver)
              )
          )
      );
  }

  private _validateAgainstRegistry(descriptor: IPromptDescriptor): Result<true> {
    // Cache key is the descriptor's RFC 8785 canonical-JSON (NOT the
    // prompt id). Caching by id alone would let one scope's
    // descriptor mask a structurally-different descriptor with the
    // same id loaded from a different scope: the first descriptor
    // would pass the loader-side compatibility check, the cache would
    // mark the id as validated, and a later resolve hitting a
    // different descriptor for the same id would skip the check
    // entirely. (`_populateDescriptorCache` enforces cross-scope
    // structural equality only when `describe()` is called; `resolve()`
    // skips that path.) Keying by canonical content makes the cache
    // immune to that hole — different descriptors carry different
    // keys; `invalidateDescriptor()` doesn't need to touch this map
    // because any subsequent descriptor revision is automatically a
    // cache miss. (PR #369 Copilot review.)
    return this._descriptorCanonical(descriptor)
      .withErrorFormat(
        (msg) => `prompt '${descriptor.id}': failed to canonicalize descriptor for validation cache: ${msg}`
      )
      .onSuccess((key) => {
        if (this._validatedRegistryKeys.has(key)) {
          return succeed(true as const);
        }
        return assertOutputValidationsCompatible<TResponse>(descriptor, this._registry).onSuccess(() => {
          this._validatedRegistryKeys.add(key);
          return succeed(true as const);
        });
      });
  }

  private async _renderResolved(
    req: IPromptResolveRequest<string>,
    walked: {
      readonly record: IStoredPromptRecord;
      readonly winningScope: ScopeKey;
      readonly scopesConsulted: ReadonlyArray<ScopeKey>;
    },
    mergeResult: {
      readonly merged: ReadonlyMap<SlotName, IBindingTraceEntry>;
      readonly safeguardFindings: ReadonlyArray<ISafeguardFinding>;
    },
    matches: ReadonlyArray<{
      readonly candidate: IPromptCandidateRecord;
      readonly index: number;
      readonly matchType: 'match' | 'matchAsDefault';
      readonly conditions: ReadonlyArray<Runtime.IConditionMatchResult>;
    }>,
    resourceBindings: IResourceBindingResolveResult
  ): Promise<Result<IResolvedPrompt>> {
    const descriptor = walked.record.descriptor;
    const selected = matches.map(({ candidate, index }) => ({ candidate, index }));
    const joinedBody = joinBodies(selected, descriptor.join);
    // Fold the resource-binding rewrites into a fresh merged-bindings map
    // so the trace surface stays a `ReadonlyMap` and `mergeBindings`'s
    // placeholder values for resource-bound slots are replaced with the
    // inner-resolve body.
    const finalMerged = applyResourceBindingRewrites(mergeResult.merged, resourceBindings.rewrites);
    // No outer `withErrorFormat` here: `applySafeguards` already formats
    // its reject messages with `prompt '${descriptor.id}': ...`, and
    // double-wrapping produces `prompt 'p': prompt 'p': ...` noise
    // (Copilot review on PR #369).
    return (await applySafeguards(descriptor, finalMerged, this._safetyPolicy)).onSuccess((safeguardResult) =>
      this._mustacheCache
        .getOrParse(req.id, joinedBody)
        .onSuccess((template) =>
          template
            .validateAndRender(this._buildRenderContext(finalMerged))
            .withErrorFormat((msg) => `prompt '${req.id}': ${msg}`)
        )
        .onSuccess((rendered) => this._applyAntiJailbreakPreface(descriptor, rendered))
        .onSuccess((finalBody) => {
          const candidateMatches: ICandidateMatchTraceEntry[] = matches.map((m) => ({
            candidateIndex: m.index,
            matchType: m.matchType,
            conditions: m.conditions
          }));
          const trace: IPromptResolveTrace = {
            winningScope: walked.winningScope,
            scopesConsulted: walked.scopesConsulted,
            mergedBindings: finalMerged,
            resourceBindingResolutions: resourceBindings.traceEntries,
            safeguardFindings: [...mergeResult.safeguardFindings, ...safeguardResult.findings],
            candidateMatches
          };
          return succeed<IResolvedPrompt>({
            id: req.id,
            body: finalBody,
            descriptor,
            trace
          });
        })
    );
  }

  private _applyAntiJailbreakPreface(descriptor: IPromptDescriptor, rendered: string): Result<string> {
    const preface = this._safetyPolicy?.antiJailbreakPreface;
    if (preface === undefined) {
      return succeed(rendered);
    }
    return preface(descriptor)
      .withErrorFormat((msg) => `prompt '${descriptor.id}': antiJailbreakPreface failed: ${msg}`)
      .onSuccess((prefaceText) => succeed(prefaceText === '' ? rendered : `${prefaceText}\n${rendered}`));
  }

  private _buildRenderContext(merged: ReadonlyMap<SlotName, IBindingTraceEntry>): Record<string, string> {
    const ctx: Record<string, string> = {};
    merged.forEach((entry, name) => {
      ctx[name] = entry.value;
    });
    return ctx;
  }

  /**
   * Fires an output-round-trip observation. Callers gate this on whether any
   * observers are wired. `outcome` carries the output method's `Result`; its
   * success / message become the record's `outcome` / `error`.
   */
  private async _observeOutput(
    req: IPromptResolveRequest<string>,
    phase: IPromptOutputObservation['phase'],
    rawOutput: string,
    outcome: Result<unknown>,
    resolveSeq: number,
    durationMs: number
  ): Promise<void> {
    await this._observe(this._buildOutputObservation(req, phase, rawOutput, outcome, resolveSeq, durationMs));
  }

  /**
   * Fans a record out to every observer. Awaited observers extend the call;
   * `fireAndForget` observers are dispatched without awaiting. Per-observer
   * errors (failed `Result` or thrown / rejected `observe`) are swallowed and
   * logged to {@link PromptLibrary.logger | logger} at `warn`, so an observer
   * never affects the resolve result — the `MultiLogger`-shaped contract.
   */
  private async _observe(record: IPromptObservationRecord): Promise<void> {
    const awaited: Promise<void>[] = [];
    for (const observer of this._observers) {
      if (observer.fireAndForget === true) {
        // Intentionally not awaited: a fire-and-forget observer must not extend
        // resolve() latency. `_safeObserve` already swallows internally; the
        // `.catch` keeps the detached promise from being flagged as floating.
        this._safeObserve(observer, record).catch(() => undefined);
      } else {
        awaited.push(this._safeObserve(observer, record));
      }
    }
    await Promise.all(awaited);
  }

  /**
   * Invokes one observer, swallowing any failure or throw.
   */
  private async _safeObserve(observer: IPromptObserver, record: IPromptObservationRecord): Promise<void> {
    try {
      const observed = await observer.observe(record);
      if (observed.isFailure()) {
        this.logger.warn(`prompt '${record.promptId}': observer failed (swallowed): ${observed.message}`);
      }
    } catch (error) {
      this.logger.warn(`prompt '${record.promptId}': observer threw (swallowed): ${String(error)}`);
    }
  }

  /**
   * Builds the `'resolve'` observation record from the request and the
   * resolve `Result`. Assigns a fresh library-global `seq` + `timestamp`.
   */
  private _buildResolveObservation(
    req: IPromptResolveRequest<string>,
    result: Result<IResolvedPrompt>,
    durationMs: number
  ): IPromptResolveObservation {
    const base = this._observationBase(req, durationMs);
    if (result.isSuccess()) {
      const resolved = result.value;
      return {
        ...base,
        phase: 'resolve',
        outcome: 'success',
        winningScope: resolved.trace.winningScope,
        body: resolved.body,
        outputKind: resolved.descriptor.output.kind,
        trace: resolved.trace,
        safeguardFindings: resolved.trace.safeguardFindings
      };
    }
    return { ...base, phase: 'resolve', outcome: 'failure', error: result.message };
  }

  /**
   * Builds an output-round-trip observation record cross-linked to its
   * resolve record via `linkedResolveSeq`. Does not duplicate the rendered
   * body (it lives on the linked resolve record).
   */
  private _buildOutputObservation(
    req: IPromptResolveRequest<string>,
    phase: IPromptOutputObservation['phase'],
    rawOutput: string,
    outcome: Result<unknown>,
    resolveSeq: number,
    durationMs: number
  ): IPromptOutputObservation {
    const base = this._observationBase(req, durationMs);
    return {
      ...base,
      phase,
      linkedResolveSeq: resolveSeq,
      outcome: outcome.isSuccess() ? 'success' : 'failure',
      rawOutput,
      error: outcome.isFailure() ? outcome.message : undefined
    };
  }

  /**
   * Builds the fields common to every observation record, assigning a fresh
   * library-global `seq` and a `timestamp`. The `contentHash` is best-effort:
   * a canonicalize / hash failure degrades to an empty string rather than
   * breaking the resolve.
   */
  private _observationBase(req: IPromptResolveRequest<string>, durationMs: number): IPromptObservationBase {
    this._nextObservationSeq += 1;
    return {
      seq: this._nextObservationSeq,
      contentHash: this._observationContentHash(req),
      timestamp: this._observationNow(),
      durationMs,
      promptId: req.id,
      chain: req.chain,
      qualifierContext: req.qualifiers,
      substitutions: req.substitutions
    };
  }

  /**
   * CRC32 over the RFC 8785 canonical JSON string of the request's identity
   * tuple. Best-effort — never throws (degrades to `''`).
   */
  private _observationContentHash(req: IPromptResolveRequest<string>): string {
    return sanitizeJsonObject({
      promptId: req.id,
      chain: req.chain,
      qualifierContext: req.qualifiers,
      substitutions: req.substitutions ?? {}
    })
      .onSuccess((sanitized) => this._normalizer.canonicalize(sanitized))
      .onSuccess((canonical) => captureResult(() => Hash.Crc32Normalizer.crc32Hash([canonical])))
      .orDefault('');
  }
}

function applyResourceBindingRewrites(
  merged: ReadonlyMap<SlotName, IBindingTraceEntry>,
  rewrites: ReadonlyMap<SlotName, string>
): ReadonlyMap<SlotName, IBindingTraceEntry> {
  if (rewrites.size === 0) {
    return merged;
  }
  const out = new Map(merged);
  rewrites.forEach((value, slot) => {
    const prev = out.get(slot);
    /* c8 ignore next 3 - defensive: rewrites are produced from the same pending list bindingMerger built from `merged`; a missing slot would indicate a contract break */
    if (prev === undefined) {
      return;
    }
    out.set(slot, { ...prev, value });
  });
  return out;
}

function validateResourceBindingDepthLimit(value: number | undefined): Result<number> {
  if (value === undefined) {
    return succeed(DEFAULT_RESOURCE_BINDING_DEPTH_LIMIT);
  }
  if (!Number.isInteger(value) || value < 1) {
    return fail(`resourceBindingDepthLimit: expected a positive integer (got ${value})`);
  }
  return succeed(value);
}

function buildResourceTypes(): Result<ResourceTypes.ResourceTypeCollector> {
  return ResourceTypes.JsonResourceType.create()
    .withErrorFormat((msg) => `prompt library: failed to create JsonResourceType: ${msg}`)
    .onSuccess((jsonType) =>
      ResourceTypes.ResourceTypeCollector.create({ resourceTypes: [jsonType] }).withErrorFormat(
        (msg) => `prompt library: failed to create resource type collector: ${msg}`
      )
    );
}

function buildQualifierCollector(
  qualifiers: Qualifiers.IReadOnlyQualifierCollector | ReadonlyArray<string | Qualifiers.IQualifierDecl>,
  qualifierTypes?: QualifierTypes.ReadOnlyQualifierTypeCollector
): Result<{
  readonly qualifiers: Qualifiers.IReadOnlyQualifierCollector;
  readonly qualifierTypes: QualifierTypes.ReadOnlyQualifierTypeCollector;
}> {
  if (isMixedQualifierArray(qualifiers)) {
    // Delegate the mixed-shape handling (including
    // LiteralQualifierType synthesis for bare-string entries and the
    // "qualifierTypes required when any decl is present" check) to
    // ts-res's `QualifierCollector.create`, which is the canonical
    // implementation post-PR-B.
    return Qualifiers.QualifierCollector.create({ qualifierTypes, qualifiers: [...qualifiers] })
      .withErrorFormat((msg) => `prompt library: invalid qualifier declarations: ${msg}`)
      .onSuccess((collector) => succeed({ qualifiers: collector, qualifierTypes: collector.qualifierTypes }));
  }
  return succeed({ qualifiers, qualifierTypes: qualifierTypes ?? qualifiers.qualifierTypes });
}

function isMixedQualifierArray(
  value: Qualifiers.IReadOnlyQualifierCollector | ReadonlyArray<string | Qualifiers.IQualifierDecl>
): value is ReadonlyArray<string | Qualifiers.IQualifierDecl> {
  return Array.isArray(value);
}

function toLooseDecl(
  candidate: IPromptCandidateRecord,
  synthId: string,
  index: number
): Result<ResourceJson.Json.ILooseResourceCandidateDecl> {
  return ResourceJson.Convert.conditionSetDecl
    .convert(candidate.conditions)
    .withErrorFormat((msg) => `candidate ${index}: invalid conditions: ${msg}`)
    .onSuccess((conditions) =>
      succeed<ResourceJson.Json.ILooseResourceCandidateDecl>({
        id: synthId,
        json: { body: candidate.body },
        conditions,
        isPartial: candidate.isPartial,
        resourceTypeName: PROMPT_RESOURCE_TYPE_NAME
      })
    );
}

function projectMatches(
  scope: ScopeKey,
  promptId: PromptId,
  record: IStoredPromptRecord,
  materialized: IMaterializedPrompt,
  resolution: Runtime.DecisionResolutionResult,
  resolver: Runtime.ResourceResolver
): Result<
  ReadonlyArray<{
    readonly candidate: IPromptCandidateRecord;
    readonly index: number;
    readonly matchType: 'match' | 'matchAsDefault';
    readonly conditions: ReadonlyArray<Runtime.IConditionMatchResult>;
  }>
> {
  if (
    !resolution.success ||
    (resolution.instanceIndices.length === 0 && resolution.defaultInstanceIndices.length === 0)
  ) {
    return fail(`prompt '${promptId}' scope '${scope}': no candidate matched the supplied qualifier context`);
  }

  interface IProjectionEntry {
    readonly origIndex: number;
    readonly candidate: IPromptCandidateRecord;
    readonly rsCandidate: ResourceCandidate;
    readonly matchType: 'match' | 'matchAsDefault';
  }

  const rsCandidates = materialized.resource.candidates;

  // Walk in ts-res's natural order — `resolveDecision` returns regular
  // matches in priority-descending order followed by default matches in
  // priority-descending order. ts-res's `resolveAllResourceCandidates`
  // emits the same `[...regulars, ...defaults]` sequence. We collect
  // candidates in that order, mirroring ts-res's value-composition
  // semantic (partials layer onto the first full base), and stop as
  // soon as a non-partial (full) candidate is encountered. The full
  // candidate is included in the collection — it is the base body the
  // partials layer onto.
  const orderedIndices: ReadonlyArray<{
    readonly idx: number;
    readonly matchType: 'match' | 'matchAsDefault';
  }> = [
    ...resolution.instanceIndices.map((idx) => ({ idx, matchType: 'match' as const })),
    ...resolution.defaultInstanceIndices.map((idx) => ({ idx, matchType: 'matchAsDefault' as const }))
  ];

  const collected: IProjectionEntry[] = [];
  for (const { idx, matchType } of orderedIndices) {
    /* c8 ignore next 3 - defensive: invalid index would require ts-res to return out-of-range, which would also fail in resolveResource */
    if (idx >= rsCandidates.length) {
      return fail(`prompt '${promptId}' scope '${scope}': invalid candidate index ${idx}`);
    }
    const rsCandidate = rsCandidates[idx];
    const origIndex = materialized.candidateOriginIndex.get(rsCandidate);
    /* c8 ignore next 5 - defensive: every built candidate is in the origin-index map by construction */
    if (origIndex === undefined) {
      return fail(
        `prompt '${promptId}' scope '${scope}': internal error: built candidate not in origin-index map`
      );
    }
    const candidate = record.candidates[origIndex];
    collected.push({ origIndex, candidate, rsCandidate, matchType });
    if (candidate.isPartial !== true) {
      // Hit the full base — partials above it have been collected,
      // stop walking.
      break;
    }
  }

  // Reverse to specificity-ascending so the trace and the default
  // `joinBodies` ('specificity-ascending') receive the full base first
  // and the most-specific override last — matching the "later
  // instructions take precedence" LLM reading convention.
  const ascending = collected.reverse();

  return mapResults(
    ascending.map((entry) =>
      resolver
        .resolveConditionSet(entry.rsCandidate.conditions)
        /* c8 ignore next 4 - defensive: resolveConditionSet on an already-resolved candidate's condition set hits the cache; the failure path requires an internal ts-res error */
        .withErrorFormat(
          (msg) => `prompt '${promptId}' scope '${scope}': condition-set resolve failed: ${msg}`
        )
        .onSuccess((resolved) =>
          succeed({
            candidate: entry.candidate,
            index: entry.origIndex,
            matchType: entry.matchType,
            conditions: resolved.matches
          })
        )
    )
  );
}
