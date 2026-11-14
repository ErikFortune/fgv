/**
 * `cross-provider-embedding-search` scenario — the **live empirical gate** for the
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
 * Web-runnable (Phase B) via the shell's generic runner panel: the `EMBED_PROVIDER` /
 * `EMBED_MODEL` / `EMBED_DIMENSIONS` / `EMBED_ENDPOINT` knobs above are CLI-only (there is no
 * generic per-scenario config UI), so the browser run always exercises the default OpenAI
 * path; the provider API keys resolve via `context.resolveSecret` (KeyStore → session
 * secrets store → env var) rather than a direct `process.env` read, which works identically
 * on the CLI and in the browser.
 *
 * @packageDocumentation
 */

import { fail, succeed } from '@fgv/ts-utils';
import type { Result } from '@fgv/ts-utils';
import { AiAssist } from '@fgv/ts-extras';

import type { IScenario, ICliScenarioImpl, IScenarioContext, ISecretSpec } from '../../shell';
import { formatEmbeddingReport, parseEmbeddingScenarioConfig, runEmbeddingSearch } from './search';

/** The `requiredSecrets` specs, reused for both the scenario declaration and key resolution. */
const OPENAI_API_KEY_SPEC: ISecretSpec = {
  id: AiAssist.providerApiKeySecretName('openai'),
  envVarName: 'OPENAI_API_KEY',
  description: 'OpenAI API key (default provider) for live embedding verification'
};
const GEMINI_API_KEY_SPEC: ISecretSpec = {
  id: AiAssist.providerApiKeySecretName('google-gemini'),
  envVarName: 'GEMINI_API_KEY',
  fallbackEnvVarNames: ['GOOGLE_API_KEY'],
  description: 'Gemini API key (EMBED_PROVIDER=gemini) for the batchEmbedContents wire path'
};
const MISTRAL_API_KEY_SPEC: ISecretSpec = {
  id: AiAssist.providerApiKeySecretName('mistral'),
  envVarName: 'MISTRAL_API_KEY',
  description: 'Mistral API key (EMBED_PROVIDER=mistral; mistral-embed is OpenAI-shaped)'
};

/**
 * `EMBED_PROVIDER` / `EMBED_MODEL` / `EMBED_DIMENSIONS` / `EMBED_ENDPOINT` are CLI-only config
 * knobs (no generic per-scenario UI exists on the web runner panel), so they still read
 * straight from `process.env` when present. Reads `process` off `globalThis` (a property
 * lookup, never a bare-identifier reference) so this resolves to `{}` in a browser — which has
 * no `process` global — rather than throwing a ReferenceError; the scenario then falls back to
 * its defaults (openai, no dimension/endpoint override).
 */
function readNodeEnv(): Record<string, string | undefined> {
  const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  return proc?.env ?? {};
}

/** Resolves one key, falling back to its `process.env` value (the pre-existing CLI behavior). */
async function resolveKeyOrEnvFallback(
  context: IScenarioContext,
  spec: ISecretSpec,
  envFallback: string | undefined
): Promise<string | undefined> {
  const result = await context.resolveSecret(spec);
  return result.isSuccess() ? result.value : envFallback;
}

/**
 * Builds the `env`-shaped record `parseEmbeddingScenarioConfig` consumes: the CLI-only config
 * knobs from `process.env` (see {@link readNodeEnv}) plus the three provider API keys resolved
 * via `context.resolveSecret`, which works identically on the CLI (env-var fallback) and the
 * web runner panel (session secrets store).
 */
async function buildEmbeddingEnv(context: IScenarioContext): Promise<Record<string, string | undefined>> {
  const nodeEnv = readNodeEnv();
  const [openaiKey, geminiKey, mistralKey] = await Promise.all([
    resolveKeyOrEnvFallback(context, OPENAI_API_KEY_SPEC, nodeEnv.OPENAI_API_KEY),
    resolveKeyOrEnvFallback(context, GEMINI_API_KEY_SPEC, nodeEnv.GEMINI_API_KEY),
    resolveKeyOrEnvFallback(context, MISTRAL_API_KEY_SPEC, nodeEnv.MISTRAL_API_KEY)
  ]);
  return {
    ...nodeEnv,
    OPENAI_API_KEY: openaiKey,
    GEMINI_API_KEY: geminiKey,
    MISTRAL_API_KEY: mistralKey
  };
}

const cliImpl: ICliScenarioImpl = {
  webRunnable: true,
  async run(context: IScenarioContext): Promise<Result<string>> {
    const env = await buildEmbeddingEnv(context);
    const configResult = parseEmbeddingScenarioConfig(env);
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
 * The cross-provider embedding-search scenario. Web-runnable (Phase B) via the shell's
 * generic runner panel (the browser run always exercises the default OpenAI path; the
 * EMBED_PROVIDER/EMBED_MODEL/EMBED_DIMENSIONS/EMBED_ENDPOINT knobs are CLI-only). Registered
 * in `scenarios/index.ts`.
 * @public
 */
export const crossProviderEmbeddingSearchScenario: IScenario = {
  id: 'cross-provider-embedding-search',
  title: 'Cross-Provider Embedding Search',
  description:
    'Live-wire verification of AiAssist.callProviderEmbedding: embeds a query + document ' +
    'corpus via a real provider (OpenAI-shaped or Gemini), ranks by cosine similarity, and ' +
    'checks both wire formats, batch alignment, the Gemini taskType retrieval asymmetry, and ' +
    'dimension honoring. On the CLI, configure via EMBED_PROVIDER (openai default; also ' +
    'gemini, mistral, ollama, openai-compat) + the provider key; the web runner panel always ' +
    'runs the default OpenAI path using the key from the Secrets panel.',
  category: 'ai',
  tags: ['ai-assist', 'embeddings', 'semantic-search', 'cross-provider', 'live-api', 'cli'],
  requiredSecrets: [OPENAI_API_KEY_SPEC, GEMINI_API_KEY_SPEC, MISTRAL_API_KEY_SPEC],
  cli: cliImpl
};
