/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Normalizer, Result, fail, succeed } from '@fgv/ts-utils';
import { sanitizeJsonObject } from '@fgv/ts-json-base';
import { Convert, PromptId, ResourceSubstitutionMode, ScopeKey, SlotName } from '../types';
import {
  IResolvedPrompt,
  IResourceBindingTraceEntry,
  IResourceSlotBinding,
  PromptSubstitutions
} from '../types';
import { IPendingResourceBinding } from './bindingMerger';

/**
 * Stack frame in the in-flight set of currently-resolving prompts.
 * @internal
 */
export interface IResourceBindingStackFrame {
  /** RFC 8785 canonical-JSON key of `\{ chain, id \}`. */
  readonly key: string;
  /** The prompt id at this frame (for human-readable cycle diagnostics). */
  readonly id: PromptId;
}

/**
 * Inputs to one inner resolve call.
 * @internal
 */
export interface IInnerResolveRequest {
  readonly id: PromptId;
  readonly chain: ReadonlyArray<ScopeKey>;
  readonly qualifiers: Readonly<Record<string, string>>;
  readonly substitutions: PromptSubstitutions | undefined;
}

/**
 * Callback shape supplied by `PromptLibrary` so the resolver can re-enter
 * the resolve pipeline at the next depth level without holding a direct
 * reference to the library class.
 * @internal
 */
export type InnerResolveFn = (
  req: IInnerResolveRequest,
  depth: number,
  stack: IResourceBindingStackFrame[]
) => Promise<Result<IResolvedPrompt>>;

/**
 * Builds the RFC 8785 canonical-JSON key for the cycle-detection stack
 * frame: `\{ chain: <chain>, id: <id> \}`. Sanitizes through
 * `sanitizeJsonObject` first so branded-string arrays serialize cleanly.
 *
 * Per the B-2 brief (overriding design §7 step 2's CRC32 reference):
 * RFC 8785 canonical-JSON keys are collision-free and consistent with
 * the descriptor and materialization caches B-1b adopted.
 *
 * @internal
 */
export function buildCycleKey(
  normalizer: Normalizer,
  chain: ReadonlyArray<ScopeKey>,
  id: PromptId
): Result<string> {
  return sanitizeJsonObject({ chain: [...chain], id }).onSuccess((sanitized) =>
    normalizer.canonicalize(sanitized)
  );
}

/**
 * Outcome of resolving the pending resource bindings for one resolve frame.
 *
 * @internal
 */
export interface IResourceBindingResolveResult {
  /** Trace entries to fold into `IPromptResolveTrace.resourceBindingResolutions`. */
  readonly traceEntries: ReadonlyArray<IResourceBindingTraceEntry>;
  /**
   * Per-slot replacement body strings. The caller folds these into the
   * final merged-binding map by `{ ...prev, value: rewrites.get(slot) }`
   * for each pending slot.
   */
  readonly rewrites: ReadonlyMap<SlotName, string>;
}

/**
 * Resolves every pending resource binding produced by `mergeBindings` and
 * returns per-slot replacement strings (the inner-resolve body) plus the
 * trace entries to surface as `IPromptResolveTrace.resourceBindingResolutions`.
 *
 * @remarks
 * - Depth is the depth at which the OUTER (containing) resolve runs. Inner
 *   resolves run at `depth + 1`.
 * - The outer resolve's own request is needed for the OQ-2 strict-replace
 *   substitutions semantic and for chain / qualifier inheritance.
 * - The outer chain is the chain the binding inherits when its own
 *   `scopeOverride` is absent. The outer qualifiers do the same for
 *   `qualifiers`.
 * - When the binding supplies `substitutions`, those entirely replace the
 *   parent's substitutions for the inner resolve (mode `'replace'`). When
 *   omitted, the parent's substitutions are inherited (mode `'inherit'`).
 *
 * @internal
 */
