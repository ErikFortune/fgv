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

import { AiAssist } from '../../..';

/**
 * Build a minimal provider descriptor for alias-resolution tests. Only the
 * fields consulted by `resolveModelAlias` / `resolveProviderModel`
 * (`id`, `defaultModel`, `aliases`) carry meaningful values per case; the rest
 * are inert defaults.
 */
function makeDescriptor(
  overrides: Partial<AiAssist.IAiProviderDescriptor> & Pick<AiAssist.IAiProviderDescriptor, 'id'>
): AiAssist.IAiProviderDescriptor {
  return {
    label: 'Test Provider',
    buttonLabel: 'Test',
    needsSecret: false,
    apiFormat: 'openai',
    baseUrl: 'https://example.test/v1',
    defaultModel: '',
    supportedTools: [],
    corsRestricted: false,
    streamingCorsRestricted: false,
    acceptsImageInput: false,
    thinkingMode: 'unsupported',
    ...overrides
  };
}

describe('MODEL_ALIAS_SIGIL', () => {
  test('is the leading @ marker', () => {
    expect(AiAssist.MODEL_ALIAS_SIGIL).toBe('@');
  });
});

describe('resolveModelAlias', () => {
  test('returns a raw (non-@) model id verbatim — back-compat passthrough', () => {
    const descriptor = makeDescriptor({ id: 'openai' });
    expect(AiAssist.resolveModelAlias(descriptor, 'gpt-4o')).toSucceedWith('gpt-4o');
  });

  test('passes a raw id through even when the descriptor defines aliases', () => {
    const descriptor = makeDescriptor({
      id: 'google-gemini',
      aliases: { '@google-gemini:flash': 'gemini-3.5-flash' }
    });
    expect(AiAssist.resolveModelAlias(descriptor, 'gemini-2.5-flash')).toSucceedWith('gemini-2.5-flash');
  });

  test('resolves a registered alias to its concrete target', () => {
    const descriptor = makeDescriptor({
      id: 'google-gemini',
      aliases: { '@google-gemini:flash': 'gemini-3.5-flash' }
    });
    expect(AiAssist.resolveModelAlias(descriptor, '@google-gemini:flash')).toSucceedWith('gemini-3.5-flash');
  });

  test('fails loudly on an unregistered @alias, naming the provider and alias', () => {
    const descriptor = makeDescriptor({
      id: 'google-gemini',
      aliases: { '@google-gemini:flash': 'gemini-3.5-flash' }
    });
    expect(AiAssist.resolveModelAlias(descriptor, '@google-gemini:flsh')).toFailWith(
      /provider "google-gemini".*unknown model alias.*@google-gemini:flsh/i
    );
  });

  test('fails loudly when the descriptor defines no aliases at all', () => {
    const descriptor = makeDescriptor({ id: 'openai' });
    expect(AiAssist.resolveModelAlias(descriptor, '@openai:reasoning')).toFailWith(
      /unknown model alias.*@openai:reasoning/i
    );
  });

  test('follows a single indirection hop — fgv alias → provider-native alias', () => {
    const descriptor = makeDescriptor({
      id: 'anthropic',
      aliases: { '@anthropic:sonnet': 'claude-sonnet-4-6' }
    });
    // `claude-sonnet-4-6` is a provider-native alias (no @), so resolution
    // terminates immediately with it as the concrete target.
    expect(AiAssist.resolveModelAlias(descriptor, '@anthropic:sonnet')).toSucceedWith('claude-sonnet-4-6');
  });

  test('follows a multi-hop chain — fgv alias → fgv alias → concrete id', () => {
    const descriptor = makeDescriptor({
      id: 'openai',
      aliases: {
        '@openai:reasoning': '@openai:gpt5',
        '@openai:gpt5': 'gpt-5.1'
      }
    });
    expect(AiAssist.resolveModelAlias(descriptor, '@openai:reasoning')).toSucceedWith('gpt-5.1');
  });

  test('fails loudly on a direct @→@ self-cycle without exhausting the stack', () => {
    const descriptor = makeDescriptor({
      id: 'openai',
      aliases: { '@openai:loop': '@openai:loop' }
    });
    expect(AiAssist.resolveModelAlias(descriptor, '@openai:loop')).toFailWith(
      /cyclic model alias.*@openai:loop/i
    );
  });

  test('fails loudly on a multi-step @→@ cycle without exhausting the stack', () => {
    const descriptor = makeDescriptor({
      id: 'openai',
      aliases: {
        '@openai:a': '@openai:b',
        '@openai:b': '@openai:a'
      }
    });
    expect(AiAssist.resolveModelAlias(descriptor, '@openai:a')).toFailWith(/cyclic model alias/i);
  });

  test('passes an Ollama-style model:tag id through untouched (the : collision case)', () => {
    const descriptor = makeDescriptor({ id: 'ollama' });
    expect(AiAssist.resolveModelAlias(descriptor, 'llama3.2:3b')).toSucceedWith('llama3.2:3b');
    expect(AiAssist.resolveModelAlias(descriptor, 'qwen2.5:7b-instruct')).toSucceedWith(
      'qwen2.5:7b-instruct'
    );
  });
});

