/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, fail, succeed } from '@fgv/ts-utils';
import { PromptId, ScopeKey, SlotName } from '../types';
import { IPromptDescriptor } from '../types';
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
import { joinBodies, selectCandidates } from './candidateSelector';

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
  /** Unified registry. Optional; defaults to an empty registry. */
  readonly registry?: IPromptRegistry<TResponse>;
  /** Default 256. */
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
 * Main entry point per design §4.1.
 *
 * @remarks
 * Generic over `TResponse extends \{ kind: string \}` so the JSON output
 * pipeline (B-4) wires up without any cast.
 *
 * The B-1 foundation implements:
 * - {@link PromptLibrary.describe} — load and return a descriptor
 * - {@link PromptLibrary.resolve} — chain walk + binding merge + intra-record
 *   candidate selection (specificity-ascending; stops at first terminal) +
 *   Mustache render via the LRU-cached `MustacheTemplate`s + full trace
 *
 * Resource binding resolution (B-2), full ts-res integration with the long-
 * lived `ResourceManagerBuilder` (B-1b follow-up), full output validation
 * (B-4), and input safeguards (B-4) are layered on top in subsequent
 * sub-phases. The only `safeguardFindings` kind emitted by B-1 is
 * `'enforced-override-ignored'` (per design §10.4).
 *
 * @public
 */
export class PromptLibrary<TResponse extends { kind: string } = { kind: string }> {
  private readonly _store: IPromptStore;
  private readonly _registry?: IPromptRegistry<TResponse>;
  private readonly _mustacheCache: MustacheTemplateCache;
  private readonly _descriptorCache: Map<string, IPromptDescriptor>;

  private constructor(
    store: IPromptStore,
    registry: IPromptRegistry<TResponse> | undefined,
    mustacheCache: MustacheTemplateCache
  ) {
    this._store = store;
    this._registry = registry;
    this._mustacheCache = mustacheCache;
    this._descriptorCache = new Map();
  }

  /** Family-convention factory. */
  public static async create<TResponse extends { kind: string } = { kind: string }>(
    params: IPromptLibraryCreateParams<TResponse>
  ): Promise<Result<PromptLibrary<TResponse>>> {
    return MustacheTemplateCache.create(params.templateCacheSize).onSuccess((cache) =>
      succeed(new PromptLibrary<TResponse>(params.store, params.registry, cache))
    );
  }

  /**
   * Returns the descriptor for a prompt by id, searching across all scopes.
   * Convenience for editor surfaces that don't want to specify a scope
   * chain. Returns the first record found via `store.list`.
   */
  public async describe(id: PromptId): Promise<Result<IPromptDescriptor>> {
    const cached = this._descriptorCache.get(id);
    if (cached !== undefined) {
      return succeed(cached);
    }
    return (await this._store.list({ id }))
      .withErrorFormat((msg) => `prompt '${id}': store.list failed: ${msg}`)
      .onSuccess((list) => {
        if (list.length === 0) {
          return fail(`prompt '${id}': not found in any scope`);
        }
        const descriptor = list[0].descriptor;
        this._descriptorCache.set(id, descriptor);
        return succeed(descriptor);
      });
  }

  /**
   * Resolves a prompt against the supplied chain + qualifier context +
   * caller substitutions. Returns the rendered body plus full trace.
   */
  public async resolve(req: IPromptResolveRequest): Promise<Result<IResolvedPrompt>> {
    const walked = await walkScopeChain(this._store, req.id, req.chain);
    if (walked.isFailure()) {
      return fail(walked.message);
    }
    const { record, winningScope, scopesConsulted, scopeBindings } = walked.value;
    const descriptor = record.descriptor;

    const mergeResult = mergeBindings(req.chain, scopeBindings, descriptor.slots, req.substitutions);
    if (mergeResult.isFailure()) {
      return fail(`prompt '${req.id}': ${mergeResult.message}`);
    }
    const { merged, safeguardFindings } = mergeResult.value;

    const selection = selectCandidates(record.candidates, req.qualifiers);
    if (selection.isFailure()) {
      return fail(`prompt '${req.id}' scope '${winningScope}': ${selection.message}`);
    }
    const selected = selection.value.selected;

    const joinedBody = joinBodies(selected, descriptor.join);
    const renderContext = this._buildRenderContext(merged);

    const rendered = this._mustacheCache
      .getOrParse(req.id, joinedBody)
      .onSuccess((template) => template.validateAndRender(renderContext));
    if (rendered.isFailure()) {
      return fail(`prompt '${req.id}': ${rendered.message}`);
    }

    const candidateMatches: ICandidateMatchTraceEntry[] = selected.map((s) => ({
      candidateIndex: s.index,
      // B-1 foundation candidate selector emits 'match' only. Full ts-res
      // integration in the follow-up surfaces 'matchAsDefault' here.
      matchType: 'match',
      conditions: []
    }));

    const trace: IPromptResolveTrace = {
      winningScope,
      scopesConsulted,
      mergedBindings: merged,
      resourceBindingResolutions: [],
      safeguardFindings,
      candidateMatches
    };

    return succeed<IResolvedPrompt>({
      id: req.id,
      body: rendered.value,
      descriptor,
      trace
    });
  }

  /**
   * Resolves and validates the output of an LLM call against the
   * descriptor's output contract.
   *
   * @remarks
   * The B-1 foundation supports only `output.kind: 'free-text'` (returns the
   * raw output unchanged). JSON output validation — fence strip → parse →
   * Converter → typed validator chain — is B-4's scope. Calling
   * `resolveAndValidateOutput` with a `json`-output descriptor returns a
   * `Result.fail` citing the B-4 dependency, NOT a silent placeholder.
   */
  public async resolveAndValidateOutput<T extends TResponse>(
    req: IPromptResolveRequest,
    rawOutput: string
  ): Promise<Result<T>> {
    const resolved = await this.resolve(req);
    if (resolved.isFailure()) {
      return fail(resolved.message);
    }
    if (resolved.value.descriptor.output.kind === 'free-text') {
      // Free-text passes through unchanged. The cast is type-equivalent to
      // the `T extends TResponse` (the consumer asked for T; free-text
      // outputs return the raw string) — but since v0.1 free-text doesn't
      // run output validators, this code path is for the "free-text only"
      // consumer who doesn't parameterize TResponse.
      const passthrough = rawOutput as unknown as T;
      return succeed(passthrough);
    }
    return fail(
      `prompt '${req.id}': resolveAndValidateOutput for kind: 'json' is not yet implemented in the B-1 foundation (B-4 ships the output validation pipeline)`
    );
  }

  private _buildRenderContext(merged: ReadonlyMap<SlotName, IBindingTraceEntry>): Record<string, string> {
    const ctx: Record<string, string> = {};
    merged.forEach((entry, name) => {
      ctx[name] = entry.value;
    });
    return ctx;
  }
}
