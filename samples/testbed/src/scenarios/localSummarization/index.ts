/**
 * Local summarization scenario (CLI-only).
 *
 * Demonstrates the `summarize` facade primitive: a small local summarization model
 * (`Xenova/distilbart-cnn-6-6`) compacts a realistic multi-turn conversation transcript into a
 * short summary — the cheap/fast local pass a consumer reaches for instead of a frontier LLM when
 * the input is simple/medium, escalating to the cloud only for long/complex documents.
 *
 * **CLI-only by design.** Summarization here is a backend-Node task — the model is a one-time
 * server-side cache, not a browser-download UX concern — so there is no web component. In the web
 * shell this scenario surfaces via the shell's "no-web" path (a pointer to the CLI invocation).
 *
 * The Node facade (`@fgv/ts-extras-transformers`) is loaded via a `webpackIgnore` dynamic import
 * because this module is reachable from the web bundle's graph (through the scenario registry);
 * the magic comment keeps the node-native ONNX deps out of the browser bundle.
 *
 * @packageDocumentation
 */

import { fail, succeed } from '@fgv/ts-utils';
import type { Result } from '@fgv/ts-utils';

import type { IScenario, IScenarioContext, ICliScenarioImpl } from '../../shell';

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

    const summaryResult = await nodeFacade.summarize(pipeResult.value, SAMPLE_TRANSCRIPT, {
      min_length: 25,
      max_length: 90
    });
    if (summaryResult.isFailure()) {
      return fail(summaryResult.message);
    }

    const first = summaryResult.value[0];
    if (first === undefined) {
      return fail('summarization produced no output');
    }
    const summary = first.summary_text;
    context.logger.info('Summarization complete.');

    // local-vs-cloud framing at "printed note" depth — NOT a routing engine. When to escalate to a
    // frontier model (e.g. cloud summarization via @fgv/ts-extras/ai-assist) is the consumer's
    // policy, not the sample's: this just observes the compaction it achieved locally.
    const ratio = Math.round((summary.length / SAMPLE_TRANSCRIPT.length) * 100);
    const note =
      `Local summary via ${MODEL_ID}: ${SAMPLE_TRANSCRIPT.length} → ${summary.length} chars (${ratio}%). ` +
      'Local is the cheap/fast path for simple/medium inputs; escalate long/complex docs to cloud ' +
      'summarization (@fgv/ts-extras/ai-assist) where quality matters.';

    return succeed(
      `local-summarization demo\n\nInput: a ${SAMPLE_TRANSCRIPT.length}-char multi-turn transcript.\n\n` +
        `Summary:\n${summary}\n\n${note}`
    );
  }
};

/**
 * The local-summarization scenario (CLI-only). Registered in `scenarios/index.ts`.
 * @public
 */
export const localSummarizationScenario: IScenario = {
  id: 'local-summarization',
  title: 'Local Summarization',
  description:
    'Compact a conversation transcript with a small local summarization model ' +
    '(distilbart-cnn-6-6) — the cheap/fast path vs. a frontier LLM. CLI-only.',
  category: 'ai',
  tags: ['local-ai', 'summarization', 'transformers', 'cli'],
  cli: cliImpl
};
