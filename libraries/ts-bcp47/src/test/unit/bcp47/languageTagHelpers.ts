/*
 * Copyright (c) 2022 Erik Fortune
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
import * as Bcp47 from '../../../packlets/bcp47';

interface IGenericLanguageTagTestExpected<TEXPECTED = string | RegExp> {
  default?: TEXPECTED;
  wellFormed?: TEXPECTED;
  wellFormedCanonical?: TEXPECTED;
  valid?: TEXPECTED;
  validCanonical?: TEXPECTED;
  preferred?: TEXPECTED;
  strictlyValid?: TEXPECTED;
  strictlyValidCanonical?: TEXPECTED;
  strictlyValidPreferred?: TEXPECTED;
}

export type TestKey = keyof IGenericLanguageTagTestExpected;
export const allTestKeys: TestKey[] = [
  'default',
  'wellFormed',
  'wellFormedCanonical',
  'valid',
  'validCanonical',
  'preferred',
  'strictlyValid',
  'strictlyValidCanonical',
  'strictlyValidPreferred'
];

export const allNonCanonicalTestKeys: TestKey[] = ['default', 'wellFormed', 'valid', 'strictlyValid'];
export const allCanonicalTestKeys: TestKey[] = [
  'wellFormedCanonical',
  'validCanonical',
  'preferred',
  'strictlyValidCanonical',
  'strictlyValidPreferred'
];
export const allNonPreferredCanonicalKeys: TestKey[] = [
  'wellFormedCanonical',
  'validCanonical',
  'strictlyValidCanonical'
];
export const allPreferredKeys: TestKey[] = ['preferred', 'strictlyValidPreferred'];
export const allValidatingKeys: TestKey[] = [
  'valid',
  'validCanonical',
  'strictlyValid',
  'strictlyValidCanonical',
  'strictlyValidPreferred',
  'preferred'
];
export interface IGenericLanguageTagTestInit<TFROM, TEXPECTED = string | RegExp> {
  description: string;
  from: TFROM;
  expected: [TEXPECTED | undefined, TestKey[]][];
  expectedDescription?: [string | undefined, TestKey[]][];
}

export class GenericLanguageTagTest<TFROM, TEXPECTED = string | RegExp> {
  public readonly description: string;
  public readonly from: TFROM;
  public readonly expected: IGenericLanguageTagTestExpected<TEXPECTED>;
  public readonly expectedDescription?: IGenericLanguageTagTestExpected<string>;
  public constructor(init: IGenericLanguageTagTestInit<TFROM, TEXPECTED>) {
    this.description = init.description;
    this.from = init.from;

    this.expected = {};
    for (const value of init.expected) {
      for (const key of value[1]) {
        this.expected[key] = value[0];
      }
    }

    if (init.expectedDescription) {
      this.expectedDescription = {};
      for (const value of init.expectedDescription) {
        for (const key of value[1]) {
          this.expectedDescription[key] = value[0];
        }
      }
    } else {
      this.expectedDescription = undefined;
    }
  }

  public static mapInitToTestCases<TFROM, TEXPECTED = string | RegExp>(
    init: IGenericLanguageTagTestInit<TFROM, TEXPECTED>
  ): GenericLanguageTagTest<TFROM, TEXPECTED> {
    return new GenericLanguageTagTest(init);
  }
}

const optionsByKey: Record<TestKey, Bcp47.ILanguageTagInitOptions | undefined> = {
  default: undefined,
  wellFormed: { validity: 'well-formed', normalization: 'none' },
  wellFormedCanonical: { validity: 'well-formed', normalization: 'canonical' },
  valid: { validity: 'valid', normalization: 'none' },
  validCanonical: { validity: 'valid', normalization: 'canonical' },
  preferred: { validity: 'valid', normalization: 'preferred' },
  strictlyValid: { validity: 'strictly-valid', normalization: 'none' },
  strictlyValidCanonical: { validity: 'strictly-valid', normalization: 'canonical' },
  strictlyValidPreferred: { validity: 'strictly-valid', normalization: 'preferred' }
};

export interface ITagTestCase<TFROM, TEXPECTED = string | RegExp> {
  description: string;
  from: TFROM;
  expected?: TEXPECTED;
  expectedDescription?: string;
  invoke(): void;
}

export type TagTestCaseEntry<TFROM, TTESTCASE extends ITagTestCase<TFROM>> = [string, TTESTCASE];

export abstract class TagTestCaseFactoryBase<TFROM, TTESTCASE extends ITagTestCase<TFROM>> {
  public emitOne(
    gtc: GenericLanguageTagTest<TFROM>,
    which: TestKey
  ): TagTestCaseEntry<TFROM, TTESTCASE> | undefined {
    const tc = this._construct(gtc, which);
    return tc.expected ? [tc.description, tc] : undefined;
  }

  public emit(
    which: TestKey | TestKey[],
    all: GenericLanguageTagTest<TFROM>[]
  ): TagTestCaseEntry<TFROM, TTESTCASE>[] {
    if (Array.isArray(which)) {
      return all.flatMap((gtc) => {
        return which
          .map((w) => this.emitOne(gtc, w))
          .filter((tc): tc is TagTestCaseEntry<TFROM, TTESTCASE> => tc !== undefined);
      });
    }
    return (
      all
        .map((gtc) => this.emitOne(gtc, which))
        /* c8 ignore next 1 - defensive filter for test helper, array path covers same logic */
        .filter((tc): tc is TagTestCaseEntry<TFROM, TTESTCASE> => tc !== undefined)
    );
  }

  protected abstract _construct(gtc: GenericLanguageTagTest<TFROM>, which: TestKey): TTESTCASE;
}

