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

describe('AiAssist.registry', () => {
  describe('getProviderDescriptors', () => {
    test('returns all built-in providers', () => {
      const descriptors = AiAssist.getProviderDescriptors();
      expect(descriptors.length).toBeGreaterThan(0);

      // Should include copy-paste and at least some API providers
      const ids = descriptors.map((d) => d.id);
      expect(ids).toContain('copy-paste');
      expect(ids).toContain('xai-grok');
      expect(ids).toContain('anthropic');
      expect(ids).toContain('google-gemini');
    });

    test('copy-paste is the first provider', () => {
      const descriptors = AiAssist.getProviderDescriptors();
      expect(descriptors[0].id).toBe('copy-paste');
    });
  });

  describe('getProviderDescriptor', () => {
    test('returns descriptor for known provider', () => {
      expect(AiAssist.getProviderDescriptor('xai-grok')).toSucceedAndSatisfy((desc) => {
        expect(desc.id).toBe('xai-grok');
        expect(desc.label).toBe('xAI Grok');
        expect(desc.needsSecret).toBe(true);
        expect(desc.apiFormat).toBe('openai');
        expect(desc.baseUrl).toBeTruthy();
        expect(desc.defaultModel).toBeTruthy();
      });
    });

    test('fails for unknown provider', () => {
      expect(AiAssist.getProviderDescriptor('unknown-provider')).toFailWith(/unknown AI provider/i);
    });
  });

  describe('allProviderIds', () => {
    test('contains all provider ids in same order as descriptors', () => {
      const descriptors = AiAssist.getProviderDescriptors();
      const expectedIds = descriptors.map((d) => d.id);
      expect(AiAssist.allProviderIds).toEqual(expectedIds);
    });
  });
});
