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
 * @public
 */
export interface IBindingTraceEntry {
  readonly source: BindingTraceSource;
  /** Set when `source === 'binding'`. */
  readonly winningScope?: ScopeKey;
  readonly directive: SlotDirective;
  /** Post-serialization, pre-Mustache. */
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
 * @public
 */
export interface ICandidateMatchTraceEntry {
  /** Index into the record's `candidates` array. */
  readonly candidateIndex: number;
  readonly matchType: 'match' | 'matchAsDefault';
  /** ts-res's per-condition match details, forwarded unchanged. */
  readonly conditions: ReadonlyArray<TsResRuntime.IConditionMatchResult>;
}

/**
 * Recursive trace entry for a resource binding inner resolve.
 * @public
 */
export interface IResourceBindingTraceEntry {
  readonly slot: SlotName;
  readonly resourceId: ResourceId;
  readonly depth: number;
  readonly substitutionMode: ResourceSubstitutionMode;
  readonly innerTrace: IPromptResolveTrace;
}

/**
 * Full resolve-time trace.
 * @public
 */
export interface IPromptResolveTrace {
  readonly winningScope: ScopeKey;
  readonly scopesConsulted: ReadonlyArray<ScopeKey>;
  readonly mergedBindings: ReadonlyMap<SlotName, IBindingTraceEntry>;
  readonly resourceBindingResolutions: ReadonlyArray<IResourceBindingTraceEntry>;
  readonly safeguardFindings: ReadonlyArray<ISafeguardFinding>;
  readonly candidateMatches: ReadonlyArray<ICandidateMatchTraceEntry>;
}

/**
 * Output of a successful {@link PromptLibrary.resolve} invocation.
 * @public
 */
export interface IResolvedPrompt {
  readonly id: PromptId;
  readonly body: string;
  readonly descriptor: IPromptDescriptor;
  readonly trace: IPromptResolveTrace;
}