export async function resolvePendingResourceBindings(params: {
  readonly pending: ReadonlyArray<IPendingResourceBinding>;
  readonly outerChain: ReadonlyArray<ScopeKey>;
  readonly outerQualifiers: Readonly<Record<string, string>>;
  readonly outerSubstitutions: PromptSubstitutions | undefined;
  readonly outerId: PromptId;
  readonly depth: number;
  readonly stack: IResourceBindingStackFrame[];
  readonly innerResolve: InnerResolveFn;
}): Promise<Result<IResourceBindingResolveResult>> {
  const traceEntries: IResourceBindingTraceEntry[] = [];
  const rewrites = new Map<SlotName, string>();
  for (const item of params.pending) {
    const built = buildInnerRequest(item.binding, params.outerChain, params.outerQualifiers);
    if (built.isFailure()) {
      return fail(`prompt '${params.outerId}' slot '${item.slot}': ${built.message}`);
    }
    const mode: ResourceSubstitutionMode = item.binding.substitutions === undefined ? 'inherit' : 'replace';
    const innerReq: IInnerResolveRequest = {
      id: built.value.id,
      chain: built.value.chain,
      qualifiers: built.value.qualifiers,
      substitutions: mode === 'replace' ? item.binding.substitutions : params.outerSubstitutions
    };
    const innerResult = await params.innerResolve(innerReq, params.depth + 1, params.stack);
    if (innerResult.isFailure()) {
      return fail(
        `prompt '${params.outerId}' slot '${item.slot}' -> resource '${item.binding.resourceId}': ${innerResult.message}`
      );
    }
    const inner = innerResult.value;
    // Forbid v0.1 resource bindings referencing a 'json'-output descriptor
    // (design §7 step 6). Validators against parsed JSON do not have
    // defined semantics when the output is a substituted body fragment;
    // forward-compatible loosening is additive.
    if (inner.descriptor.output.kind !== 'free-text') {
      return fail(
        `prompt '${params.outerId}' slot '${item.slot}' -> resource '${item.binding.resourceId}': only 'free-text' output is permitted as a resource binding target (got '${inner.descriptor.output.kind}')`
      );
    }
    rewrites.set(item.slot, inner.body);
    traceEntries.push({
      slot: item.slot,
      resourceId: item.binding.resourceId,
      depth: params.depth + 1,
      substitutionMode: mode,
      innerTrace: inner.trace
    });
  }
  return succeed({ traceEntries, rewrites });
}

function buildInnerRequest(
  binding: IResourceSlotBinding,
  outerChain: ReadonlyArray<ScopeKey>,
  outerQualifiers: Readonly<Record<string, string>>
): Result<{
  readonly id: PromptId;
  readonly chain: ReadonlyArray<ScopeKey>;
  readonly qualifiers: Readonly<Record<string, string>>;
}> {
  // `resourceId` is a `ResourceId` brand at the binding layer; the inner
  // resolve consumes a `PromptId` so re-validate. A resource binding that
  // references a non-PromptId-valid id (e.g. one containing '::') is a
  // misconfiguration the consumer needs to see; surface it loudly.
  return Convert.promptId
    .convert(binding.resourceId)
    .withErrorFormat((msg) => `resource '${binding.resourceId}' is not a valid prompt id: ${msg}`)
    .onSuccess((id) =>
      succeed({
        id,
        chain: binding.scopeOverride !== undefined ? binding.scopeOverride : outerChain,
        qualifiers: binding.qualifiers !== undefined ? binding.qualifiers : outerQualifiers
      })
    );
}

/**
 * Formats the cycle-detection error message: walks the in-flight stack
 * up to and including the cycle target.
 *
 * @internal
 */
export function formatCycleError(
  outerId: PromptId,
  stack: ReadonlyArray<IResourceBindingStackFrame>,
  reEnteredId: PromptId
): string {
  const path = stack.map((f) => f.id).concat(reEnteredId);
  return `prompt '${outerId}': cycle detected in resource binding chain: ${path
    .map((id) => `'${id}'`)
    .join(' -> ')}`;
}
