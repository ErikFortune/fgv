/**
 * Thin summarization adapter — the only facade-touching surface in the scenario.
 *
 * Wraps the injected `summarize` function (from either `@fgv/ts-extras-transformers`
 * for Node or `@fgv/ts-web-extras-transformers` for the browser) and reduces the
 * upstream `SummarizationOutput` (an array of `{ summary_text }` entries) to the single
 * summary string plus the local-vs-original compaction ratio the scenario reports.
 *
 * ## Facade agnosticism via injection
 *
 * `summarizeTranscript` takes `summarizeFn` as a parameter rather than importing either
 * facade directly. Only type-only imports from `@fgv/ts-web-extras-transformers` are
 * present here — they are erased at compile time and pull no runtime facade into the
 * bundle. The web component passes the browser facade's `summarize`; the CLI path passes
 * the Node facade's `summarize` (loaded via a `webpackIgnore` dynamic import).
 *
 * @packageDocumentation
 */

import { Result, fail, succeed } from '@fgv/ts-utils';
// Type-only imports — erased by the TypeScript compiler; no runtime facade
// reference enters the web bundle from this module.
import type { SummarizationOutput, SummarizationPipeline } from '@fgv/ts-web-extras-transformers';

/**
 * The `summarize` operation as exposed by either transformers facade.
 * Injected into {@link summarizeTranscript} so the adapter core depends on neither
 * concrete facade at runtime.
 *
 * @public
 */
export type SummarizeFn = (
  summarizer: SummarizationPipeline,
  text: string,
  options?: Parameters<SummarizationPipeline>[1]
) => Promise<Result<SummarizationOutput>>;

/** Result of {@link summarizeTranscript}: the summary text plus its compaction ratio. */
export interface ISummaryResult {
  /** The generated summary text. */
  readonly summary: string;
  /** `summary.length / transcript.length`, as a whole percent (e.g. `18` for 18%). */
  readonly ratio: number;
}

/**
 * Summarize `transcript` via the injected facade function and reduce the result to the
 * summary text plus its compaction ratio against the original transcript length.
 *
 * Returns `Result.fail` when:
 * - the `summarize` call fails (e.g. inference error, model not loaded), or
 * - the summarizer returns no output entries (defensive — should not occur with a
 *   valid `SummarizationPipeline` and non-empty input).
 *
 * @param summarizer - A `SummarizationPipeline` obtained from `loadPipeline`.
 * @param transcript - The text to summarize.
 * @param summarizeFn - Injected facade function.
 * @param options - Optional upstream summarization options (e.g. `min_length`, `max_length`).
 * @returns The summary text plus its compaction ratio.
 *
 * @public
 */
export async function summarizeTranscript(
  summarizer: SummarizationPipeline,
  transcript: string,
  summarizeFn: SummarizeFn,
  options?: Parameters<SummarizationPipeline>[1]
): Promise<Result<ISummaryResult>> {
  return (await summarizeFn(summarizer, transcript, options))
    .withErrorFormat((message) => `summarization failed: ${message}`)
    .onSuccess((output) => {
      const first = output[0];
      if (first === undefined) {
        return fail('summarization produced no output');
      }
      const summary = first.summary_text;
      const ratio = Math.round((summary.length / transcript.length) * 100);
      return succeed({ summary, ratio });
    });
}
