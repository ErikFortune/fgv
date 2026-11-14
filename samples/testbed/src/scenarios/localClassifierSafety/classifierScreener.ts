/**
 * Classifier screener core — pure, React-free interpretation logic.
 *
 * Separating the threshold-map interpreter and screener factory from the React
 * component makes both units fully unit-testable with a mocked `classify` facade,
 * satisfying the brief's load-bearing testability requirement.
 *
 * Design choice: the threshold map expresses two bands per label — a `reject`
 * threshold and a `warn` threshold (reject \> warn). A label's score triggers the
 * highest-tier band it crosses. Labels not in the map are ignored.
 *
 * @packageDocumentation
 */

import { Result, fail, succeed } from '@fgv/ts-utils';
// Type-only imports (erased at compile time, so they pull no runtime facade into
// the web bundle). Both `@fgv/ts-extras-transformers` (Node) and
// `@fgv/ts-web-extras-transformers` (browser) re-export these identical upstream
// types; the screener stays facade-agnostic by taking `classify` as an injected
// function rather than importing one facade's runtime binding.
import type { TextClassificationPipeline, TextClassificationOutput } from '@fgv/ts-web-extras-transformers';
import type { ISafeguardFinding, IScreener, IScreenerContext, SlotName } from '@fgv/ts-prompt-assist';

/**
 * The `classifyAll` operation as exposed by either transformers facade
 * (`@fgv/ts-extras-transformers` for Node, `@fgv/ts-web-extras-transformers` for
 * the browser). Injected into {@link createClassifierScreener} so the screener
 * core depends on neither concrete facade.
 *
 * `classifyAll` always returns the full per-label vector (it bakes in `top_k: null`)
 * so callers do not need to pass `{ top_k: null }` explicitly.
 *
 * @public
 */
export type ClassifyFn = (
  classifier: TextClassificationPipeline,
  text: string,
  options?: Parameters<TextClassificationPipeline>[1]
) => Promise<Result<TextClassificationOutput>>;

/**
 * Per-label threshold configuration. Both bands are optional.
 *
 * @remarks
 * - `reject`: score at-or-above this level → `'reject'` disposition (fails the resolve).
 * - `warn`: score at-or-above this level (but below `reject`) → `'warn'` disposition.
 *
 * A label with only `warn` defined will never trigger a reject; a label with only
 * `reject` defined will only trigger if above the reject threshold.
 *
 * @public
 */
export interface ILabelThreshold {
  /** Score at-or-above this → `'reject'`. */
  readonly reject?: number;
  /** Score at-or-above this (and below `reject`) → `'warn'`. */
  readonly warn?: number;
}

/**
 * Threshold map: label string → per-label thresholds.
 *
 * @remarks
 * The keys mirror `toxic-bert`'s label vocabulary:
 * `toxic`, `severe_toxic`, `obscene`, `threat`, `insult`, `identity_hate`.
 * Labels not present in the map are silently ignored — the screener never
 * fires a finding for unmapped labels.
 *
 * @public
 */
export type ClassifierThresholdMap = Readonly<Record<string, ILabelThreshold>>;

/**
 * Default threshold map for `Xenova/toxic-bert`. Derived from the model's
 * label vocabulary; tuned for a demo scenario where toxicity should `warn`
 * at moderate scores and `reject` only at high confidence.
 *
 * Threat and identity_hate are more sensitive (lower thresholds) because
 * these categories are more clearly unacceptable even at moderate scores.
 *
 * @public
 */
export const DEFAULT_TOXIC_BERT_THRESHOLDS: ClassifierThresholdMap = {
  toxic: { warn: 0.5, reject: 0.8 },
  severe_toxic: { warn: 0.3, reject: 0.6 },
  obscene: { warn: 0.5, reject: 0.8 },
  threat: { warn: 0.2, reject: 0.5 },
  insult: { warn: 0.5, reject: 0.8 },
  identity_hate: { warn: 0.2, reject: 0.5 }
};

/**
 * Result of interpreting one label's score against its threshold band.
 * @public
 */
export type LabelVerdict = 'allow' | 'warn' | 'reject';

/**
 * Interpret a single `{ label, score }` entry against the threshold map.
 *
 * Returns `'allow'` when the label is not in the map or the score is below
 * both thresholds; `'warn'` or `'reject'` as appropriate.
 *
 * @public
 */
export function interpretLabel(
  label: string,
  score: number,
  thresholds: ClassifierThresholdMap
): LabelVerdict {
  const entry = thresholds[label];
  if (entry === undefined) {
    return 'allow';
  }
  if (entry.reject !== undefined && score >= entry.reject) {
    return 'reject';
  }
  if (entry.warn !== undefined && score >= entry.warn) {
    return 'warn';
  }
  return 'allow';
}

