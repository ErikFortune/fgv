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

import '../helpers/jest';

import { Converter, Converters, convalidate } from '../../packlets/conversion';
import { Validator, Validators } from '../../packlets/validation';

interface ITestThing {
  s: string;
  a: number[];
}

const converter: Converter<ITestThing> = Converters.object<ITestThing>({
  s: Converters.string,
  a: Converters.arrayOf(Converters.number)
});

const validator: Validator<ITestThing> = Validators.object<ITestThing>({
  s: Validators.string,
  a: Validators.arrayOf(Validators.number)
});

const thing1: ITestThing = {
  s: 'some string',
  a: [10, 20, 30]
};

const thing2 = {
  s: 'some string',
  a: [10, 20, 30],
  extraProperty: 'hi there'
};

describe('convalidate helper', () => {
  test('converts with a converter', () => {
    const testThing = convalidate(converter, thing1).orThrow();
    expect(testThing).toEqual(thing1);
    expect(testThing).not.toBe(thing1);
  });

  test('validates with a validator', () => {
    const testThing = convalidate(validator, thing1).orThrow();
    expect(testThing).toEqual(thing1);
    expect(testThing).toBe(thing1);
  });

  test('converter omits unknown properties', () => {
    const testThing = convalidate(converter, thing2).orThrow();
    expect(testThing).toEqual(thing1);
    expect(testThing).not.toEqual(thing2);
    expect(testThing).not.toBe(thing1);
    expect(testThing).not.toBe(thing2);
  });

  test('validator leaves unknown properties intact', () => {
    const testThing = convalidate(validator, thing2).orThrow();
    expect(testThing).not.toEqual(thing1);
    expect(testThing).toEqual(thing2);
    expect(testThing).not.toBe(thing1);
    expect(testThing).toBe(thing2);
  });
});
