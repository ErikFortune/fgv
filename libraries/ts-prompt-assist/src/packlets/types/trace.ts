/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { PromptId, ResourceId, ScopeKey, SlotName } from './ids';
import { SlotDirective, ResourceSubstitutionMode } from './enums';
import { IPromptDescriptor } from './descriptor';
import { Runtime as TsResRuntime } from '@fgv/ts-res';

/**
 * Discrimination of the source of a merged slot value.
 * @public
 */
export type BindingTraceSource = 'caller-sub' | 'binding' | 'default' | 'empty';

/**
 * Trace entry per slot in the merged bindings result.
 *
 * @remarks
 * Surfaces *which* binding won — a caller substitution, a scope-level
 * `_bindings.yaml` entry, the slot's `defaultBinding`, or the empty
 * fallback — and (for scope-level wins) which scope contributed it.
 *
 * @public
 */
export interface IBindingTraceEntry {
  /** Where the winning value came from. */
  readonly source: BindingTraceSource;
  /** Set when `source === 'binding'`. The scope whose `_bindings.yaml` won. */
  readonly winningScope?: ScopeKey;
  /** Framing directive carried with the binding (`'constraint' | 'hint' | 'prose'`). */
  readonly directive: SlotDirective;
  /** Post-serialization, pre-Mustache string fed into the template renderer. */
  readonly value: string;
  /** True iff the merged binding had `enforced: true` (caller subs were rejected). */
  readonly wasEnforced: boolean;
}

/**
 * Discriminator of the safeguard finding kind. The v0.1 surface enumerates
 * the four kinds the library can emit; only `'enforced-override-ignored'` is
 * produced by B-1's foundation. The remaining kinds wire up in B-4.
 * @public
 */
export type SafeguardFindingKind =
  | 'max-length'
  | 'suspicious-pattern'
  | 'screening-skipped'
  | 'enforced-override-ignored';

/**
 * Disposition of a safeguard finding.
 * @public
 */
export type SafeguardDisposition = 'warn' | 'reject' | 'info';

/**
 * Safeguard finding surfaced in the trace.
 * @public
 */
export interface ISafeguardFinding {
  readonly slot: SlotName;
  readonly kind: SafeguardFindingKind;
  readonly disposition: SafeguardDisposition;
  readonly detail: string;
}

/**
 * Per-candidate match disposition recorded in the trace.
 *
 * @remarks
 * Order is specificity-ascending: full base first, most-specific partial
 * last (matches the join order for partial-fragment composition).
 *
 * @public
 */
export interface ICandidateMatchTraceEntry {
  /** Index into the record's `candidates` array (authored order). */
  readonly candidateIndex: number;
  /** ts-res's match disposition for the candidate's condition set. */
  readonly matchType: 'match' | 'matchAsDefault';
  /** ts-res's per-condition match details, forwarded unchanged. */
  readonly conditions: ReadonlyArray<TsResRuntime.IConditionMatchResult>;
}

/**
 * Recursive trace entry for a resource binding inner resolve.
 * @public
 */
export interface IResourceBindingTraceEntry {
  /** Outer slot whose binding referenced an inner prompt. */
  readonly slot: SlotName;
  /** Inner prompt id (treated as a `PromptId` for the inner resolve). */
  readonly resourceId: ResourceId;
  /** 1-based recursion depth (outer is 0; first inner is 1). */
  readonly depth: number;
  /** `'replace'` when the binding supplied its own substitutions; `'inherit'` otherwise. */
  readonly substitutionMode: ResourceSubstitutionMode;
  /** Full inner-resolve trace (recursive). */
  readonly innerTrace: IPromptResolveTrace;
}

/**
 * Full resolve-time trace.
 *
 * @remarks
 * Surfaces every decision the resolver made: which scope's record won, which
 * scopes were consulted, what each slot's merged value came from, which
 * candidates contributed body fragments, which safeguard findings fired, and
 * the recursive inner traces of any resource bindings.
 *
 * @public
 */
export interface IPromptResolveTrace {
  /** Scope whose prompt record was selected (chain walker's win). */
  readonly winningScope: ScopeKey;
  /** Scopes consulted (most-specific first), up to and including the winner. */
  readonly scopesConsulted: ReadonlyArray<ScopeKey>;
  /** Merged-binding map keyed by slot name. See {@link IBindingTraceEntry}. */
  readonly mergedBindings: ReadonlyMap<SlotName, IBindingTraceEntry>;
  /** One entry per resource-binding slot, with the inner resolve's full trace. */
  readonly resourceBindingResolutions: ReadonlyArray<IResourceBindingTraceEntry>;
  /**
   * Warn / info safeguard findings: `'suspicious-pattern'` matches under
   * `onSuspicious: 'warn'`, `'screening-skipped'`, and
   * `'enforced-override-ignored'`. Reject paths (length-cap violations,
   * `'suspicious-pattern'` matches under `onSuspicious: 'reject'`) fail
   * the resolve before an `IResolvedPrompt` is constructed, so their
   * details surface in the failure message rather than here.
   */
  readonly safeguardFindings: ReadonlyArray<ISafeguardFinding>;
  /** Per-candidate match details, specificity-ascending. */
  readonly candidateMatches: ReadonlyArray<ICandidateMatchTraceEntry>;
}

/**
 * Output of a successful {@link PromptLibrary.resolve} invocation.
 * @public
 */
export interface IResolvedPrompt {
  /** Prompt id from the request. */
  readonly id: PromptId;
  /** Final rendered body, post Mustache + post anti-jailbreak preface. */
  readonly body: string;
  /** Descriptor that drove the resolve. */
  readonly descriptor: IPromptDescriptor;
  /** Full resolve-time trace; see {@link IPromptResolveTrace}. */
  readonly trace: IPromptResolveTrace;
}
