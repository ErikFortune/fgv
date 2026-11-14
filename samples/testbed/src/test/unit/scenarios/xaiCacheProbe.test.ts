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

import '@fgv/ts-utils-jest';
import { Logging, fail, succeed } from '@fgv/ts-utils';
import type { Result } from '@fgv/ts-utils';
import type { JsonObject, JsonValue } from '@fgv/ts-json-base';

import {
  DEFAULT_XAI_CACHE_PROBE_DEPS,
  formatXaiCacheProbeReport,
  runXaiCacheProbe,
  xaiCacheProbeScenario
} from '../../../scenarios/xaiCacheProbe';
import type { IXaiCacheProbeDeps } from '../../../scenarios/xaiCacheProbe';
import type { IScenarioContext } from '../../../shell';

/**
 * A context whose `resolveSecret` succeeds, so the probe reaches the network seam. The probe
 * reads nothing else off the context but the logger.
 */
let lastLogger: Logging.InMemoryLogger;

function testContext(secret: Result<string> = succeed('test-key')): IScenarioContext {
  lastLogger = new Logging.InMemoryLogger();
  return {
    logger: new Logging.LogReporter({ logger: lastLogger }),
    keyStore: undefined,
    resolveSecret: async () => secret,
    dataTree: undefined as unknown as IScenarioContext['dataTree']
  };
}

/**
 * The report emitted by the last run. `run` returns a one-line summary per the
 * ICliScenarioImpl contract; the report itself goes to the logger, so that is where an
 * assertion about its content belongs.
 */
function emittedReport(): string {
  return lastLogger.logged.join('\n');
}

/** Runs assertions against the report the last run emitted. */
function withReport(assertions: (report: string) => void): void {
  assertions(emittedReport());
}

/**
 * Usage block in the OpenAI-compatible shape, with a nested cached-token field. Built through
 * computed keys for the same reason the probe does it — the wire is snake_case and the lint
 * profile rejects snake_case object-literal property names.
 */
const WIRE_DETAILS: string = 'prompt_tokens_details';
const WIRE_CACHED: string = 'cached_tokens';
const WIRE_PROMPT: string = 'prompt_tokens';
const WIRE_COMPLETION: string = 'completion_tokens';

function usageWithCached(cached: number): JsonObject {
  return {
    [WIRE_PROMPT]: 5000,
    [WIRE_COMPLETION]: 1,
    [WIRE_DETAILS]: { [WIRE_CACHED]: cached }
  } as unknown as JsonObject;
}

/** Deps whose `postJson` returns the supplied responses in order, and never pauses. */
function depsReturning(responses: ReadonlyArray<Result<JsonValue>>): {
  deps: IXaiCacheProbeDeps;
  calls: string[];
} {
  const calls: string[] = [];
  let i = 0;
  return {
    calls,
    deps: {
      delayMs: 0,
      postJson: async (url: string) => {
        calls.push(url);
        const next = responses[Math.min(i, responses.length - 1)];
        i++;
        return next;
      }
    }
  };
}

