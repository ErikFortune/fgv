/**
 * Pure / deps-injected core of the `cross-provider-embedding-search` scenario — the cloud
 * sibling of `local-embedding-search`. Where the local scenario runs the model in-process
 * (`@fgv/ts-extras-transformers`), this one exercises the **distant-HTTP** embedding primitive
 * `AiAssist.callProviderEmbedding` against a real provider (OpenAI-shaped or Gemini).
 *
 * The embedding call is injected via {@link EmbedFn} (defaulting to the real
 * `AiAssist.callProviderEmbedding`) so the orchestration is unit-testable by mocking `fetch`
 * — the test then drives the **real** primitive + adapters over a faked network and asserts
 * the outgoing request body (the load-bearing class of test per TESTING_GUIDELINES "never
 * paper over failures"). The config parser is a pure `env -> Result` function (the `mcpProbe`
 * idiom).
 *
 * The ranking math (`rankBySimilarity` / cosine) is reused verbatim from `local-embedding-search`
 * — there is exactly one cosine-similarity implementation in the testbed.
 *
 * @packageDocumentation
 */

import { type Logging, Result, fail, succeed } from '@fgv/ts-utils';
import { AiAssist } from '@fgv/ts-extras';

import { rankBySimilarity } from '../localEmbeddingSearch/similarity';
import type { ICorpusEntry, IRankedResult } from '../localEmbeddingSearch/similarity';

// ---------------------------------------------------------------------------
// The injected embedding operation
// ---------------------------------------------------------------------------

/**
 * The embedding operation the search core depends on. Defaults to the real
 * {@link AiAssist.callProviderEmbedding}; injected in unit tests (either as the real
 * primitive over a mocked `fetch`, or as a stub for the pure ranking paths).
 * @public
 */
export type EmbedFn = (
  params: AiAssist.IProviderEmbeddingParams
) => Promise<Result<AiAssist.IAiEmbeddingResult>>;

// ---------------------------------------------------------------------------
// Fixed demo corpus + query (semantic search)
// ---------------------------------------------------------------------------

/**
 * Fixed document corpus for the demo. Deliberately spread across unrelated topics so a
 * well-formed retrieval embedding ranks the single relevant document first — the sanity
 * signal for the live gate.
 * @public
 */
export const CORPUS_DOCUMENTS: readonly string[] = [
  "To reset your password, click 'Forgot password' on the sign-in page and follow the emailed link.",
  'Our support office is open Monday through Friday, from 9am to 5pm local time.',
  'The Eiffel Tower is a wrought-iron lattice tower on the Champ de Mars in Paris, France.',
  'Photosynthesis is the process by which green plants convert sunlight into chemical energy.',
  'You can update your billing information and payment method from the account settings page.'
];

/** The search query. Unambiguously about the password-reset document (index 0). */
export const QUERY_TEXT: string = 'How do I reset the password for my account?';

/** Index into {@link CORPUS_DOCUMENTS} a sane ranking must place first. */
export const EXPECTED_TOP_INDEX: number = 0;

/** Query-side task-type hint (Gemini retrieval asymmetry; no-op on symmetric providers). */
export const QUERY_TASK_TYPE: AiAssist.AiEmbeddingTaskType = 'retrieval-query';

/** Document-side task-type hint (Gemini retrieval asymmetry; no-op on symmetric providers). */
export const DOCUMENT_TASK_TYPE: AiAssist.AiEmbeddingTaskType = 'retrieval-document';

// ---------------------------------------------------------------------------
// Scenario configuration (provider selection + key resolution from env)
// ---------------------------------------------------------------------------

/**
 * A resolved, ready-to-run configuration for the scenario: which provider descriptor to use,
 * the API key, the resolved embedding model, and the optional knobs.
 * @public
 */
export interface IEmbeddingScenarioConfig {
  /** Human-facing provider label (the value the caller selected, e.g. `'openai'`, `'gemini'`). */
  readonly providerLabel: string;
  /** The resolved provider descriptor. */
  readonly descriptor: AiAssist.IAiProviderDescriptor;
  /** The API key (empty string for keyless self-hosted providers). */
  readonly apiKey: string;
  /** The resolved embedding model id (default or overridden). */
  readonly model: string;
  /** Requested output dimensionality, when the caller set `EMBED_DIMENSIONS`. */
  readonly dimensions?: number;
  /** Base-URL override, when the caller set `EMBED_ENDPOINT` (self-hosted). */
  readonly endpoint?: string;
}

