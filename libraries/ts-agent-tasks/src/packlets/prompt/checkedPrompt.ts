/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { AiAssist } from '@fgv/ts-extras';
import {
  IPromptCacheFinding,
  IPromptComposition,
  IPromptCompositionOptions,
  IPromptResolveRequest,
  IPromptSection,
  IResolvedPrompt,
  IToCacheRequestHints,
  PromptCacheStability,
  PromptSubstitutions,
  SlotName,
  toCacheRequest
} from '@fgv/ts-prompt-assist';
import { Result, captureAsyncResult, captureResult, fail, succeed } from '@fgv/ts-utils';
import { ITaskContext, ITaskInclusionReceipt } from '../types';
import { defaultTaskContextSlotName, taskContextSubstitutions } from './fragments';

/**
 * What the checked helper needs of a prompt library: its `resolve`. A `PromptLibrary` is one.
 * @public
 */
export interface ITaskPromptLibrary {
  resolve(request: IPromptResolveRequest): Promise<Result<IResolvedPrompt>>;
}

/**
 * The host's part of a resolve request: everything but the composition request, which the helper
 * always makes, and the task-context substitution, which it supplies.
 * @public
 */
export interface ITaskPromptRequest {
  readonly id: IPromptResolveRequest['id'];
  readonly chain: IPromptResolveRequest['chain'];
  readonly qualifiers: IPromptResolveRequest['qualifiers'];
  /** The host's substitutions for its own slots. Naming the task slot here fails the check. */
  readonly substitutions?: PromptSubstitutions;
  /** Call-site stability overrides, passed through to the resolve. */
  readonly cacheStability?: ReadonlyMap<SlotName, PromptCacheStability>;
}

/**
 * Parameters for {@link checkTaskPrompt}.
 * @public
 */
export interface ICheckTaskPromptParams {
  readonly library: ITaskPromptLibrary;
  readonly request: ITaskPromptRequest;
  /** A rendered context — from `TaskContextRenderer.render` or a delivery's `prepare`. */
  readonly context: ITaskContext;
  /** Defaults to {@link defaultTaskContextSlotName}. */
  readonly taskSlot?: SlotName;
  /**
   * Passed to the resolve's composition request. Supply a tokenizer `measure` and a
   * `cacheDiagnostics.minCacheablePrefixTokens` to get a threshold verdict; without them the
   * threshold is classified `unknown`.
   */
  readonly composition?: IPromptCompositionOptions;
  /** Passed to `toCacheRequest`. */
  readonly cacheHints?: IToCacheRequestHints;
}

/**
 * Whether the stable prefix is long enough to cache, as far as the composition can say.
 *
 * @remarks
 * - `unknown` — no tokenizer, or no minimum, was supplied: the size was not judged. Neither a
 *   failure nor evidence that the prefix caches.
 * - `below` — measured and judged short of the supplied minimum: the plan is sound, but a provider
 *   will not cache a prefix this short.
 * - `met` — measured and judged at or above the supplied minimum.
 *
 * None of these is a claim about provider cache hits; the check never consults a provider.
 * @public
 */
export interface ITaskPromptThreshold {
  readonly verdict: 'unknown' | 'below' | 'met';
  /** prompt-assist's own description, for `unknown` and `below`. */
  readonly detail?: string;
}

/**
 * Where the task-context slot sits in the body, in UTF-16 code units.
 * @public
 */
export interface ITaskPromptSlotSpan {
  readonly name: SlotName;
  readonly start: number;
  readonly chars: number;
}

/**
 * The parts of a checked task prompt a host sends, with the evidence the check was made on.
 * @public
 */
export interface ITaskPromptCheck {
  /** The resolve, with its composition — the one the checks below were made on. */
  readonly resolved: IResolvedPrompt;
  /** The system text to send: exactly the analyzed body. */
  readonly system: string;
  /** The cache-breakpoint plan, derived from the same composition; offsets are into `system`. */
  readonly cacheRequest: AiAssist.IAiCacheRequest;
  /** The task-context slot: the last section, its text the context's text exactly. */
  readonly taskSlot: ITaskPromptSlotSpan;
  /** Characters before the task slot: the intended stable prefix. Always more than zero. */
  readonly stablePrefixChars: number;
  readonly threshold: ITaskPromptThreshold;
}

/**
 * A prompt that passed every check, holding its context's receipt back until the host says what it
 * sent.
 * @public
 */
export interface ICheckedTaskPrompt extends ITaskPromptCheck {
  /**
   * The context's inclusion receipt — only if `sentSystem` is exactly {@link ITaskPromptCheck.system}.
   *
   * @remarks
   * Any change after the check — a prefix, a suffix, an edited or dropped task slot — fails: the
   * receipt describes what the checked body carried, and a body that differs did not carry it.
   */
  receiptFor(sentSystem: string): Result<ITaskInclusionReceipt>;
}

