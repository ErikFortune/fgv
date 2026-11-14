// Copyright (c) 2026 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/**
 * Scenario descriptor for the xAI prompt-cache wire probe. The probe itself, and the reasoning
 * behind its differential design, live in `./probe`.
 *
 * @packageDocumentation
 */

import { succeed } from '@fgv/ts-utils';
import type { Result } from '@fgv/ts-utils';
import { AiAssist, SaferFetch } from '@fgv/ts-extras';
import type { JsonObject, JsonValue } from '@fgv/ts-json-base';

import type { IScenario, ICliScenarioImpl } from '../../shell';
import { runXaiCacheProbe } from './probe';
import type { IXaiCacheProbeDeps } from './probe';

export { runXaiCacheProbe, formatXaiCacheProbeReport } from './probe';
export type { IXaiCacheProbeDeps, IRouteResult, IUsageDelta } from './probe';

/**
 * Posts one JSON body and returns the parsed response. Uses the repo's own `saferFetchJson`
 * rather than bare `fetch` per the testbed's first tenet; `allowAnyAddress` is correct here
 * because the address is the registry's own provider `baseUrl`, not caller-supplied input,
 * and blocking private networks would only matter for a URL we did not choose.
 *
 * @remarks
 * This module is the live-wiring seam and is excluded from coverage by
 * `config/jest.config.json`'s `coveragePathIgnorePatterns`, exactly as
 * `sqliteVecMemoryPersistence/index.js` and `saferFetchGuard/index.js` are. Every behaviour
 * that *reads* this function's result — route probing, usage diffing, cache-read detection,
 * report rendering — lives in `./probe` and is covered to 100% through the injected dep.
 */
async function postJsonLive(url: string, apiKey: string, body: JsonObject): Promise<Result<JsonValue>> {
  const response = await SaferFetch.saferFetchJson(url, {
    addressGuard: SaferFetch.allowAnyAddress(),
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  return response.asResult.onSuccess((r) => succeed(r.value));
}

/**
 * Live dependencies.
 * @public
 */
export const DEFAULT_XAI_CACHE_PROBE_DEPS: IXaiCacheProbeDeps = {
  postJson: postJsonLive,
  // Every provider's shortest documented cache TTL is minutes, so a short pause is ample and
  // keeps the probe quick. It is not zero on purpose: two calls issued back-to-back can race
  // the provider's own cache write, which would read as "this provider does not cache".
  delayMs: 1500
};

/**
 * Scenario descriptor.
 * @public
 */
export const xaiCacheProbeScenario: IScenario = {
  id: 'xai-cache-probe',
  title: 'xAI prompt-cache wire probe',
  description:
    "Sends one byte-identical request twice on each of xAI's two OpenAI-compatible routes and " +
    'diffs the usage blocks, to discover what xAI calls cached tokens without guessing the name. ' +
    'Settles OQ-1 of the ai-assist-prompt-caching design.',
  category: 'ai',
  tags: ['ai-assist', 'prompt-caching', 'xai', 'wire-probe'],
  requiredSecrets: [
    {
      id: AiAssist.providerApiKeySecretName('xai-grok'),
      envVarName: 'XAI_API_KEY',
      description: 'xAI API key for the prompt-cache wire probe'
    }
  ],
  cli: {
    // CLI-only: `webRunnable` would require this module graph to be browser-clean, and the
    // live poster above uses the Node-flavored `safer-fetch`. The browser sibling lives in
    // `@fgv/ts-web-extras`; wiring it is not worth it for a one-shot wire probe.
    run: (context) => runXaiCacheProbe(context, DEFAULT_XAI_CACHE_PROBE_DEPS)
  } satisfies ICliScenarioImpl
};
