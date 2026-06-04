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

import { JsonSchema } from '@fgv/ts-json-base';

// eslint-disable-next-line @rushstack/packlets/mechanics
import { aiClientToolConfig } from '../../../packlets/ai-assist/converters';

// ============================================================================
// aiClientToolConfig converter
// ============================================================================

describe('aiClientToolConfig', () => {
  const memorySchema = JsonSchema.object({
    query: JsonSchema.string({ description: 'What to recall' })
  });

  const validConfig = {
    type: 'client_tool',
    name: 'recall_memory',
    description: 'Recall stored user context',
    parametersSchema: memorySchema
  };

  describe('success cases', () => {
    test('accepts a valid client tool config', () => {
      expect(aiClientToolConfig.convert(validConfig)).toSucceedAndSatisfy((config) => {
        expect(config.type).toBe('client_tool');
        expect(config.name).toBe('recall_memory');
        expect(config.description).toBe('Recall stored user context');
        expect(config.parametersSchema).toBe(memorySchema);
      });
    });

    test('accepts client tool config with complex schema', () => {
      const complexSchema = JsonSchema.object({
        location: JsonSchema.string({ description: 'City name' }),
        units: JsonSchema.optional(JsonSchema.enumOf(['celsius', 'fahrenheit'] as const))
      });
      const config = {
        type: 'client_tool',
        name: 'get_weather',
        description: 'Get current weather',
        parametersSchema: complexSchema
      };
      expect(aiClientToolConfig.convert(config)).toSucceedAndSatisfy((result) => {
        expect(result.name).toBe('get_weather');
        expect(result.parametersSchema).toBe(complexSchema);
      });
    });

    test('the converted config exposes a callable .toJson() on parametersSchema', () => {
      expect(aiClientToolConfig.convert(validConfig)).toSucceedAndSatisfy((config) => {
        const wireSchema = config.parametersSchema.toJson();
        expect(wireSchema).toHaveProperty('type', 'object');
      });
    });

    test('the converted config exposes a callable .validate() on parametersSchema', () => {
      expect(aiClientToolConfig.convert(validConfig)).toSucceedAndSatisfy((config) => {
        expect(config.parametersSchema.validate({ query: 'test' })).toSucceed();
      });
    });
  });

  describe('failure cases', () => {
    test('rejects null input', () => {
      expect(aiClientToolConfig.convert(null)).toFailWith(/expected object/i);
    });

    test('rejects undefined input', () => {
      expect(aiClientToolConfig.convert(undefined)).toFailWith(/expected object/i);
    });

    test('rejects non-object input', () => {
      expect(aiClientToolConfig.convert('not-an-object')).toFailWith(/expected object/i);
    });

    test('rejects wrong type field', () => {
      const bad = { ...validConfig, type: 'server_tool' };
      expect(aiClientToolConfig.convert(bad)).toFailWith(/expected type 'client_tool'/i);
    });

    test('rejects missing type field', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { type: _type, ...noType } = validConfig;
      expect(aiClientToolConfig.convert(noType)).toFailWith(/expected type 'client_tool'/i);
    });

    test('rejects empty name', () => {
      const bad = { ...validConfig, name: '' };
      expect(aiClientToolConfig.convert(bad)).toFailWith(/name must be a non-empty string/i);
    });

    test('rejects non-string name', () => {
      const bad = { ...validConfig, name: 42 };
      expect(aiClientToolConfig.convert(bad)).toFailWith(/name must be a non-empty string/i);
    });

    test('rejects non-string description', () => {
      const bad = { ...validConfig, description: 123 };
      expect(aiClientToolConfig.convert(bad)).toFailWith(/description must be a string/i);
    });

    test('rejects missing description', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { description: _desc, ...noDesc } = validConfig;
      expect(aiClientToolConfig.convert(noDesc)).toFailWith(/description must be a string/i);
    });

    test('rejects null parametersSchema', () => {
      const bad = { ...validConfig, parametersSchema: null };
      expect(aiClientToolConfig.convert(bad)).toFailWith(/parametersSchema/i);
    });

    test('rejects missing parametersSchema', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { parametersSchema: _s, ...noSchema } = validConfig;
      expect(aiClientToolConfig.convert(noSchema)).toFailWith(/parametersSchema/i);
    });

    test('rejects plain object without validate/toJson methods', () => {
      const bad = { ...validConfig, parametersSchema: { type: 'object' } };
      expect(aiClientToolConfig.convert(bad)).toFailWith(/parametersSchema/i);
    });

    test('rejects parametersSchema with validate but no toJson', () => {
      const bad = {
        ...validConfig,
        parametersSchema: { validate: (): unknown => undefined }
      };
      expect(aiClientToolConfig.convert(bad)).toFailWith(/parametersSchema/i);
    });

    test('rejects parametersSchema with toJson but no validate', () => {
      const bad = {
        ...validConfig,
        parametersSchema: { toJson: (): unknown => ({}) }
      };
      expect(aiClientToolConfig.convert(bad)).toFailWith(/parametersSchema/i);
    });
  });
});