describe('resolveProviderModel', () => {
  test('walks the ModelSpecKey branch then returns the concrete id (no aliases)', () => {
    const descriptor = makeDescriptor({
      id: 'openai',
      defaultModel: { base: 'gpt-4o', advanced: 'gpt-4o-advanced' }
    });
    expect(AiAssist.resolveProviderModel(descriptor, undefined, 'advanced')).toSucceedWith('gpt-4o-advanced');
    expect(AiAssist.resolveProviderModel(descriptor, undefined, 'base')).toSucceedWith('gpt-4o');
  });

  test('falls back to base when the requested context key is absent', () => {
    const descriptor = makeDescriptor({
      id: 'openai',
      defaultModel: { base: 'gpt-4o', advanced: 'gpt-4o-advanced' }
    });
    expect(AiAssist.resolveProviderModel(descriptor, undefined, 'image')).toSucceedWith('gpt-4o');
  });

  test('prefers an explicit modelOverride over the descriptor default', () => {
    const descriptor = makeDescriptor({ id: 'openai', defaultModel: 'gpt-4o' });
    expect(AiAssist.resolveProviderModel(descriptor, 'gpt-5.1', 'base')).toSucceedWith('gpt-5.1');
  });

  test('resolves an alias selected from the ModelSpecKey branch to a concrete id', () => {
    const descriptor = makeDescriptor({
      id: 'google-gemini',
      defaultModel: {
        base: '@google-gemini:flash',
        image: '@google-gemini:flash-image'
      },
      aliases: {
        '@google-gemini:flash': 'gemini-3.5-flash',
        '@google-gemini:flash-image': 'gemini-3.1-flash-image-preview'
      }
    });
    expect(AiAssist.resolveProviderModel(descriptor, undefined, 'base')).toSucceedWith('gemini-3.5-flash');
    expect(AiAssist.resolveProviderModel(descriptor, undefined, 'image')).toSucceedWith(
      'gemini-3.1-flash-image-preview'
    );
  });

  test('resolves an alias supplied as the modelOverride', () => {
    const descriptor = makeDescriptor({
      id: 'google-gemini',
      defaultModel: 'gemini-2.5-flash',
      aliases: { '@google-gemini:flash': 'gemini-3.5-flash' }
    });
    expect(AiAssist.resolveProviderModel(descriptor, '@google-gemini:flash')).toSucceedWith(
      'gemini-3.5-flash'
    );
  });

  test('fails when neither modelOverride nor defaultModel yields a model', () => {
    const descriptor = makeDescriptor({ id: 'ollama', defaultModel: '' });
    expect(AiAssist.resolveProviderModel(descriptor, undefined, 'base')).toFailWith(
      /provider "ollama".*no model resolved/i
    );
  });

  test('propagates an unregistered-alias failure from the alias layer', () => {
    const descriptor = makeDescriptor({
      id: 'google-gemini',
      defaultModel: '@google-gemini:missing'
    });
    expect(AiAssist.resolveProviderModel(descriptor, undefined, 'base')).toFailWith(
      /unknown model alias.*@google-gemini:missing/i
    );
  });

  test('models a proxy server-side resolution: descriptor reconstructed by id + alias override', () => {
    // The proxy reconstructs the descriptor from providerId via
    // getProviderDescriptor, then resolves the (possibly-aliased) modelOverride
    // with the same function the direct path uses.
    const base = AiAssist.getProviderDescriptor('google-gemini').orThrow();
    const reconstructed = makeDescriptor({
      id: base.id,
      defaultModel: base.defaultModel,
      aliases: { '@google-gemini:flash': 'gemini-3.5-flash' }
    });
    expect(AiAssist.resolveProviderModel(reconstructed, '@google-gemini:flash')).toSucceedWith(
      'gemini-3.5-flash'
    );
  });
});

