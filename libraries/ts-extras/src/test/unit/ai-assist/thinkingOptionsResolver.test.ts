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
  checkTemperatureConflict,
  mergeThinkingConfig,
  providerDiscriminatorForId
} from '../../../packlets/ai-assist/thinkingOptionsResolver';
// eslint-disable-next-line @rushstack/packlets/mechanics
import type { IThinkingConfig } from '../../../packlets/ai-assist/model';

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
            models: ['gemini-2.5-pro'],
            config: { thinkingBudget: 16384 }
          }
        ]
      };
      const result = mergeThinkingConfig(config, 'gemini-2.5-pro', 'google');
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
            config: { custom_thinking_param: true }
          }
        ]
      };
      const result = mergeThinkingConfig(config, 'claude-opus-4-7', 'anthropic');
      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.otherParams).toEqual({ custom_thinking_param: true });
      });
    });

    test('skips other block when model is not in list', () => {
      const config: IThinkingConfig = {
        providers: [
          {
            provider: 'other',
            models: ['gpt-5-pro'],
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
});
