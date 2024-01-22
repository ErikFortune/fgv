/*
 * Copyright (c) 2024 Erik Fortune
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

import { Classes, Validators } from '../../../packlets/validation';
import '../../helpers/jest';

describe('OneOfValidator class', () => {
  const validator = Validators.oneOf<boolean | string | number>([
    Validators.boolean,
    Validators.string,
    Validators.number
  ]);

  describe('constructor', () => {
    test('uses options supplied via the constructor', () => {
      const validators = [Validators.string, Validators.number];
      const trueContext = new Classes.OneOfValidator<string | number>({
        validators,
        options: { defaultContext: true }
      });
      const falseContext = new Classes.OneOfValidator<string | number>({
        validators,
        options: { defaultContext: false }
      });
      expect(trueContext.options.defaultContext).toBe(true);
      expect(falseContext.options.defaultContext).toBe(false);
    });

    test('uses options supplied via the helper', () => {
      const validators = [Validators.string, Validators.number];
      const trueContext = Validators.oneOf<string | number>(validators, {
        options: { defaultContext: true }
      });
      const falseContext = Validators.oneOf<string | number>(validators, {
        options: { defaultContext: false }
      });
      expect(trueContext.options.defaultContext).toBe(true);
      expect(falseContext.options.defaultContext).toBe(false);
    });

    test('uses traits supplied via the constructor', () => {
      const validators = [Validators.string, Validators.number];
      const optional = new Classes.OneOfValidator<string | number>({
        validators,
        traits: { isOptional: true }
      });
      const notOptional = new Classes.OneOfValidator<string | number>({
        validators,
        traits: { isOptional: false }
      });
      expect(optional.isOptional).toBe(true);
      expect(notOptional.isOptional).toBe(false);
    });
  });

  test('succeeds if any of the supplied validators match', () => {
    expect(validator.validate('this is a string')).toSucceedWith('this is a string');
    expect(validator.validate(true)).toSucceedWith(true);
    expect(validator.validate(false)).toSucceedWith(false);
    expect(validator.validate(0)).toSucceedWith(0);
    expect(validator.validate(-100)).toSucceedWith(-100);
  });

  test('fails if none of the supplied validators match', () => {
    expect(validator.validate(['this is a string in an array'])).toFailWith(/does not match/);
  });
});
