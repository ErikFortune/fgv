/**
 * Local summarization scenario.
 *
 * Demonstrates the `summarize` facade primitive: a small local summarization model
 * (`Xenova/distilbart-cnn-6-6`) compacts a realistic multi-turn conversation transcript into a
 * short summary — the cheap/fast local pass a consumer reaches for instead of a frontier LLM when
 * the input is simple/medium, escalating to the cloud only for long/complex documents.
 *
 * ## Architecture
 *
 * Mirrors the B-3 / B-4a dual-target split (`localClassifierSafety` / `localEmbeddingSearch`):
 *
 * - `summarizeAdapter.ts` — thin `summarizeTranscript` adapter that injects `summarize` from the
 *   active facade and reduces the upstream `SummarizationOutput` to `{ summary, ratio }`.
 *   Facade-agnostic via injection and type-only imports.
 * - `index.tsx` (this file) — web React component (browser facade) + CLI `run()` (Node facade
 *   via `webpackIgnore` dynamic import).
 *
 * @packageDocumentation
 */

import React, { useCallback, useState } from 'react';
import { fail, succeed } from '@fgv/ts-utils';
import type { Result } from '@fgv/ts-utils';
// Browser facade — WASM ONNX, no node-native deps.
import { loadPipeline, summarize } from '@fgv/ts-web-extras-transformers';
import type { SummarizationPipeline } from '@fgv/ts-web-extras-transformers';

import type { IScenario, IScenarioContext, IWebScenarioImpl, ICliScenarioImpl } from '../../shell';
import { summarizeTranscript } from './summarizeAdapter';
import type { ISummaryResult } from './summarizeAdapter';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** HuggingFace Hub model id — small, local-friendly summarization model. */
const MODEL_ID: string = 'Xenova/distilbart-cnn-6-6';

/**
 * Realistic-length, synthetic input — a multi-turn standup-style transcript of the kind that ages
 * out of a conversation's short-term window and gets compacted for medium-term recall. Synthetic
 * (no real consumer data); long enough that summary quality is actually observable.
 */
const SAMPLE_TRANSCRIPT: string = [
  'Alex: Morning — quick standup. I finished wiring the checkout retry logic yesterday; it now backs off exponentially and gives up after four attempts instead of hammering the gateway.',
  'Sam: Nice. Did that fix the duplicate-charge reports from last week?',
  'Alex: Partly. The retries were one cause, but there was also a race where the webhook and the client both marked the order paid. I added an idempotency key keyed on the payment intent, so the second writer is now a no-op.',
  'Sam: Good. Is it deployed?',
  'Alex: Staging only. I want a second pair of eyes on the idempotency migration before it hits prod — it adds a unique constraint on a table with 50M rows, so the backfill needs to run online.',
  'Jordan: I can review the migration this afternoon. Concurrent index build, I assume?',
  'Alex: Right, CREATE INDEX CONCURRENTLY, then validate the constraint in a second step so we never take a long lock.',
  'Sam: What about the refund path — does it respect the idempotency key too?',
  'Alex: Not yet. That is the next ticket. Refunds are lower volume so the duplicate risk is smaller, but I will close the gap this week.',
  'Jordan: Anything blocking?',
  'Alex: Only the prod deploy, which is gated on the migration review. Otherwise on track.'
].join('\n');

const SUMMARIZE_OPTIONS: Parameters<SummarizationPipeline>[1] = { min_length: 25, max_length: 90 };

/**
 * Local-vs-cloud framing at "printed note" depth — NOT a routing engine. When to escalate to a
 * frontier model (e.g. cloud summarization via \@fgv/ts-extras/ai-assist) is the consumer's
 * policy, not the sample's: this just observes the compaction achieved locally.
 */
const ESCALATION_NOTE: string =
  'Local is the cheap/fast path for simple/medium inputs; escalate long/complex docs to cloud ' +
  'summarization (@fgv/ts-extras/ai-assist) where quality matters.';

// ---------------------------------------------------------------------------
// Web component
// ---------------------------------------------------------------------------

/**
 * Module-level pipeline reference. Populated by `initialize()` so the component reuses the
 * already-loaded pipeline rather than downloading it again on mount. Falls back to a fresh
 * `loadPipeline` call when the component is mounted standalone (e.g. in tests that exercise the
 * component directly).
 */
let _cachedSummarizer: SummarizationPipeline | undefined;

/**
 * Web component for the local-summarization scenario.
 *
 * Displays the fixed sample transcript and a "Summarize" button; running it invokes the cached
 * `SummarizationPipeline` and displays the summary plus the compaction ratio.
 */
