/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Hash, Logging, Result, fail, mapResults, succeed } from '@fgv/ts-utils';
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
import { IQualifierContext } from '../types';
import {
  IBindingTraceEntry,
  ICandidateMatchTraceEntry,
  IPromptResolveTrace,
  IResolvedPrompt
} from '../types';
import { IPromptStore } from '../store';
import { IPromptRegistry } from '../registry';
import { walkScopeChain } from './chainWalker';
import { mergeBindings } from './bindingMerger';
import { MustacheTemplateCache } from './mustacheCache';
import { joinBodies } from './candidateSelector';

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
export interface IPromptLibraryCreateParams<TResponse extends { kind: string } = { kind: string }> {
  readonly store: IPromptStore;
  /**
   * ts-res qualifier configuration. Accepts either a pre-built
   * `IReadOnlyQualifierCollector` (when the consumer already maintains a
   * ts-res qualifier set) or a declarative `IQualifierDecl[]` (the
   * library builds the collector internally via ts-res's Converters).
   * REQUIRED per design §4.1.
   */
  readonly qualifiers: Qualifiers.IReadOnlyQualifierCollector | ReadonlyArray<Qualifiers.IQualifierDecl>;
  /**
   * Optional ts-res qualifier-type collector. When `qualifiers` is
   * supplied as a pre-built `IReadOnlyQualifierCollector`, this is
   * inferred from it. When `qualifiers` is supplied as decls, this
   * must supply at least the qualifier types referenced by those decls.
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
}

/**
 * Resolve request.
 * @public
 */
export interface IPromptResolveRequest {
  readonly id: PromptId;
  /** Most-specific to most-general. */
  readonly chain: ReadonlyArray<ScopeKey>;
  readonly qualifiers: IQualifierContext;
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
export class PromptLibrary<TResponse extends { kind: string } = { kind: string }> {
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
   * structural equality (vs. CRC32 hash equality, which is not collision-
   * resistant). Used for descriptor cross-scope equality checks in
   * `_populateDescriptorCache` and for the materialized-resource cache
   * key.
   */
  private readonly _normalizer: Hash.Crc32Normalizer;
  /**
   * Monotonic counter feeding the synthesized ts-res resource id
   * (`prompt_<n>`). Sequential ids guarantee no collisions across
   * materialized prompts, so distinct records never share a ts-res
   * resource.
   */
  private _nextSynthIdSerial: number;
  private readonly _cacheListener?: Runtime.IResourceResolverCacheListener;
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
    this._normalizer = new Hash.Crc32Normalizer();
    this._nextSynthIdSerial = 0;
    this._cacheListener = params.cacheListener;
    this.logger = params.logger;
    this.resourceBindingDepthLimit = params.resourceBindingDepthLimit;
  }