/** Maps a friendly provider label to its descriptor id. */
const PROVIDER_LABEL_TO_ID: Readonly<Record<string, string>> = {
  openai: 'openai',
  gemini: 'google-gemini',
  'google-gemini': 'google-gemini',
  mistral: 'mistral',
  ollama: 'ollama',
  'openai-compat': 'openai-compat'
};

/** Providers that need no API key (self-hosted / keyless). */
const KEYLESS_PROVIDER_IDS: ReadonlySet<string> = new Set(['ollama', 'openai-compat']);

/**
 * Resolve the API key for a provider from the environment, honoring the same env-var
 * conventions the sibling `*ClientTools` scenarios use.
 * @internal
 */
function resolveApiKey(providerId: string, env: Record<string, string | undefined>): Result<string> {
  if (KEYLESS_PROVIDER_IDS.has(providerId)) {
    return succeed('');
  }
  switch (providerId) {
    case 'openai':
      return env.OPENAI_API_KEY
        ? succeed(env.OPENAI_API_KEY)
        : fail('OPENAI_API_KEY is not set. Run: export OPENAI_API_KEY=<your-key>');
    case 'google-gemini': {
      const key = env.GEMINI_API_KEY ?? env.GOOGLE_API_KEY;
      return key
        ? succeed(key)
        : fail('Neither GEMINI_API_KEY nor GOOGLE_API_KEY is set. Run: export GEMINI_API_KEY=<your-key>');
    }
    case 'mistral':
      return env.MISTRAL_API_KEY
        ? succeed(env.MISTRAL_API_KEY)
        : fail('MISTRAL_API_KEY is not set. Run: export MISTRAL_API_KEY=<your-key>');
    /* c8 ignore next 2 - unreachable: every id in PROVIDER_LABEL_TO_ID is handled above. */
    default:
      return fail(`no API-key convention is wired for provider "${providerId}"`);
  }
}

/**
 * Parse the scenario configuration from environment variables (the CLI-dispatch idiom — the
 * testbed CLI does not forward trailing argv to scenarios).
 *
 * - `EMBED_PROVIDER` selects the provider (default `openai`). Accepts `openai`, `gemini`
 *   (alias `google-gemini`), `mistral`, `ollama`, `openai-compat`.
 * - `EMBED_MODEL` overrides the embedding model (required for `ollama` / `openai-compat`,
 *   which declare no default embedding model).
 * - `EMBED_DIMENSIONS` requests a reduced output dimensionality (OpenAI 3-* / Gemini).
 * - `EMBED_ENDPOINT` overrides the base URL (self-hosted servers).
 * - The API key comes from the provider's conventional env var (e.g. `OPENAI_API_KEY`,
 *   `GEMINI_API_KEY`/`GOOGLE_API_KEY`).
 *
 * @param env - The environment record (`process.env` in production; a fixture in tests).
 * @returns The resolved config, or a `Failure` describing the missing piece (the "live gate
 *   PENDING" diagnostic).
 * @public
 */
