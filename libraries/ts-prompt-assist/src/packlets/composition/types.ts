/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { IContributorSpec, ILogicalSlotConfig, IPromptDescriptor, IPromptSafetyPolicy } from '../types';
import { IPromptObservationSeam } from '../observe';

/**
 * Parameters for {@link HorizontalComposer.create}.
 *
 * @remarks
 * Lives in the `composition` packlet (rather than alongside the other
 * composition types in the `types` packlet) because its optional
 * {@link IHorizontalComposeParams.observation | observation} field references
 * {@link IPromptObservationSeam} from the `observe` packlet — and the `types`
 * packlet is a leaf that `observe` depends on, so it cannot depend back on
 * `observe`.
 *
 * @public
 */
export interface IHorizontalComposeParams {
  /** Independently-resolved contributors, each tagged with a composer-layer provenance. */
  readonly contributors: ReadonlyArray<IContributorSpec>;
  /**
   * The logical-slot declarations. Declared order is a tiebreaker for
   * topo-equal slots, **not** the semantic processing order — independent
   * logical slots may be processed in any order. (Phase B+1 replaces the
   * declared-order walk with a dependency topo-sort; treating declared order
   * as the binding processing order would make that a breaking change.)
   */
  readonly logicalSlots: ReadonlyArray<ILogicalSlotConfig>;
  /**
   * Descriptor for the composed prompt. Mandatory so {@link HorizontalComposer}
   * can run `applySafeguards` against a first-class composed descriptor (the
   * composed slots' `maxLength` / `allowedDirectives` / safeguard overrides)
   * before returning a body — this is the safety closure the consumer-side
   * external-composer path cannot achieve. Its `slots` are the logical-slot
   * declarations (keyed by `logicalSlotName`).
   */
  readonly composedDescriptor: IPromptDescriptor;
  /**
   * Mustache body template for the composed prompt, referencing logical slots
   * by name (`{{logicalSlotName}}`). {@link IPromptDescriptor} carries slot
   * declarations but not a body (a body lives on candidate records, not the
   * descriptor), so the composed body template is supplied here. Rendered with
   * the merged slot map via the same `MustacheTemplateCache` (`escape: 'none'`)
   * the resolver uses.
   */
  readonly composedBody: string;
  /** Optional safety policy applied (with the composed descriptor) to the merged slot values. */
  readonly safetyPolicy?: IPromptSafetyPolicy;
  /**
   * Optional observation seam obtained from {@link PromptLibrary.observationSeam}.
   * When supplied, {@link HorizontalComposer.compose} times the merge, builds a
   * `'compose'` observation record (nesting each contributor's resolve trace),
   * and awaits its dispatch through the library's observer fan-out before
   * returning — so an audit trail correlates the composed output with the N
   * contributor `'resolve'` records via the shared `seq` space. When omitted,
   * `compose` behaves exactly as before with zero observation overhead.
   */
  readonly observation?: IPromptObservationSeam;
}
