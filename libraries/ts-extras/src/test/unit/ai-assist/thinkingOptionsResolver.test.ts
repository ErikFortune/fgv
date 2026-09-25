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

// eslint-disable-next-line @rushstack/packlets/mechanics
import {
  anthropicEffortToBudgetTokens,
  checkTemperatureConflict,
  mergeThinkingConfig,
  resolveThinkingConfig,
  providerDiscriminatorForId
} from '../../../packlets/ai-assist/thinkingOptionsResolver';
// eslint-disable-next-line @rushstack/packlets/mechanics
import type { IThinkingConfig, IThinkingProviderConfig } from '../../../packlets/ai-assist/model';

// ============================================================================
// providerDiscriminatorForId
// ============================================================================

describe('providerDiscriminatorForId', () => {
  test('maps anthropic to anthropic', () => {
    expect(providerDiscriminatorForId('anthropic')).toBe('anthropic');
  });

  test('maps openai to openai', () => {
    expect(providerDiscriminatorForId('openai')).toBe('openai');
  });

  test('maps google-gemini to google', () => {
    expect(providerDiscriminatorForId('google-gemini')).toBe('google');
  });

  test('maps xai-grok to xai', () => {
    expect(providerDiscriminatorForId('xai-grok')).toBe('xai');
  });

  test('returns undefined for unknown providers', () => {
    expect(providerDiscriminatorForId('ollama')).toBeUndefined();
    expect(providerDiscriminatorForId('openai-compat')).toBeUndefined();
    expect(providerDiscriminatorForId('something-else')).toBeUndefined();
  });
});

// ============================================================================
// mergeThinkingConfig — generic effort (tier 1)
// ============================================================================

