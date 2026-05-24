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
import type { TextClassificationPipeline, TextClassificationOutput } from '@fgv/ts-extras-transformers';
import { classify } from '@fgv/ts-extras-transformers';
import type { ISafeguardFinding, IScreener, IScreenerContext } from '@fgv/ts-prompt-assist';

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
 * each label's score against the threshold map. Returns the first `'reject'`
 * finding if any label crosses the reject threshold, or the first `'warn'`
 * finding if any label crosses a warn threshold, or an empty array if all
 * labels are clean.
 *
 * The brief specifies returning **one** finding (the highest-severity
 * triggering label), not one per label — per-label scores are placed in
 * `metadata` for full observability.
 *
 * @public
 */
export function interpretClassification(
  output: TextClassificationOutput,
  thresholds: ClassifierThresholdMap,
  slotName: string,
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
        slot: slotName as ISafeguardFinding['slot'],
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
        slot: slotName as ISafeguardFinding['slot'],
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
   * Pre-loaded `TextClassificationPipeline` obtained via
   * `loadPipeline('text-classification', modelId)`. The screener holds this
   * reference for its lifetime; the caller is responsible for lifecycle.
   */
  readonly pipeline: TextClassificationPipeline;
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
 * - `classify` is called with `{ top_k: null }` to retrieve the full label
 *   vector — this is required for per-label threshold comparison.
 * - A `classify` failure propagates as `Result.fail()` (operational failure,
 *   not a safeguard finding) per the `IScreener` contract.
 * - An empty `TextClassificationOutput` returns `[]` (no finding).
 * - The highest-severity breaching label drives the single returned finding;
 *   all per-label scores are attached in `metadata.scores` for observability.
 *
 * **Facade evaluation note:** the screener body reduces to three lines of
 * fgv-idiomatic chain:
 * ```
 * classify(pipeline, ctx.value, { top_k: null })
 *   .thenOnSuccess(...interpretClassification...)
 * ```
 * vs. the equivalent captureAsyncResult + flattenIfNeeded inline would be
 * ~8 lines. The facade earns its keep here.
 *
 * @public
 */
export function createClassifierScreener(options: IClassifierScreenerOptions): IScreener {
  const { pipeline, thresholds } = options;
  const name = options.name ?? 'local-classifier-screener';

  return {
    name,
    screen: async (ctx: IScreenerContext): Promise<Result<ReadonlyArray<ISafeguardFinding>>> => {
      const classifyResult = await classify(pipeline, ctx.value, { top_k: null });
      if (classifyResult.isFailure()) {
        return fail(`${name}: classify failed for slot '${ctx.slot.name}': ${classifyResult.message}`);
      }
      return succeed(interpretClassification(classifyResult.value, thresholds, String(ctx.slot.name), name));
    }
  };
}
