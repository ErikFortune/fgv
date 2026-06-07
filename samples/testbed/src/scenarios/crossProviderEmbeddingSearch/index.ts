/**
 * `cross-provider-embedding-search` scenario (CLI-only) — the **live empirical gate** for the
 * `ai-assist-embeddings` primitive and the cloud sibling of `local-embedding-search`.
 *
 * Where `local-embedding-search` runs the model in-process, this scenario exercises the
 * **distant-HTTP** primitive `AiAssist.callProviderEmbedding` against a real provider: it embeds
 * a query and a small document corpus, computes cosine similarity, and ranks the documents.
 * It runs against either an **OpenAI-shaped** provider (`openai`, and reachable: Ollama-via-`/v1`,
 * `openai-compat`, Mistral) or **Gemini** (`google-gemini` — the divergent `batchEmbedContents`
 * wire path), so both embedding wire formats are exercised live.
 *
 * ## Why this scenario exists
 *
 * The primitive shipped with 100% unit coverage but had **never made a real network call** —
 * mock-fetch tests assert what we *send*, not that a provider *accepts* it. This scenario is the
 * live verification. The highest-risk path is Gemini's `taskType` retrieval asymmetry
 * (`RETRIEVAL_QUERY` for the query vs `RETRIEVAL_DOCUMENT` for the documents) on the
 * `batchEmbedContents` route, which the primitive's mock tests describe but no live call had
 * confirmed.
 *
 * ## Usage (env-gated; live network required)
 *
 * The testbed CLI does not forward trailing argv to scenarios, so configuration is via env vars:
 *
 * ```sh
 * # OpenAI (default provider):
 * OPENAI_API_KEY=sk-... node bin/testbed.js --scenario cross-provider-embedding-search
 *
 * # Gemini (exercises the batchEmbedContents + taskType-asymmetry wire path):
 * EMBED_PROVIDER=gemini GEMINI_API_KEY=... \
 *   node bin/testbed.js --scenario cross-provider-embedding-search
 *
 * # Request a reduced dimension (OpenAI text-embedding-3-* / Gemini):
 * EMBED_PROVIDER=openai OPENAI_API_KEY=sk-... EMBED_DIMENSIONS=512 \
 *   node bin/testbed.js --scenario cross-provider-embedding-search
 *
 * # Self-hosted (Ollama via /v1; keyless — EMBED_MODEL required):
 * EMBED_PROVIDER=ollama EMBED_MODEL=nomic-embed-text EMBED_ENDPOINT=http://localhost:11434/v1 \
 *   node bin/testbed.js --scenario cross-provider-embedding-search
 * ```
 *
 * Without the provider's key the scenario fails immediately with the exact missing-config
 * diagnostic (the "live gate PENDING" signal), rather than silently skipping.
 *
 * @packageDocumentation
 */

import { fail, succeed } from '@fgv/ts-utils';
import type { Result } from '@fgv/ts-utils';

import type { IScenario, ICliScenarioImpl, IScenarioContext } from '../../shell';
import { formatEmbeddingReport, parseEmbeddingScenarioConfig, runEmbeddingSearch } from './search';

const cliImpl: ICliScenarioImpl = {
  async run(context: IScenarioContext): Promise<Result<string>> {
    const configResult = parseEmbeddingScenarioConfig(process.env);
    if (configResult.isFailure()) {
      return fail(configResult.message);
    }
    const config = configResult.value;

    context.logger.info(
      `cross-provider-embedding-search: provider=${config.providerLabel}, model=${config.model}` +
        (config.dimensions !== undefined ? `, dimensions=${config.dimensions}` : '') +
        (config.endpoint !== undefined ? `, endpoint=${config.endpoint}` : '')
    );

    const outcomeResult = await runEmbeddingSearch(config, undefined, context.logger);
    if (outcomeResult.isFailure()) {
      return fail(`cross-provider-embedding-search (${config.providerLabel}): ${outcomeResult.message}`);
    }

    const report = formatEmbeddingReport(outcomeResult.value);

    // Return the report as the single source of output: the CLI prints a success value to stdout
    // and surfaces a failure value through its structured error path. (Logging report.text here
    // too would duplicate the whole block on stderr.) The short progress line above stays on
    // stderr for live diagnostics.
    return report.pass ? succeed(report.text) : fail(report.text);
  }
};

/**
 * The cross-provider embedding-search scenario (CLI-only). Registered in `scenarios/index.ts`.
 * @public
 */
export const crossProviderEmbeddingSearchScenario: IScenario = {
  id: 'cross-provider-embedding-search',
  title: 'Cross-Provider Embedding Search',
  description:
    'Live-wire verification of AiAssist.callProviderEmbedding: embeds a query + document ' +
    'corpus via a real provider (OpenAI-shaped or Gemini), ranks by cosine similarity, and ' +
    'checks both wire formats, batch alignment, the Gemini taskType retrieval asymmetry, and ' +
    'dimension honoring. Configure via EMBED_PROVIDER (openai default; also gemini, mistral, ' +
    'ollama, openai-compat) + the provider key (OPENAI_API_KEY, GEMINI_API_KEY / GOOGLE_API_KEY, ' +
    'MISTRAL_API_KEY; self-hosted ollama / openai-compat are keyless). CLI-only.',
  category: 'ai',
  tags: ['ai-assist', 'embeddings', 'semantic-search', 'cross-provider', 'live-api', 'cli'],
  requiredSecrets: [
    {
      id: 'openai-api-key',
      envVarName: 'OPENAI_API_KEY',
      description: 'OpenAI API key (default provider) for live embedding verification'
    },
    {
      id: 'gemini-api-key',
      envVarName: 'GEMINI_API_KEY',
      description:
        'Gemini API key (EMBED_PROVIDER=gemini) for the batchEmbedContents wire path; ' +
        'GOOGLE_API_KEY is also accepted'
    },
    {
      id: 'mistral-api-key',
      envVarName: 'MISTRAL_API_KEY',
      description: 'Mistral API key (EMBED_PROVIDER=mistral; mistral-embed is OpenAI-shaped)'
    }
  ],
  cli: cliImpl
};
