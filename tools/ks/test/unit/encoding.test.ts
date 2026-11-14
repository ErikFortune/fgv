import '@fgv/ts-utils-jest';

import { encodeSecret, ENCODINGS, parseEncoding } from '../../src/encoding';

describe('encoding', () => {
  describe('parseEncoding', () => {
    test('returns the default encoding when undefined', () => {
      expect(parseEncoding(undefined)).toSucceedWith('text');
    });

    test.each(ENCODINGS)('accepts %s', (value) => {
      expect(parseEncoding(value)).toSucceedWith(value);
    });

    test('normalizes case', () => {
      expect(parseEncoding('BASE64')).toSucceedWith('base64');
      expect(parseEncoding('Hex')).toSucceedWith('hex');
    });

    test('rejects unknown values', () => {
      expect(parseEncoding('utf16')).toFailWith(/invalid encoding 'utf16'/i);
    });
  });

  describe('encodeSecret', () => {
    test('returns text values unchanged', () => {
      expect(encodeSecret('hello world', 'text')).toBe('hello world');
    });

    test('base64-encodes the UTF-8 bytes (with padding)', () => {
      expect(encodeSecret('hello', 'base64')).toBe('aGVsbG8=');
    });

    test('hex-encodes the UTF-8 bytes', () => {
      expect(encodeSecret('hello', 'hex')).toBe('68656c6c6f');
    });

    test('preserves multi-byte UTF-8 characters round-trip via base64', () => {
      const original = 'café-✓-naïve';
      const encoded = encodeSecret(original, 'base64');
      expect(Buffer.from(encoded, 'base64').toString('utf8')).toBe(original);
    });

    test('preserves multi-byte UTF-8 characters round-trip via hex', () => {
      const original = 'café-✓-naïve';
      const encoded = encodeSecret(original, 'hex');
      expect(Buffer.from(encoded, 'hex').toString('utf8')).toBe(original);
    });
  });
});