export function parseEmbeddingScenarioConfig(
  env: Record<string, string | undefined>
): Result<IEmbeddingScenarioConfig> {
  // Treat a blank/whitespace-only EMBED_PROVIDER as unset (default `openai`), consistent with
  // how EMBED_MODEL / EMBED_DIMENSIONS / EMBED_ENDPOINT treat blank-as-absent.
  const rawProvider = env.EMBED_PROVIDER?.trim();
  const providerLabel =
    rawProvider !== undefined && rawProvider.length > 0 ? rawProvider.toLowerCase() : 'openai';
  const providerId = PROVIDER_LABEL_TO_ID[providerLabel];
  if (providerId === undefined) {
    return fail(
      `cross-provider-embedding-search: unknown EMBED_PROVIDER "${providerLabel}". ` +
        `Supported: ${Object.keys(PROVIDER_LABEL_TO_ID).join(', ')}`
    );
  }

  // Chain the three fallible resolutions (descriptor, key, dimensions); error context is applied
  // once at each boundary rather than scattered across imperative `fail()` branches. Chaining
  // also removes the otherwise-unreachable descriptor-failure branch (every id in
  // PROVIDER_LABEL_TO_ID is a registered descriptor) without a coverage directive.
  return AiAssist.getProviderDescriptor(providerId)
    .withErrorFormat((msg) => `cross-provider-embedding-search: ${msg}`)
    .onSuccess((descriptor) =>
      resolveApiKey(providerId, env)
        .withErrorFormat((msg) => `cross-provider-embedding-search (provider=${providerLabel}): ${msg}`)
        .onSuccess((apiKey) =>
          parseDimensions(env.EMBED_DIMENSIONS)
            .withErrorFormat((msg) => `cross-provider-embedding-search: ${msg}`)
            .onSuccess((dimensions) => {
              const modelOverride = env.EMBED_MODEL?.trim();
              const model =
                modelOverride !== undefined && modelOverride.length > 0
                  ? modelOverride
                  : AiAssist.resolveModel(descriptor.defaultModel, 'embedding');
              if (model.length === 0) {
                return fail(
                  `cross-provider-embedding-search (provider=${providerLabel}): no embedding ` +
                    `model resolved. Set EMBED_MODEL (self-hosted providers declare no default ` +
                    `embedding model).`
                );
              }
              const endpoint = env.EMBED_ENDPOINT?.trim();
              const hasEndpoint = endpoint !== undefined && endpoint.length > 0;
              // A provider with no default base URL (e.g. `openai-compat`, `baseUrl: ''`) needs an
              // explicit EMBED_ENDPOINT. Fail fast here with a targeted diagnostic rather than
              // letting the embedding primitive fail later with a vaguer "no API endpoint" error.
              if (!hasEndpoint && descriptor.baseUrl.length === 0) {
                return fail(
                  `cross-provider-embedding-search (provider=${providerLabel}): this provider has ` +
                    `no default base URL; set EMBED_ENDPOINT (e.g. http://localhost:8000/v1).`
                );
              }
              return succeed({
                providerLabel,
                descriptor,
                apiKey,
                model,
                ...(dimensions !== undefined ? { dimensions } : {}),
                ...(hasEndpoint ? { endpoint } : {})
              });
            })
        )
    );
}

/** Parse the optional `EMBED_DIMENSIONS` value into a positive integer, or `undefined`. */
function parseDimensions(raw: string | undefined): Result<number | undefined> {
  if (raw === undefined || raw.trim().length === 0) {
    return succeed(undefined);
  }
  const value = Number(raw.trim());
  if (!Number.isInteger(value) || value <= 0) {
    return fail(`EMBED_DIMENSIONS must be a positive integer; got "${raw}"`);
  }
  return succeed(value);
}

// ---------------------------------------------------------------------------
// The search core
// ---------------------------------------------------------------------------

/**
 * The empirical outcome of a cross-provider embedding search — the raw material the report
 * formatter turns into a PASS/FAIL gate matrix.
 * @public
 */
export interface IEmbeddingSearchOutcome {
  /** Provider label the caller selected. */
  readonly providerLabel: string;
  /** Embedding model that produced the vectors. */
  readonly model: string;
  /** Dimensionality of the query vector. */
  readonly queryDimensions: number;
  /** Dimensionality of the document vectors. */
  readonly documentDimensions: number;
  /** Number of document vectors returned (must equal the document count — batch alignment). */
  readonly documentCount: number;
  /** Requested dimensionality, when the caller asked for one. */
  readonly requestedDimensions?: number;
  /** Whether the resolved capability declares `supportsDimensions`. */
  readonly capabilitySupportsDimensions: boolean;
  /** Whether the resolved capability declares `supportsTaskType` (Gemini retrieval asymmetry). */
  readonly capabilitySupportsTaskType: boolean;
  /** The ranked documents (highest cosine similarity first). */
  readonly ranked: readonly IRankedResult[];
  /** Token usage reported for the query call, when the provider reports it. */
  readonly queryUsage?: AiAssist.IAiEmbeddingUsage;
}