describe('xaiCacheProbe', () => {
  describe('scenario descriptor', () => {
    test('is CLI-only and requires the xAI key', () => {
      expect(xaiCacheProbeScenario.id).toBe('xai-cache-probe');
      expect(xaiCacheProbeScenario.cli?.webRunnable).toBeUndefined();
      expect(xaiCacheProbeScenario.requiredSecrets?.[0]?.envVarName).toBe('XAI_API_KEY');
    });

    test('default deps use the live poster and a non-zero pause', () => {
      // The pause is load-bearing against the real API: two calls issued with no gap can race
      // the provider's own cache write, which would read as "no caching".
      expect(DEFAULT_XAI_CACHE_PROBE_DEPS.delayMs).toBeGreaterThan(0);
      expect(typeof DEFAULT_XAI_CACHE_PROBE_DEPS.postJson).toBe('function');
    });

    test('the scenario`s run closure delegates to the probe', async () => {
      // Drives the descriptor's own arrow, which is otherwise uncovered. No key resolves here,
      // so it fails — the point is that it reached the probe rather than what it returned.
      const context = testContext(fail('no key configured'));
      await expect(xaiCacheProbeScenario.cli!.run(context)).resolves.toFailWith(
        /xai-grok API key unavailable/i
      );
    });
  });

  describe('runXaiCacheProbe', () => {
    test('fails with a clear diagnostic when the key is unavailable', async () => {
      const { deps } = depsReturning([succeed({})]);
      await expect(runXaiCacheProbe(testContext(fail('locked')), deps)).resolves.toFailWith(
        /xai-grok API key unavailable: locked/i
      );
    });

    test('probes both routes and names the cached-token field when the warm call reports one', async () => {
      // Cold: nothing cached. Warm: the nested field goes positive. That 0 -> positive step is
      // the entire signal the probe is built to detect, and it must survive being nested.
      const { deps, calls } = depsReturning([
        succeed({ usage: usageWithCached(0) } as unknown as JsonValue),
        succeed({ usage: usageWithCached(4096) } as unknown as JsonValue)
      ]);
      const result = await runXaiCacheProbe(testContext(), deps);

      expect(result).toSucceed();

      withReport((report: string) => {
        expect(report).toMatch(/CACHED-TOKEN FIELD: prompt_tokens_details\.cached_tokens/);
        expect(report).toMatch(/<== CACHE READ/);
      });
      // Both routes, two calls each, against the registry's own base URL.
      expect(calls).toHaveLength(4);
      expect(calls[0]).toMatch(/\/chat\/completions$/);
      expect(calls[2]).toMatch(/\/responses$/);
      expect(calls.every((c) => c.startsWith('https://api.x.ai/v1'))).toBe(true);
    });

    test('reports a route as unreachable rather than failing the run', async () => {
      // A 404 on /responses is the answer to half of OQ-1, not an error — the run must still
      // produce its report.
      const { deps } = depsReturning([fail('HTTP 404 Not Found')]);
      const result = await runXaiCacheProbe(testContext(), deps);
      expect(result).toSucceed();
      withReport((report: string) => {
        expect(report).toMatch(/UNREACHABLE: HTTP 404 Not Found/);
      });
    });

    test('records the cold usage when only the warm call fails', async () => {
      const { deps } = depsReturning([
        succeed({ usage: usageWithCached(0) } as unknown as JsonValue),
        fail('HTTP 429 rate limited')
      ]);
      const result = await runXaiCacheProbe(testContext(), deps);
      expect(result).toSucceed();
      withReport((report: string) => {
        expect(report).toMatch(/warm call failed: HTTP 429 rate limited/);
      });
    });

    test('names a cached field that is identical on both calls — the 4416/4416 regression', async () => {
      // The live 2026-09-15 run reported input_tokens_details.cached_tokens as 4416 on BOTH
      // calls. Identical values are not a delta, so the field vanished from the report
      // entirely and the run looked like it had found nothing. A warm cache is the normal
      // case against a live API; the probe must name the field anyway.
      const same = succeed({ usage: usageWithCached(4416) } as unknown as JsonValue);
      const { deps } = depsReturning([same, same]);
      const result = await runXaiCacheProbe(testContext(), deps);
      expect(result).toSucceed();
      withReport((report: string) => {
        expect(report).toMatch(
          /CACHED-TOKEN FIELD: prompt_tokens_details\.cached_tokens \(cold=4416 warm=4416\)/
        );
        expect(report).toMatch(/NOT by itself evidence of no caching/);
      });
    });

    test('names a cached field that moves between two non-zero values — the 128→192 regression', async () => {
      // The same run moved prompt_tokens_details.cached_tokens 128 -> 192. Real cache
      // accounting, but non-zero cold, so the original 0->positive rule did not flag it.
      const { deps } = depsReturning([
        succeed({ usage: usageWithCached(128) } as unknown as JsonValue),
        succeed({ usage: usageWithCached(192) } as unknown as JsonValue)
      ]);
      const result = await runXaiCacheProbe(testContext(), deps);
      expect(result).toSucceed();
      withReport((report: string) => {
        expect(report).toMatch(
          /CACHED-TOKEN FIELD: prompt_tokens_details\.cached_tokens \(cold=128 warm=192\)/
        );
      });
    });

    test('distinguishes "field exists, nothing cached" from "no such field"', async () => {
      const zero = succeed({ usage: usageWithCached(0) } as unknown as JsonValue);
      const { deps } = depsReturning([zero, zero]);
      const result = await runXaiCacheProbe(testContext(), deps);
      expect(result).toSucceed();
      withReport((report: string) => {
        expect(report).toMatch(/CACHED-TOKEN FIELD: prompt_tokens_details\.cached_tokens \(cold=0 warm=0\)/);
        expect(report).toMatch(/the field exists but nothing cached/);
      });
    });

    test('handles a response carrying no usage block at all', async () => {
      const { deps } = depsReturning([succeed({ id: 'x' } as unknown as JsonValue)]);
      const result = await runXaiCacheProbe(testContext(), deps);
      expect(result).toSucceed();
      withReport((report: string) => {
        expect(report).toMatch(/usage block absent or carried no numeric fields/);
      });
    });

    test('ignores non-object and array responses without throwing', async () => {
      // `usageOf` has to survive a provider returning a bare scalar or a list; a throw here
      // would lose the other route's result too.
      const { deps } = depsReturning([succeed('not an object' as unknown as JsonValue)]);
      await expect(runXaiCacheProbe(testContext(), deps)).resolves.toSucceed();

      const { deps: arrayDeps } = depsReturning([succeed([1, 2] as unknown as JsonValue)]);
      await expect(runXaiCacheProbe(testContext(), arrayDeps)).resolves.toSucceed();
    });

    test('reports a field that moved without looking like a cache read, unflagged', async () => {
      // Output tokens wobble between calls. That is noise, and it must be shown but NOT
      // flagged — a probe that flags every delta would name the wrong field.
      const { deps } = depsReturning([
        succeed({ usage: { [WIRE_COMPLETION]: 1 } } as unknown as JsonValue),
        succeed({ usage: { [WIRE_COMPLETION]: 7 } } as unknown as JsonValue)
      ]);
      const result = await runXaiCacheProbe(testContext(), deps);
      expect(result).toSucceed();
      withReport((report: string) => {
        expect(report).toMatch(/completion_tokens: cold=1 warm=7/);
        expect(report).not.toMatch(/CACHED-TOKEN FIELD/);
      });
    });
  });

  describe('provider generalization', () => {
    test('the probe is provider-agnostic, and an unknown provider fails at the registry lookup', async () => {
      // The differential probe works for any OpenAI-compatible provider; OQ-1 only needs xAI.
      // An id the registry does not carry exercises the one registry-lookup failure path.
      const { deps } = depsReturning([succeed({})]);
      const unknown = 'not-a-provider' as unknown as Parameters<typeof runXaiCacheProbe>[2];
      await expect(runXaiCacheProbe(testContext(), deps, unknown)).resolves.toFailWith(
        /not-a-provider registry lookup/i
      );
    });
  });

  describe('formatXaiCacheProbeReport', () => {
    test('renders an absent value as a dash rather than undefined', () => {
      const report = formatXaiCacheProbeReport('grok-test', [
        {
          label: 'Route',
          usageKeys: ['a'],
          deltas: [{ path: 'a', cold: undefined, warm: 9 }],
          cachedFields: [{ path: 'a', cold: undefined, warm: 9 }],
          cacheReadFields: ['a'],
          rawCold: null,
          rawWarm: null
        }
      ]);
      expect(report).toMatch(/a: cold=- warm=9 {2}<== CACHE READ/);
      expect(report).toMatch(/model: grok-test/);
      expect(report).not.toMatch(/undefined/);
    });

    test('a field that vanishes on the warm call is shown but not flagged as a cache read', () => {
      // The mirror of the case above: present cold, absent warm. A provider dropping a field
      // between calls is not a cache read, and flagging it would name the wrong field in the
      // one line of this report a reader acts on.
      const report = formatXaiCacheProbeReport('grok-test', [
        {
          label: 'Route',
          usageKeys: ['b'],
          deltas: [{ path: 'b', cold: 7, warm: undefined }],
          cachedFields: [
            { path: 'c_cached', cold: 0, warm: undefined },
            { path: 'b_cached', cold: 7, warm: undefined }
          ],
          cacheReadFields: [],
          rawCold: null,
          rawWarm: null
        }
      ]);
      expect(report).toMatch(/b: cold=7 warm=-/);
      expect(report).not.toMatch(/<== CACHE READ/);
      expect(report).toMatch(/CACHED-TOKEN FIELD: b_cached \(cold=7 warm=-\)/);
      expect(report).toMatch(/CACHED-TOKEN FIELD: c_cached \(cold=0 warm=-\)/);
      // Not every field is zero, so the "nothing cached" line must stay off.
      expect(report).not.toMatch(/nothing cached/);
    });
  });
});