describe('mergeThinkingConfig', () => {
  describe('generic effort — tier 1', () => {
    test('maps generic low effort to Anthropic low', () => {
      const result = mergeThinkingConfig({ effort: 'low' }, 'claude-opus-4-7', 'anthropic');
      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.anthropicEffort).toBe('low');
        expect(r.openAiEffort).toBeUndefined();
        expect(r.geminiThinkingBudget).toBeUndefined();
        expect(r.xaiEffort).toBeUndefined();
      });
    });

    test('maps generic medium effort to Anthropic medium', () => {
      const result = mergeThinkingConfig({ effort: 'medium' }, 'claude-opus-4-7', 'anthropic');
      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.anthropicEffort).toBe('medium');
      });
    });

    test('maps generic high effort to Anthropic high', () => {
      const result = mergeThinkingConfig({ effort: 'high' }, 'claude-opus-4-7', 'anthropic');
      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.anthropicEffort).toBe('high');
      });
    });

    test('maps generic low effort to OpenAI low', () => {
      const result = mergeThinkingConfig({ effort: 'low' }, 'gpt-5-pro', 'openai');
      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.openAiEffort).toBe('low');
        expect(r.anthropicEffort).toBeUndefined();
      });
    });

    test('maps generic medium effort to OpenAI medium', () => {
      const result = mergeThinkingConfig({ effort: 'medium' }, 'gpt-5-pro', 'openai');
      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.openAiEffort).toBe('medium');
      });
    });

    test('maps generic high effort to OpenAI high', () => {
      const result = mergeThinkingConfig({ effort: 'high' }, 'gpt-5-pro', 'openai');
      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.openAiEffort).toBe('high');
      });
    });

    test('maps generic low effort to Gemini budget 1024', () => {
      const result = mergeThinkingConfig({ effort: 'low' }, 'gemini-2.5-pro', 'google');
      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.geminiThinkingBudget).toBe(1024);
        expect(r.anthropicEffort).toBeUndefined();
      });
    });

    test('maps generic medium effort to Gemini budget 4096', () => {
      const result = mergeThinkingConfig({ effort: 'medium' }, 'gemini-2.5-pro', 'google');
      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.geminiThinkingBudget).toBe(4096);
      });
    });

    test('maps generic high effort to Gemini budget 8192', () => {
      const result = mergeThinkingConfig({ effort: 'high' }, 'gemini-2.5-pro', 'google');
      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.geminiThinkingBudget).toBe(8192);
      });
    });

    test('maps generic low effort to xAI low', () => {
      const result = mergeThinkingConfig({ effort: 'low' }, 'grok-3-mini', 'xai');
      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.xaiEffort).toBe('low');
        expect(r.anthropicEffort).toBeUndefined();
      });
    });

    test('maps generic medium effort to xAI medium', () => {
      const result = mergeThinkingConfig({ effort: 'medium' }, 'grok-3-mini', 'xai');
      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.xaiEffort).toBe('medium');
      });
    });

    test('maps generic high effort to xAI high', () => {
      const result = mergeThinkingConfig({ effort: 'high' }, 'grok-3-mini', 'xai');
      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.xaiEffort).toBe('high');
      });
    });

    test('returns empty resolved when no effort and no providers', () => {
      const result = mergeThinkingConfig({}, 'claude-opus-4-7', 'anthropic');
      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.anthropicEffort).toBeUndefined();
        expect(r.openAiEffort).toBeUndefined();
        expect(r.geminiThinkingBudget).toBeUndefined();
        expect(r.xaiEffort).toBeUndefined();
        expect(r.otherParams).toBeUndefined();
      });
    });
  });

  // ============================================================================
  // Provider-generic blocks — tier 2
  // ============================================================================

  describe('provider-generic blocks — tier 2', () => {
    test('applies Anthropic provider-generic block', () => {
      const config: IThinkingConfig = {
        providers: [{ provider: 'anthropic', config: { effort: 'max' } }]
      };
      const result = mergeThinkingConfig(config, 'claude-opus-4-7', 'anthropic');
      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.anthropicEffort).toBe('max');
      });
    });

    test('applies OpenAI provider-generic block', () => {
      const config: IThinkingConfig = {
        providers: [{ provider: 'openai', config: { effort: 'xhigh' } }]
      };
      const result = mergeThinkingConfig(config, 'gpt-5-pro', 'openai');
      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.openAiEffort).toBe('xhigh');
      });
    });

    test('applies OpenAI none effort (A1 edge case)', () => {
      const config: IThinkingConfig = {
        effort: 'medium',
        providers: [{ provider: 'openai', config: { effort: 'none' } }]
      };
      const result = mergeThinkingConfig(config, 'gpt-5-pro', 'openai');
      expect(result).toSucceedAndSatisfy((r) => {
        // provider-generic block overrides generic effort
        expect(r.openAiEffort).toBe('none');
      });
    });

    test('applies Gemini provider-generic block with thinkingBudget', () => {
      const config: IThinkingConfig = {
        providers: [{ provider: 'google', config: { thinkingBudget: 2048 } }]
      };
      const result = mergeThinkingConfig(config, 'gemini-2.5-pro', 'google');
      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.geminiThinkingBudget).toBe(2048);
      });
    });

    test('Gemini block with no thinkingBudget does not override existing', () => {
      const config: IThinkingConfig = {
        effort: 'high',
        providers: [{ provider: 'google', config: {} }]
      };
      const result = mergeThinkingConfig(config, 'gemini-2.5-pro', 'google');
      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.geminiThinkingBudget).toBe(8192); // from generic effort, not overridden
      });
    });

    test('applies xAI provider-generic block', () => {
      const config: IThinkingConfig = {
        providers: [{ provider: 'xai', config: { effort: 'none' } }]
      };
      const result = mergeThinkingConfig(config, 'grok-3-mini', 'xai');
      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.xaiEffort).toBe('none');
      });
    });

    test('skips blocks for non-matching provider', () => {
      const config: IThinkingConfig = {
        providers: [
          { provider: 'openai', config: { effort: 'xhigh' } },
          { provider: 'anthropic', config: { effort: 'max' } }
        ]
      };
      const result = mergeThinkingConfig(config, 'claude-opus-4-7', 'anthropic');
      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.anthropicEffort).toBe('max');
        expect(r.openAiEffort).toBeUndefined();
      });
    });

    test('later provider-generic block within tier 2 wins (declaration order)', () => {
      const config: IThinkingConfig = {
        providers: [
          { provider: 'anthropic', config: { effort: 'low' } },
          { provider: 'anthropic', config: { effort: 'max' } }
        ]
      };
      const result = mergeThinkingConfig(config, 'claude-opus-4-7', 'anthropic');
      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.anthropicEffort).toBe('max');
      });
    });
  });

  // ============================================================================
  // Model-specific blocks — tier 3
  // ============================================================================

  describe('model-specific blocks — tier 3', () => {
    test('applies model-specific Anthropic block when model matches', () => {
      const config: IThinkingConfig = {
        providers: [
          {
            provider: 'anthropic',
            models: ['claude-opus-4-7'],
            config: { effort: 'max' }
          }
        ]
      };
      const result = mergeThinkingConfig(config, 'claude-opus-4-7', 'anthropic');
      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.anthropicEffort).toBe('max');
      });
    });

    test('skips model-specific Anthropic block when model does not match', () => {
      const config: IThinkingConfig = {
        effort: 'low',
        providers: [
          {
            provider: 'anthropic',
            models: ['claude-opus-4-7'],
            config: { effort: 'max' }
          }
        ]
      };
      const result = mergeThinkingConfig(config, 'claude-sonnet-4', 'anthropic');
      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.anthropicEffort).toBe('low'); // generic, model-specific skipped
      });
    });

    test('model-specific block overrides provider-generic block (tier 3 > tier 2)', () => {
      const config: IThinkingConfig = {
        providers: [
          { provider: 'anthropic', config: { effort: 'medium' } },
          { provider: 'anthropic', models: ['claude-opus-4-7'], config: { effort: 'max' } }
        ]
      };
      const result = mergeThinkingConfig(config, 'claude-opus-4-7', 'anthropic');
      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.anthropicEffort).toBe('max');
      });
    });

    test('model-specific OpenAI block applies when model matches', () => {
      const config: IThinkingConfig = {
        providers: [
          {
            provider: 'openai',
            models: ['gpt-5-pro'],
            config: { effort: 'xhigh' }
          }
        ]
      };
      const result = mergeThinkingConfig(config, 'gpt-5-pro', 'openai');
      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.openAiEffort).toBe('xhigh');
      });
    });

    test('model-specific Gemini block applies thinkingBudget', () => {
      const config: IThinkingConfig = {
        providers: [
          {
            provider: 'google',
            models: ['gemini-3.1-pro-preview'],
            config: { thinkingBudget: 16384 }
          }
        ]
      };
      const result = mergeThinkingConfig(config, 'gemini-3.1-pro-preview', 'google');
      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.geminiThinkingBudget).toBe(16384);
      });
    });

    test('model-specific xAI block applies effort', () => {
      const config: IThinkingConfig = {
        providers: [
          {
            provider: 'xai',
            models: ['grok-3-mini'],
            config: { effort: 'high' }
          }
        ]
      };
      const result = mergeThinkingConfig(config, 'grok-3-mini', 'xai');
      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.xaiEffort).toBe('high');
      });
    });

    test('model-specific Anthropic block applies to the rotated advanced-tier target claude-opus-5', () => {
      const config: IThinkingConfig = {
        providers: [
          {
            provider: 'anthropic',
            models: ['claude-opus-5'],
            config: { effort: 'high' }
          }
        ]
      };
      const result = mergeThinkingConfig(config, 'claude-opus-5', 'anthropic');
      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.anthropicEffort).toBe('high');
      });
    });

    test('a claude-opus-4-8 models entry does NOT match resolved claude-opus-5 (prefix guard)', () => {
      // Prefix matching requires equality or `<entry>-` prefix, so opus-4 entries never
      // capture the opus-5 line — the union additions are load-bearing, not cosmetic.
      const config: IThinkingConfig = {
        effort: 'low',
        providers: [
          {
            provider: 'anthropic',
            models: ['claude-opus-4-8'],
            config: { effort: 'max' }
          }
        ]
      };
      const result = mergeThinkingConfig(config, 'claude-opus-5', 'anthropic');
      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.anthropicEffort).toBe('low'); // generic; the opus-4-8 block is skipped
      });
    });

    test('model-specific OpenAI blocks apply to the rotated gpt-5.6 tier targets', () => {
      const config: IThinkingConfig = {
        providers: [
          {
            provider: 'openai',
            models: ['gpt-5.6-sol', 'gpt-5.6-terra', 'gpt-5.6-luna'],
            config: { effort: 'xhigh' }
          }
        ]
      };
      for (const model of ['gpt-5.6-sol', 'gpt-5.6-terra', 'gpt-5.6-luna']) {
        const result = mergeThinkingConfig(config, model, 'openai');
        expect(result).toSucceedAndSatisfy((r) => {
          expect(r.openAiEffort).toBe('xhigh');
        });
      }
    });
  });

  // ============================================================================
  // Other blocks — tier 4 (same as tier 3)
  // ============================================================================

  describe('other blocks (provider: other) — tier 4', () => {
    test('applies other block when model is listed', () => {
      const config: IThinkingConfig = {
        providers: [
          {
            provider: 'other',
            models: ['claude-opus-4-7'],
            // eslint-disable-next-line @typescript-eslint/naming-convention
            config: { custom_thinking_param: true }
          }
        ]
      };
      const result = mergeThinkingConfig(config, 'claude-opus-4-7', 'anthropic');
      expect(result).toSucceedAndSatisfy((r) => {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        expect(r.otherParams).toEqual({ custom_thinking_param: true });
      });
    });

    test('skips other block when model is not in list', () => {
      const config: IThinkingConfig = {
        providers: [
          {
            provider: 'other',
            models: ['gpt-5-pro'],
            // eslint-disable-next-line @typescript-eslint/naming-convention
            config: { custom_thinking_param: true }
          }
        ]
      };
      const result = mergeThinkingConfig(config, 'claude-opus-4-7', 'anthropic');
      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.otherParams).toBeUndefined();
      });
    });

    test('merges multiple other blocks for same model', () => {
      const config: IThinkingConfig = {
        providers: [
          {
            provider: 'other',
            models: ['claude-opus-4-7'],
            config: { param_a: 1 }
          },
          {
            provider: 'other',
            models: ['claude-opus-4-7'],
            config: { param_b: 2 }
          }
        ]
      };
      const result = mergeThinkingConfig(config, 'claude-opus-4-7', 'anthropic');
      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.otherParams).toEqual({ param_a: 1, param_b: 2 });
      });
    });

    test('later other block wins for same key', () => {
      const config: IThinkingConfig = {
        providers: [
          {
            provider: 'other',
            models: ['claude-opus-4-7'],
            config: { param: 'first' }
          },
          {
            provider: 'other',
            models: ['claude-opus-4-7'],
            config: { param: 'second' }
          }
        ]
      };
      const result = mergeThinkingConfig(config, 'claude-opus-4-7', 'anthropic');
      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.otherParams).toEqual({ param: 'second' });
      });
    });
  });

  describe('model name prefix matching', () => {
    test('typed provider block matches versioned model id via prefix', () => {
      const config: IThinkingConfig = {
        providers: [
          {
            provider: 'anthropic',
            models: ['claude-sonnet-4-5'],
            config: { effort: 'high' }
          }
        ]
      };
      const result = mergeThinkingConfig(config, 'claude-sonnet-4-5-20250929', 'anthropic');
      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.anthropicEffort).toBe('high');
      });
    });

    test('other block matches versioned model id via prefix', () => {
      const config: IThinkingConfig = {
        providers: [
          {
            provider: 'other',
            models: ['gpt-4o'],
            config: { custom_param: 'yes' }
          }
        ]
      };
      const result = mergeThinkingConfig(config, 'gpt-4o-2024-11-20', 'openai');
      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.otherParams).toEqual({ custom_param: 'yes' });
      });
    });

    test('prefix match does not match a different model version', () => {
      const config: IThinkingConfig = {
        providers: [
          {
            provider: 'anthropic',
            models: ['claude-sonnet-4-5'],
            config: { effort: 'high' }
          }
        ]
      };
      const result = mergeThinkingConfig(config, 'claude-sonnet-4-6-20251001', 'anthropic');
      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.anthropicEffort).toBeUndefined();
      });
    });
  });

  // ============================================================================
  // applyBlock — provider blocks with no override (config fields all undefined)
  // ============================================================================

  describe('provider blocks with no overridable fields (no-op blocks)', () => {
    test('Anthropic block with no effort leaves resolved unchanged', () => {
      const config: IThinkingConfig = {
        effort: 'medium',
        providers: [{ provider: 'anthropic', config: {} }]
      };
      const result = mergeThinkingConfig(config, 'claude-opus-4-7', 'anthropic');
      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.anthropicEffort).toBe('medium'); // from generic, not changed by empty block
      });
    });

    test('OpenAI block with no effort leaves resolved unchanged', () => {
      const config: IThinkingConfig = {
        effort: 'high',
        providers: [{ provider: 'openai', config: {} }]
      };
      const result = mergeThinkingConfig(config, 'gpt-5-pro', 'openai');
      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.openAiEffort).toBe('high'); // from generic, not changed
      });
    });

    test('xAI block with no effort leaves resolved unchanged', () => {
      const config: IThinkingConfig = {
        effort: 'low',
        providers: [{ provider: 'xai', config: {} }]
      };
      const result = mergeThinkingConfig(config, 'grok-3-mini', 'xai');
      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.xaiEffort).toBe('low'); // from generic, not changed
      });
    });
  });

  // ============================================================================
  // Tier precedence — full ladder
  // ============================================================================

  describe('full tier precedence', () => {
    test('generic < provider-generic < model-specific', () => {
      const config: IThinkingConfig = {
        effort: 'low',
        providers: [
          { provider: 'anthropic', config: { effort: 'medium' } },
          { provider: 'anthropic', models: ['claude-opus-4-7'], config: { effort: 'max' } }
        ]
      };
      const result = mergeThinkingConfig(config, 'claude-opus-4-7', 'anthropic');
      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.anthropicEffort).toBe('max');
      });
    });

    test('generic effort coexists with Anthropic-specific when no override for that field', () => {
      const config: IThinkingConfig = {
        effort: 'medium',
        providers: [
          {
            provider: 'other',
            models: ['claude-opus-4-7'],
            config: { extra_param: 'x' }
          }
        ]
      };
      const result = mergeThinkingConfig(config, 'claude-opus-4-7', 'anthropic');
      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.anthropicEffort).toBe('medium');
        expect(r.otherParams).toEqual({ extra_param: 'x' });
      });
    });

    test('provider-generic block for different provider is skipped even when applicable by model', () => {
      // OpenAI block should not affect Anthropic resolution
      const config: IThinkingConfig = {
        providers: [
          { provider: 'openai', config: { effort: 'xhigh' } },
          { provider: 'anthropic', config: { effort: 'max' } }
        ]
      };
      const result = mergeThinkingConfig(config, 'claude-opus-4-7', 'anthropic');
      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.anthropicEffort).toBe('max');
        expect(r.openAiEffort).toBeUndefined();
      });
    });
  });
});

