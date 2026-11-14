/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Hash, Normalizer, Result, captureResult, fail, succeed } from '@fgv/ts-utils';
import { sanitizeJsonObject } from '@fgv/ts-json-base';
import {
  IBindingTraceEntry,
  IComposedPrompt,
  IContributorSpec,
  ILogicalSlotConfig,
  IResolvedPromptSlot,
  ISlotProvenanceEntry,
  SlotDirective,
  SlotName
} from '../types';
import {
  IPromptComposeContributorObservation,
  IPromptComposeObservation,
  IPromptObservationSeam
} from '../observe';
import { IHorizontalComposeParams } from './types';
import { applySafeguards } from '../safeguards';
import { MustacheTemplateCache } from '../resolve';

const DEFAULT_SEPARATOR: string = '\n\n';

/**
 * Internal shape of one gathered contribution before merge — a contributor's
 * resolved value for one of a logical slot's `contributorSlots` references,
 * tagged with the contributor's provenance.
 */
interface IGatheredContribution {
  readonly provenance: number;
  readonly contributorSlotName: SlotName;
  readonly value: string;
  readonly directive: SlotDirective;
}

/**
 * First-class horizontal (multi-contributor) prompt-slot composer.
 *
 * @remarks
 * Each contributor is resolved independently via `PromptLibrary.resolve`; the
 * composer reads the per-contributor {@link IResolvedPrompt.slots} view and
 * merges contributions into a composed prompt's logical-slot space. It is the
 * **safety-closed** home for horizontal composition: unlike a consumer-side
 * external composer (which bypasses the resolver's `applySafeguards` pass), the
 * composer runs `applySafeguards` against a first-class composed descriptor over
 * the merged slot map before rendering.
 *
 * Merge rules (directive-aware) per logical slot:
 * - Contributions are ordered by ascending provenance (declared order in
 *   `contributorSlots` is a stable tiebreaker among equal provenance).
 * - `constraint`-directive contributions are **always concatenated first and
 *   never dropped**, regardless of the slot's strategy.
 * - Non-constraint contributions then apply the declared strategy on top of the
 *   constraint block: `'concatenate'` joins all (ascending) with the separator;
 *   `'overwrite'` keeps only the highest-provenance non-constraint.
 *
 * Logical-slot processing order is NOT semantically binding — independent slots
 * may be processed in any order. `IHorizontalComposeParams.logicalSlots`
 * declared order is a tiebreaker for topo-equal slots only, preserving room for
 * a future dependency topo-sort (phase B+1) to reorder without a breaking change.
 *
 * @public
 */
export class HorizontalComposer {
  private readonly _params: IHorizontalComposeParams;
  private readonly _contributorsByProvenance: ReadonlyMap<number, IContributorSpec>;
  private readonly _templateCache: MustacheTemplateCache;

  private constructor(
    params: IHorizontalComposeParams,
    contributorsByProvenance: ReadonlyMap<number, IContributorSpec>,
    templateCache: MustacheTemplateCache
  ) {
    this._params = params;
    this._contributorsByProvenance = contributorsByProvenance;
    this._templateCache = templateCache;
  }

