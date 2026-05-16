/*
 * Copyright (c) 2026 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { Result, captureResult, fail, succeed } from '@fgv/ts-utils';
import { Mustache } from '@fgv/ts-extras';
import { Resources, Runtime, Config, ResourceJson } from '@fgv/ts-res';
import type { QualifierContextValue } from '@fgv/ts-res';
import type { IPromptStore } from '../store';
import type { IPromptRegistry } from '../registry';
import type {
  IPromptDescriptor,
  IPromptSafetyPolicy,
  IPromptResolveRequest,
  IResolvedPrompt,
  ISafeguardFinding,
  IBindingTraceEntry,
  IStoredPromptRecord,
  SlotName,
  ScopeKey,
  SlotBinding
} from '../types';
import { runSafeguards } from '../safeguards';
import { processOutput } from '../output';
import type { IOutputValidationContext } from '../registry';

/**
 * Maximum number of MustacheTemplate instances to cache by body string.
 * @internal
 */
const MUSTACHE_CACHE_MAX: number = 256;

/**
 * Parameters for creating a {@link PromptLibrary}.
 * @public
 */
export interface IPromptLibraryCreateParams {
  /** The prompt store to retrieve records from. */
  readonly store: IPromptStore;
  /** The registry for converters, validators, and slot kinds. */
  readonly registry: IPromptRegistry;
  /** Optional safety policy for safeguard checks. */
  readonly safetyPolicy?: IPromptSafetyPolicy;
}

/**
 * Core prompt library that resolves prompts from a store using ts-res candidate selection.
 * @public
 */
export class PromptLibrary {
  private readonly _store: IPromptStore;
  private readonly _registry: IPromptRegistry;
  private readonly _safetyPolicy: IPromptSafetyPolicy | undefined;
  private readonly _builder: Resources.ResourceManagerBuilder;
  private readonly _qualifierTypes: Config.SystemConfiguration['qualifierTypes'];
  private readonly _registeredKeys: Set<string>;
  private readonly _mustacheCache: Map<string, Mustache.MustacheTemplate>;

  private constructor(
    store: IPromptStore,
    registry: IPromptRegistry,
    safetyPolicy: IPromptSafetyPolicy | undefined,
    builder: Resources.ResourceManagerBuilder,
    qualifierTypes: Config.SystemConfiguration['qualifierTypes']
  ) {
    this._store = store;
    this._registry = registry;
    this._safetyPolicy = safetyPolicy;
    this._builder = builder;
    this._qualifierTypes = qualifierTypes;
    this._registeredKeys = new Set<string>();
    this._mustacheCache = new Map<string, Mustache.MustacheTemplate>();
  }

  /**
   * Creates a new {@link PromptLibrary}.
   * @param params - Parameters for construction.
   * @returns `Success` with the new {@link PromptLibrary} if successful, or `Failure` with an error message.
   * @public
   */
  public static async create(params: IPromptLibraryCreateParams): Promise<Result<PromptLibrary>> {
    const sysConfigResult = Config.getPredefinedSystemConfiguration('default');
    if (sysConfigResult.isFailure()) {
      return fail(sysConfigResult.message);
    }
    const sysConfig = sysConfigResult.value;

    const builderResult = Resources.ResourceManagerBuilder.createPredefined('default');
    if (builderResult.isFailure()) {
      return fail(builderResult.message);
    }
    const builder = builderResult.value;

    return captureResult(
      () =>
        new PromptLibrary(
          params.store,
          params.registry,
          params.safetyPolicy,
          builder,
          sysConfig.qualifierTypes
        )
    );
  }

