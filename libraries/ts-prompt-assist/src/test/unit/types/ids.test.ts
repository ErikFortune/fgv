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
import { Convert } from '../../../packlets/types';

describe('Convert namespace (branded id converters)', () => {
  describe('Convert.promptId', () => {
    test('converts a valid string to PromptId', () => {
      expect(Convert.promptId.convert('my-prompt')).toSucceedAndSatisfy((id) => {
        expect(id as string).toBe('my-prompt');
      });
    });

    test('fails on non-string input', () => {
      expect(Convert.promptId.convert(42)).toFail();
    });

    test('fails on null input', () => {
      expect(Convert.promptId.convert(null)).toFail();
    });

    test('fails on undefined input', () => {
      expect(Convert.promptId.convert(undefined)).toFail();
    });
  });

  describe('Convert.slotName', () => {
    test('converts a valid string to SlotName', () => {
      expect(Convert.slotName.convert('user-name')).toSucceedAndSatisfy((name) => {
        expect(name as string).toBe('user-name');
      });
    });

    test('fails on non-string input', () => {
      expect(Convert.slotName.convert({})).toFail();
    });
  });

  describe('Convert.resourceId', () => {
    test('converts a valid string to ResourceId', () => {
      expect(Convert.resourceId.convert('res-123')).toSucceedAndSatisfy((id) => {
        expect(id as string).toBe('res-123');
      });
    });

    test('fails on non-string input', () => {
      expect(Convert.resourceId.convert(true)).toFail();
    });
  });

  describe('Convert.converterId', () => {
    test('converts a valid string to ConverterId', () => {
      expect(Convert.converterId.convert('json-converter')).toSucceedAndSatisfy((id) => {
        expect(id as string).toBe('json-converter');
      });
    });

    test('fails on non-string input', () => {
      expect(Convert.converterId.convert([])).toFail();
    });
  });

  describe('Convert.serializerId', () => {
    test('converts a valid string to SerializerId', () => {
      expect(Convert.serializerId.convert('my-serializer')).toSucceedAndSatisfy((id) => {
        expect(id as string).toBe('my-serializer');
      });
    });

    test('fails on non-string input', () => {
      expect(Convert.serializerId.convert(0)).toFail();
    });
  });

  describe('Convert.validatorId', () => {
    test('converts a valid string to ValidatorId', () => {
      expect(Convert.validatorId.convert('schema-validator')).toSucceedAndSatisfy((id) => {
        expect(id as string).toBe('schema-validator');
      });
    });

    test('fails on non-string input', () => {
      expect(Convert.validatorId.convert(null)).toFail();
    });
  });

  describe('Convert.axisName', () => {
    test('converts a valid string to AxisName', () => {
      expect(Convert.axisName.convert('language')).toSucceedAndSatisfy((name) => {
        expect(name as string).toBe('language');
      });
    });

    test('fails on non-string input', () => {
      expect(Convert.axisName.convert({})).toFail();
    });
  });

  describe('Convert.scopeKey', () => {
    test('converts a valid string to ScopeKey', () => {
      expect(Convert.scopeKey.convert('global')).toSucceedAndSatisfy((key) => {
        expect(key as string).toBe('global');
      });
    });

    test('fails on non-string input', () => {
      expect(Convert.scopeKey.convert(undefined)).toFail();
    });
  });
});