/**
 * Run the cross-provider embedding search: embed the query (with `retrieval-query` task type)
 * and the documents in a single batch call (with `retrieval-document` task type), then rank
 * the documents by cosine similarity to the query.
 *
 * The two-call, asymmetric-task-type shape is the load-bearing exercise: on Gemini it drives
 * the `batchEmbedContents` wire path with `RETRIEVAL_QUERY` vs `RETRIEVAL_DOCUMENT`; on the
 * OpenAI-shaped providers the same task-type hints are a harmless no-op (the design's
 * cross-provider call-site promise). Batching the documents in one call exercises index
 * alignment.
 *
 * @param config - The resolved scenario configuration.
 * @param embedFn - The embedding operation (defaults to {@link AiAssist.callProviderEmbedding}).
 * @param logger - Optional logger threaded to the primitive (the no-op-knob notes surface here).
 * @returns The empirical outcome, or a `Failure` carrying the wire error.
 * @public
 */
export async function runEmbeddingSearch(
  config: IEmbeddingScenarioConfig,
  embedFn: EmbedFn = AiAssist.callProviderEmbedding,
  logger?: Logging.ILogger
): Promise<Result<IEmbeddingSearchOutcome>> {
  const capability = AiAssist.resolveEmbeddingCapability(config.descriptor, config.model);
  if (capability === undefined) {
    return fail(
      `provider "${config.descriptor.id}" declares no embedding capability for model "${config.model}"`
    );
  }

  const common = {
    descriptor: config.descriptor,
    apiKey: config.apiKey,
    modelOverride: config.model,
    ...(config.endpoint !== undefined ? { endpoint: config.endpoint } : {}),
    ...(logger !== undefined ? { logger } : {})
  };

  // 1. Embed the query (retrieval-query).
  const queryResult = await embedFn({
    ...common,
    params: {
      input: QUERY_TEXT,
      taskType: QUERY_TASK_TYPE,
      ...(config.dimensions !== undefined ? { dimensions: config.dimensions } : {})
    }
  });
  if (queryResult.isFailure()) {
    return fail(`query embedding failed: ${queryResult.message}`);
  }
  const query = queryResult.value;

  // 2. Embed all documents in one batch call (retrieval-document).
  const docResult = await embedFn({
    ...common,
    params: {
      input: CORPUS_DOCUMENTS,
      taskType: DOCUMENT_TASK_TYPE,
      ...(config.dimensions !== undefined ? { dimensions: config.dimensions } : {})
    }
  });
  if (docResult.isFailure()) {
    return fail(`document embedding failed: ${docResult.message}`);
  }
  const docs = docResult.value;

  if (docs.vectors.length !== CORPUS_DOCUMENTS.length) {
    return fail(
      `batch misalignment: requested ${CORPUS_DOCUMENTS.length} document embeddings, ` +
        `received ${docs.vectors.length}`
    );
  }

  // The query is a single-item batch: require exactly one vector. This catches an empty result
  // AND extra vectors that would otherwise be silently dropped — notably on the Gemini path,
  // where the adapter does not enforce the response count against the request.
  if (query.vectors.length !== 1) {
    return fail(
      `query batch misalignment: expected exactly 1 query vector, received ${query.vectors.length}`
    );
  }
  const queryVec = query.vectors[0]!;

  const corpus: ICorpusEntry[] = CORPUS_DOCUMENTS.map((text, i) => ({
    text,
    vec: docs.vectors[i]!
  }));

  const rankResult = rankBySimilarity(queryVec, corpus);
  if (rankResult.isFailure()) {
    return fail(`ranking failed: ${rankResult.message}`);
  }

  return succeed({
    providerLabel: config.providerLabel,
    model: docs.model,
    queryDimensions: query.dimensions,
    documentDimensions: docs.dimensions,
    documentCount: docs.vectors.length,
    ...(config.dimensions !== undefined ? { requestedDimensions: config.dimensions } : {}),
    capabilitySupportsDimensions: capability.supportsDimensions === true,
    capabilitySupportsTaskType: capability.supportsTaskType === true,
    ranked: rankResult.value,
    ...(query.usage !== undefined ? { queryUsage: query.usage } : {})
  });
}

// ---------------------------------------------------------------------------
// Report formatting + gate evaluation
// ---------------------------------------------------------------------------

/** A single empirical gate's evaluation. */
interface IGate {
  readonly label: string;
  /** `true` = PASS, `false` = FAIL, `undefined` = SKIP (not applicable this run). */
  readonly status: boolean | undefined;
  readonly detail: string;
}

/** The result of evaluating all gates for a search outcome. */
export interface IEmbeddingReport {
  /** Overall PASS (every applicable gate passed) / FAIL. */
  readonly pass: boolean;
  /** The full multi-line human-readable report. */
  readonly text: string;
}