  /**
   * Validates the logical-slot map against the supplied contributors and
   * returns a ready composer. Build-time validation (synchronous, cheap):
   * - contributor provenance values are unique (provenance is the contributor key);
   * - logical-slot names are unique (a duplicate would silently overwrite an
   *   earlier merge / trace);
   * - every `logicalSlotName` is declared in `composedDescriptor.slots` (an
   *   undeclared logical slot would be merged and rendered but skipped by the
   *   `applySafeguards` / `allowedDirectives` pass — defeating the safety closure);
   * - every `contributorSlots` entry references a contributor that exists (by
   *   `contributorProvenance`);
   * - every referenced slot appears on that contributor's
   *   {@link IResolvedPrompt.slots}.
   *
   * @param params - {@link IHorizontalComposeParams}.
   * @returns A {@link HorizontalComposer} on success, or a contextual failure.
   */
  public static create(params: IHorizontalComposeParams): Result<HorizontalComposer> {
    const byProvenance = new Map<number, IContributorSpec>();
    for (const contributor of params.contributors) {
      if (byProvenance.has(contributor.provenance)) {
        return fail(
          `horizontal composition: duplicate contributor provenance ${contributor.provenance} (provenance must be unique — it is the contributor key)`
        );
      }
      byProvenance.set(contributor.provenance, contributor);
    }

    const composedSlotNames = new Set(params.composedDescriptor.slots.map((s) => s.name));
    const seenLogicalSlots = new Set<SlotName>();
    for (const logical of params.logicalSlots) {
      if (seenLogicalSlots.has(logical.logicalSlotName)) {
        return fail(
          `horizontal composition: duplicate logical slot '${logical.logicalSlotName}' (logical slot names must be unique)`
        );
      }
      seenLogicalSlots.add(logical.logicalSlotName);
      if (!composedSlotNames.has(logical.logicalSlotName)) {
        return fail(
          `horizontal composition: logical slot '${logical.logicalSlotName}' is not declared in the composed descriptor's slots (it would be rendered but bypass the safeguard pass)`
        );
      }
      for (const ref of logical.contributorSlots) {
        const contributor = byProvenance.get(ref.contributorProvenance);
        if (contributor === undefined) {
          return fail(
            `horizontal composition: logical slot '${logical.logicalSlotName}' references contributor provenance ${ref.contributorProvenance}, which is not among the supplied contributors`
          );
        }
        if (!contributor.resolved.slots.has(ref.slotName)) {
          return fail(
            `horizontal composition: logical slot '${logical.logicalSlotName}' references slot '${ref.slotName}' on contributor provenance ${ref.contributorProvenance}, which has no such resolved slot`
          );
        }
      }
    }

    return MustacheTemplateCache.create().onSuccess((templateCache) =>
      succeed(new HorizontalComposer(params, byProvenance, templateCache))
    );
  }

  /**
   * Performs the directive-aware merge, runs the safeguard boundary over the
   * merged slot values (with the composed descriptor), renders the composed
   * body template, and returns the {@link IComposedPrompt}.
   *
   * @remarks
   * When {@link IHorizontalComposeParams.observation} is supplied, the merge is
   * timed and a `'compose'` observation record — nesting each contributor's
   * resolve trace and sharing the library's `seq` space — is built and awaited
   * through the library's observer fan-out before this returns. When it is
   * absent, this is the pre-existing fast path: no timing, no record, no
   * dispatch.
   *
   * @returns The composed prompt on success; a failure if a merged value
   * violates a hard policy (length cap, disallowed directive, or a screener
   * reject) or rendering fails.
   */
  public async compose(): Promise<Result<IComposedPrompt>> {
    const observation = this._params.observation;
    if (observation === undefined) {
      return this._composeInternal();
    }
    const startedAt = observation.now();
    const result = await this._composeInternal();
    const durationMs = observation.now() - startedAt;
    await observation.observe(this._buildComposeObservation(observation, result, durationMs));
    return result;
  }

