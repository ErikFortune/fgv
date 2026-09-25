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
  type ICanaryCompleteOptions,
  type ITierCanaryDeps,
  classifyLiveFailure,
  classifyThinkingFailure,
  formatTierCanaryReport,
  resolveTierResolutions,
  runTierCanary
} from '../../../scenarios/modelTiers/canary';
import {
  anthropicModelTiersScenario,
  geminiModelTiersScenario,
  openaiModelTiersScenario,
  resolveTierApiKey,
  xaiModelTiersScenario
} from '../../../scenarios/modelTiers';
import type { ISecretSpec, IScenario, IScenarioContext } from '../../../shell';

const openai = AiAssist.getProviderDescriptor('openai').shouldNotFail('openai descriptor');
const anthropic = AiAssist.getProviderDescriptor('anthropic').shouldNotFail('anthropic descriptor');
const gemini = AiAssist.getProviderDescriptor('google-gemini').shouldNotFail('google-gemini descriptor');
const xai = AiAssist.getProviderDescriptor('xai-grok').shouldNotFail('xai-grok descriptor');

/** A completion result with visible text — the live-pass shape. */
function pong(): Result<AiAssist.IAiCompletionResponse> {
  return succeed({ content: 'pong', truncated: false, structuredOutput: 'none' });
}

/**
 * Builds a fully-shaped `IScenarioContext` (no `as unknown as` cast — the compiler enforces
 * the interface) with an injectable `resolveSecret`; the default fails every spec, which is
 * the keyless STOP-FLAG shape. `dataTree` is stubbed narrowly: the tier scenarios never read
 * it. Mirrors the `makeContext` helper in `crossProviderEmbeddingSearch.test.ts`.
 */
function makeContext(
  resolveSecret: IScenarioContext['resolveSecret'] = jest.fn(async (spec: ISecretSpec) =>
    fail<string>(`${spec.id} not set`)
  )
): IScenarioContext {
  return {
    logger: new Logging.LogReporter<unknown>({ logger: new Logging.InMemoryLogger() }),
    keyStore: undefined,
    resolveSecret,
    dataTree: {} as IScenarioContext['dataTree']
  };
}

// ---------------------------------------------------------------------------
// resolveTierResolutions
// ---------------------------------------------------------------------------

