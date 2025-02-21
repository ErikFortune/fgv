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
import * as TsRes from '../../../index';

const validIdentifiers: string[] = [
  'abc',
  '_a10',
  'this-is-an-identifier',
  '_This_Is_Also-An_Identifier10',
  'A'
];

const invalidIdentifiers: string[] = [
  '',
  ' not_an_identifier',
  'also not an identifier',
  '1not_identifier',
  'rats!'
];

describe('common conditions', () => {
  test.each(validIdentifiers)('%s is valid as qualifierName and qualifierTypeName', (identifier) => {
    expect(TsRes.Validate.isValidQualifierName(identifier)).toBe(true);
    expect(TsRes.Validate.isValidQualifierTypeName(identifier)).toBe(true);
    expect(TsRes.Validate.toQualifierName(identifier)).toSucceedWith(identifier as TsRes.QualifierName);
    expect(TsRes.Validate.toQualifierTypeName(identifier)).toSucceedWith(
      identifier as TsRes.QualifierTypeName
    );
  });
  test.each(invalidIdentifiers)('%s is not a valid qualifierName and qualifierTypeName', (identifier) => {
    expect(TsRes.Validate.isValidQualifierName(identifier)).toBe(false);
    expect(TsRes.Validate.isValidQualifierTypeName(identifier)).toBe(false);
    expect(TsRes.Validate.toQualifierName(identifier)).toFailWith(/not a valid qualifier name/i);
    expect(TsRes.Validate.toQualifierTypeName(identifier)).toFailWith(/not a valid qualifier type name/i);
  });

  test.each([0, 1, 10, 100])('%s is a valid index for various condition collectibles', (index) => {
    expect(TsRes.Validate.isValidQualifierIndex(index)).toBe(true);
    expect(TsRes.Validate.isValidQualifierTypeIndex(index)).toBe(true);
    expect(TsRes.Validate.isValidConditionIndex(index)).toBe(true);
    expect(TsRes.Validate.isValidConditionSetIndex(index)).toBe(true);
    expect(TsRes.Validate.isValidDecisionIndex(index)).toBe(true);
    expect(TsRes.Validate.toQualifierIndex(index)).toSucceedWith(index as TsRes.QualifierIndex);
    expect(TsRes.Validate.toQualifierTypeIndex(index)).toSucceedWith(index as TsRes.QualifierTypeIndex);
    expect(TsRes.Validate.toConditionIndex(index)).toSucceedWith(index as TsRes.ConditionIndex);
    expect(TsRes.Validate.toConditionSetIndex(index)).toSucceedWith(index as TsRes.ConditionSetIndex);
    expect(TsRes.Validate.toDecisionIndex(index)).toSucceedWith(index as TsRes.DecisionIndex);
  });

  test.each([-1, -10, -100])('%s is not a valid index for various condition collectibles', (index) => {
    expect(TsRes.Validate.isValidQualifierIndex(index)).toBe(false);
    expect(TsRes.Validate.isValidQualifierTypeIndex(index)).toBe(false);
    expect(TsRes.Validate.isValidConditionIndex(index)).toBe(false);
    expect(TsRes.Validate.isValidConditionSetIndex(index)).toBe(false);
    expect(TsRes.Validate.isValidDecisionIndex(index)).toBe(false);
    expect(TsRes.Validate.toQualifierIndex(index)).toFailWith(/not a valid qualifier index/i);
    expect(TsRes.Validate.toQualifierTypeIndex(index)).toFailWith(/not a valid qualifier type index/i);
    expect(TsRes.Validate.toConditionIndex(index)).toFailWith(/not a valid condition index/i);
    expect(TsRes.Validate.toConditionSetIndex(index)).toFailWith(/not a valid condition set index/i);
    expect(TsRes.Validate.toDecisionIndex(index)).toFailWith(/not a valid decision index/i);
  });

  test.each([TsRes.MinConditionPriority, TsRes.MaxConditionPriority, 100, 500, 700])(
    `%s is a valid priority`,
    (priority) => {
      expect(TsRes.Validate.isValidConditionPriority(priority)).toBe(true);
      expect(TsRes.Validate.toConditionPriority(priority)).toSucceedWith(priority as TsRes.ConditionPriority);
    }
  );

  test.each([TsRes.MinConditionPriority - 1, TsRes.MaxConditionPriority + 1, -100])(
    '%s is not a valid priority',
    (priority) => {
      expect(TsRes.Validate.isValidConditionPriority(priority)).toBe(false);
      expect(TsRes.Validate.toConditionPriority(priority)).toFailWith(/not a valid priority/i);
    }
  );

  test.each([0.0, 0.5, 1.0, TsRes.NoMatch, TsRes.PerfectMatch])(
    '%s is a valid QualifierMatchScore',
    (score) => {
      expect(TsRes.Validate.isValidQualifierMatchScore(score)).toBe(true);
      expect(TsRes.Validate.toQualifierMatchScore(score)).toSucceedWith(score as TsRes.QualifierMatchScore);
    }
  );

  test.each([-1.0, -0.001, 1.0001])('%s is not a valid QualifierMatchScore', (score) => {
    expect(TsRes.Validate.isValidQualifierMatchScore(score)).toBe(false);
    expect(TsRes.Validate.toQualifierMatchScore(score)).toFailWith(/not a valid match score/i);
  });

  test.each(['always', 'never', 'matches'])('%s is a valid ConditionOperator', (operator) => {
    expect(TsRes.Validate.isValidConditionOperator(operator)).toBe(true);
    expect(TsRes.Validate.toConditionOperator(operator)).toSucceedWith(operator as TsRes.ConditionOperator);
  });

  test.each(['foo', 'bar', 'baz'])('%s is not a valid ConditionOperator', (operator) => {
    expect(TsRes.Validate.isValidConditionOperator(operator)).toBe(false);
    expect(TsRes.Validate.toConditionOperator(operator)).toFailWith(/not a valid condition operator/i);
  });

  test.each(['foo-[bar]', 'foo-matches-[bar]', 'some_qualifier-[some_value]@100'])(
    '%s is a valid condition key',
    (key) => {
      expect(TsRes.Validate.isValidConditionKey(key)).toBe(true);
      expect(TsRes.Validate.toConditionKey(key)).toSucceedWith(key as TsRes.ConditionKey);
    }
  );

  test.each(['foo-[bar', 'foo-matches-bar', 'some_qualifier-[some_value]@10000'])(
    '%s is not a valid condition key',
    (key) => {
      expect(TsRes.Validate.isValidConditionKey(key)).toBe(false);
      expect(TsRes.Validate.toConditionKey(key)).toFailWith(/not a valid condition key/i);
    }
  );

  test.each([
    'foo-[bar]',
    'foo-[bar]+bar-[baz]',
    'foo-[bar]+bar-[baz]+baz-[foo]',
    'foo-[bar]@500+bar-[baz]@600'
  ])('%s is a valid condition set key', (key) => {
    expect(TsRes.Validate.isValidConditionSetKey(key)).toBe(true);
    expect(TsRes.Validate.toConditionSetKey(key)).toSucceedWith(key as TsRes.ConditionSetKey);
  });

  test.each([
    'foo-[bar',
    'foo-[bar]+bar-[baz',
    'foo-[bar]+bar-[baz]+baz-[foo',
    'foo-[bar]@500+bar-[baz]@600+'
  ])('%s is not a valid condition set key', (key) => {
    expect(TsRes.Validate.isValidConditionSetKey(key)).toBe(false);
    expect(TsRes.Validate.toConditionSetKey(key)).toFailWith(/not a valid condition set key/i);
  });

  test.each(['somehash', 'hash1234', 'AnotherH'])('%s is a valid condition set hash', (hash) => {
    expect(TsRes.Validate.isValidConditionSetHash(hash)).toBe(true);
    expect(TsRes.Validate.toConditionSetHash(hash)).toSucceedWith(hash as TsRes.ConditionSetHash);
  });

  test.each(['bad_char', 'bad char', 'short', 'too long by far@'])(
    '%s is not a valid condition set hash',
    (hash) => {
      expect(TsRes.Validate.isValidConditionSetHash(hash)).toBe(false);
      expect(TsRes.Validate.toConditionSetHash(hash)).toFailWith(/not a valid condition set hash/i);
    }
  );

  test.each(['abcd1234', 'abcd1234+efgh5678', 'abcd1234+efgh5678+ijkl9012'])(
    '%s is a valid decision key',
    (key) => {
      expect(TsRes.Validate.isValidDecisionKey(key)).toBe(true);
      expect(TsRes.Validate.toDecisionKey(key)).toSucceedWith(key as TsRes.DecisionKey);
    }
  );

  test.each(['abcd1234+efgh5678+ijkl9012+', 'abcd1234+efgh5678+ijkl9012+mnop_456', 'abcd12345+efgh1234'])(
    '%s is not a valid decision key',
    (key) => {
      expect(TsRes.Validate.isValidDecisionKey(key)).toBe(false);
      expect(TsRes.Validate.toDecisionKey(key)).toFailWith(/not a valid decision key/i);
    }
  );
});