  /**
   * The directive-aware merge → safeguard boundary → Mustache render pipeline.
   * Split from {@link HorizontalComposer.compose} so the observation wrapper can
   * time it without the timing/record machinery leaking into the merge logic.
   */
  private async _composeInternal(): Promise<Result<IComposedPrompt>> {
    const mergedSlots = new Map<SlotName, IResolvedPromptSlot>();
    const provenanceTrace = new Map<SlotName, ReadonlyArray<ISlotProvenanceEntry>>();
    const safeguardMap = new Map<SlotName, IBindingTraceEntry>();

    for (const logical of this._params.logicalSlots) {
      const merged = this._mergeLogicalSlot(logical);
      mergedSlots.set(logical.logicalSlotName, {
        name: logical.logicalSlotName,
        value: merged.value,
        directive: merged.directive,
        source: merged.source,
        wasEnforced: false
      });
      provenanceTrace.set(logical.logicalSlotName, merged.entries);
      safeguardMap.set(logical.logicalSlotName, {
        source: merged.source,
        directive: merged.directive,
        value: merged.value,
        wasEnforced: false
      });
    }

    // Safeguard boundary: directive conformance (sync) bridges into the async
    // applySafeguards pass, then the Mustache render of the composed body.
    return this._checkAllowedDirectives(provenanceTrace)
      .thenOnSuccess(async () =>
        applySafeguards(this._params.composedDescriptor, safeguardMap, this._params.safetyPolicy)
      )
      .onSuccess((safeguardResult) =>
        this._renderBody(mergedSlots).onSuccess((body) =>
          succeed<IComposedPrompt>({
            body,
            descriptor: this._params.composedDescriptor,
            mergedSlots,
            provenanceTrace,
            safeguardFindings: safeguardResult.findings
          })
        )
      );
  }

  /**
   * Merges one logical slot's contributions: gather (provenance-ascending,
   * declared-order tiebreak) → constraint block first (never dropped) →
   * non-constraints per strategy.
   */
  private _mergeLogicalSlot(logical: ILogicalSlotConfig): {
    readonly value: string;
    readonly directive: SlotDirective;
    readonly source: IBindingTraceEntry['source'];
    readonly entries: ReadonlyArray<ISlotProvenanceEntry>;
  } {
    const separator = logical.separator ?? DEFAULT_SEPARATOR;
    const gathered = this._gatherContributions(logical);

    const constraints = gathered.filter((c) => c.directive === 'constraint');
    const nonConstraints = gathered.filter((c) => c.directive !== 'constraint');

    const entries: ISlotProvenanceEntry[] = [];
    const parts: string[] = [];

    // Constraint block: always concatenated in ascending provenance order, never dropped.
    for (const c of constraints) {
      entries.push(c);
      parts.push(c.value);
    }

    if (logical.strategy === 'overwrite') {
      // Highest-provenance non-constraint wins (ascending sort → last entry).
      const winner = nonConstraints[nonConstraints.length - 1];
      if (winner !== undefined) {
        entries.push(winner);
        parts.push(winner.value);
      }
    } else {
      for (const c of nonConstraints) {
        entries.push(c);
        parts.push(c.value);
      }
    }

    if (gathered.length === 0) {
      // No contribution for this logical slot — empty fallback (skipped by the
      // safeguard pass and rendered as the empty string by Mustache).
      return { value: '', directive: 'prose', source: 'empty', entries };
    }

    // Merged framing: a constraint anywhere dominates; otherwise the
    // highest-provenance non-constraint's directive. Safe to index here —
    // `gathered.length > 0` with no constraints implies `nonConstraints` is
    // non-empty (the empty case returned above).
    const directive: SlotDirective =
      constraints.length > 0 ? 'constraint' : nonConstraints[nonConstraints.length - 1].directive;

    return { value: parts.join(separator), directive, source: 'binding', entries };
  }

  /** Gathers a logical slot's contributions, sorted ascending by provenance (stable). */
  private _gatherContributions(logical: ILogicalSlotConfig): ReadonlyArray<IGatheredContribution> {
    const gathered = logical.contributorSlots.map((ref) => {
      // Both lookups are guaranteed present by create()'s build-time validation.
      const contributor = this._contributorsByProvenance.get(ref.contributorProvenance)!;
      const slot = contributor.resolved.slots.get(ref.slotName)!;
      return {
        provenance: ref.contributorProvenance,
        contributorSlotName: ref.slotName,
        value: slot.value,
        directive: slot.directive
      };
    });
    // Stable sort: Array.prototype.sort is stable (Node 20), so equal-provenance
    // contributions keep their declared `contributorSlots` order (the tiebreaker).
    return [...gathered].sort((a, b) => a.provenance - b.provenance);
  }