  /** Family-convention factory. */
  public static async create<TResponse extends { kind: string } = { kind: string }>(
    params: IPromptLibraryCreateParams<TResponse>
  ): Promise<Result<PromptLibrary<TResponse>>> {
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
                    new PromptLibrary<TResponse>({
                      store: params.store,
                      registry: params.registry,
                      mustacheCache,
                      qualifierCollector: qualifierInfo.qualifiers,
                      qualifierTypes: qualifierInfo.qualifierTypes,
                      builder,
                      cacheListener: params.cacheListener,
                      logger: params.logger ?? new Logging.NoOpLogger(),
                      resourceBindingDepthLimit: depthLimit
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
   * structurally equal (via `Hash.Crc32Normalizer`) and fails loudly on
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
   */
  public async resolve(req: IPromptResolveRequest): Promise<Result<IResolvedPrompt>> {
    return (await walkScopeChain(this._store, req.id, req.chain)).onSuccess((walked) =>
      mergeBindings(req.chain, walked.scopeBindings, walked.record.descriptor.slots, req.substitutions)
        .withErrorFormat((msg) => `prompt '${req.id}': ${msg}`)
        .onSuccess((mergeResult) =>
          this._materializeIfNeeded(walked.record).onSuccess((materialized) =>
            this._resolveCandidates(
              walked.winningScope,
              req.id,
              walked.record,
              materialized,
              req.qualifiers
            ).onSuccess((matches) => this._renderResolved(req, walked, mergeResult, matches))
          )
        )
    );
  }

  /**
   * Resolves and validates the output of an LLM call against the descriptor's
   * output contract.
   *
   * @remarks
   * Full output validation — fence strip, JSON.parse, Converter
   * dispatch, typed validator chain — is B-4's scope. The B-1b
   * foundation pre-runs the chain walk + render so the failure message
   * cites the actual `descriptor.output.kind`; that resolve cost is
   * also paid by the real B-4 pipeline, so the ordering is not
   * premature.
   */
  public async resolveAndValidateOutput<T extends TResponse>(
    req: IPromptResolveRequest,
    rawOutput: string
  ): Promise<Result<T>> {
    return (await this.resolve(req)).onSuccess((resolved) =>
      fail<T>(
        `prompt '${req.id}': resolveAndValidateOutput (output.kind '${resolved.descriptor.output.kind}', rawOutput length ${rawOutput.length}) is not yet implemented in the B-1 foundation (B-4 ships the output validation pipeline)`
      )
    );
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
        this._descriptorCache.set(id, first.descriptor);
        return succeed(first.descriptor);
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
    // condition-set declaration shape (no builder mutation); phase 2
    // commits the validated decls via `addLooseCandidate` sequentially
    // with short-circuit on failure.
    //
    // Phase-1 catches malformed condition-set shape, but NOT qualifier-
    // name-not-registered errors — those surface inside
    // `addLooseCandidate` during phase 2. A phase-2 failure on
    // candidate N after candidates 0..N-1 already committed leaves
    // those earlier candidates in the long-lived builder under the
    // record's freshly-allocated synthesized id. This does not affect
    // resolves of OTHER prompts because synthesized ids are sequential
    // and unique per materialization (no cross-record reuse). Retries
    // of the same malformed record are idempotent: ts-res dedupes
    // candidates by condition-set key, so the already-committed
    // candidates re-resolve via the existing entries and the failing
    // candidate fails the same way as before. Full builder rollback on
    // mid-walk failure would require a `removeCandidate` API in ts-res
    // that v0.1 doesn't expose; the orphan-resource memory cost is
    // bounded by the (rare) failure rate.
    return mapResults(
      record.candidates.map((candidate, index) => toLooseDecl(candidate, synthId, index))
    ).onSuccess((decls) => this._commitDecls(record, decls));
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

  private _renderResolved(
    req: IPromptResolveRequest,
    walked: {
      readonly record: IStoredPromptRecord;
      readonly winningScope: ScopeKey;
      readonly scopesConsulted: ReadonlyArray<ScopeKey>;
    },
    mergeResult: {
      readonly merged: ReadonlyMap<SlotName, IBindingTraceEntry>;
      readonly safeguardFindings: ReadonlyArray<import('../types').ISafeguardFinding>;
    },
    matches: ReadonlyArray<{
      readonly candidate: IPromptCandidateRecord;
      readonly index: number;
      readonly matchType: 'match' | 'matchAsDefault';
      readonly conditions: ReadonlyArray<Runtime.IConditionMatchResult>;
    }>
  ): Result<IResolvedPrompt> {
    const descriptor = walked.record.descriptor;
    const selected = matches.map(({ candidate, index }) => ({ candidate, index }));
    const joinedBody = joinBodies(selected, descriptor.join);
    return this._mustacheCache
      .getOrParse(req.id, joinedBody)
      .onSuccess((template) =>
        template
          .validateAndRender(this._buildRenderContext(mergeResult.merged))
          .withErrorFormat((msg) => `prompt '${req.id}': ${msg}`)
      )
      .onSuccess((rendered) => {
        const candidateMatches: ICandidateMatchTraceEntry[] = matches.map((m) => ({
          candidateIndex: m.index,
          matchType: m.matchType,
          conditions: m.conditions
        }));
        const trace: IPromptResolveTrace = {
          winningScope: walked.winningScope,
          scopesConsulted: walked.scopesConsulted,
          mergedBindings: mergeResult.merged,
          resourceBindingResolutions: [],
          safeguardFindings: mergeResult.safeguardFindings,
          candidateMatches
        };
        return succeed<IResolvedPrompt>({
          id: req.id,
          body: rendered,
          descriptor,
          trace
        });
      });
  }

  private _buildRenderContext(merged: ReadonlyMap<SlotName, IBindingTraceEntry>): Record<string, string> {
    const ctx: Record<string, string> = {};
    merged.forEach((entry, name) => {
      ctx[name] = entry.value;
    });
    return ctx;
  }
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
  qualifiers: Qualifiers.IReadOnlyQualifierCollector | ReadonlyArray<Qualifiers.IQualifierDecl>,
  qualifierTypes?: QualifierTypes.ReadOnlyQualifierTypeCollector
): Result<{
  readonly qualifiers: Qualifiers.IReadOnlyQualifierCollector;
  readonly qualifierTypes: QualifierTypes.ReadOnlyQualifierTypeCollector;
}> {
  if (isQualifierDeclArray(qualifiers)) {
    if (qualifierTypes === undefined) {
      return fail(
        'prompt library: qualifierTypes must be supplied when qualifiers are provided as declarations'
      );
    }
    return Qualifiers.QualifierCollector.create({ qualifierTypes, qualifiers: [...qualifiers] })
      .withErrorFormat((msg) => `prompt library: invalid qualifier declarations: ${msg}`)
      .onSuccess((collector) => succeed({ qualifiers: collector, qualifierTypes }));
  }
  return succeed({ qualifiers, qualifierTypes: qualifierTypes ?? qualifiers.qualifierTypes });
}

function isQualifierDeclArray(
  value: Qualifiers.IReadOnlyQualifierCollector | ReadonlyArray<Qualifiers.IQualifierDecl>
): value is ReadonlyArray<Qualifiers.IQualifierDecl> {
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
