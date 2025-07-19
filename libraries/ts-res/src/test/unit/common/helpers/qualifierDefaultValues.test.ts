/*
 * Copyright (c) 2025 Erik Fortune
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
import { Helpers as CommonHelpers } from '../../../../packlets/common';

describe('QualifierDefaultValues Common Helpers', () => {
  describe('buildQualifierDefaultValueToken', () => {
    test('builds simple qualifier default value token', () => {
      const parts: CommonHelpers.IQualifierDefaultValueTokenParts = {
        qualifier: 'language',
        value: 'en-US'
      };

      expect(CommonHelpers.buildQualifierDefaultValueToken(parts)).toSucceedAndSatisfy((result) => {
        expect(result).toBe('language=en-US');
      });
    });

    test('builds token with empty value', () => {
      const parts: CommonHelpers.IQualifierDefaultValueTokenParts = {
        qualifier: 'language',
        value: ''
      };

      expect(CommonHelpers.buildQualifierDefaultValueToken(parts)).toSucceedAndSatisfy((result) => {
        expect(result).toBe('language=');
      });
    });

    test('builds token with comma-separated values', () => {
      const parts: CommonHelpers.IQualifierDefaultValueTokenParts = {
        qualifier: 'language',
        value: 'en-US,fr-CA,de-DE'
      };

      expect(CommonHelpers.buildQualifierDefaultValueToken(parts)).toSucceedAndSatisfy((result) => {
        expect(result).toBe('language=en-US,fr-CA,de-DE');
      });
    });

    test('builds token with spaces in values', () => {
      const parts: CommonHelpers.IQualifierDefaultValueTokenParts = {
        qualifier: 'region',
        value: 'North America'
      };

      expect(CommonHelpers.buildQualifierDefaultValueToken(parts)).toSucceedAndSatisfy((result) => {
        expect(result).toBe('region=North America');
      });
    });

    test('fails with invalid qualifier name (empty)', () => {
      const parts: CommonHelpers.IQualifierDefaultValueTokenParts = {
        qualifier: '',
        value: 'en-US'
      };

      expect(CommonHelpers.buildQualifierDefaultValueToken(parts)).toFailWith(
        /not a valid qualifier default value token/i
      );
    });

    test('fails with invalid qualifier name (starts with number)', () => {
      const parts: CommonHelpers.IQualifierDefaultValueTokenParts = {
        qualifier: '1language',
        value: 'en-US'
      };

      expect(CommonHelpers.buildQualifierDefaultValueToken(parts)).toFailWith(
        /not a valid qualifier default value token/i
      );
    });

    test('fails with invalid qualifier name (contains spaces)', () => {
      const parts: CommonHelpers.IQualifierDefaultValueTokenParts = {
        qualifier: 'my language',
        value: 'en-US'
      };

      expect(CommonHelpers.buildQualifierDefaultValueToken(parts)).toFailWith(
        /not a valid qualifier default value token/i
      );
    });

    test('succeeds with valid qualifier name containing underscores and hyphens', () => {
      const parts: CommonHelpers.IQualifierDefaultValueTokenParts = {
        qualifier: 'my_qualifier-name',
        value: 'value'
      };

      expect(CommonHelpers.buildQualifierDefaultValueToken(parts)).toSucceedAndSatisfy((result) => {
        expect(result).toBe('my_qualifier-name=value');
      });
    });
  });

  describe('buildQualifierDefaultValuesToken', () => {
    test('builds token from single qualifier part', () => {
      const parts: CommonHelpers.IQualifierDefaultValueTokenParts[] = [
        { qualifier: 'language', value: 'en-US' }
      ];

      expect(CommonHelpers.buildQualifierDefaultValuesToken(parts)).toSucceedAndSatisfy((result) => {
        expect(result).toBe('language=en-US');
      });
    });

    test('builds token from multiple qualifier parts', () => {
      const parts: CommonHelpers.IQualifierDefaultValueTokenParts[] = [
        { qualifier: 'language', value: 'en-US' },
        { qualifier: 'territory', value: 'US' },
        { qualifier: 'environment', value: 'production' }
      ];

      expect(CommonHelpers.buildQualifierDefaultValuesToken(parts)).toSucceedAndSatisfy((result) => {
        expect(result).toBe('language=en-US|territory=US|environment=production');
      });
    });

    test('builds token from empty array', () => {
      const parts: CommonHelpers.IQualifierDefaultValueTokenParts[] = [];

      expect(CommonHelpers.buildQualifierDefaultValuesToken(parts)).toSucceedAndSatisfy((result) => {
        expect(result).toBe('');
      });
    });

    test('builds token with mix of empty and non-empty values', () => {
      const parts: CommonHelpers.IQualifierDefaultValueTokenParts[] = [
        { qualifier: 'language', value: '' },
        { qualifier: 'territory', value: 'US' },
        { qualifier: 'environment', value: '' }
      ];

      expect(CommonHelpers.buildQualifierDefaultValuesToken(parts)).toSucceedAndSatisfy((result) => {
        expect(result).toBe('language=|territory=US|environment=');
      });
    });

    test('builds token with comma-separated values', () => {
      const parts: CommonHelpers.IQualifierDefaultValueTokenParts[] = [
        { qualifier: 'language', value: 'en-US,fr-CA' },
        { qualifier: 'region', value: 'US,CA,GB' }
      ];

      expect(CommonHelpers.buildQualifierDefaultValuesToken(parts)).toSucceedAndSatisfy((result) => {
        expect(result).toBe('language=en-US,fr-CA|region=US,CA,GB');
      });
    });

    test('fails when any qualifier part is invalid', () => {
      const parts: CommonHelpers.IQualifierDefaultValueTokenParts[] = [
        { qualifier: 'language', value: 'en-US' },
        { qualifier: '', value: 'US' }, // Invalid qualifier name
        { qualifier: 'environment', value: 'production' }
      ];

      expect(CommonHelpers.buildQualifierDefaultValuesToken(parts)).toFailWith(
        /not a valid qualifier default value token/i
      );
    });
  });

  describe('parseQualifierDefaultValueTokenParts', () => {
    test('parses simple qualifier default value token', () => {
      expect(CommonHelpers.parseQualifierDefaultValueTokenParts('language=en-US')).toSucceedAndSatisfy(
        (parts) => {
          expect(parts.qualifier).toBe('language');
          expect(parts.value).toBe('en-US');
        }
      );
    });

    test('parses token with empty value', () => {
      expect(CommonHelpers.parseQualifierDefaultValueTokenParts('language=')).toSucceedAndSatisfy((parts) => {
        expect(parts.qualifier).toBe('language');
        expect(parts.value).toBe('');
      });
    });

    test('parses token with comma-separated values', () => {
      expect(
        CommonHelpers.parseQualifierDefaultValueTokenParts('language=en-US,fr-CA,de-DE')
      ).toSucceedAndSatisfy((parts) => {
        expect(parts.qualifier).toBe('language');
        expect(parts.value).toBe('en-US,fr-CA,de-DE');
      });
    });

    test('parses token with spaces and special characters in value', () => {
      expect(CommonHelpers.parseQualifierDefaultValueTokenParts('region=North_America')).toSucceedAndSatisfy(
        (parts) => {
          expect(parts.qualifier).toBe('region');
          expect(parts.value).toBe('North_America');
        }
      );
    });

    test('parses token with underscores and hyphens in qualifier name', () => {
      expect(
        CommonHelpers.parseQualifierDefaultValueTokenParts('my_qualifier-name=value')
      ).toSucceedAndSatisfy((parts) => {
        expect(parts.qualifier).toBe('my_qualifier-name');
        expect(parts.value).toBe('value');
      });
    });

    test('fails with missing equals sign', () => {
      expect(CommonHelpers.parseQualifierDefaultValueTokenParts('language')).toFailWith(
        /not a valid qualifier default value token/i
      );
    });

    test('fails with multiple equals signs', () => {
      expect(CommonHelpers.parseQualifierDefaultValueTokenParts('language=en=US')).toFailWith(
        /not a valid qualifier default value token/i
      );
    });

    test('fails with empty qualifier name', () => {
      expect(CommonHelpers.parseQualifierDefaultValueTokenParts('=en-US')).toFailWith(
        /not a valid qualifier default value token/i
      );
    });

    test('fails with invalid qualifier name (starts with number)', () => {
      expect(CommonHelpers.parseQualifierDefaultValueTokenParts('1language=en-US')).toFailWith(
        /not a valid qualifier default value token/i
      );
    });

    test('fails with invalid qualifier name (contains spaces)', () => {
      expect(CommonHelpers.parseQualifierDefaultValueTokenParts('my language=en-US')).toFailWith(
        /not a valid qualifier default value token/i
      );
    });

    test('fails with invalid qualifier name (contains special characters)', () => {
      expect(CommonHelpers.parseQualifierDefaultValueTokenParts('language@name=en-US')).toFailWith(
        /not a valid qualifier default value token/i
      );
    });

    test('fails with empty token', () => {
      expect(CommonHelpers.parseQualifierDefaultValueTokenParts('')).toFailWith(
        /not a valid qualifier default value token/i
      );
    });

    test('fails with whitespace-only token', () => {
      expect(CommonHelpers.parseQualifierDefaultValueTokenParts('   ')).toFailWith(
        /not a valid qualifier default value token/i
      );
    });
  });

  describe('parseQualifierDefaultValuesTokenParts', () => {
    test('parses single qualifier token', () => {
      expect(CommonHelpers.parseQualifierDefaultValuesTokenParts('language=en-US')).toSucceedAndSatisfy(
        (parts) => {
          expect(parts).toHaveLength(1);
          expect(parts[0].qualifier).toBe('language');
          expect(parts[0].value).toBe('en-US');
        }
      );
    });

    test('parses multiple qualifier tokens', () => {
      expect(
        CommonHelpers.parseQualifierDefaultValuesTokenParts(
          'language=en-US|territory=US|environment=production'
        )
      ).toSucceedAndSatisfy((parts) => {
        expect(parts).toHaveLength(3);

        expect(parts[0].qualifier).toBe('language');
        expect(parts[0].value).toBe('en-US');

        expect(parts[1].qualifier).toBe('territory');
        expect(parts[1].value).toBe('US');

        expect(parts[2].qualifier).toBe('environment');
        expect(parts[2].value).toBe('production');
      });
    });

    test('parses tokens with empty values', () => {
      expect(
        CommonHelpers.parseQualifierDefaultValuesTokenParts('language=|territory=US|environment=')
      ).toSucceedAndSatisfy((parts) => {
        expect(parts).toHaveLength(3);

        expect(parts[0].qualifier).toBe('language');
        expect(parts[0].value).toBe('');

        expect(parts[1].qualifier).toBe('territory');
        expect(parts[1].value).toBe('US');

        expect(parts[2].qualifier).toBe('environment');
        expect(parts[2].value).toBe('');
      });
    });

    test('parses tokens with comma-separated values', () => {
      expect(
        CommonHelpers.parseQualifierDefaultValuesTokenParts('language=en-US,fr-CA|region=US,CA,GB')
      ).toSucceedAndSatisfy((parts) => {
        expect(parts).toHaveLength(2);

        expect(parts[0].qualifier).toBe('language');
        expect(parts[0].value).toBe('en-US,fr-CA');

        expect(parts[1].qualifier).toBe('region');
        expect(parts[1].value).toBe('US,CA,GB');
      });
    });

    test('parses empty token as empty array', () => {
      expect(CommonHelpers.parseQualifierDefaultValuesTokenParts('')).toSucceedAndSatisfy((parts) => {
        expect(parts).toHaveLength(0);
      });
    });

    test('handles whitespace around pipe separators', () => {
      expect(
        CommonHelpers.parseQualifierDefaultValuesTokenParts(
          ' language=en-US | territory=US | environment=production '
        )
      ).toSucceedAndSatisfy((parts) => {
        expect(parts).toHaveLength(3);
        expect(parts[0].qualifier).toBe('language');
        expect(parts[1].qualifier).toBe('territory');
        expect(parts[2].qualifier).toBe('environment');
      });
    });

    test('handles tokens with spaces in values', () => {
      expect(
        CommonHelpers.parseQualifierDefaultValuesTokenParts('region=North America|environment=production')
      ).toSucceedAndSatisfy((parts) => {
        expect(parts).toHaveLength(2);
        expect(parts[0].value).toBe('North America');
        expect(parts[1].value).toBe('production');
      });
    });

    test('fails when any token is invalid', () => {
      expect(
        CommonHelpers.parseQualifierDefaultValuesTokenParts('language=en-US|invalid-token|territory=US')
      ).toFailWith(/not a valid qualifier default value token/i);
    });

    test('fails with pipe only', () => {
      expect(CommonHelpers.parseQualifierDefaultValuesTokenParts('|')).toFailWith(
        /not a valid qualifier default value token/i
      );
    });

    test('fails with empty tokens in pipe-separated list', () => {
      expect(CommonHelpers.parseQualifierDefaultValuesTokenParts('language=en-US||territory=US')).toFailWith(
        /not a valid qualifier default value token/i
      );
    });

    test('fails with whitespace-only tokens', () => {
      expect(
        CommonHelpers.parseQualifierDefaultValuesTokenParts('language=en-US|   |territory=US')
      ).toFailWith(/not a valid qualifier default value token/i);
    });

    test('handles complex real-world example', () => {
      const complexToken =
        'language=en-US,en-CA,en-GB|territory=US|region=North America,Europe|environment=production';

      expect(CommonHelpers.parseQualifierDefaultValuesTokenParts(complexToken)).toSucceedAndSatisfy(
        (parts) => {
          expect(parts).toHaveLength(4);

          expect(parts[0].qualifier).toBe('language');
          expect(parts[0].value).toBe('en-US,en-CA,en-GB');

          expect(parts[1].qualifier).toBe('territory');
          expect(parts[1].value).toBe('US');

          expect(parts[2].qualifier).toBe('region');
          expect(parts[2].value).toBe('North America,Europe');

          expect(parts[3].qualifier).toBe('environment');
          expect(parts[3].value).toBe('production');
        }
      );
    });
  });

  describe('round-trip parsing and building', () => {
    test('round-trip single token', () => {
      const originalParts: CommonHelpers.IQualifierDefaultValueTokenParts = {
        qualifier: 'language',
        value: 'en-US'
      };

      expect(CommonHelpers.buildQualifierDefaultValueToken(originalParts)).toSucceedAndSatisfy((token) => {
        expect(CommonHelpers.parseQualifierDefaultValueTokenParts(token)).toSucceedAndSatisfy(
          (parsedParts) => {
            expect(parsedParts).toEqual(originalParts);
          }
        );
      });
    });

    test('round-trip multiple tokens', () => {
      const originalParts: CommonHelpers.IQualifierDefaultValueTokenParts[] = [
        { qualifier: 'language', value: 'en-US,fr-CA' },
        { qualifier: 'territory', value: 'US' },
        { qualifier: 'environment', value: '' },
        { qualifier: 'region', value: 'North_America' }
      ];

      expect(CommonHelpers.buildQualifierDefaultValuesToken(originalParts)).toSucceedAndSatisfy((token) => {
        expect(CommonHelpers.parseQualifierDefaultValuesTokenParts(token)).toSucceedAndSatisfy(
          (parsedParts) => {
            expect(parsedParts).toEqual(originalParts);
          }
        );
      });
    });

    test('round-trip empty values', () => {
      const originalParts: CommonHelpers.IQualifierDefaultValueTokenParts[] = [
        { qualifier: 'language', value: '' },
        { qualifier: 'territory', value: '' }
      ];

      expect(CommonHelpers.buildQualifierDefaultValuesToken(originalParts)).toSucceedAndSatisfy((token) => {
        expect(CommonHelpers.parseQualifierDefaultValuesTokenParts(token)).toSucceedAndSatisfy(
          (parsedParts) => {
            expect(parsedParts).toEqual(originalParts);
          }
        );
      });
    });

    test('round-trip empty array', () => {
      const originalParts: CommonHelpers.IQualifierDefaultValueTokenParts[] = [];

      expect(CommonHelpers.buildQualifierDefaultValuesToken(originalParts)).toSucceedAndSatisfy((token) => {
        expect(CommonHelpers.parseQualifierDefaultValuesTokenParts(token)).toSucceedAndSatisfy(
          (parsedParts) => {
            expect(parsedParts).toEqual(originalParts);
          }
        );
      });
    });
  });

  describe('edge cases and boundary conditions', () => {
    test('handles maximum length qualifier names', () => {
      const longQualifier = 'a'.repeat(50) + '_' + 'b'.repeat(50);
      const parts: CommonHelpers.IQualifierDefaultValueTokenParts = {
        qualifier: longQualifier,
        value: 'value'
      };

      // Should succeed if qualifier name follows the pattern
      expect(CommonHelpers.buildQualifierDefaultValueToken(parts)).toSucceedAndSatisfy((result) => {
        expect(result).toBe(`${longQualifier}=value`);
      });
    });

    test('handles values with allowed special characters', () => {
      const parts: CommonHelpers.IQualifierDefaultValueTokenParts = {
        qualifier: 'special',
        value: 'value-with_special_chars123'
      };

      expect(CommonHelpers.buildQualifierDefaultValueToken(parts)).toSucceedAndSatisfy((result) => {
        expect(result).toBe('special=value-with_special_chars123');
      });
    });

    test('fails with Unicode characters in values', () => {
      const parts: CommonHelpers.IQualifierDefaultValueTokenParts = {
        qualifier: 'unicode',
        value: 'français,español,中文'
      };

      expect(CommonHelpers.buildQualifierDefaultValueToken(parts)).toFailWith(
        /not a valid qualifier default value token/i
      );
    });

    test('accepts qualifier names with leading underscore and numbers after letters', () => {
      const parts: CommonHelpers.IQualifierDefaultValueTokenParts = {
        qualifier: '_q123ualifier',
        value: 'value'
      };

      expect(CommonHelpers.buildQualifierDefaultValueToken(parts)).toSucceedAndSatisfy((result) => {
        expect(result).toBe('_q123ualifier=value');
      });
    });

    test('accepts qualifier names starting with underscore and letter', () => {
      const parts: CommonHelpers.IQualifierDefaultValueTokenParts = {
        qualifier: '_qualifier',
        value: 'value'
      };

      expect(CommonHelpers.buildQualifierDefaultValueToken(parts)).toSucceedAndSatisfy((result) => {
        expect(result).toBe('_qualifier=value');
      });
    });

    test('handles very long values', () => {
      const longValue = 'value'.repeat(100);
      const parts: CommonHelpers.IQualifierDefaultValueTokenParts = {
        qualifier: 'test',
        value: longValue
      };

      expect(CommonHelpers.buildQualifierDefaultValueToken(parts)).toSucceedAndSatisfy((result) => {
        expect(result).toBe(`test=${longValue}`);
      });
    });

    test('handles many comma-separated values', () => {
      const manyValues = Array.from({ length: 50 }, (unusedValue, i) => `value${i}`).join(',');
      const parts: CommonHelpers.IQualifierDefaultValueTokenParts = {
        qualifier: 'many',
        value: manyValues
      };

      expect(CommonHelpers.buildQualifierDefaultValueToken(parts)).toSucceedAndSatisfy((result) => {
        expect(result).toBe(`many=${manyValues}`);
      });
    });
  });
});