describe('alias layer resolution for built-in descriptors', () => {
  const descriptors = AiAssist.getProviderDescriptors();

  test.each(descriptors.map((d) => [d.id, d] as const))(
    'every resolved defaultModel value of "%s" is a concrete (non-@) id or a clean failure',
    (__id, descriptor) => {
      for (const key of AiAssist.allModelSpecKeys) {
        const direct = AiAssist.resolveModel(descriptor.defaultModel, key);
        const resolved = AiAssist.resolveProviderModel(descriptor, undefined, key);
        if (direct.length === 0) {
          // Self-hosted providers (defaultModel: '') intentionally resolve to nothing.
          expect(resolved).toFail();
        } else {
          // The post-alias result must never leak an unresolved sigil to the wire.
          expect(resolved).toSucceedAndSatisfy((model) => {
            expect(model.startsWith(AiAssist.MODEL_ALIAS_SIGIL)).toBe(false);
          });
          if (descriptor.aliases === undefined) {
            // Descriptors without aliases are inert: the concrete id passes through verbatim.
            expect(resolved).toSucceedWith(direct);
          }
        }
      }
    }
  );

  test('an arbitrary raw modelOverride (incl. an Ollama model:tag) resolves to itself', () => {
    const gemini = AiAssist.getProviderDescriptor('google-gemini').orThrow();
    expect(AiAssist.resolveProviderModel(gemini, 'gemini-2.5-flash')).toSucceedWith('gemini-2.5-flash');

    const ollama = AiAssist.getProviderDescriptor('ollama').orThrow();
    expect(AiAssist.resolveProviderModel(ollama, 'llama3.2:3b')).toSucceedWith('llama3.2:3b');
  });

  test('only google-gemini defines an aliases map (Tier 2)', () => {
    for (const descriptor of descriptors) {
      if (descriptor.id === 'google-gemini') {
        expect(descriptor.aliases).toBeDefined();
      } else {
        expect(descriptor.aliases).toBeUndefined();
      }
    }
  });
});

describe('google-gemini Tier 2 alias migration', () => {
  const gemini = AiAssist.getProviderDescriptor('google-gemini').orThrow();

  test('defaultModel resolves through the aliases to the concrete 3.x ids', () => {
    expect(AiAssist.resolveProviderModel(gemini, undefined, 'base')).toSucceedWith('gemini-3.5-flash');
    expect(AiAssist.resolveProviderModel(gemini, undefined, 'image')).toSucceedWith(
      'gemini-3.1-flash-image-preview'
    );
    expect(AiAssist.resolveProviderModel(gemini, undefined, 'embedding')).toSucceedWith(
      'gemini-embedding-001'
    );
  });

  test('a tier request cascades to base (flash) — no advanced/frontier key defined yet at B1', () => {
    // The `advanced: '@google-gemini:pro'` key is added in B4; at B1 the Gemini
    // descriptor has no tier key, so a tier request cascades to base = flash.
    expect(AiAssist.resolveProviderModel(gemini, undefined, 'advanced')).toSucceedWith('gemini-3.5-flash');
    expect(AiAssist.resolveProviderModel(gemini, undefined, 'frontier')).toSucceedWith('gemini-3.5-flash');
  });

  test('each declared alias maps to its concrete target', () => {
    expect(AiAssist.resolveModelAlias(gemini, '@google-gemini:flash')).toSucceedWith('gemini-3.5-flash');
    expect(AiAssist.resolveModelAlias(gemini, '@google-gemini:pro')).toSucceedWith('gemini-3.1-pro-preview');
    expect(AiAssist.resolveModelAlias(gemini, '@google-gemini:flash-lite')).toSucceedWith(
      'gemini-3.1-flash-lite'
    );
    expect(AiAssist.resolveModelAlias(gemini, '@google-gemini:flash-image')).toSucceedWith(
      'gemini-3.1-flash-image-preview'
    );
    expect(AiAssist.resolveModelAlias(gemini, '@google-gemini:embedding')).toSucceedWith(
      'gemini-embedding-001'
    );
  });

  test('an unknown gemini alias fails loudly', () => {
    expect(AiAssist.resolveModelAlias(gemini, '@google-gemini:flsh')).toFailWith(/unknown model alias/i);
  });
});
