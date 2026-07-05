/*
 * Copyright (c) 2026 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import '@fgv/ts-utils-jest';
import { Logging, type Result, fail, succeed } from '@fgv/ts-utils';
import { AiAssist } from '@fgv/ts-extras';

import {
  type CanaryTier,
  type ITierCanaryDeps,
  classifyLiveFailure,
  formatTierCanaryReport,
  resolveTierResolutions,
  runTierCanary
} from '../../../scenarios/modelTiers/canary';
import {
  anthropicModelTiersScenario,
  geminiModelTiersScenario,
  openaiModelTiersScenario
} from '../../../scenarios/modelTiers';
import type { IScenario, IScenarioContext } from '../../../shell';

const openai = AiAssist.getProviderDescriptor('openai').orThrow();
const anthropic = AiAssist.getProviderDescriptor('anthropic').orThrow();
const gemini = AiAssist.getProviderDescriptor('google-gemini').orThrow();

/** A completion result with visible text — the live-pass shape. */
function pong(): Result<AiAssist.IAiCompletionResponse> {
  return succeed({ content: 'pong', truncated: false });
}

// ---------------------------------------------------------------------------
// resolveTierResolutions
// ---------------------------------------------------------------------------

describe('resolveTierResolutions', () => {
  test('resolves all three OpenAI tiers to their concrete ids (no cascade — all keys present)', () => {
    expect(resolveTierResolutions(openai, ['base', 'advanced', 'frontier'])).toSucceedAndSatisfy(
      (resolutions) => {
        expect(resolutions).toEqual([
          { tier: 'base', alias: '@openai:mini', concrete: 'gpt-5.4-mini', cascaded: false },
          { tier: 'advanced', alias: '@openai:flagship', concrete: 'gpt-5.5', cascaded: false },
          { tier: 'frontier', alias: '@openai:pro', concrete: 'gpt-5.5-pro', cascaded: false }
        ]);
      }
    );
  });

  test('marks a frontier request as cascaded when the descriptor omits a frontier key (Anthropic)', () => {
    expect(resolveTierResolutions(anthropic, ['advanced', 'frontier'])).toSucceedAndSatisfy((resolutions) => {
      expect(resolutions).toEqual([
        { tier: 'advanced', alias: '@anthropic:opus', concrete: 'claude-opus-4-8', cascaded: false },
        // frontier has no key → resolves to the advanced (opus) alias, flagged cascaded.
        { tier: 'frontier', alias: '@anthropic:opus', concrete: 'claude-opus-4-8', cascaded: true }
      ]);
    });
  });

  test('marks a Gemini frontier request as cascaded to pro', () => {
    expect(resolveTierResolutions(gemini, ['base', 'advanced', 'frontier'])).toSucceedAndSatisfy(
      (resolutions) => {
        expect(resolutions[0]).toEqual({
          tier: 'base',
          alias: '@google-gemini:flash',
          concrete: 'gemini-3.5-flash',
          cascaded: false
        });
        expect(resolutions[1]).toEqual({
          tier: 'advanced',
          alias: '@google-gemini:pro',
          concrete: 'gemini-3.1-pro-preview',
          cascaded: false
        });
        expect(resolutions[2]).toEqual({
          tier: 'frontier',
          alias: '@google-gemini:pro',
          concrete: 'gemini-3.1-pro-preview',
          cascaded: true
        });
      }
    );
  });

  test('fails when a tier resolves to an unregistered alias (resolver bug, offline-detectable)', () => {
    const broken: AiAssist.IAiProviderDescriptor = {
      ...openai,
      defaultModel: { base: '@openai:does-not-exist' }
    };
    expect(resolveTierResolutions(broken, ['base'])).toFailWith(/tier 'base': resolver failed/i);
  });
});

// ---------------------------------------------------------------------------
// classifyLiveFailure
// ---------------------------------------------------------------------------

describe('classifyLiveFailure', () => {
  test('classifies auth/verification failures as access-gated (resolver correct, key lacks access)', () => {
    expect(classifyLiveFailure('AI API returned 403: forbidden')).toBe('access-gated');
    expect(classifyLiveFailure('AI API returned 401: unauthorized')).toBe('access-gated');
    expect(classifyLiveFailure('your organization must be verified to use gpt-image-1.5')).toBe(
      'access-gated'
    );
  });

  test('classifies 404 / unknown-model failures as id-wrong (stale alias value)', () => {
    expect(classifyLiveFailure('AI API returned 404: not found')).toBe('id-wrong');
    expect(classifyLiveFailure('The model `claude-opus-9` does not exist')).toBe('id-wrong');
    expect(classifyLiveFailure('unknown model: gpt-9')).toBe('id-wrong');
  });

  test('classifies any other failure (or a statusless message) as error', () => {
    expect(classifyLiveFailure('AI API returned 500: server error')).toBe('error');
    expect(classifyLiveFailure('network boom')).toBe('error');
  });
});