  /**
   * Resolves a prompt by walking the scope chain, selecting candidates via ts-res,
   * composing the body, merging bindings, running safeguards, and rendering via Mustache.
   * @param req - The resolve request.
   * @returns `Success` with the resolved prompt, or `Failure` with an error message.
   * @public
   */
  public async resolve(req: IPromptResolveRequest): Promise<Result<IResolvedPrompt>> {
    // Step 1: Walk req.chain (most-specific first) until finding a record.
    const scopesConsulted: ScopeKey[] = [];
    let winningScope: ScopeKey | undefined;
    let winningRecord: IStoredPromptRecord | undefined;

    for (const scope of req.chain) {
      scopesConsulted.push(scope);
      const getResult = await this._store.get(scope, req.id);
      if (getResult.isFailure()) {
        return fail(`failed to get prompt '${req.id}' from scope '${scope}': ${getResult.message}`);
      }
      if (getResult.value !== undefined) {
        winningScope = scope;
        winningRecord = getResult.value;
        break;
      }
    }

    if (winningScope === undefined || winningRecord === undefined) {
      return fail(`prompt '${req.id}' not found in any scope`);
    }

    const record: IStoredPromptRecord = winningRecord;
    const descriptor: IPromptDescriptor = record.descriptor;
    const tsResKey = `${winningScope as string}.${req.id as string}`;

    // Step 3: Register candidates in builder (if not already registered).
    if (!this._registeredKeys.has(tsResKey)) {
      for (const candidate of record.candidates) {
        const decl: ResourceJson.Json.ILooseResourceCandidateDecl = {
          id: tsResKey,
          json: { body: candidate.body },
          conditions: candidate.conditions as ResourceJson.Json.ConditionSetDecl,
          isPartial: candidate.isPartial ?? false,
          resourceTypeName: 'json'
        };
        const addResult = this._builder.addLooseCandidate(decl);
        if (addResult.isFailure()) {
          return fail(`failed to register candidate for '${tsResKey}': ${addResult.message}`);
        }
      }
      this._registeredKeys.add(tsResKey);
    }

    // Step 4: Create a per-resolve SimpleContextQualifierProvider.
    // QualifierContextValue is a branded string; cast the caller's plain string map.
    const qualifierValues = req.qualifiers as unknown as Record<string, QualifierContextValue>;
    const contextProviderResult = Runtime.SimpleContextQualifierProvider.create({
      qualifiers: this._builder.qualifiers,
      qualifierValues
    });
    if (contextProviderResult.isFailure()) {
      return fail(`failed to create qualifier provider: ${contextProviderResult.message}`);
    }

    // Step 5: Create a per-resolve ResourceResolver.
    const resolverResult = Runtime.ResourceResolver.create({
      resourceManager: this._builder,
      qualifierTypes: this._qualifierTypes,
      contextQualifierProvider: contextProviderResult.value
    });
    if (resolverResult.isFailure()) {
      return fail(`failed to create resource resolver: ${resolverResult.message}`);
    }
    const resolver = resolverResult.value;

    // Step 6: Resolve all candidates (most-specific first).
    const candidatesResult = resolver.resolveAllResourceCandidates(tsResKey);
    if (candidatesResult.isFailure()) {
      return fail(`failed to resolve candidates for '${tsResKey}': ${candidatesResult.message}`);
    }
    const candidates = candidatesResult.value;

    // Step 7: Compose body.
    const bodyResult = this._composeBody(candidates, descriptor);
    if (bodyResult.isFailure()) {
      return fail(bodyResult.message);
    }
    const composedBody = bodyResult.value;

    // Step 8: Gather scope-level bindings (walk from most-general to most-specific).
    const mergedBindingMap = new Map<SlotName, SlotBinding>();
    const reversedChain = [...req.chain].reverse();
    for (const scope of reversedChain) {
      const bindingsResult = await this._store.getBindings(scope);
      if (bindingsResult.isFailure()) {
        return fail(`failed to get bindings for scope '${scope}': ${bindingsResult.message}`);
      }
      const bindingsRecord = bindingsResult.value;
      if (bindingsRecord !== undefined) {
        for (const [slotName, binding] of bindingsRecord.bindings) {
          mergedBindingMap.set(slotName, binding);
        }
      }
    }

    // Step 9: Apply caller substitutions and collect enforced-override findings.
    const enforcedFindings: ISafeguardFinding[] = [];
    const substitutions = req.substitutions ?? {};

    for (const slot of descriptor.slots) {
      const callerValue = substitutions[slot.name];
      if (callerValue === undefined) {
        continue;
      }

      const existingBinding = mergedBindingMap.get(slot.name);
      if (existingBinding?.enforced === true) {
        // Caller tries to override an enforced binding — record finding, keep enforced binding.
        enforcedFindings.push({
          slot: slot.name,
          kind: 'enforced-override-ignored',
          disposition: 'info',
          detail: `slot '${slot.name}' has enforced binding; caller substitution ignored`
        });
        continue;
      }

      // Apply caller substitution.
      if (typeof callerValue === 'string') {
        mergedBindingMap.set(slot.name, {
          kind: 'literal',
          value: callerValue,
          directive: 'prose'
        });
      } else {
        mergedBindingMap.set(slot.name, callerValue);
      }
    }

    // Step 10: Serialize slot values.
    const slotValueMap = new Map<SlotName, string>();
    const bindingTrace = new Map<SlotName, IBindingTraceEntry>();

    for (const slot of descriptor.slots) {
      const callerProvided = substitutions[slot.name] !== undefined;
      const enforcedOverrideIgnored = enforcedFindings.some((f) => f.slot === slot.name);

      const binding = mergedBindingMap.get(slot.name) ?? slot.defaultBinding;
      let value: string;
      let traceSource: IBindingTraceEntry['source'];
      let wasEnforced = false;

      if (binding === undefined) {
        value = '';
        traceSource = 'empty';
      } else if (binding.kind === 'literal') {
        value = binding.value;
        if (enforcedOverrideIgnored || binding.enforced === true) {
          traceSource = 'binding';
          wasEnforced = binding.enforced === true;
        } else if (callerProvided) {
          traceSource = 'caller-sub';
        } else if (slot.defaultBinding !== undefined && binding === slot.defaultBinding) {
          traceSource = 'default';
        } else {
          traceSource = 'binding';
        }
      } else {
        return fail(`slot '${slot.name}': resource slot bindings are not supported in v0.1`);
      }

      slotValueMap.set(slot.name, value);
      bindingTrace.set(slot.name, {
        source: traceSource,
        directive: binding?.directive ?? 'prose',
        value,
        wasEnforced
      });
    }

    // Step 11: Run safeguards.
    const safeguardResult = runSafeguards(slotValueMap, descriptor, this._safetyPolicy);
    if (safeguardResult.isFailure()) {
      return fail(safeguardResult.message);
    }
    const safeguardFindings: ISafeguardFinding[] = [...enforcedFindings, ...safeguardResult.value];

    // Step 12: Render via Mustache.
    const templateResult = this._getOrCreateTemplate(composedBody);
    if (templateResult.isFailure()) {
      return fail(`failed to create Mustache template: ${templateResult.message}`);
    }
    const template = templateResult.value;

    const context = Object.fromEntries(slotValueMap);
    const renderResult = template.validateAndRender(context);
    if (renderResult.isFailure()) {
      return fail(`failed to render prompt '${req.id}': ${renderResult.message}`);
    }

    return succeed({
      id: req.id,
      body: renderResult.value,
      descriptor,
      trace: {
        winningScope,
        scopesConsulted,
        mergedBindings: bindingTrace,
        resourceBindingResolutions: [],
        safeguardFindings,
        candidateMatches: []
      }
    });
  }