  /**
   * Safeguard-boundary directive conformance: each contribution's directive
   * must be permitted by the composed descriptor's matching logical slot's
   * `allowedDirectives` (when declared). A disallowed directive fails compose.
   */
  private _checkAllowedDirectives(
    provenanceTrace: ReadonlyMap<SlotName, ReadonlyArray<ISlotProvenanceEntry>>
  ): Result<true> {
    for (const slot of this._params.composedDescriptor.slots) {
      const allowed = slot.allowedDirectives;
      if (allowed === undefined) {
        continue;
      }
      const entries = provenanceTrace.get(slot.name) ?? [];
      for (const entry of entries) {
        if (!allowed.includes(entry.directive)) {
          return fail(
            `prompt '${this._params.composedDescriptor.id}': logical slot '${
              slot.name
            }': contribution from slot '${entry.contributorSlotName}' has directive '${
              entry.directive
            }', not permitted by allowedDirectives [${allowed.join(', ')}]`
          );
        }
      }
    }
    return succeed(true);
  }

  /** Renders the composed body template with the merged slot map. */
  private _renderBody(mergedSlots: ReadonlyMap<SlotName, IResolvedPromptSlot>): Result<string> {
    const context: Record<string, string> = {};
    mergedSlots.forEach((slot, name) => {
      context[name] = slot.value;
    });
    return this._templateCache
      .getOrParse(this._params.composedDescriptor.id, this._params.composedBody)
      .onSuccess((template) => template.validateAndRender(context))
      .withErrorFormat((msg) => `prompt '${this._params.composedDescriptor.id}': ${msg}`);
  }

  /**
   * Builds the `'compose'` observation record from the compose `Result`,
   * minting a fresh library-global `seq` + `timestamp` through the seam. Nests
   * each contributor's full resolve trace (the `innerTrace` analogue) on both
   * success and failure; the merged provenance + safeguard findings surface on
   * success only. The composed body is deliberately not duplicated (see
   * {@link IPromptComposeObservation}).
   */
  private _buildComposeObservation(
    seam: IPromptObservationSeam,
    result: Result<IComposedPrompt>,
    durationMs: number
  ): IPromptComposeObservation {
    const seq = seam.nextSeq();
    const timestamp = seam.now();
    const contributors: ReadonlyArray<IPromptComposeContributorObservation> = this._params.contributors.map(
      (c) => ({
        provenance: c.provenance,
        promptId: c.resolved.id,
        trace: c.resolved.trace
      })
    );
    const common = {
      seq,
      contentHash: this._composeContentHash(),
      timestamp,
      durationMs,
      promptId: this._params.composedDescriptor.id,
      chain: [],
      contributors
    };
    if (result.isSuccess()) {
      return {
        ...common,
        phase: 'compose',
        outcome: 'success',
        provenanceTrace: result.value.provenanceTrace,
        safeguardFindings: result.value.safeguardFindings
      };
    }
    return { ...common, phase: 'compose', outcome: 'failure', error: result.message };
  }

  /**
   * CRC32 over the RFC 8785 canonical JSON of the compose identity tuple
   * (`\{ composedPromptId, contributors: [\{ provenance, promptId \}] \}`).
   * Best-effort — a canonicalize / hash failure degrades to an empty string
   * rather than breaking the compose, mirroring the resolve-path content hash.
   */
  private _composeContentHash(): string {
    const identity = {
      composedPromptId: this._params.composedDescriptor.id,
      contributors: this._params.contributors.map((c) => ({
        provenance: c.provenance,
        promptId: c.resolved.id
      }))
    };
    return sanitizeJsonObject(identity)
      .onSuccess((sanitized) => new Normalizer().canonicalize(sanitized))
      .onSuccess((canonical) => captureResult(() => Hash.Crc32Normalizer.crc32Hash([canonical])))
      .orDefault('');
  }
}