/**
 * Resolves a task prompt and checks that what will be sent is what was analyzed.
 *
 * @remarks
 * Resolves with a composition, supplying the context's text as the task-context slot, then fails
 * unless every one of these holds:
 *
 * 1. **Composition is positively available.** A composition is present, carries no `unavailable`
 *    reason, and its sections are contiguous, gapless and cover the body exactly. An empty
 *    `cacheFindings` is never taken as evidence of analysis — an unavailable composition has one.
 * 2. **The task slot is the one trailing per-request section, carrying the full context once.**
 *    Exactly one section is the task slot; it is the last section; its text is the context's text
 *    exactly; it came from this substitution (not an enforced binding, a default or anything else);
 *    its effective stability is `'per-request'`; and the context text occurs in the body only there.
 * 3. **A stable prefix exists ahead of it.** The slot does not start at offset 0.
 * 4. **No cache finding is left unhandled.** `stability-refuted`, `cache-hostile-ordering`,
 *    `no-cacheable-prefix` and any kind this helper does not know fail the check;
 *    `threshold-unknown` and `below-threshold` are classified in `threshold` instead.
 * 5. **The breakpoint plan ends at the task slot.** `toCacheRequest` succeeds on the same
 *    composition and its last system breakpoint is the task slot's start.
 *
 * The receipt is never placed in the body, a substitution or the request; it is released only by
 * {@link ICheckedTaskPrompt.receiptFor}. Checking acknowledges nothing.
 *
 * **The context is trusted to be one render.** The check binds the context's *text* to the body;
 * that its *receipt* describes that text is the renderer's guarantee, which holds for a context
 * passed as it was rendered. A host that assembles a context from two renders defeats it.
 * {@link prepareTaskPrompt} takes the context from the delivery that issued it, so on that path
 * nothing is assembled by the host.
 * @public
 */
export async function checkTaskPrompt(params: ICheckTaskPromptParams): Promise<Result<ICheckedTaskPrompt>> {
  const slot: SlotName = params.taskSlot ?? defaultTaskContextSlotName;
  const label: string = `task prompt ${params.request.id}`;
  if (
    params.request.substitutions !== undefined &&
    Object.prototype.hasOwnProperty.call(params.request.substitutions, slot)
  ) {
    return fail(`${label}: the host's substitutions name the task slot '${slot}'; only the context fills it`);
  }
  const request: IPromptResolveRequest = {
    id: params.request.id,
    chain: params.request.chain,
    qualifiers: params.request.qualifiers,
    substitutions: { ...params.request.substitutions, ...taskContextSubstitutions(params.context, slot) },
    composition: params.composition ?? {},
    ...(params.request.cacheStability !== undefined ? { cacheStability: params.request.cacheStability } : {})
  };
  // A host library may throw, or answer with a shape no check expects: both are failures, never throws.
  const resolved: Result<Result<IResolvedPrompt>> = await captureAsyncResult(() =>
    params.library.resolve(request)
  );
  return resolved
    .onSuccess((inner: Result<IResolvedPrompt>) => inner)
    .withErrorFormat((message: string) => `${label}: resolve failed: ${message}`)
    .onSuccess((prompt: IResolvedPrompt) =>
      captureResult(() => _check(prompt, params.context, slot, params.cacheHints))
        .onSuccess((checked: Result<ICheckedTaskPrompt>) => checked)
        .withErrorFormat((message: string) => `${label}: ${message}`)
    );
}

function _check(
  resolved: IResolvedPrompt,
  context: ITaskContext,
  slot: SlotName,
  hints: IToCacheRequestHints | undefined
): Result<ICheckedTaskPrompt> {
  return _availableComposition(resolved)
    .onSuccess((composition: IPromptComposition) =>
      _taskSlot(resolved.body, composition, context.text, slot).onSuccess((span: ITaskPromptSlotSpan) =>
        _threshold(composition).onSuccess((threshold: ITaskPromptThreshold) =>
          _cacheRequest(composition, span, hints).onSuccess((cacheRequest: AiAssist.IAiCacheRequest) =>
            succeed({ span, threshold, cacheRequest })
          )
        )
      )
    )
    .onSuccess(({ span, threshold, cacheRequest }) => {
      const system: string = resolved.body;
      const receipt: ITaskInclusionReceipt = context.receipt;
      return succeed<ICheckedTaskPrompt>({
        resolved,
        system,
        cacheRequest,
        taskSlot: span,
        stablePrefixChars: span.start,
        threshold,
        receiptFor: (sentSystem: string): Result<ITaskInclusionReceipt> =>
          sentSystem === system
            ? succeed(receipt)
            : fail('the system text sent is not the checked body; its task context was not the one checked')
      });
    });
}

