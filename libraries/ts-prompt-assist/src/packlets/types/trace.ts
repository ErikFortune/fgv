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
 * The `value` here is the resolved slot content (post-merge,
 * post-resource-binding, pre-Mustache-render) — the exact string fed into the
 * body template renderer for this slot during {@link PromptLibrary.resolve}.
 *
 * SAFETY: a consumer that reads these per-slot values and assembles a prompt
 * *externally* bypasses the `applySafeguards` pass that `resolve` runs over the
 * resolved whole, and **must independently screen the composed output against
 * its own safety policy.** The durable, safety-closed path is the in-fgv
 * {@link HorizontalComposer}, which consumes these slots and runs
 * `applySafeguards` against a first-class composed descriptor over the merged
 * slot map before returning a body — prefer it over a hand-rolled external
 * composer.
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
 * How a resolved prompt's text is measured, when the default character count is not the unit the
 * caller cares about.
 * @remarks
 * **Segmentation is the library's job; measurement is the caller's.** A prompt budget is
 * denominated in *tokens*, and `ts-prompt-assist` cannot count those truthfully — tokenization is
 * model-specific, so a bundled tokenizer would be confidently wrong for every model it was not
 * built for. Characters are always reported because they are exact and free; supply this to get a
 * second number in a unit that means something to you.
 * @public
 */
export type PromptSectionMeasure = (text: string) => number;

/**
 * Options requesting a {@link IPromptComposition} from a resolve. Presence opts in.
 * @public
 */
export interface IPromptCompositionOptions {
  /** Optional second measure per section — typically a tokenizer. See {@link PromptSectionMeasure}. */
  readonly measure?: PromptSectionMeasure;
}

/**
 * One contiguous run of a resolved prompt's body, attributed to what produced it.
 * @public
 */
export interface IPromptSection {
  /**
   * `'preface'` for the anti-jailbreak preface, `'template'` for literal body text, `'slot'` for a
   * substituted slot value.
   */
  readonly kind: 'preface' | 'template' | 'slot';
  /** Slot name, when `kind` is `'slot'`. */
  readonly slot?: SlotName;
  /** Offset into {@link IResolvedPrompt.body}, in UTF-16 code units. */
  readonly start: number;
  /** Length in UTF-16 code units. May be `0` for a slot that resolved to an empty value. */
  readonly chars: number;
  /** Result of {@link IPromptCompositionOptions.measure}, when one was supplied. */
  readonly measured?: number;
  /** Provenance of the winning binding, for a `'slot'` section — mirrors {@link IResolvedPromptSlot}. */
  readonly source?: BindingTraceSource;
  /** Framing directive for a `'slot'` section. */
  readonly directive?: SlotDirective;
  /** True iff the slot's winning binding was enforced. */
  readonly wasEnforced?: boolean;
  /** Scope whose binding won, when the section's source is `'binding'`. */
  readonly winningScope?: ScopeKey;
}

/**
 * Where a resolved prompt's bulk actually went: what is in the body, in what order, and how much of
 * it each part is.
 * @remarks
 * Answers "why is this prompt so large", which the trace cannot — the trace says which bindings won,
 * not how many characters each contributed to the output. Sections carry the same provenance as
 * {@link IResolvedPromptSlot}, so a large section is attributable to the scope and binding that
 * produced it without a second lookup.
 *
 * **Offsets are computed during the render, never recovered from the finished text.** See
 * `MustacheTemplate.renderWithSegments` in `@fgv/ts-extras` for why searching the output for each
 * substituted value is unsound.
 * @public
 */
export interface IPromptComposition {
  /** Length of {@link IResolvedPrompt.body} in UTF-16 code units. Always present. */
  readonly totalChars: number;
  /** Sum of the sections' `measured`, when a measure was supplied. */
  readonly totalMeasured?: number;
  /**
   * Document-ordered, contiguous and gapless — concatenating the slices reproduces `body` exactly.
   * **Empty when {@link IPromptComposition.unavailable} is set.**
   */
  readonly sections: ReadonlyArray<IPromptSection>;
  /**
   * Set when a section map could not be produced — e.g. the body template uses Mustache sections or
   * partials, whose output is not a linear image of the template.
   * @remarks
   * A diagnostic must not be able to break the thing it observes, so this is reported here rather
   * than failing the resolve. The prompt is returned normally; only the section map is missing, and
   * it says why rather than being silently absent.
   */
  readonly unavailable?: string;
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
   * SAFETY: reading these values to compose a prompt *externally* bypasses the
   * `applySafeguards` pass `resolve` runs over the resolved whole — an external
   * composer **must self-screen the composed output** against its own safety
   * policy. The in-fgv {@link HorizontalComposer} is the durable, safety-closed
   * path: it consumes these slots and re-runs `applySafeguards` against a
   * first-class composed descriptor over the merged slot map.
   */
  readonly slots: ReadonlyMap<SlotName, IResolvedPromptSlot>;
  /**
   * Section-by-section view of `body` — present only when the request supplied
   * {@link IPromptResolveRequest.composition}. See {@link IPromptComposition}.
   */
  readonly composition?: IPromptComposition;
}