describe('resolveTierResolutions', () => {
  test('resolves OpenAI base/advanced/frontier directly (frontier → gpt-6-astra, no cascade)', () => {
    // The gpt-6 family works on chat completions, so the frontier tier no longer needs the
    // Responses-only routing its predecessor gpt-5.5-pro required: a frontier request resolves
    // @openai:pro → gpt-6-astra directly.
    expect(resolveTierResolutions(openai, ['base', 'advanced', 'frontier'])).toSucceedAndSatisfy(
      (resolutions) => {
        expect(resolutions).toEqual([
          { tier: 'base', alias: '@openai:mini', concrete: 'gpt-6-luna', cascaded: false },
          { tier: 'advanced', alias: '@openai:flagship', concrete: 'gpt-6-sol', cascaded: false },
          { tier: 'frontier', alias: '@openai:pro', concrete: 'gpt-6-astra', cascaded: false }
        ]);
      }
    );
  });

  test('marks a frontier request as cascaded when the descriptor omits a frontier key (Anthropic)', () => {
    expect(resolveTierResolutions(anthropic, ['advanced', 'frontier'])).toSucceedAndSatisfy((resolutions) => {
      expect(resolutions).toEqual([
        { tier: 'advanced', alias: '@anthropic:opus', concrete: 'claude-opus-5', cascaded: false },
        // frontier has no key → resolves to the advanced (opus) alias, flagged cascaded.
        { tier: 'frontier', alias: '@anthropic:opus', concrete: 'claude-opus-5', cascaded: true }
      ]);
    });
  });

  test('marks a Gemini frontier request as cascaded to pro', () => {
    expect(resolveTierResolutions(gemini, ['base', 'advanced', 'frontier'])).toSucceedAndSatisfy(
      (resolutions) => {
        expect(resolutions[0]).toEqual({
          tier: 'base',
          alias: '@google-gemini:flash',
          concrete: 'gemini-3.8-flash',
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

  test('resolves xAI base/advanced directly and marks a frontier request as cascaded to flagship', () => {
    expect(resolveTierResolutions(xai, ['base', 'advanced', 'frontier'])).toSucceedAndSatisfy(
      (resolutions) => {
        expect(resolutions).toEqual([
          { tier: 'base', alias: '@xai-grok:standard', concrete: 'grok-4.3', cascaded: false },
          { tier: 'advanced', alias: '@xai-grok:flagship', concrete: 'grok-4.7', cascaded: false },
          // frontier has no key → resolves to the advanced (flagship) alias, flagged cascaded.
          { tier: 'frontier', alias: '@xai-grok:flagship', concrete: 'grok-4.7', cascaded: true }
        ]);
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

  test('does NOT green-wash a TLS/certificate verification failure as access-gated', () => {
    // A cert/network "verification" error carries no access meaning and no 401/403 — the tightened
    // gate must classify it as `error`, not `access-gated` (which would hide a real transport
    // failure behind a BLOCKED line). Guards against a bare /verif/i match.
    expect(
      classifyLiveFailure(
        'AI API request failed: certificate verification failed (unable to get local issuer certificate)'
      )
    ).toBe('error');
    expect(classifyLiveFailure('TLS handshake error: self-signed certificate verification error')).toBe(
      'error'
    );
  });

  test('classifies a non-chat-completions id as wrong-endpoint (checked before the 404 branch)', () => {
    // OpenAI gpt-5.5-pro returns a 404 whose message says it is not a chat model — must NOT be
    // conflated with a stale id.
    expect(
      classifyLiveFailure(
        'AI API returned 404: {"error":{"message":"This is not a chat model and thus not supported ' +
          'in the v1/chat/completions endpoint. Did you mean to use v1/completions?"}}'
      )
    ).toBe('wrong-endpoint');
  });

  test('classifies a rejected request parameter as param-rejected (completion-path, not resolver)', () => {
    // Anthropic Claude-5: temperature is deprecated (any value rejected).
    expect(classifyLiveFailure('AI API returned 400: `temperature` is deprecated for this model.')).toBe(
      'param-rejected'
    );
    // OpenAI GPT-5.5: temperature only supports the default (1).
    expect(
      classifyLiveFailure(
        "AI API returned 400: Unsupported value: 'temperature' does not support 0.7 with this model."
      )
    ).toBe('param-rejected');
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
        /\[PASS\] frontier\s+@anthropic:opus -> claude-opus-5 \(cascaded from a lower tier\)/
      );
      expect(report).toMatch(/\[PENDING\] base/);
      expect(report).toMatch(/RESOLVER-VERIFIED; LIVE CANARY PENDING \(STOP-FLAG/);
    });
    // The alias -> concrete log lines match the shipped maintenance-loop format.
    expect(logger.logged).toContain("resolved @anthropic:sonnet -> claude-sonnet-5 (tier 'base')");
    expect(logger.logged).toContain(
      "resolved @anthropic:opus -> claude-opus-5 (tier 'frontier' request cascaded)"
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
      expect(report).toMatch(/\[PASS\] image\s+@openai:image -> gpt-image-2\.5-sunburst/);
    });
    expect(logger.logged).toContain('resolved @openai:image -> gpt-image-2.5-sunburst (image)');
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
      expect(report).toMatch(/\[PASS\] base\s+gpt-6-luna/);
      // frontier resolves to gpt-6-astra (direct frontier key; chat-completions-callable).
      expect(report).toMatch(/\[PASS\] frontier\s+gpt-6-astra/);
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
      expect(report).toMatch(/LIVE BLOCKED/);
      expect(report).toMatch(/\[BLOCKED\(access\)\] frontier\s+gpt-6-astra\s+\(AI API returned 403/);
    });
  });

  test('a rejected request parameter is BLOCKED(param), not a resolver failure (temperature)', async () => {
    // Mirrors the observed live Anthropic result: every tier 400s on the deprecated `temperature`
    // param. Resolver + ids are correct, so the run does NOT fail — it reports LIVE BLOCKED.
    const deps: ITierCanaryDeps = {
      complete: async () => fail('AI API returned 400: `temperature` is deprecated for this model.')
    };
    const result = await runTierCanary(
      { providerId: 'anthropic', descriptor: anthropic, tiers: ['base', 'advanced', 'frontier'] },
      deps,
      new Logging.InMemoryLogger()
    );
    expect(result).toSucceedAndSatisfy((report: string) => {
      expect(report).toMatch(/LIVE BLOCKED/);
      expect(report).toMatch(/\[BLOCKED\(param\)\] base\s+claude-sonnet-5\s+\(AI API returned 400/);
    });
  });

  test('a non-chat-completions id is a real failure tagged FAIL(endpoint) (not a stale id)', async () => {
    // Exercises the wrong-endpoint → FAILED verdict wiring (the classifier itself is unit-tested
    // above). The frontier tier now resolves to gpt-6-astra (chat-completions-callable in the
    // real client); this offline test drives the FAIL(endpoint) verdict wiring via an injected
    // wrong-endpoint failure, independent of the real routing.
    const deps: ITierCanaryDeps = {
      complete: async (tier: CanaryTier) =>
        tier === 'frontier'
          ? fail(
              'AI API returned 404: This is not a chat model and thus not supported in the ' +
                'v1/chat/completions endpoint.'
            )
          : pong()
    };
    const result = await runTierCanary(
      { providerId: 'openai', descriptor: openai, tiers: ['base', 'advanced', 'frontier'] },
      deps,
      new Logging.InMemoryLogger()
    );
    expect(result).toFailWith(/FAILED — a tier is not chat-completions-callable/);
    expect(result).toFailWith(/\[FAIL\(endpoint\)\] frontier\s+gpt-6-astra/);
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
    expect(result).toFailWith(/FAILED — a tier is not chat-completions-callable.*stale id/);
    expect(result).toFailWith(/\[FAIL\(id\)\] advanced/);
  });

  test('an HTTP-200-but-empty-body response is an error failure', async () => {
    const deps: ITierCanaryDeps = {
      complete: async () => succeed({ content: '   ', truncated: false, structuredOutput: 'none' })
    };
    const result = await runTierCanary(
      { providerId: 'google-gemini', descriptor: gemini, tiers: ['base'] },
      deps,
      new Logging.InMemoryLogger()
    );
    expect(result).toFailWith(/\[FAIL\] base\s+gemini-3\.8-flash\s+\(HTTP 200 but empty body\)/);
  });

  test('a generic live failure is an error failure', async () => {
    const deps: ITierCanaryDeps = { complete: async () => fail('network boom') };
    const result = await runTierCanary(
      { providerId: 'google-gemini', descriptor: gemini, tiers: ['base'] },
      deps,
      new Logging.InMemoryLogger()
    );
    expect(result).toFailWith(/FAILED/);
    expect(result).toFailWith(/\[FAIL\] base/);
  });
});

// ---------------------------------------------------------------------------
// Supplementary probes — thinking effort, model override, live image
// ---------------------------------------------------------------------------

function imageOk(base64: string = 'AAAA'): Result<AiAssist.IAiImageGenerationResponse> {
  return succeed({ images: [{ mimeType: 'image/png', base64 }] });
}

describe('classifyThinkingFailure', () => {
  test.each([
    ['AI API returned 400: Unsupported value: reasoning_effort "none"', 'param-failed'],
    ['AI API returned 400: `temperature` is deprecated for this model.', 'param-failed'],
    ['AI API returned 403: org not verified', 'access-gated'],
    ['AI API returned 404: no such model', 'id-wrong'],
    ['AI API returned 404: This is not a chat model', 'wrong-endpoint'],
    ['network boom', 'error']
  ])('%s → %s', (message, expected) => {
    expect(classifyThinkingFailure(message)).toBe(expected);
  });
});

describe('runTierCanary (thinking probes)', () => {
  const spec = {
    providerId: 'openai',
    descriptor: openai,
    tiers: ['base', 'frontier'] as ReadonlyArray<CanaryTier>,
    thinkingEfforts: ['none', 'low'] as const
  };

  test('fires one completion per (tier, effort) and passes when all answer', async () => {
    const complete = jest.fn(async () => pong());
    const result = await runTierCanary(spec, { complete }, new Logging.InMemoryLogger());
    expect(result).toSucceedAndSatisfy((report: string) => {
      expect(report).toMatch(/Thinking probes \(tier \+ effort\):/);
      expect(report).toMatch(/\[PASS\] base effort=none\s+gpt-6-luna/);
      expect(report).toMatch(/\[PASS\] frontier effort=low\s+gpt-6-astra/);
      expect(report).toMatch(/LIVE-VERIFIED/);
    });
    // 2 plain tier calls + 2 tiers × 2 efforts.
    expect(complete).toHaveBeenCalledTimes(6);
    expect(complete).toHaveBeenCalledWith('frontier', { effort: 'none' });
  });

  test('a rejected thinking effort fails the run as FAIL(param) while the plain tier still passes', async () => {
    const deps: ITierCanaryDeps = {
      complete: async (tier: CanaryTier, options?: ICanaryCompleteOptions) =>
        tier === 'frontier' && options?.effort === 'none'
          ? fail('AI API returned 400: Unsupported value: reasoning_effort "none"')
          : pong()
    };
    const result = await runTierCanary(spec, deps, new Logging.InMemoryLogger());
    expect(result).toFailWith(/\[PASS\] frontier\s+gpt-6-astra/);
    expect(result).toFailWith(/\[FAIL\(param\)\] frontier effort=none\s+gpt-6-astra\s+\(AI API returned 400/);
    expect(result).toFailWith(/FAILED — a thinking, strict-none, model-override or image probe failed/);
  });

  test('an access-gated thinking probe is BLOCKED, not a failure', async () => {
    const deps: ITierCanaryDeps = {
      complete: async (tier: CanaryTier, options?: ICanaryCompleteOptions) =>
        options?.effort === 'low' ? fail('AI API returned 403: org not verified') : pong()
    };
    const result = await runTierCanary(spec, deps, new Logging.InMemoryLogger());
    expect(result).toSucceedAndSatisfy((report: string) => {
      expect(report).toMatch(/\[BLOCKED\(access\)\] base effort=low/);
      expect(report).toMatch(/LIVE BLOCKED/);
    });
  });

  test('an empty-body thinking probe is an error failure', async () => {
    const deps: ITierCanaryDeps = {
      complete: async (tier: CanaryTier, options?: ICanaryCompleteOptions) =>
        options?.effort !== undefined
          ? succeed({ content: ' ', truncated: false, structuredOutput: 'none' })
          : pong()
    };
    const result = await runTierCanary(spec, deps, new Logging.InMemoryLogger());
    expect(result).toFailWith(/\[FAIL\] base effort=none\s+gpt-6-luna\s+\(HTTP 200 but empty body\)/);
  });

  test('keyless, every thinking probe is PENDING', async () => {
    const result = await runTierCanary(spec, {}, new Logging.InMemoryLogger());
    expect(result).toSucceedAndSatisfy((report: string) => {
      expect(report).toMatch(/\[PENDING\] frontier effort=none\s+gpt-6-astra/);
      expect(report).toMatch(/LIVE CANARY PENDING/);
    });
  });
});

describe('runTierCanary (strict-none probes)', () => {
  const REFUSAL =
    "thinking effort 'none' is not supported by gpt-6-astra: the model cannot run with thinking off";
  const PROVIDER_REJECTS_NONE =
    "AI API returned 400: 'reasoning_effort' does not support 'none' with this model";
  const spec = {
    providerId: 'openai',
    descriptor: openai,
    tiers: ['base', 'frontier'] as ReadonlyArray<CanaryTier>,
    strictNoneProbe: true
  };

  /** A provider stand-in: refuses 'fail' locally on the listed frontier, rejects a raw none there. */
  function answer(
    tier: CanaryTier,
    options: ICanaryCompleteOptions | undefined,
    overrides: {
      raw?: Result<AiAssist.IAiCompletionResponse>;
      strict?: Result<AiAssist.IAiCompletionResponse>;
    } = {}
  ): Result<AiAssist.IAiCompletionResponse> {
    if (tier === 'frontier' && options?.onUnsupported === 'fail') {
      return overrides.strict ?? fail(REFUSAL);
    }
    if (options?.rawNone === true) {
      return overrides.raw ?? fail(PROVIDER_REJECTS_NONE);
    }
    return pong();
  }

  test('a listed model refused locally, rejected by the provider on a raw none, and an unlisted one answering all pass', async () => {
    const complete = jest.fn(
      async (
        tier: CanaryTier,
        options?: ICanaryCompleteOptions
      ): Promise<Result<AiAssist.IAiCompletionResponse>> => answer(tier, options)
    );
    const result = await runTierCanary(spec, { complete }, new Logging.InMemoryLogger());
    expect(result).toSucceedAndSatisfy((report: string) => {
      expect(report).toMatch(/Strict-none probes \(effort none, onUnsupported 'fail'\):/);
      expect(report).toMatch(/\[PASS\] base none\+fail\s+gpt-6-luna/);
      expect(report).toMatch(/\[PASS\] frontier none\+fail\s+gpt-6-astra\s+\(refused locally, as listed\)/);
      expect(report).toMatch(
        /\[PASS\] frontier none raw\s+gpt-6-astra\s+\(the provider still rejects none, as listed\)/
      );
      expect(report).not.toMatch(/base none raw/);
      expect(report).toMatch(/LIVE-VERIFIED/);
    });
    expect(complete).toHaveBeenCalledWith('frontier', { effort: 'none', onUnsupported: 'fail' });
    expect(complete).toHaveBeenCalledWith('frontier', { rawNone: true });
    expect(complete).not.toHaveBeenCalledWith('base', { rawNone: true });
  });

  test('an unlisted model that rejects none is FAIL(param) — it belongs on the list', async () => {
    const deps: ITierCanaryDeps = {
      complete: async (tier: CanaryTier, options?: ICanaryCompleteOptions) =>
        tier === 'base' && options?.onUnsupported === 'fail'
          ? fail('AI API returned 400: reasoning_effort does not support none')
          : answer(tier, options)
    };
    const result = await runTierCanary(spec, deps, new Logging.InMemoryLogger());
    expect(result).toFailWith(/\[FAIL\(param\)\] base none\+fail\s+gpt-6-luna/);
    expect(result).toFailWith(/FAILED — a thinking, strict-none, model-override or image probe failed/);
  });

  test('a listed model whose strict call goes through fails — the list is stale', async () => {
    const deps: ITierCanaryDeps = {
      complete: async (tier: CanaryTier, options?: ICanaryCompleteOptions) =>
        answer(tier, options, { strict: pong() })
    };
    const result = await runTierCanary(spec, deps, new Logging.InMemoryLogger());
    expect(result).toFailWith(
      /\[FAIL\] frontier none\+fail\s+gpt-6-astra\s+\(listed as thinking-required, but the call went through\)/
    );
  });

  test('a listed model whose provider now accepts a raw none fails — the listing is stale', async () => {
    const deps: ITierCanaryDeps = {
      complete: async (tier: CanaryTier, options?: ICanaryCompleteOptions) =>
        answer(tier, options, { raw: pong() })
    };
    const result = await runTierCanary(spec, deps, new Logging.InMemoryLogger());
    expect(result).toFailWith(
      /\[FAIL\] frontier none raw\s+gpt-6-astra\s+\(the provider accepted none; the thinking-required listing is stale\)/
    );
  });

  test.each([
    {
      reason: 'a provider parameter rejection',
      message: 'AI API returned 400: unsupported_value reasoning_effort none'
    },
    { reason: 'an access denial', message: 'AI API returned 403: org not verified' }
  ])('a listed model not refused locally fails on $reason — the gate did not fire', async ({ message }) => {
    const reached = fail<AiAssist.IAiCompletionResponse>(message);
    const deps: ITierCanaryDeps = {
      complete: async (tier: CanaryTier, options?: ICanaryCompleteOptions) =>
        answer(tier, options, { strict: reached })
    };
    const result = await runTierCanary(spec, deps, new Logging.InMemoryLogger());
    expect(result).toFailWith(
      /\[FAIL\] frontier none\+fail\s+gpt-6-astra\s+\(listed as thinking-required, but not refused locally: AI API returned/
    );
  });

  test('a raw none failing some other way is classified as a live failure', async () => {
    const denied = fail<AiAssist.IAiCompletionResponse>('AI API returned 403: org not verified');
    const deps: ITierCanaryDeps = {
      complete: async (tier: CanaryTier, options?: ICanaryCompleteOptions) =>
        answer(tier, options, { raw: denied })
    };
    const result = await runTierCanary(spec, deps, new Logging.InMemoryLogger());
    expect(result).toSucceedAndSatisfy((report: string) => {
      expect(report).toMatch(/\[PASS\] frontier none\+fail\s+gpt-6-astra/);
      expect(report).toMatch(/\[BLOCKED\(access\)\] frontier none raw\s+gpt-6-astra/);
    });
  });

  test('keyless, every strict-none probe is PENDING', async () => {
    const result = await runTierCanary(spec, {}, new Logging.InMemoryLogger());
    expect(result).toSucceedAndSatisfy((report: string) => {
      expect(report).toMatch(/\[PENDING\] frontier none\+fail\s+gpt-6-astra/);
      expect(report).toMatch(/\[PENDING\] frontier none raw\s+gpt-6-astra/);
      expect(report).not.toMatch(/base none raw/);
    });
  });

  test('without strictNoneProbe no strict-none section is produced', async () => {
    const result = await runTierCanary(
      { ...spec, strictNoneProbe: false },
      { complete: async () => pong() },
      new Logging.InMemoryLogger()
    );
    expect(result).toSucceedAndSatisfy((report: string) => {
      expect(report).not.toMatch(/Strict-none probes/);
    });
  });
});

describe('runTierCanary (model-override probes)', () => {
  const spec = {
    providerId: 'google-gemini',
    descriptor: gemini,
    tiers: ['base'] as ReadonlyArray<CanaryTier>,
    extraModels: ['@google-gemini:flash-lite']
  };

  test('resolves, logs and fires the override via modelOverride', async () => {
    const complete = jest.fn(async () => pong());
    const logger = new Logging.InMemoryLogger();
    const result = await runTierCanary(spec, { complete }, logger);
    expect(result).toSucceedAndSatisfy((report: string) => {
      expect(report).toMatch(/Model-override probes:/);
      expect(report).toMatch(/\[PASS\] @google-gemini:flash-lite\s+gemini-3\.5-flash-lite/);
    });
    expect(complete).toHaveBeenCalledWith('base', { modelOverride: '@google-gemini:flash-lite' });
    expect(logger.logged).toContain(
      'resolved @google-gemini:flash-lite -> gemini-3.5-flash-lite (modelOverride)'
    );
  });

  test('a stale override id fails the run as FAIL(id)', async () => {
    const deps: ITierCanaryDeps = {
      complete: async (tier: CanaryTier, options?: ICanaryCompleteOptions) =>
        options?.modelOverride !== undefined ? fail('AI API returned 404: no such model') : pong()
    };
    const result = await runTierCanary(spec, deps, new Logging.InMemoryLogger());
    expect(result).toFailWith(/\[FAIL\(id\)\] @google-gemini:flash-lite\s+gemini-3\.5-flash-lite/);
    expect(result).toFailWith(/FAILED — a thinking, strict-none, model-override or image probe failed/);
  });

  test('keyless, the override is resolved and PENDING', async () => {
    const result = await runTierCanary(spec, {}, new Logging.InMemoryLogger());
    expect(result).toSucceedAndSatisfy((report: string) => {
      expect(report).toMatch(/\[PENDING\] @google-gemini:flash-lite\s+gemini-3\.5-flash-lite/);
    });
  });

  test('an unregistered override alias fails the run offline', async () => {
    const result = await runTierCanary(
      { ...spec, extraModels: ['@google-gemini:nope'] },
      {},
      new Logging.InMemoryLogger()
    );
    expect(result).toFailWith(
      /google-gemini tier canary: model override '@google-gemini:nope': resolver failed/
    );
  });
});

describe('runTierCanary (live image probe)', () => {
  const spec = {
    providerId: 'xai-grok',
    descriptor: xai,
    tiers: ['base'] as ReadonlyArray<CanaryTier>,
    imageTier: true,
    liveImage: true
  };

  test('a returned image passes', async () => {
    const result = await runTierCanary(
      spec,
      { complete: async () => pong(), generateImage: async () => imageOk() },
      new Logging.InMemoryLogger()
    );
    expect(result).toSucceedAndSatisfy((report: string) => {
      expect(report).toMatch(/Live image probe:/);
      expect(report).toMatch(/\[PASS\] image\s+grok-imagine-image-2\.0/);
      expect(report).toMatch(/LIVE-VERIFIED/);
    });
  });

  test('a 200 with no image data is an error failure', async () => {
    const result = await runTierCanary(
      spec,
      { complete: async () => pong(), generateImage: async () => imageOk('') },
      new Logging.InMemoryLogger()
    );
    expect(result).toFailWith(/\[FAIL\] image\s+grok-imagine-image-2\.0\s+\(HTTP 200 but no image data\)/);
  });

  test('an access-gated image is BLOCKED, not a failure', async () => {
    const result = await runTierCanary(
      spec,
      {
        complete: async () => pong(),
        generateImage: async () => fail('AI API returned 403: org must be verified')
      },
      new Logging.InMemoryLogger()
    );
    expect(result).toSucceedAndSatisfy((report: string) => {
      expect(report).toMatch(/\[BLOCKED\(access\)\] image\s+grok-imagine-image-2\.0/);
    });
  });

  test('a rejected image parameter fails the run as FAIL(param), not BLOCKED', async () => {
    const result = await runTierCanary(
      spec,
      {
        complete: async () => pong(),
        generateImage: async () => fail('AI API returned 400: unsupported_value for quality')
      },
      new Logging.InMemoryLogger()
    );
    expect(result).toFailWith(/\[FAIL\(param\)\] image\s+grok-imagine-image-2\.0/);
  });

  test('a rejected image request fails the run', async () => {
    const result = await runTierCanary(
      spec,
      {
        complete: async () => pong(),
        generateImage: async () => fail('AI API returned 404: model not found')
      },
      new Logging.InMemoryLogger()
    );
    expect(result).toFailWith(/\[FAIL\(id\)\] image\s+grok-imagine-image-2\.0/);
  });

  test('without a generateImage seam the probe is PENDING', async () => {
    const result = await runTierCanary(spec, { complete: async () => pong() }, new Logging.InMemoryLogger());
    expect(result).toSucceedAndSatisfy((report: string) => {
      expect(report).toMatch(/\[PENDING\] image\s+grok-imagine-image-2\.0/);
    });
  });

  test('liveImage without imageTier fires nothing', async () => {
    const generateImage = jest.fn(async () => imageOk());
    const result = await runTierCanary(
      { ...spec, imageTier: false },
      { complete: async () => pong(), generateImage },
      new Logging.InMemoryLogger()
    );
    expect(result).toSucceedAndSatisfy((report: string) => {
      expect(report).not.toMatch(/Live image probe:/);
    });
    expect(generateImage).not.toHaveBeenCalled();
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
// resolveTierApiKey
// ---------------------------------------------------------------------------

describe('resolveTierApiKey', () => {
  const specA: ISecretSpec = { id: 'a-key', envVarName: 'A_KEY', description: 'a' };
  const specB: ISecretSpec = { id: 'b-key', envVarName: 'B_KEY', description: 'b' };

  test('returns the first spec that resolves, trying specs in order', async () => {
    const context = makeContext(
      jest.fn(async (spec: ISecretSpec) =>
        spec.id === 'b-key' ? succeed('resolved-b') : fail<string>(`${spec.id} not set`)
      )
    );
    await expect(resolveTierApiKey(context, [specA, specB])).resolves.toBe('resolved-b');
  });

  test('returns undefined when no spec resolves', async () => {
    await expect(resolveTierApiKey(makeContext(), [specA, specB])).resolves.toBeUndefined();
  });

  test('returns undefined for an empty spec list', async () => {
    const resolveSecret = jest.fn(async (spec: ISecretSpec) => fail<string>(`${spec.id} not set`));
    await expect(resolveTierApiKey(makeContext(resolveSecret), [])).resolves.toBeUndefined();
    expect(resolveSecret).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Scenario metadata + keyless cli.run (STOP-FLAG)
// ---------------------------------------------------------------------------

describe('model-tier scenarios', () => {
  const scenariosById: ReadonlyArray<[string, IScenario]> = [
    ['openai-model-tiers', openaiModelTiersScenario],
    ['anthropic-model-tiers', anthropicModelTiersScenario],
    ['google-gemini-model-tiers', geminiModelTiersScenario],
    ['xai-grok-model-tiers', xaiModelTiersScenario]
  ];

  test.each(scenariosById)('%s is a web-runnable ai scenario', (id, scenario) => {
    expect(scenario.id).toBe(id);
    expect(scenario.category).toBe('ai');
    expect(scenario.tags).toContain('model-tiers');
    expect(scenario.cli).toBeDefined();
    expect(scenario.cli?.webRunnable).toBe(true);
    expect(scenario.web).toBeUndefined();
  });

  test('cli.run without a resolvable API key returns the STOP-FLAG resolver-only proof', async () => {
    if (!geminiModelTiersScenario.cli) {
      throw new Error('expected a CLI implementation');
    }
    const result = await geminiModelTiersScenario.cli.run(makeContext());
    expect(result).toSucceedAndSatisfy((report: string) => {
      expect(report).toMatch(/=== google-gemini model-tier canary ===/);
      expect(report).toMatch(/@google-gemini:pro -> gemini-3\.1-pro-preview \(cascaded from a lower tier\)/);
      expect(report).toMatch(/\[PASS\] image\s+@google-gemini:flash-image -> gemini-3\.1-flash-image\b/);
      expect(report).toMatch(/\[PENDING\] frontier effort=none\s+gemini-3\.1-pro-preview/);
      expect(report).toMatch(/\[PENDING\] @google-gemini:flash-lite\s+gemini-3\.5-flash-lite/);
      expect(report).not.toMatch(/Live image probe:/);
      expect(report).toMatch(/RESOLVER-VERIFIED; LIVE CANARY PENDING \(STOP-FLAG/);
    });
  });

  test('xai cli.run without a key proves the new alias map end-to-end (STOP-FLAG)', async () => {
    if (!xaiModelTiersScenario.cli) {
      throw new Error('expected a CLI implementation');
    }
    const result = await xaiModelTiersScenario.cli.run(makeContext());
    expect(result).toSucceedAndSatisfy((report: string) => {
      expect(report).toMatch(/=== xai-grok model-tier canary ===/);
      expect(report).toMatch(/@xai-grok:standard -> grok-4\.3\b/);
      expect(report).toMatch(/@xai-grok:flagship -> grok-4\.7 \(cascaded from a lower tier\)/);
      expect(report).toMatch(/\[PASS\] image\s+@xai-grok:imagine -> grok-imagine-image-2\.0\b/);
      expect(report).toMatch(/\[PENDING\] advanced effort=none\s+grok-4\.7/);
      expect(report).toMatch(/\[PENDING\] image\s+grok-imagine-image-2\.0/);
      expect(report).toMatch(/RESOLVER-VERIFIED; LIVE CANARY PENDING \(STOP-FLAG/);
    });
  });

  test('openai cli.run without a key lists the thinking and image probes as PENDING', async () => {
    if (!openaiModelTiersScenario.cli) {
      throw new Error('expected a CLI implementation');
    }
    const result = await openaiModelTiersScenario.cli.run(makeContext());
    expect(result).toSucceedAndSatisfy((report: string) => {
      expect(report).toMatch(/\[PENDING\] frontier effort=none\s+gpt-6-astra/);
      expect(report).toMatch(/\[PENDING\] image\s+gpt-image-2\.5-sunburst/);
      expect(report).toMatch(/\[PENDING\] frontier none\+fail\s+gpt-6-astra/);
      expect(report).not.toMatch(/Model-override probes:/);
    });
  });
});