/**
 * Aggregate per-label findings from a `TextClassificationOutput` by comparing
 * each label's score against the threshold map. Returns a single aggregated
 * finding for the highest-severity tier any label breaches: one `'reject'`
 * finding summarizing every reject-crossing label if any label crosses its
 * reject threshold, else one `'warn'` finding summarizing every warn-crossing
 * label, else an empty array when all labels are clean.
 *
 * Per the brief this collapses to **one** finding (not one per label); the
 * breaching labels are summarized in `detail` and all per-label scores are
 * placed in `metadata` for full observability.
 *
 * @public
 */
export function interpretClassification(
  output: TextClassificationOutput,
  thresholds: ClassifierThresholdMap,
  slotName: SlotName,
  screenerName: string
): ReadonlyArray<ISafeguardFinding> {
  if (output.length === 0) {
    return [];
  }

  // Build a per-label score map for metadata regardless of outcome.
  const scores: Record<string, number> = {};
  for (const entry of output) {
    scores[entry.label] = entry.score;
  }

  // Collect all breaching labels in both tiers.
  const rejectLabels: string[] = [];
  const warnLabels: string[] = [];

  for (const entry of output) {
    const verdict = interpretLabel(entry.label, entry.score, thresholds);
    if (verdict === 'reject') {
      rejectLabels.push(entry.label);
    } else if (verdict === 'warn') {
      warnLabels.push(entry.label);
    }
  }

  if (rejectLabels.length > 0) {
    const detail = `slot '${slotName}': classifier rejected on label(s): ${rejectLabels.join(', ')}`;
    return [
      {
        slot: slotName,
        kind: 'classifier-verdict',
        disposition: 'reject',
        detail,
        metadata: { scores },
        screener: screenerName
      }
    ];
  }

  if (warnLabels.length > 0) {
    const detail = `slot '${slotName}': classifier warned on label(s): ${warnLabels.join(', ')}`;
    return [
      {
        slot: slotName,
        kind: 'classifier-verdict',
        disposition: 'warn',
        detail,
        metadata: { scores },
        screener: screenerName
      }
    ];
  }

  return [];
}

/**
 * Options for {@link createClassifierScreener}.
 * @public
 */
export interface IClassifierScreenerOptions {
  /**
   * Pre-loaded `TextClassificationPipeline` obtained via the active facade's
   * `loadPipeline('text-classification', modelId)`. The screener holds this
   * reference for its lifetime; the caller is responsible for lifecycle.
   */
  readonly pipeline: TextClassificationPipeline;
  /**
   * The `classifyAll` function from the active facade — `@fgv/ts-web-extras-transformers`
   * on the browser, `@fgv/ts-extras-transformers` in Node. Injected (rather than
   * imported) so this core never statically references a runtime facade.
   * `classifyAll` bakes in `top_k: null` so callers do not need to pass it.
   */
  readonly classify: ClassifyFn;
  /**
   * Per-label threshold map. See {@link DEFAULT_TOXIC_BERT_THRESHOLDS} for
   * the `Xenova/toxic-bert` defaults.
   */
  readonly thresholds: ClassifierThresholdMap;
  /**
   * Screener name used for finding attribution.
   * @defaultValue `'local-classifier-screener'`
   */
  readonly name?: string;
}

/**
 * Builds an {@link IScreener} that runs every screened slot value through a
 * local `TextClassificationPipeline`, interprets the per-label scores against
 * a threshold map, and emits a `'classifier-verdict'` {@link ISafeguardFinding}
 * when any label breaches its configured band.
 *
 * @remarks
 * Mirrors the structure of `createPatternScreener` from `@fgv/ts-prompt-assist`
 * — the canonical built-in screener shape. Key behaviours:
 *
 * - `classify` (expected to be `classifyAll` from the active facade) returns the
 *   full per-label vector without the caller needing to pass `{ top_k: null }` —
 *   `classifyAll` bakes that in so per-label threshold comparison always works.
 * - A `classify` failure propagates as `Result.fail()` (operational failure,
 *   not a safeguard finding) per the `IScreener` contract.
 * - An empty `TextClassificationOutput` returns `[]` (no finding).
 * - The highest-severity breaching label drives the single returned finding;
 *   all per-label scores are attached in `metadata.scores` for observability.
 *
 * **Facade evaluation note:** the screener body reduces to three lines of
 * fgv-idiomatic chain:
 * ```
 * classify(pipeline, ctx.value)
 *   .thenOnSuccess(...interpretClassification...)
 * ```
 * vs. the equivalent captureAsyncResult + flattenIfNeeded inline would be
 * ~8 lines. The facade earns its keep here.
 *
 * @public
 */
export function createClassifierScreener(options: IClassifierScreenerOptions): IScreener {
  const { pipeline, classify, thresholds } = options;
  const name = options.name ?? 'local-classifier-screener';

  return {
    name,
    screen: async (ctx: IScreenerContext): Promise<Result<ReadonlyArray<ISafeguardFinding>>> => {
      const classifyResult = await classify(pipeline, ctx.value);
      if (classifyResult.isFailure()) {
        return fail(`${name}: classify failed for slot '${ctx.slot.name}': ${classifyResult.message}`);
      }
      return succeed(interpretClassification(classifyResult.value, thresholds, ctx.slot.name, name));
    }
  };
}
