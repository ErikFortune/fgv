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
  /**
   * Framing directive carried with the binding
   * (`'constraint' | 'hint' | 'prose'`). For `source === 'empty'` (the
   * fallback when no binding, default, or caller substitution applies)
   * this field is `'prose'` — placeholder metadata, not author intent.
   */
  readonly directive: SlotDirective;
  /** Post-serialization, pre-Mustache string fed into the template renderer. */
  readonly value: string;
  /** True iff the merged binding had `enforced: true` (caller subs were rejected). */
  readonly wasEnforced: boolean;
}

/**
 * Built-in safeguard finding kinds the library itself emits. `'max-length'`
 * and `'suspicious-pattern'` describe rejections / matches; `'screening-skipped'`
 * and `'enforced-override-ignored'` are informational. Custom screeners may
 * emit additional kinds — see {@link SafeguardFindingKind}.
 * @public
 */
export type BuiltInFindingKind =
  | 'max-length'
  | 'suspicious-pattern'
  | 'screening-skipped'
  | 'enforced-override-ignored';

/**
 * Discriminator of a safeguard finding kind. Built-in kinds (see
 * {@link BuiltInFindingKind}) preserve autocomplete; the `string & {}` branch
 * lets custom {@link IScreener} implementations emit arbitrary kinds.
 * @public
 */
export type SafeguardFindingKind = BuiltInFindingKind | (string & {});

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
  /**
   * Optional structured per-finding data — e.g. a classifier's per-label
   * scores — that would otherwise have to be stringified into `detail`.
   */
  readonly metadata?: Readonly<Record<string, unknown>>;
  /** Name of the emitting {@link IScreener}, when the finding came from one. */
  readonly screener?: string;
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
   * Warn / info safeguard findings: screener findings whose `disposition`
   * is `'warn'` or `'info'` (e.g. `'suspicious-pattern'` warnings,
   * `'screening-skipped'`) plus `'enforced-override-ignored'` from the
   * binding merge. Reject paths (length-cap violations, any finding with
   * `disposition: 'reject'`, or a screener returning `fail()`) fail the
   * resolve before an `IResolvedPrompt` is constructed, so their details
   * surface in the failure message rather than here.
   */
  readonly safeguardFindings: ReadonlyArray<ISafeguardFinding>;
  /** Per-candidate match details, specificity-ascending. */
  readonly candidateMatches: ReadonlyArray<ICandidateMatchTraceEntry>;
}

/**
 * Per-slot view of a resolved prompt, purpose-typed for horizontal composition
 * patterns. A stable, supported alternative view over `trace.mergedBindings` for
 * consumers that read per-slot values to compose a prompt externally — the same
 * data as the corresponding {@link IBindingTraceEntry}, projected with the slot
 * `name` and surfaced as a first-class primitive rather than a trace detail.
 *
 * @remarks
 * IMPORTANT (interim safety gap): the `value` here is the resolved slot
 * content (post-merge, post-resource-binding, pre-Mustache-render) — the
 * exact string fed into the body template renderer for this slot during
 * {@link PromptLibrary.resolve}. A consumer that reads these per-slot values
 * and assembles a prompt *externally* bypasses the `applySafeguards` pass that
 * `resolve` runs over the resolved whole. Such a consumer **must independently
 * screen the composed output against its own safety policy.** The durable,
 * safety-closed path is the in-fgv `HorizontalComposer` (phase B), which runs
 * `applySafeguards` against a first-class composed descriptor over the merged
 * slot map.
 *
 * @public
 */
export interface IResolvedPromptSlot {
  /** Slot name (key into {@link IResolvedPrompt.slots}). */
  readonly name: SlotName;
  /**
   * Resolved slot value string (post-merge, post-resource-binding,
   * pre-Mustache-render) — the exact string fed into the body template
   * renderer as this slot's substitution. Slot values are substituted
   * literally; they are not themselves rendered through Mustache.
   */
  readonly value: string;
  /** Framing directive for the slot's winning binding. */
  readonly directive: SlotDirective;
  /** Source of the winning binding. */
  readonly source: BindingTraceSource;
  /** True iff the winning binding was enforced (caller substitutions were rejected). */
  readonly wasEnforced: boolean;
  /** Set when `source === 'binding'` — the scope whose `_bindings.yaml` won. */
  readonly winningScope?: ScopeKey;
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
  /**
   * Per-slot resolved view, keyed by {@link SlotName} — a stable, supported
   * projection of `trace.mergedBindings` purpose-typed for horizontal
   * composition. Each entry is the resolved pre-Mustache-render value plus
   * its framing/provenance metadata; see {@link IResolvedPromptSlot}.
   *
   * @remarks
   * IMPORTANT (interim safety gap): reading these values to compose a prompt
   * *externally* bypasses the `applySafeguards` pass `resolve` runs over the
   * resolved whole — an external composer **must self-screen the composed
   * output** against its own safety policy. The in-fgv `HorizontalComposer`
   * (phase B) is the durable, safety-closed path.
   */
  readonly slots: ReadonlyMap<SlotName, IResolvedPromptSlot>;
}