  /**
   * Resolves a prompt and validates the raw output using the descriptor's output contract.
   * @param req - The resolve request.
   * @param rawOutput - The raw LLM output string.
   * @returns `Success` with the validated and converted output, or `Failure` with an error message.
   * @public
   */
  public async resolveAndValidateOutput<T>(
    req: IPromptResolveRequest,
    rawOutput: string
  ): Promise<Result<T>> {
    const resolveResult = await this.resolve(req);
    if (resolveResult.isFailure()) {
      return fail(resolveResult.message);
    }
    const resolvedPrompt = resolveResult.value;
    const validationContext: IOutputValidationContext = {
      promptId: req.id,
      substitutions: resolvedPrompt.trace.mergedBindings
    };
    return processOutput<T>(rawOutput, resolvedPrompt.descriptor, this._registry, validationContext);
  }

  /**
   * Composes the prompt body from the resolved candidates.
   * Takes candidates from most-specific until hitting a non-partial one,
   * then joins in specificity-ascending order (base first).
   * @internal
   */
  private _composeBody(
    candidates: ReadonlyArray<Runtime.IResourceCandidate>,
    descriptor: IPromptDescriptor
  ): Result<string> {
    if (candidates.length === 0) {
      return fail('no candidates resolved for prompt body composition');
    }

    // Find the index of the first non-partial candidate (the base).
    const baseIndex = candidates.findIndex((c) => !c.isPartial);
    const stopIndex = baseIndex === -1 ? candidates.length - 1 : baseIndex;

    // Fragments: candidates[0..stopIndex] inclusive.
    const fragments: string[] = [];
    for (let i = 0; i <= stopIndex; i++) {
      const candidate = candidates[i];
      const bodyValue = candidate.json.body;
      if (typeof bodyValue !== 'string') {
        return fail(`candidate ${i} for prompt does not have a string 'body' field`);
      }
      fragments.push(bodyValue);
    }

    const separator = descriptor.join?.separator ?? '\n\n';
    const trimTrailingWhitespace = descriptor.join?.trimTrailingWhitespace ?? true;
    const order = descriptor.join?.order ?? 'specificity-ascending';

    // specificity-ascending: join from least-specific (last in array) to most-specific (first).
    const orderedFragments = order === 'specificity-ascending' ? [...fragments].reverse() : fragments;

    const processedFragments = trimTrailingWhitespace
      ? orderedFragments.map((f) => f.replace(/\s+$/, ''))
      : orderedFragments;

    return succeed(processedFragments.join(separator));
  }

  /**
   * Gets a cached MustacheTemplate or creates a new one, bounded at MUSTACHE_CACHE_MAX.
   * @internal
   */
  private _getOrCreateTemplate(body: string): Result<Mustache.MustacheTemplate> {
    const cached = this._mustacheCache.get(body);
    if (cached !== undefined) {
      return succeed(cached);
    }

    const templateResult = Mustache.MustacheTemplate.create(body, { escape: 'none' });
    if (templateResult.isFailure()) {
      return templateResult;
    }

    if (this._mustacheCache.size >= MUSTACHE_CACHE_MAX) {
      // Evict the oldest entry.
      const firstKey = this._mustacheCache.keys().next().value;
      if (firstKey !== undefined) {
        this._mustacheCache.delete(firstKey);
      }
    }
    this._mustacheCache.set(body, templateResult.value);
    return templateResult;
  }
}
