/**
 * B-3 scenario: local toxicity classifier wired as an `IPromptSafetyPolicy` screener.
 *
 * This scenario is the **done-or-discard forcing function** for the transformers facades.
 * It wires a `Xenova/toxic-bert` text-classification pipeline into a `PromptLibrary`'s
 * safety policy as an `IScreener`, demonstrating the full facade → ts-prompt-assist composition.
 *
 * ## Architecture
 *
 * The implementation splits across units to satisfy both the testability requirement
 * and the dual web/CLI target:
 *
 * - `classifierScreener.ts` — pure, React-free interpretation logic + screener factory.
 *   Facade-agnostic: it takes `classify` as an injected {@link ClassifyFn} and uses only
 *   type-only facade imports, so it pulls no runtime facade into the web bundle.
 * - `index.tsx` (this file) — web and CLI implementations, both thin shells over the
 *   tested core. The web path imports the browser facade (`@fgv/ts-web-extras-transformers`);
 *   the CLI path loads the Node facade (`@fgv/ts-extras-transformers`) via a `webpackIgnore`
 *   dynamic import so the node-native deps never reach the browser bundle.
 *
 * ## Facade evaluation notes (for `phase-b3-result.md`)
 *
 * The screener body in `classifierScreener.ts` reduces to:
 * ```typescript
 * const result = await classify(pipeline, ctx.value, { top_k: null });
 * ```
 * vs. the raw equivalent:
 * ```typescript
 * const result = await captureAsyncResult(async () => {
 *   const r = await pipeline(text, options);
 *   return Array.isArray(r[0]) ? (r as TextClassificationOutput[]).flat() : r as TextClassificationOutput;
 * });
 * ```
 * The facade eliminates the flatten-if-needed branch and makes the Result boundary explicit.
 *
 * @packageDocumentation
 */

import React, { useState, useCallback } from 'react';
import { fail, succeed } from '@fgv/ts-utils';
import type { Result } from '@fgv/ts-utils';
// The web component runs in the browser bundle, so it uses the browser facade
// (WASM ONNX + Web Crypto — no node-native deps). The CLI path uses the Node
// facade, but loads it via a `webpackIgnore` dynamic import (see `cliImpl.run`)
// so it never enters the web bundle's static graph.
import { loadPipeline, classifyAll } from '@fgv/ts-web-extras-transformers';
import type { TextClassificationPipeline } from '@fgv/ts-web-extras-transformers';
import {
  Convert,
  PromptLibrary,
  PromptStoreFixture,
  type IPromptResolveTrace,
  type ISafeguardFinding,
  type PromptId,
  type ScopeKey,
  type SlotName
} from '@fgv/ts-prompt-assist';

import type { IScenario, IScenarioContext, IWebScenarioImpl, ICliScenarioImpl } from '../../shell';
import {
  createClassifierScreener,
  interpretLabel,
  interpretClassification,
  DEFAULT_TOXIC_BERT_THRESHOLDS
} from './classifierScreener';
import type {
  ClassifierThresholdMap,
  ClassifyFn,
  IClassifierScreenerOptions,
  ILabelThreshold,
  LabelVerdict
} from './classifierScreener';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** HuggingFace Hub model id for the transformers.js-compatible ONNX export of toxic-bert. */
const MODEL_ID: string = 'Xenova/toxic-bert';

// Scenario id, scope key, and prompt id used throughout the fixture. Built via
// the ts-prompt-assist brand Converters (not raw casts) so a literal that ever
// violated the brand constraints — e.g. a slot name that isn't a valid mustache
// name, or a prompt id containing '::' — would fail loudly at module load.
const SCENARIO_SCOPE: ScopeKey = Convert.scopeKey
  .convert('classifier-safety')
  .shouldNotFail('SCENARIO_SCOPE');
const SCENARIO_PROMPT_ID: PromptId = Convert.promptId
  .convert('user-message')
  .shouldNotFail('SCENARIO_PROMPT_ID');
const USER_TEXT_SLOT: SlotName = Convert.slotName.convert('user_text').shouldNotFail('USER_TEXT_SLOT');

// ---------------------------------------------------------------------------
// Fixture prompt record
// ---------------------------------------------------------------------------