// ---------------------------------------------------------------------------
// runTierCanary — offline (no live completion)
// ---------------------------------------------------------------------------

describe('runTierCanary (offline — STOP-FLAG)', () => {
  test('logs each alias -> concrete hop and reports resolver-verified + live-pending', async () => {
    const logger = new Logging.InMemoryLogger();
    const result = await runTierCanary(
      { providerId: 'anthropic', descriptor: anthropic, tiers: ['base', 'advanced', 'frontier'] },
      {},
      logger
    );
    expect(result).toSucceedAndSatisfy((report: string) => {
      expect(report).toMatch(/=== anthropic model-tier canary ===/);
      expect(report).toMatch(/\[PASS\] base\s+@anthropic:sonnet -> claude-sonnet-5/);
      expect(report).toMatch(
        /\[PASS\] frontier\s+@anthropic:opus -> claude-opus-4-8 \(cascaded from a lower tier\)/
      );
      expect(report).toMatch(/\[PENDING\] base/);
      expect(report).toMatch(/RESOLVER-VERIFIED; LIVE CANARY PENDING \(STOP-FLAG/);
    });
    // The alias -> concrete log lines match the shipped maintenance-loop format.
    expect(logger.logged).toContain("resolved @anthropic:sonnet -> claude-sonnet-5 (tier 'base')");
    expect(logger.logged).toContain(
      "resolved @anthropic:opus -> claude-opus-4-8 (tier 'frontier' request cascaded)"
    );
  });

  test('resolves and logs the OpenAI image tier alongside the completion tiers', async () => {
    const logger = new Logging.InMemoryLogger();
    const result = await runTierCanary(
      { providerId: 'openai', descriptor: openai, tiers: ['base'], imageTier: true },
      {},
      logger
    );
    expect(result).toSucceedAndSatisfy((report: string) => {
      expect(report).toMatch(/\[PASS\] image\s+@openai:image -> gpt-image-1\.5/);
    });
    expect(logger.logged).toContain('resolved @openai:image -> gpt-image-1.5 (image)');
  });

  test('fails when a resolver bug is present (prefixed with the provider id)', async () => {
    const broken: AiAssist.IAiProviderDescriptor = {
      ...openai,
      defaultModel: { base: '@openai:nope' }
    };
    const result = await runTierCanary(
      { providerId: 'openai', descriptor: broken, tiers: ['base'] },
      {},
      new Logging.InMemoryLogger()
    );
    expect(result).toFailWith(/openai tier canary: tier 'base': resolver failed/i);
  });

  test('fails when the image-tier alias is unregistered', async () => {
    const broken: AiAssist.IAiProviderDescriptor = {
      ...openai,
      defaultModel: { base: '@openai:mini', image: '@openai:bad-image' }
    };
    const result = await runTierCanary(
      { providerId: 'openai', descriptor: broken, tiers: ['base'], imageTier: true },
      {},
      new Logging.InMemoryLogger()
    );
    expect(result).toFailWith(/openai tier canary: image tier resolver failed/i);
  });
});

// ---------------------------------------------------------------------------
// runTierCanary — live (injected completion)
// ---------------------------------------------------------------------------

describe('runTierCanary (live — injected completion)', () => {
  test('all tiers answer → LIVE-VERIFIED', async () => {
    const deps: ITierCanaryDeps = { complete: async () => pong() };
    const result = await runTierCanary(
      { providerId: 'openai', descriptor: openai, tiers: ['base', 'advanced', 'frontier'] },
      deps,
      new Logging.InMemoryLogger()
    );
    expect(result).toSucceedAndSatisfy((report: string) => {
      expect(report).toMatch(/LIVE-VERIFIED/);
      expect(report).toMatch(/\[PASS\] base\s+gpt-5\.4-mini/);
      expect(report).toMatch(/\[PASS\] frontier\s+gpt-5\.5-pro/);
    });
  });

  test('an access-gated tier is BLOCKED, not a failure (resolver correct, key lacks access)', async () => {
    const deps: ITierCanaryDeps = {
      complete: async (tier: CanaryTier) =>
        tier === 'frontier' ? fail('AI API returned 403: org not verified') : pong()
    };
    const result = await runTierCanary(
      { providerId: 'openai', descriptor: openai, tiers: ['base', 'advanced', 'frontier'] },
      deps,
      new Logging.InMemoryLogger()
    );
    expect(result).toSucceedAndSatisfy((report: string) => {
      expect(report).toMatch(/LIVE PARTIAL/);
      expect(report).toMatch(/\[BLOCKED\] frontier\s+gpt-5\.5-pro\s+\(AI API returned 403/);
    });
  });

  test('a 404 on a tier is a real failure (id-wrong — stale alias value)', async () => {
    const deps: ITierCanaryDeps = {
      complete: async (tier: CanaryTier) =>
        tier === 'advanced' ? fail('AI API returned 404: no such model') : pong()
    };
    const result = await runTierCanary(
      { providerId: 'anthropic', descriptor: anthropic, tiers: ['base', 'advanced'] },
      deps,
      new Logging.InMemoryLogger()
    );
    expect(result).toFailWith(/FAILED — resolver bug or stale id/);
    expect(result).toFailWith(/\[FAIL\(id\)\] advanced/);
  });

  test('an HTTP-200-but-empty-body response is an error failure', async () => {
    const deps: ITierCanaryDeps = {
      complete: async () => succeed({ content: '   ', truncated: false })
    };
    const result = await runTierCanary(
      { providerId: 'gemini', descriptor: gemini, tiers: ['base'] },
      deps,
      new Logging.InMemoryLogger()
    );
    expect(result).toFailWith(/\[FAIL\] base\s+gemini-3\.5-flash\s+\(HTTP 200 but empty body\)/);
  });

  test('a generic live failure is an error failure', async () => {
    const deps: ITierCanaryDeps = { complete: async () => fail('network boom') };
    const result = await runTierCanary(
      { providerId: 'gemini', descriptor: gemini, tiers: ['base'] },
      deps,
      new Logging.InMemoryLogger()
    );
    expect(result).toFailWith(/FAILED/);
    expect(result).toFailWith(/\[FAIL\] base/);
  });
});

// ---------------------------------------------------------------------------
// formatTierCanaryReport — direct verdict coverage
// ---------------------------------------------------------------------------

describe('formatTierCanaryReport', () => {
  const resolution = { tier: 'base' as CanaryTier, alias: '@x:a', concrete: 'a', cascaded: false };

  test('renders the LIVE-VERIFIED verdict when every tier passed', () => {
    const report = formatTierCanaryReport({ providerId: 'x', descriptor: openai, tiers: ['base'] }, [
      { resolution, outcome: 'live-pass' }
    ]);
    expect(report).toMatch(/Verdict: LIVE-VERIFIED/);
  });
});

// ---------------------------------------------------------------------------
// Scenario metadata + keyless cli.run (STOP-FLAG)
// ---------------------------------------------------------------------------

describe('model-tier scenarios', () => {
  const scenariosById: ReadonlyArray<[string, IScenario]> = [
    ['openai-model-tiers', openaiModelTiersScenario],
    ['anthropic-model-tiers', anthropicModelTiersScenario],
    ['google-gemini-model-tiers', geminiModelTiersScenario]
  ];

  test.each(scenariosById)('%s is a CLI-only ai scenario', (id, scenario) => {
    expect(scenario.id).toBe(id);
    expect(scenario.category).toBe('ai');
    expect(scenario.tags).toContain('model-tiers');
    expect(scenario.cli).toBeDefined();
    expect(scenario.web).toBeUndefined();
  });

  test('cli.run without an API key returns the STOP-FLAG resolver-only proof', async () => {
    const saved = {
      openai: process.env.OPENAI_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY,
      gemini: process.env.GEMINI_API_KEY,
      google: process.env.GOOGLE_API_KEY
    };
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_API_KEY;
    try {
      const context = {
        logger: new Logging.LogReporter<unknown>({ logger: new Logging.InMemoryLogger() })
      } as unknown as IScenarioContext;
      if (!geminiModelTiersScenario.cli) {
        throw new Error('expected a CLI implementation');
      }
      const result = await geminiModelTiersScenario.cli.run(context);
      expect(result).toSucceedAndSatisfy((report: string) => {
        expect(report).toMatch(/=== google-gemini model-tier canary ===/);
        expect(report).toMatch(
          /@google-gemini:pro -> gemini-3\.1-pro-preview \(cascaded from a lower tier\)/
        );
        expect(report).toMatch(/RESOLVER-VERIFIED; LIVE CANARY PENDING \(STOP-FLAG/);
      });
    } finally {
      if (saved.openai !== undefined) process.env.OPENAI_API_KEY = saved.openai;
      if (saved.anthropic !== undefined) process.env.ANTHROPIC_API_KEY = saved.anthropic;
      if (saved.gemini !== undefined) process.env.GEMINI_API_KEY = saved.gemini;
      if (saved.google !== undefined) process.env.GOOGLE_API_KEY = saved.google;
    }
  });
});