function LocalSummarizationComponent({
  context
}: {
  readonly context: IScenarioContext;
}): React.ReactElement {
  const [summarizer, setSummarizer] = React.useState<SummarizationPipeline | null>(null);
  const [result, setResult] = useState<{ readonly summary?: ISummaryResult; readonly error?: string } | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  // Load the pipeline on mount (reuse cached instance when initialize() ran first).
  React.useEffect(() => {
    let mounted: boolean = true;
    const pipePromise: Promise<Result<SummarizationPipeline>> =
      _cachedSummarizer !== undefined
        ? Promise.resolve(succeed(_cachedSummarizer))
        : loadPipeline('summarization', MODEL_ID);

    pipePromise
      .then((pipeResult) => {
        if (!mounted) {
          return;
        }
        if (pipeResult.isFailure()) {
          context.logger.error(`Failed to load model: ${pipeResult.message}`);
          setIsLoading(false);
          return;
        }
        context.logger.info(`Model ${MODEL_ID} loaded.`);
        // The pipeline is itself a callable object; pass it via the updater form so React
        // stores it instead of invoking it as a functional state updater.
        setSummarizer(() => pipeResult.value);
        setIsLoading(false);
      })
      /* c8 ignore next 5 - unreachable: the promise never rejects — loadPipeline returns Result.fail rather than throwing, the cached path is Promise.resolve(succeed(...)), and the .then handler only sets state */
      .catch((err: unknown) => {
        if (mounted) {
          context.logger.error(`Unexpected error loading model: ${String(err)}`);
          setIsLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSummarize = useCallback(async () => {
    /* c8 ignore next 3 - defensive: the Summarize button's disabled condition already excludes summarizer === null; kept for type-narrowing and robustness against a non-UI invocation. */
    if (summarizer === null) {
      return;
    }

    (await summarizeTranscript(summarizer, SAMPLE_TRANSCRIPT, summarize, SUMMARIZE_OPTIONS))
      .onSuccess((summary) => {
        setResult({ summary });
        context.logger.info(`Summarization complete (${summary.ratio}% of original length).`);
        return succeed(summary);
      })
      .onFailure((message) => {
        setResult({ error: message });
        context.logger.error(`Summarization failed: ${message}`);
        return fail(message);
      });
  }, [summarizer, context.logger]);

  if (isLoading) {
    return (
      <div data-testid="summarization-loading" className="py-4 text-center text-secondary">
        <p>Loading model {MODEL_ID}…</p>
      </div>
    );
  }

  return (
    <div data-testid="summarization-scenario" className="space-y-4">
      <div className="space-y-1">
        <p className="text-sm font-medium text-secondary">Transcript ({SAMPLE_TRANSCRIPT.length} chars):</p>
        <pre
          data-testid="summarization-transcript"
          className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-md border border-border bg-surface p-3 text-xs text-secondary"
        >
          {SAMPLE_TRANSCRIPT}
        </pre>
      </div>
      <button
        data-testid="summarization-run-btn"
        onClick={handleSummarize}
        disabled={summarizer === null}
        className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        Summarize
      </button>
      {result !== null && (
        <div data-testid="summarization-result" className="rounded-md border">
          {result.error !== undefined ? (
            <div
              data-testid="summarization-error"
              className="rounded-md border border-status-error-border bg-status-error-bg p-4 text-sm text-status-error-text"
            >
              {result.error}
            </div>
          ) : (
            <div data-testid="summarization-summary" className="border-border bg-surface p-4 text-sm">
              <p className="text-primary">{result.summary!.summary}</p>
              <p className="mt-2 text-xs text-secondary">
                Compaction: {result.summary!.ratio}% of the original transcript. {ESCALATION_NOTE}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Web impl (IWebScenarioImpl)
// ---------------------------------------------------------------------------

const webImpl: IWebScenarioImpl = {
  component: LocalSummarizationComponent,

  /**
   * Called by the shell before mounting the component. Loads the pipeline; gates mounting on
   * success. Returns `false` if the model is still downloading so the shell keeps showing its
   * loading state.
   */
  async initialize(context: IScenarioContext): Promise<Result<boolean>> {
    context.logger.info(`Loading model ${MODEL_ID}…`);
    const result = await loadPipeline('summarization', MODEL_ID);
    if (result.isFailure()) {
      context.logger.error(`Model load failed: ${result.message}`);
      return fail(`model load failed: ${result.message}`);
    }
    _cachedSummarizer = result.value;
    context.logger.info(`Model ${MODEL_ID} ready.`);
    return succeed(true);
  }
};

// ---------------------------------------------------------------------------
// CLI implementation (ICliScenarioImpl)
// ---------------------------------------------------------------------------

const cliImpl: ICliScenarioImpl = {
  async run(context: IScenarioContext): Promise<Result<string>> {
    context.logger.info(`Loading model ${MODEL_ID} for summarization…`);

    // Load the Node facade lazily so webpack never pulls node-native ONNX deps into the browser
    // bundle. The `webpackIgnore` magic comment is load-bearing (this module is in the web graph).
    const nodeFacade = await import(/* webpackIgnore: true */ '@fgv/ts-extras-transformers');

    const pipeResult = await nodeFacade.loadPipeline('summarization', MODEL_ID);
    if (pipeResult.isFailure()) {
      return fail(pipeResult.message);
    }

    return (
      await summarizeTranscript(pipeResult.value, SAMPLE_TRANSCRIPT, nodeFacade.summarize, SUMMARIZE_OPTIONS)
    )
      .onSuccess(({ summary, ratio }) => {
        context.logger.info('Summarization complete.');
        const note =
          `Local summary via ${MODEL_ID}: ${SAMPLE_TRANSCRIPT.length} → ${summary.length} chars (${ratio}%). ` +
          ESCALATION_NOTE;
        return succeed(
          `local-summarization demo\n\nInput: a ${SAMPLE_TRANSCRIPT.length}-char multi-turn transcript.\n\n` +
            `Summary:\n${summary}\n\n${note}`
        );
      })
      .withErrorFormat((msg) => `local-summarization: ${msg}`);
  }
};

// ---------------------------------------------------------------------------
// Scenario export
// ---------------------------------------------------------------------------

/**
 * The local-summarization scenario. Registered in `scenarios/index.ts`.
 * @public
 */
export const localSummarizationScenario: IScenario = {
  id: 'local-summarization',
  title: 'Local Summarization',
  description:
    'Compact a conversation transcript with a small local summarization model ' +
    '(distilbart-cnn-6-6) — the cheap/fast path vs. a frontier LLM.',
  category: 'ai',
  tags: ['local-ai', 'summarization', 'transformers'],
  web: webImpl,
  cli: cliImpl
};

// Re-export internals for tests (same pattern as B-3 / B-4a).
export { summarizeTranscript, MODEL_ID, SAMPLE_TRANSCRIPT };
export type { ISummaryResult, SummarizeFn } from './summarizeAdapter';