/** Check 1: a composition is present, available, and partitions the body exactly. */
function _availableComposition(resolved: IResolvedPrompt): Result<IPromptComposition> {
  const composition: IPromptComposition | undefined = resolved.composition;
  if (composition === undefined) {
    return fail('the resolve returned no composition, so nothing about the body was analyzed');
  }
  if (composition.unavailable !== undefined) {
    return fail(
      `composition is unavailable (${composition.unavailable}); its empty findings are no evidence of analysis`
    );
  }
  let offset: number = 0;
  for (const section of composition.sections) {
    if (!Number.isInteger(section.chars) || section.chars < 0) {
      return fail(
        `composition section at ${section.start} has length ${section.chars}, not a count of characters`
      );
    }
    if (section.start !== offset) {
      return fail(
        `composition section at ${section.start} does not follow the previous one, which ends at ${offset}`
      );
    }
    offset += section.chars;
  }
  if (offset !== resolved.body.length || composition.totalChars !== resolved.body.length) {
    return fail(
      `composition covers ${offset} of ${composition.totalChars} characters, but the body is ${resolved.body.length}`
    );
  }
  return succeed(composition);
}

/** Check 2 and 3: one trailing per-request task slot carrying the whole context, after a stable prefix. */
function _taskSlot(
  body: string,
  composition: IPromptComposition,
  text: string,
  slot: SlotName
): Result<ITaskPromptSlotSpan> {
  const sections: ReadonlyArray<IPromptSection> = composition.sections;
  const slotSections: ReadonlyArray<IPromptSection> = sections.filter(
    (section: IPromptSection) => section.kind === 'slot' && section.slot === slot
  );
  if (slotSections.length !== 1) {
    return fail(
      `the body holds the task slot '${slot}' ${slotSections.length} times; it must hold it exactly once`
    );
  }
  const section: IPromptSection = slotSections[0];
  if (section !== sections[sections.length - 1]) {
    return fail(`the task slot '${slot}' is not the last section of the body; nothing may follow it`);
  }
  if (section.source !== 'caller-sub' || section.wasEnforced === true) {
    return fail(
      `the task slot '${slot}' was filled from '${section.source}'${
        section.wasEnforced === true ? ' (enforced)' : ''
      }, not from the task context`
    );
  }
  if (body.slice(section.start, section.start + section.chars) !== text) {
    return fail(`the task slot '${slot}' does not carry the issued task context exactly`);
  }
  if (body.indexOf(text) !== section.start || body.lastIndexOf(text) !== section.start) {
    return fail('the task context appears in the body outside its slot; it must be included exactly once');
  }
  if (section.effectiveStability !== 'per-request') {
    return fail(
      `the task slot '${slot}' is treated as '${section.effectiveStability}', but task context changes per request`
    );
  }
  if (section.start === 0) {
    return fail('nothing precedes the task context: there is no stable prefix to cache');
  }
  return succeed({ name: slot, start: section.start, chars: section.chars });
}

/**
 * Check 4: every finding is handled — threshold findings classified, every other kind refused. `met`
 * is reported only when a measure was supplied and neither threshold finding fired, never inferred
 * from silence alone.
 */
function _threshold(composition: IPromptComposition): Result<ITaskPromptThreshold> {
  const findings: ReadonlyArray<IPromptCacheFinding> = composition.cacheFindings;
  const refused: ReadonlyArray<IPromptCacheFinding> = findings.filter(
    (finding: IPromptCacheFinding) =>
      finding.kind !== 'threshold-unknown' && finding.kind !== 'below-threshold'
  );
  if (refused.length > 0) {
    return fail(
      `cache findings refuse this composition: ${refused
        .map((finding: IPromptCacheFinding) => `${finding.kind}: ${finding.detail}`)
        .join('; ')}`
    );
  }
  const unknown: IPromptCacheFinding | undefined = findings.find(
    (finding: IPromptCacheFinding) => finding.kind === 'threshold-unknown'
  );
  if (unknown !== undefined) {
    return succeed({ verdict: 'unknown', detail: unknown.detail });
  }
  const below: IPromptCacheFinding | undefined = findings.find(
    (finding: IPromptCacheFinding) => finding.kind === 'below-threshold'
  );
  if (below !== undefined) {
    return succeed({ verdict: 'below', detail: below.detail });
  }
  return succeed(
    composition.totalMeasured === undefined
      ? { verdict: 'unknown', detail: 'the composition was not measured, so the prefix size was not judged' }
      : { verdict: 'met' }
  );
}

/** Check 5: the breakpoint plan from the same composition, whose last breakpoint is the task slot. */
function _cacheRequest(
  composition: IPromptComposition,
  span: ITaskPromptSlotSpan,
  hints: IToCacheRequestHints | undefined
): Result<AiAssist.IAiCacheRequest> {
  return toCacheRequest(composition, hints).onSuccess((cacheRequest: AiAssist.IAiCacheRequest) => {
    const breakpoints: ReadonlyArray<number> = cacheRequest.systemBreakpoints ?? [];
    return breakpoints[breakpoints.length - 1] === span.start
      ? succeed(cacheRequest)
      : fail(
          `the cache plan's breakpoints [${breakpoints.join(', ')}] do not end at the task slot (${
            span.start
          })`
        );
  });
}