// ============================================================================
// checkTemperatureConflict
// ============================================================================

describe('checkTemperatureConflict', () => {
  describe('temperature is undefined — always succeeds', () => {
    test('Anthropic with effort set, no temperature', () => {
      expect(checkTemperatureConflict({ anthropicEffort: 'high' }, 'anthropic', undefined)).toSucceed();
    });

    test('OpenAI with effort set, no temperature', () => {
      expect(checkTemperatureConflict({ openAiEffort: 'high' }, 'openai', undefined)).toSucceed();
    });

    test('xAI with effort set, no temperature', () => {
      expect(checkTemperatureConflict({ xaiEffort: 'high' }, 'xai', undefined)).toSucceed();
    });

    test('Google with budget set, no temperature', () => {
      expect(checkTemperatureConflict({ geminiThinkingBudget: 4096 }, 'google', undefined)).toSucceed();
    });
  });

  describe('Anthropic', () => {
    test('fails when Anthropic effort is set and temperature is provided', () => {
      expect(checkTemperatureConflict({ anthropicEffort: 'high' }, 'anthropic', 0.7)).toFailWith(
        /thinking mode is not compatible with temperature on provider anthropic/i
      );
    });

    test('fails for all Anthropic effort levels', () => {
      for (const effort of ['low', 'medium', 'high', 'max'] as const) {
        expect(checkTemperatureConflict({ anthropicEffort: effort }, 'anthropic', 0.5)).toFail();
      }
    });

    test('succeeds when Anthropic effort is undefined and temperature is provided', () => {
      expect(checkTemperatureConflict({}, 'anthropic', 0.7)).toSucceed();
    });
  });

  describe('OpenAI', () => {
    test('fails when OpenAI effort is set (non-none) and temperature is provided', () => {
      expect(checkTemperatureConflict({ openAiEffort: 'high' }, 'openai', 0.7)).toFailWith(
        /thinking mode is not compatible with temperature on provider openai/i
      );
    });

    test('fails for all non-none OpenAI effort levels', () => {
      for (const effort of ['low', 'medium', 'high', 'xhigh', 'minimal'] as const) {
        expect(checkTemperatureConflict({ openAiEffort: effort }, 'openai', 0.5)).toFail();
      }
    });

    test('succeeds when OpenAI effort is none (A1 edge case: temperature allowed)', () => {
      expect(checkTemperatureConflict({ openAiEffort: 'none' }, 'openai', 0.7)).toSucceed();
    });

    test('succeeds when OpenAI effort is undefined and temperature is provided', () => {
      expect(checkTemperatureConflict({}, 'openai', 0.7)).toSucceed();
    });
  });

  describe('xAI (conservative default)', () => {
    test('fails when xAI effort is set (non-none) and temperature is provided', () => {
      expect(checkTemperatureConflict({ xaiEffort: 'high' }, 'xai', 0.7)).toFailWith(
        /thinking mode is not compatible with temperature on provider xai/i
      );
    });

    test('fails for all non-none xAI effort levels', () => {
      for (const effort of ['low', 'medium', 'high'] as const) {
        expect(checkTemperatureConflict({ xaiEffort: effort }, 'xai', 0.5)).toFail();
      }
    });

    test('succeeds when xAI effort is none (temperature allowed)', () => {
      expect(checkTemperatureConflict({ xaiEffort: 'none' }, 'xai', 0.7)).toSucceed();
    });

    test('succeeds when xAI effort is undefined and temperature is provided', () => {
      expect(checkTemperatureConflict({}, 'xai', 0.7)).toSucceed();
    });
  });

  describe('Google (Gemini — temperature always allowed)', () => {
    test('succeeds when Gemini budget is set and temperature is provided', () => {
      expect(checkTemperatureConflict({ geminiThinkingBudget: 4096 }, 'google', 0.7)).toSucceed();
    });

    test('succeeds even at high temperature with high budget', () => {
      expect(checkTemperatureConflict({ geminiThinkingBudget: 8192 }, 'google', 1.0)).toSucceed();
    });

    test('succeeds when Gemini budget is undefined and temperature is provided', () => {
      expect(checkTemperatureConflict({}, 'google', 0.7)).toSucceed();
    });
  });

  describe('error messages', () => {
    test('Anthropic error message suggests removing temperature or disabling thinking', () => {
      const result = checkTemperatureConflict({ anthropicEffort: 'high' }, 'anthropic', 0.7);
      expect(result).toFailWith(/remove temperature or disable thinking/i);
    });

    test('OpenAI error message mentions provider openai', () => {
      const result = checkTemperatureConflict({ openAiEffort: 'high' }, 'openai', 0.7);
      expect(result).toFailWith(/provider openai/i);
    });

    test('xAI error message mentions provider xai', () => {
      const result = checkTemperatureConflict({ xaiEffort: 'high' }, 'xai', 0.7);
      expect(result).toFailWith(/provider xai/i);
    });
  });

  describe('anthropicEffortToBudgetTokens', () => {
    test('low effort maps to 2048', () => {
      expect(anthropicEffortToBudgetTokens('low')).toBe(2048);
    });
    test('medium effort maps to 8192', () => {
      expect(anthropicEffortToBudgetTokens('medium')).toBe(8192);
    });
    test('high effort maps to 24000', () => {
      expect(anthropicEffortToBudgetTokens('high')).toBe(24000);
    });
    test('max effort maps to 32000', () => {
      expect(anthropicEffortToBudgetTokens('max')).toBe(32000);
    });
  });

  describe("effort 'none' on a thinking-required model", () => {
    test('degrades to low by default', () => {
      expect(mergeThinkingConfig({ effort: 'none' }, 'gpt-6-astra', 'openai', true)).toSucceedAndSatisfy(
        (r) => {
          expect(r.openAiEffort).toBe('low');
        }
      );
    });

    test("fails when onUnsupported is 'fail'", () => {
      expect(
        mergeThinkingConfig({ effort: 'none', onUnsupported: 'fail' }, 'gpt-6-astra', 'openai', true)
      ).toFailWith(/'none' is not supported by gpt-6-astra/);
    });

    test('a degraded none plus temperature fails with a message that says none was sent as low', () => {
      expect(
        resolveThinkingConfig({ effort: 'none' }, 'gpt-6-astra', 'openai', true).onSuccess((r) =>
          checkTemperatureConflict(r.resolved, 'openai', 0.7, r.noneDegraded)
        )
      ).toFailWith(/thinking effort 'none' was sent as 'low'.*provider openai: remove temperature$/);
    });

    test('an accepted none plus temperature still passes', () => {
      expect(
        resolveThinkingConfig({ effort: 'none' }, 'gpt-6-luna', 'openai', false).onSuccess((r) =>
          checkTemperatureConflict(r.resolved, 'openai', 0.7, r.noneDegraded)
        )
      ).toSucceed();
    });

    test('reports noneDegraded only when the degraded value reaches the wire', () => {
      expect(resolveThinkingConfig({ effort: 'none' }, 'gpt-6-astra', 'openai', true)).toSucceedAndSatisfy(
        (r) => {
          expect(r.resolved.openAiEffort).toBe('low');
          expect(r.noneDegraded).toBe(true);
        }
      );
      expect(resolveThinkingConfig({ effort: 'low' }, 'gpt-6-astra', 'openai', true)).toSucceedAndSatisfy(
        (r) => {
          expect(r.noneDegraded).toBe(false);
        }
      );
    });

    test('a provider block that rewrites the effort cancels the degrade', () => {
      const config: IThinkingConfig = {
        effort: 'none',
        providers: [{ provider: 'openai', config: { effort: 'high' } }]
      };
      expect(resolveThinkingConfig(config, 'gpt-6-astra', 'openai', true)).toSucceedAndSatisfy((r) => {
        expect(r.resolved.openAiEffort).toBe('high');
        expect(r.noneDegraded).toBe(false);
        expect(checkTemperatureConflict(r.resolved, 'openai', 0.7, r.noneDegraded)).toFailWith(
          /^thinking mode is not compatible with temperature on provider openai: remove temperature or disable thinking$/
        );
      });
    });

    test('a provider block for another provider leaves the degrade in place', () => {
      const config: IThinkingConfig = {
        effort: 'none',
        providers: [{ provider: 'google', config: { thinkingBudget: 8192 } }]
      };
      expect(resolveThinkingConfig(config, 'gpt-6-astra', 'openai', true)).toSucceedAndSatisfy((r) => {
        expect(r.noneDegraded).toBe(true);
      });
    });

    test("an applicable 'other' block that sets the wire effort makes the none gate stand aside", () => {
      const config: IThinkingConfig = {
        effort: 'none',
        onUnsupported: 'fail',
        providers: [{ provider: 'other', models: ['gpt-6-astra'], config: { reasoning_effort: 'none' } }]
      };
      expect(resolveThinkingConfig(config, 'gpt-6-astra', 'openai', true)).toSucceedAndSatisfy((r) => {
        expect(r.resolved.openAiEffort).toBe('none');
        expect(r.resolved.otherParams).toEqual({ reasoning_effort: 'none' });
        expect(r.noneDegraded).toBe(false);
        expect(checkTemperatureConflict(r.resolved, 'openai', 0.7, r.noneDegraded)).toSucceed();
      });
    });

    test("an 'other' block for a different model, or without an effort key, leaves the gate in place", () => {
      const blocks: ReadonlyArray<IThinkingProviderConfig> = [
        { provider: 'other', models: ['gpt-6-luna'], config: { reasoning_effort: 'none' } },
        { provider: 'other', models: ['gpt-6-astra'], config: { store: false } }
      ];
      for (const block of blocks) {
        expect(
          resolveThinkingConfig({ effort: 'none', providers: [block] }, 'gpt-6-astra', 'openai', true)
        ).toSucceedAndSatisfy((r) => {
          expect(r.resolved.openAiEffort).toBe('low');
          expect(r.noneDegraded).toBe(true);
        });
      }
    });

    test("a gemini 'other' block setting thinkingConfig makes the gate stand aside", () => {
      const config: IThinkingConfig = {
        effort: 'none',
        providers: [
          {
            provider: 'other',
            models: ['gemini-3.1-pro-preview'],
            config: { thinkingConfig: { thinkingBudget: 0 } }
          }
        ]
      };
      expect(resolveThinkingConfig(config, 'gemini-3.1-pro-preview', 'google', true)).toSucceedAndSatisfy(
        (r) => {
          expect(r.resolved.geminiThinkingBudget).toBe(0);
          expect(r.noneDegraded).toBe(false);
        }
      );
    });

    test('a gemini budget block cancels a gemini degrade', () => {
      const config: IThinkingConfig = {
        effort: 'none',
        providers: [{ provider: 'google', config: { thinkingBudget: 2048 } }]
      };
      expect(resolveThinkingConfig(config, 'gemini-3.1-pro-preview', 'google', true)).toSucceedAndSatisfy(
        (r) => {
          expect(r.resolved.geminiThinkingBudget).toBe(2048);
          expect(r.noneDegraded).toBe(false);
        }
      );
    });

    test('leaves none alone when the model accepts it', () => {
      expect(
        mergeThinkingConfig({ effort: 'none', onUnsupported: 'fail' }, 'gpt-6-luna', 'openai', false)
      ).toSucceedAndSatisfy((r) => {
        expect(r.openAiEffort).toBe('none');
      });
    });
  });
});
