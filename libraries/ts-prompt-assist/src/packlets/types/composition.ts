/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { SlotName } from './ids';
import { SlotDirective } from './enums';
import { IPromptDescriptor } from './descriptor';
import { IResolvedPrompt, IResolvedPromptSlot, ISafeguardFinding } from './trace';

/**
 * One contributor to a horizontal composition. The consumer resolves each
 * contributor independently via `PromptLibrary.resolve()` before passing it
 * to the composer. The composer does not resolve — it composes resolved
 * outputs, reading each contributor's per-slot values off
 * {@link IResolvedPrompt.slots}.
 *
 * @public
 */
export interface IContributorSpec {
  /** The independently-resolved prompt this contributor brings to the composition. */
  readonly resolved: IResolvedPrompt;
  /**
   * Provenance priority for this contributor. Higher numbers take precedence
   * for `'overwrite'`-strategy slots. For `'concatenate'` slots, contributions
   * are joined in ascending provenance order (lowest-priority first — the
   * "later instructions take precedence" LLM reading convention, matching the
   * existing partial-fragment join order in the resolver).
   *
   * @remarks
   * Provenance is a composer-layer concept only. It never participates in
   * ts-res candidate selection — by the time a contributor reaches the
   * composer it is already fully resolved (own qualifiers, own candidates,
   * own substitutions).
   */
  readonly provenance: number;
}

/**
 * Strategy for merging multiple contributors' non-constraint values for one
 * logical slot. `'concatenate'` joins all contributions (ascending provenance)
 * with the slot's separator; `'overwrite'` keeps the highest-provenance
 * contribution and discards the rest.
 *
 * @remarks
 * `constraint`-directive contributions are exempt from `'overwrite'` — they are
 * always concatenated and never dropped (see {@link HorizontalComposer}).
 * A future model-synthesis (`'rewrite'`) strategy is deliberately not precluded
 * by this union.
 *
 * @public
 */
export type LogicalSlotStrategy = 'concatenate' | 'overwrite';

/**
 * Declaration of one logical slot in the composed prompt's slot space. An
 * explicit `(contributor, slotName)` map — not name-matching — turns every
 * implicit dependency into a checked reference validated at
 * {@link HorizontalComposer.create}.
 *
 * @public
 */
export interface ILogicalSlotConfig {
  /** Name of the logical slot in the composed prompt's slot space. */
  readonly logicalSlotName: SlotName;
  /**
   * Ordered list of `(contributor, slotName)` pairs contributing to this
   * logical slot. The composer validates at construction time that each
   * referenced contributor exists (matched by `contributorProvenance`) and
   * that the referenced slot appears on that contributor's
   * {@link IResolvedPrompt.slots}.
   *
   * @remarks
   * Declared order is a stable tiebreaker among contributions of equal
   * provenance; provenance is the primary order.
   */
  readonly contributorSlots: ReadonlyArray<{
    readonly contributorProvenance: number;
    readonly slotName: SlotName;
  }>;
  /** Merge strategy for the slot's non-constraint contributions. */
  readonly strategy: LogicalSlotStrategy;
  /** Separator for the `'concatenate'` strategy (and the constraint block). Default `'\n\n'`. */
  readonly separator?: string;
}

/**
 * Per-logical-slot provenance entry: one contributor's contribution to a
 * logical slot, recorded in {@link IComposedPrompt.provenanceTrace} in the
 * order it was merged (ascending provenance; constraints first).
 *
 * @public
 */
export interface ISlotProvenanceEntry {
  /** Provenance of the contributing contributor. */
  readonly provenance: number;
  /** Name of the slot on the contributor that supplied this contribution. */
  readonly contributorSlotName: SlotName;
  /** The contribution's resolved value. */
  readonly value: string;
  /** The contribution's framing directive. */
  readonly directive: SlotDirective;
}

/**
 * Result of a successful {@link HorizontalComposer.compose}, mirroring
 * {@link IResolvedPrompt}'s shape for the composed whole.
 *
 * @public
 */
export interface IComposedPrompt {
  /** Final rendered body of the composed prompt (Mustache render of `composedBody`). */
  readonly body: string;
  /** The composed descriptor that drove the merge + safeguard pass. */
  readonly descriptor: IPromptDescriptor;
  /** Merged per-logical-slot values, keyed by `logicalSlotName`. */
  readonly mergedSlots: ReadonlyMap<SlotName, IResolvedPromptSlot>;
  /** Per-logical-slot contribution provenance, keyed by `logicalSlotName`. */
  readonly provenanceTrace: ReadonlyMap<SlotName, ReadonlyArray<ISlotProvenanceEntry>>;
  /** Warn / info safeguard findings surfaced over the merged slot values. */
  readonly safeguardFindings: ReadonlyArray<ISafeguardFinding>;
}
