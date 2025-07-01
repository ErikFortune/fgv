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

import '../../helpers/jest';

import { Validators } from '../../../packlets/validation';

describe('recordOf validator', () => {
  test('validates a valid object', () => {
    const srcObject = {
      p1: 's1',
      p2: 's2',
      p3: 's3'
    };
    expect(Validators.recordOf(Validators.string).validate(srcObject)).toSucceedWith(srcObject);
  });

  test('fails an object which contains values that cannot be validated if onError is "fail"', () => {
    const srcObject = {
      p1: 's1',
      p2: 's2',
      p3: 's3',
      p4: 10
    };
    expect(Validators.recordOf(Validators.string, { onError: 'fail' }).validate(srcObject)).toFailWith(
      /not a string/i
    );
  });

  test('ignores inherited or non-enumerable properties even if onError is "fail"', () => {
    interface IBaseObject {
      p1: string;
      p2: string;
      p3: string;
      p4: number;
      base1: number;
    }
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const BaseObjectFunc = function (this: IBaseObject): void {
      this.p1 = 's1';
      this.p2 = 's2';
      this.p3 = 's3';
      Object.defineProperty(this, 'p4', { value: 10, enumerable: false });
    };
    BaseObjectFunc.prototype.base1 = 100;

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const BaseObject = BaseObjectFunc as unknown as { new (): IBaseObject };

    const srcObject = new BaseObject();

    // make sure our source object looks as expected
    expect(srcObject.base1).toBe(100);
    expect(srcObject.hasOwnProperty('base1')).toBe(false);
    expect(srcObject.p4).toBe(10);

    [Validators.recordOf(Validators.string, { onError: 'fail' })].forEach((validator) => {
      expect(validator.validate(srcObject)).toSucceed();
    });
  });

  test('ignores values that cannot be validated if onError is "ignore"', () => {
    const validObject = {
      p1: 's1',
      p2: 's2',
      p3: 's3'
    };
    const badObject = { ...validObject, badField: 10 };
    expect(Validators.recordOf(Validators.string, { onError: 'ignore' }).validate(badObject)).toSucceed();
  });

  test('defaults to onError="fail"', () => {
    expect(Validators.recordOf(Validators.string).validate({ bad: true })).toFail();
    expect(Validators.recordOf(Validators.string, {}).validate({ bad: true })).toFail();
  });

  test('passes a supplied context to the base validator', () => {
    type SomeEnum = 'val1' | 'val2' | 'val3';
    const enumValidator = Validators.enumeratedValue<SomeEnum>(['val1', 'val2', 'val3']);
    const context: SomeEnum[] = ['val1', 'val2'];

    const source = {
      s1: 'val1',
      s2: 'val2',
      s3: 'val3'
    };
    type EnumRecord = {
      [key in keyof typeof source]: SomeEnum;
    };

    expect(Validators.recordOf(enumValidator).validate(source)).toSucceedWith(source as EnumRecord);
    expect(Validators.recordOf(enumValidator).validate(source, context)).toFailWith(
      /invalid enumerated value/i
    );
  });

  test('fails when validating a non-object', () => {
    [123, true, ['hello'], null].forEach((t) => {
      expect(Validators.recordOf(Validators.string).validate(t)).toFailWith(/not a string-keyed object/i);
    });
  });

  describe('with key validation', () => {
    const keyValidator = Validators.string.withConstraint((k: string) => !k.startsWith('bad'));

    test('applies a supplied key validator', () => {
      const prefixValidator = Validators.recordOf(Validators.string, { keyValidator });
      const srcObject = {
        p1: 's1'
      };
      expect(prefixValidator.validate(srcObject)).toSucceedWith(srcObject);
    });

    test('passes a supplied context to the key validator', () => {
      type SomeEnum = 'val1' | 'val2' | 'val3';
      const keyValidator = Validators.enumeratedValue<SomeEnum>(['val1', 'val2', 'val3']);
      const context: SomeEnum[] = ['val1', 'val2'];
      const source = {
        val1: 'some value 1',
        val2: 'some value 2',
        val3: 'some value 3'
      };

      [
        Validators.recordOf(Validators.string, { keyValidator }),
        Validators.recordOf(Validators.string, { keyValidator, onError: 'fail' })
      ].forEach((validator) => {
        expect(validator.validate(source)).toSucceedWith(source);
        expect(validator.validate(source, context)).toFailWith(/invalid enumerated value/i);
      });
    });

    test('fails if a key fails validation', () => {
      const srcObject = {
        p1: 's1',
        badp2: 's2'
      };
      [
        Validators.recordOf(Validators.string, { keyValidator }),
        Validators.recordOf(Validators.string, { keyValidator, onError: 'fail' })
      ].forEach((validator) => {
        expect(validator.validate(srcObject)).toFailWith(/does not meet constraint/i);
      });
    });

    test('ignores failed key validations if "ignore" is specified', () => {
      const srcObject = {
        p1: 's1',
        badp2: 's2'
      };
      [Validators.recordOf(Validators.string, { keyValidator, onError: 'ignore' })].forEach((validator) => {
        expect(validator.validate(srcObject)).toSucceedWith(srcObject);
      });
    });
  });
});