/** Render a gate status to its display token. */
function gateToken(status: boolean | undefined): string {
  return status === undefined ? 'SKIP' : status ? 'PASS' : 'FAIL';
}

/**
 * Evaluate the empirical gates for a search outcome and format the report. The verdict is
 * COMPUTED from the outcome (never hardcoded): a live HTTP 200 that returns mis-shaped or
 * mis-ranked vectors is a FAIL, not a PASS.
 *
 * Gates:
 *  1. Query + document vectors are non-empty and equal-dimensioned (both wire formats yield
 *     usable `number[][]`).
 *  2. Batch alignment — document vector count equals the document count.
 *  3. Ranking sanity — the expected document ranks first.
 *  4. `dimensions` honored where the capability supports it (returned dimension equals the
 *     requested one); SKIP when not requested or not supported.
 *
 * @param outcome - The empirical search outcome.
 * @returns The pass/fail verdict and the printable report.
 * @public
 */
export function formatEmbeddingReport(outcome: IEmbeddingSearchOutcome): IEmbeddingReport {
  const dimsUsable =
    outcome.queryDimensions > 0 &&
    outcome.documentDimensions > 0 &&
    outcome.queryDimensions === outcome.documentDimensions;
  const batchAligned = outcome.documentCount === CORPUS_DOCUMENTS.length;
  const topText = outcome.ranked[0]?.text;
  const rankingSane = topText === CORPUS_DOCUMENTS[EXPECTED_TOP_INDEX];

  // Dimensions gate: only applicable when the caller requested a dimension AND the capability
  // honors it; then the returned dimension must equal the request.
  let dimsHonored: boolean | undefined;
  if (outcome.requestedDimensions === undefined || !outcome.capabilitySupportsDimensions) {
    dimsHonored = undefined;
  } else {
    dimsHonored =
      outcome.documentDimensions === outcome.requestedDimensions &&
      outcome.queryDimensions === outcome.requestedDimensions;
  }

  const gates: readonly IGate[] = [
    {
      label: 'Both vectors usable + equal-dimensioned',
      status: dimsUsable,
      detail: `query=${outcome.queryDimensions}d, documents=${outcome.documentDimensions}d`
    },
    {
      label: 'Batch alignment (one vector per document)',
      status: batchAligned,
      detail: `${outcome.documentCount}/${CORPUS_DOCUMENTS.length} document vectors`
    },
    {
      label: 'Ranking sanity (expected document ranks #1)',
      status: rankingSane,
      detail: `top="${(topText ?? '(none)').slice(0, 60)}"`
    },
    {
      label: 'dimensions honored',
      status: dimsHonored,
      detail:
        outcome.requestedDimensions === undefined
          ? 'no dimension requested'
          : !outcome.capabilitySupportsDimensions
          ? `model does not support dimensions (returned native ${outcome.documentDimensions}d)`
          : `requested ${outcome.requestedDimensions}d, returned ${outcome.documentDimensions}d`
    }
  ];

  // PASS = every applicable (non-SKIP) gate passed.
  const pass = gates.every((g) => g.status !== false);

  const lines: string[] = [
    `cross-provider-embedding-search (${outcome.providerLabel}): ${pass ? 'PASS' : 'FAIL'}`,
    '',
    `Provider: ${outcome.providerLabel}`,
    `Model: ${outcome.model}`,
    `Vector dimensions: ${outcome.documentDimensions}`,
    `Task-type asymmetry: query="${QUERY_TASK_TYPE}" documents="${DOCUMENT_TASK_TYPE}" ` +
      `(capability ${outcome.capabilitySupportsTaskType ? 'HONORS' : 'ignores (no-op)'} taskType)`,
    outcome.queryUsage !== undefined
      ? `Query token usage: ${JSON.stringify(outcome.queryUsage)}`
      : 'Query token usage: (not reported by provider)',
    '',
    `Query: "${QUERY_TEXT}"`,
    'Ranking (cosine similarity, highest first):',
    ...outcome.ranked.map((r, i) => `  ${i + 1}. [${r.score.toFixed(4)}] ${r.text}`),
    '',
    'Empirical gates:',
    ...gates.map((g) => `  [${gateToken(g.status)}] ${g.label} — ${g.detail}`)
  ];

  return { pass, text: lines.join('\n') };
}