/**
 * Minimal prompt fixture for the scenario: a single slot `{{{user_text}}}` whose
 * resolved value flows through the classifier screener before rendering.
 *
 * Using `PromptStoreFixture.build` (the canonical in-memory test/demo fixture) keeps
 * the testbed honest — no bespoke store implementation.
 */
async function buildPromptLibrary(
  pipeline: TextClassificationPipeline,
  classifyFn: ClassifyFn,
  thresholds: ClassifierThresholdMap
): Promise<Result<PromptLibrary>> {
  const store = await PromptStoreFixture.build({
    records: [
      {
        scope: SCENARIO_SCOPE,
        id: SCENARIO_PROMPT_ID,
        descriptor: {
          title: 'User message screening demo',
          schemaVersion: '1',
          surface: 'chat',
          slots: [
            {
              name: USER_TEXT_SLOT,
              description: 'User-supplied text to screen through the local classifier',
              source: 'user'
            }
          ],
          output: { kind: 'free-text' }
        },
        candidates: [{ conditions: {}, body: `{{{${USER_TEXT_SLOT}}}}` }]
      }
    ]
  });

  return store.thenOnSuccess((s) =>
    PromptLibrary.create({
      store: s,
      qualifiers: [],
      safetyPolicy: {
        screeners: [
          createClassifierScreener({
            pipeline,
            classify: classifyFn,
            thresholds,
            name: 'local-toxic-bert-screener'
          })
        ]
      }
    })
  );
}

// ---------------------------------------------------------------------------
// Web implementation
// ---------------------------------------------------------------------------

/**
 * Module-level pipeline reference. Populated by `initialize()` so the component
 * reuses the already-loaded pipeline rather than downloading it again on mount.
 * Falls back to a fresh `loadPipeline` call when the component is mounted
 * standalone (e.g. in tests that exercise the component directly).
 */
let _cachedPipeline: TextClassificationPipeline | undefined;

/**
 * Per-resolve display state for the web component.
 */
interface IResolveResult {
  readonly input: string;
  readonly body?: string;
  readonly findings: ReadonlyArray<ISafeguardFinding>;
  readonly error?: string;
  readonly trace?: IPromptResolveTrace;
}

/**
 * Web component for the local-classifier-safety scenario.
 *
 * Accepts user-supplied text, resolves it through the `PromptLibrary` (which runs
 * the classifier screener), and displays the verdict + per-label scores.
 */