export class GenericTagTestCaseFactory<
  TFROM,
  TTESTCASE extends ITagTestCase<TFROM>
> extends TagTestCaseFactoryBase<TFROM, TTESTCASE> {
  protected _construct: (gtc: GenericLanguageTagTest<TFROM>, which: TestKey) => TTESTCASE;

  public constructor(construct: (gtc: GenericLanguageTagTest<TFROM>, which: TestKey) => TTESTCASE) {
    super();
    this._construct = construct;
  }
}

export abstract class SimpleTagTestCaseBase<TFROM> implements ITagTestCase<TFROM> {
  public readonly description: string;
  public readonly from: TFROM;
  public readonly options: Bcp47.ILanguageTagInitOptions | undefined;
  public readonly expected?: string | RegExp;
  public readonly expectedDescription?: string;

  public constructor(gtc: GenericLanguageTagTest<TFROM>, which: TestKey) {
    this.from = gtc.from;
    this.options = optionsByKey[which];

    const expected = gtc.expected[which];
    this.expected = this._getExpectedValue(which, gtc, expected);
    this.expectedDescription = gtc.expectedDescription?.[which];

    const target = this._getTestTarget(which, gtc);

    if (this.isSuccessTest) {
      this.description = this._getSuccessTestDescription(target, gtc.from, gtc.description);
    } else if (this.isFailureTest) {
      this.description = this._getFailureTestDescription(target, gtc.from, gtc.description);
    } else {
      this.description = this._getIgnoredTestDescription(target, gtc.from, gtc.description);
    }
  }

  public get isSuccessTest(): boolean {
    return !this.isFailureTest && !this.isIgnoredTest;
  }

  public get isFailureTest(): boolean {
    return this.expected instanceof RegExp;
  }

  public get isIgnoredTest(): boolean {
    return this.expected === undefined;
  }

  protected _getExpectedValue(
    __which: TestKey,
    __gtc: GenericLanguageTagTest<TFROM>,
    expected: string | RegExp | undefined
  ): string | RegExp | undefined {
    return expected;
  }

  protected _getTestTarget(which: TestKey, __gtc: GenericLanguageTagTest<TFROM>): string {
    return which;
  }

  protected _getSuccessTestDescription(testTarget: string, from: TFROM, description: string): string {
    if (typeof from !== 'string') {
      const fromDesc = JSON.stringify(from, undefined, 2);
      return `${testTarget} succeeds for "${description}" with "${this.expected}" (${fromDesc})`;
    }
    return `${testTarget} succeeds for "${from}" with "${this.expected}" (${description})`;
  }

  protected _getFailureTestDescription(testTarget: string, from: TFROM, description: string): string {
    if (typeof from === 'string') {
      return `${testTarget} fails for "${from}" with "${this.expected}" (${description})`;
    } else {
      const fromDesc = JSON.stringify(from, undefined, 2);
      return `${testTarget} fails for "${description}" with "${this.expected}" (${fromDesc})`;
    }
  }

  protected _getIgnoredTestDescription(testTarget: string, from: TFROM, description: string): string {
    if (typeof from === 'string') {
      return `${testTarget} "${from}" ignored due to expected value {${description}})`;
    } else {
      const fromDesc = JSON.stringify(from, undefined, 2);
      return `${testTarget} "${description}" ignored due to expected value {${fromDesc})`;
    }
  }

  public abstract invoke(): void;
}
