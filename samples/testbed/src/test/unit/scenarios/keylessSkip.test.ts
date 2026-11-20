/**
 * The keyless-skip precondition of every scenario that needs a provider API key: with no key the
 * CLI reports the scenario as skipped (naming the env var to set); with one it runs.
 *
 * @packageDocumentation
 */

import '@fgv/ts-utils-jest';
import { fail, succeed } from '@fgv/ts-utils';

import {
  anthropicClientToolsFableScenario,
  anthropicClientToolsScenario
} from '../../../scenarios/anthropicClientTools';
import { crossProviderEmbeddingSearchScenario } from '../../../scenarios/crossProviderEmbeddingSearch';
import { geminiClientToolsScenario } from '../../../scenarios/geminiClientTools';
import { openaiClientToolsScenario } from '../../../scenarios/openaiClientTools';
import {
  anthropicStructuredOutputScenario,
  geminiStructuredOutputScenario,
  openaiStructuredOutputScenario,
  xaiStructuredOutputScenario
} from '../../../scenarios/structuredOutput';
import { xaiCacheProbeScenario } from '../../../scenarios/xaiCacheProbe';
import { xaiClientToolsScenario } from '../../../scenarios/xaiClientTools';
import type { IScenario, IScenarioContext } from '../../../shell';

/** A context whose `resolveSecret` resolves exactly the env vars in `keys`. */
function contextWithKeys(keys: readonly string[]): IScenarioContext {
  return {
    logger: {} as unknown as IScenarioContext['logger'],
    keyStore: undefined,
    resolveSecret: async (spec) =>
      [spec.envVarName, ...(spec.fallbackEnvVarNames ?? [])].some((name) => keys.includes(name))
        ? succeed('key')
        : fail(`${spec.envVarName} not set`),
    dataTree: {} as unknown as IScenarioContext['dataTree']
  };
}

async function skipReasonOf(scenario: IScenario, keys: readonly string[]): Promise<string | undefined> {
  const check = scenario.cli?.skipReason;
  if (check === undefined) {
    throw new Error(`${scenario.id} declares no skipReason`);
  }
  return check(contextWithKeys(keys));
}

describe('keyless scenarios skip instead of failing', () => {
  test.each([
    {
      scenario: anthropicClientToolsScenario,
      key: 'ANTHROPIC_API_KEY',
      purpose: /client-tool round trip on @anthropic:sonnet/
    },
    {
      scenario: anthropicClientToolsFableScenario,
      key: 'ANTHROPIC_API_KEY',
      purpose: /client-tool round trip on @anthropic:fable/
    },
    { scenario: openaiClientToolsScenario, key: 'OPENAI_API_KEY', purpose: /client-tool round trip/ },
    { scenario: geminiClientToolsScenario, key: 'GEMINI_API_KEY', purpose: /client-tool round trip/ },
    { scenario: xaiClientToolsScenario, key: 'XAI_API_KEY', purpose: /client-tool round trip/ },
    { scenario: openaiStructuredOutputScenario, key: 'OPENAI_API_KEY', purpose: /structured-output probes/ },
    {
      scenario: anthropicStructuredOutputScenario,
      key: 'ANTHROPIC_API_KEY',
      purpose: /structured-output probes/
    },
    { scenario: geminiStructuredOutputScenario, key: 'GEMINI_API_KEY', purpose: /structured-output probes/ },
    { scenario: xaiStructuredOutputScenario, key: 'XAI_API_KEY', purpose: /structured-output probes/ },
    { scenario: xaiCacheProbeScenario, key: 'XAI_API_KEY', purpose: /prompt-cache wire probe/ },
    {
      scenario: crossProviderEmbeddingSearchScenario,
      key: 'OPENAI_API_KEY',
      purpose: /openai embedding search/
    }
  ])('$scenario.id: skips naming its key when unset, runs when set', async ({ scenario, key, purpose }) => {
    const saved = process.env.EMBED_PROVIDER;
    delete process.env.EMBED_PROVIDER;
    try {
      const reason = await skipReasonOf(scenario, []);
      expect(reason).toMatch(new RegExp(`^${key}.* not set; set it to run `));
      expect(reason).toMatch(purpose);
      expect(await skipReasonOf(scenario, [key])).toBeUndefined();
    } finally {
      if (saved !== undefined) {
        process.env.EMBED_PROVIDER = saved;
      }
    }
  });

  describe('cross-provider-embedding-search follows EMBED_PROVIDER', () => {
    const saved = process.env.EMBED_PROVIDER;
    afterEach(() => {
      if (saved === undefined) {
        delete process.env.EMBED_PROVIDER;
      } else {
        process.env.EMBED_PROVIDER = saved;
      }
    });

    test('gemini needs GEMINI_API_KEY or GOOGLE_API_KEY', async () => {
      process.env.EMBED_PROVIDER = 'gemini';
      expect(await skipReasonOf(crossProviderEmbeddingSearchScenario, ['OPENAI_API_KEY'])).toBe(
        'GEMINI_API_KEY or GOOGLE_API_KEY not set; set it to run the live google-gemini embedding search'
      );
      expect(await skipReasonOf(crossProviderEmbeddingSearchScenario, ['GOOGLE_API_KEY'])).toBeUndefined();
    });

    test('a self-hosted provider never skips', async () => {
      process.env.EMBED_PROVIDER = 'ollama';
      expect(await skipReasonOf(crossProviderEmbeddingSearchScenario, [])).toBeUndefined();
    });

    test('an unknown provider is left to run, which reports it', async () => {
      process.env.EMBED_PROVIDER = 'nope';
      expect(await skipReasonOf(crossProviderEmbeddingSearchScenario, [])).toBeUndefined();
    });
  });
});