function LocalClassifierSafetyComponent({
  context
}: {
  readonly context: IScenarioContext;
}): React.ReactElement {
  const [lib, setLib] = React.useState<PromptLibrary | null>(null);
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<IResolveResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Build the PromptLibrary on mount. If `initialize()` has already loaded the pipeline
  // (the normal web-shell path), reuse it via `_cachedPipeline`. Otherwise load it here
  // (standalone / test usage without an outer shell).
  React.useEffect(() => {
    let mounted: boolean = true;
    const pipePromise: Promise<Result<TextClassificationPipeline>> =
      _cachedPipeline !== undefined
        ? Promise.resolve(succeed(_cachedPipeline))
        : loadPipeline('text-classification', MODEL_ID);

    pipePromise
      .then(async (pipeResult) => {
        if (!mounted) {
          return;
        }
        if (pipeResult.isFailure()) {
          context.logger.error(`Failed to load model: ${pipeResult.message}`);
          setIsLoading(false);
          return;
        }
        const libResult = await buildPromptLibrary(
          pipeResult.value,
          classifyAll,
          DEFAULT_TOXIC_BERT_THRESHOLDS
        );
        /* c8 ignore next 3 - unmount guard after buildPromptLibrary: requires precise timing (unmount between loadPipeline resolve and buildPromptLibrary resolve) which is not deterministic in jsdom */
        if (!mounted) {
          return;
        }
        /* c8 ignore next 5 - buildPromptLibrary fails only if PromptStoreFixture/PromptLibrary.create has a bug; not reachable via mocked pipeline tests (same rationale as CLI path line 383) */
        if (libResult.isFailure()) {
          context.logger.error(`Failed to build PromptLibrary: ${libResult.message}`);
          setIsLoading(false);
          return;
        }
        context.logger.info(`Model ${MODEL_ID} loaded.`);
        setLib(libResult.value);
        setIsLoading(false);
      })
      /* c8 ignore next 5 - catch only fires if the then-chain throws synchronously (not from a rejected promise, since mocked loadPipeline returns a resolved Promise<Result>); not reachable in tests */
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

  const handleScreen = useCallback(async () => {
    if (lib === null || inputText.trim() === '') {
      return;
    }
    const resolveResult = await lib.resolve({
      id: SCENARIO_PROMPT_ID,
      chain: [SCENARIO_SCOPE],
      qualifiers: {},
      substitutions: { [USER_TEXT_SLOT]: inputText }
    });

    if (resolveResult.isFailure()) {
      // A reject-disposition finding surfaces in the failure message.
      setResult({
        input: inputText,
        findings: [],
        error: resolveResult.message,
        trace: undefined
      });
      context.logger.warn(`Resolve failed: ${resolveResult.message}`);
    } else {
      const { body, trace } = resolveResult.value;
      setResult({
        input: inputText,
        body,
        findings: trace.safeguardFindings,
        trace
      });
      const hasWarnings = trace.safeguardFindings.length > 0;
      if (hasWarnings) {
        context.logger.warn(`Warnings: ${trace.safeguardFindings.map((f) => f.detail).join('; ')}`);
      } else {
        context.logger.info('Content passed all checks.');
      }
    }
  }, [lib, inputText, context.logger]);

  if (isLoading) {
    return (
      <div data-testid="classifier-loading">
        <p>Loading model {MODEL_ID}…</p>
      </div>
    );
  }

  return (
    <div data-testid="classifier-scenario">
      <div data-testid="classifier-input-area">
        <label htmlFor="classifier-input">Text to screen:</label>
        <textarea
          id="classifier-input"
          data-testid="classifier-input"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={4}
          cols={60}
        />
        <button data-testid="classifier-run-btn" onClick={handleScreen} disabled={lib === null}>
          Screen text
        </button>
      </div>
      {result !== null && (
        <div data-testid="classifier-result">
          {result.error !== undefined ? (
            <div data-testid="classifier-error">
              <strong>Rejected:</strong> {result.error}
            </div>
          ) : (
            <div data-testid="classifier-allowed">
              <strong>Rendered body:</strong> {result.body}
              {result.findings.length === 0 ? (
                <p data-testid="classifier-verdict-clean">✓ Content passed all checks.</p>
              ) : (
                <ul data-testid="classifier-findings">
                  {result.findings.map((f, i) => (
                    <li key={i} data-testid={`classifier-finding-${i}`}>
                      [{f.disposition.toUpperCase()}] {f.detail}
                    </li>
                  ))}
                </ul>
              )}
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
  component: LocalClassifierSafetyComponent,

  /**
   * Called by the shell before mounting the component. Loads the pipeline; gates
   * mounting on success. Returns `false` if the model is still downloading so the
   * shell keeps showing its loading state.
   */
  async initialize(context: IScenarioContext): Promise<Result<boolean>> {
    context.logger.info(`Loading model ${MODEL_ID}…`);
    const result = await loadPipeline('text-classification', MODEL_ID);
    if (result.isFailure()) {
      context.logger.error(`Model load failed: ${result.message}`);
      return fail(`model load failed: ${result.message}`);
    }
    _cachedPipeline = result.value;
    context.logger.info(`Model ${MODEL_ID} ready.`);
    return succeed(true);
  }
};

// ---------------------------------------------------------------------------
// CLI implementation (ICliScenarioImpl)
// ---------------------------------------------------------------------------

/** Fixed fixture inputs for the CLI batch demonstration. */
const CLI_DEMO_INPUTS: ReadonlyArray<{ readonly label: string; readonly text: string }> = [
  { label: 'clean-greeting', text: 'Hello, how can I help you today?' },
  { label: 'clean-question', text: 'What is the capital of France?' },
  { label: 'mild-rudeness', text: 'This is absolutely stupid behavior.' },
  { label: 'hate-speech', text: 'I hate all people of that group.' }
];

const cliImpl: ICliScenarioImpl = {
  /**
   * Classifies a fixed set of demo inputs through the screener and returns a
   * summary string. Drives the tested `classifierScreener.ts` logic end-to-end
   * through the `PromptLibrary` seam, covering the full resolve → screen → verdict
   * path without requiring a browser.
   */
  async run(context: IScenarioContext): Promise<Result<string>> {
    context.logger.info(`Loading model ${MODEL_ID} for batch demo…`);
    // Load the Node facade lazily and opaquely to webpack: the `webpackIgnore`
    // magic comment keeps `@fgv/ts-extras-transformers` (and its node-native ONNX
    // deps) out of the browser bundle's static graph, while Node resolves it
    // normally at CLI runtime.
    const nodeFacade = await import(/* webpackIgnore: true */ '@fgv/ts-extras-transformers');
    const pipeResult = await nodeFacade.loadPipeline('text-classification', MODEL_ID);
    if (pipeResult.isFailure()) {
      return fail(pipeResult.message);
    }

    const libResult = await buildPromptLibrary(
      pipeResult.value,
      nodeFacade.classifyAll,
      DEFAULT_TOXIC_BERT_THRESHOLDS
    );
    /* c8 ignore next 3 - buildPromptLibrary fails only if PromptStoreFixture/PromptLibrary.create has a bug; not reachable via mocked loadPipeline tests */
    if (libResult.isFailure()) {
      return fail(libResult.message);
    }
    const lib = libResult.value;

    // Resolve all inputs sequentially (preserving order) and collect per-input summaries.
    // mapResults requires a synchronous Iterable<Result<T>>, so we await each resolve
    // first and then fold into Result strings.
    const summaries: string[] = [];
    for (const { label, text } of CLI_DEMO_INPUTS) {
      const resolveResult = await lib.resolve({
        id: SCENARIO_PROMPT_ID,
        chain: [SCENARIO_SCOPE],
        qualifiers: {},
        substitutions: { [USER_TEXT_SLOT]: text }
      });

      if (resolveResult.isFailure()) {
        context.logger.warn(`[${label}] REJECTED — ${resolveResult.message}`);
        summaries.push(`${label}: REJECTED`);
      } else {
        const { trace } = resolveResult.value;
        const findings = trace.safeguardFindings;
        const summary =
          findings.length === 0
            ? 'CLEAN'
            : `${findings[0]!.disposition.toUpperCase()}: ${findings[0]!.detail}`;
        context.logger.info(`[${label}] ${summary}`);
        summaries.push(`${label}: ${summary}`);
      }
    }

    const lines = summaries.join('\n');
    return succeed(`B-3 local-classifier-safety demo (${CLI_DEMO_INPUTS.length} inputs):\n${lines}`);
  }
};

// ---------------------------------------------------------------------------
// Scenario export
// ---------------------------------------------------------------------------

/**
 * `localClassifierSafety` scenario: wires a local `toxic-bert` text-classification
 * pipeline into a `PromptLibrary`'s `IPromptSafetyPolicy.screeners`.
 *
 * @public
 */
export const localClassifierSafetyScenario: IScenario = {
  id: 'local-classifier-safety',
  title: 'Local Classifier Safety',
  description:
    'Demonstrates wiring a local `Xenova/toxic-bert` text-classification pipeline as an ' +
    '`IPromptSafetyPolicy` screener on a `PromptLibrary`. Slot values are screened by a ' +
    'local ONNX model before the prompt renders — no remote API required.',
  category: 'ai',
  tags: ['local-ai', 'classification', 'ts-prompt-assist', 'safety'],
  web: webImpl,
  cli: cliImpl
};

// Re-export the screener primitives and scenario helpers so tests can import
// from this module's barrel rather than reaching into internal sub-modules.
export {
  createClassifierScreener,
  interpretLabel,
  interpretClassification,
  DEFAULT_TOXIC_BERT_THRESHOLDS,
  buildPromptLibrary,
  MODEL_ID,
  SCENARIO_SCOPE,
  SCENARIO_PROMPT_ID,
  USER_TEXT_SLOT
};
export type { ClassifyFn, IClassifierScreenerOptions, ILabelThreshold, ClassifierThresholdMap, LabelVerdict };
