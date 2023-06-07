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

import {
  GenericLanguageTagTest,
  GenericTagTestCaseFactory,
  SimpleTagTestCaseBase,
  TestKey,
  allTestKeys
} from './languageTagHelpers';
import { LanguageTag, Subtags } from '../../../src/bcp47';
import { tagTestCases } from './commonTestCases';

describe('LanguageRegistryData class', () => {
  describe('construction via LanguageTag', () => {
    class TagRegistryDataTestCase<TFROM extends string | Subtags> extends SimpleTagTestCaseBase<TFROM> {
      public static create<TFROM extends string | Subtags>(
        gtc: GenericLanguageTagTest<TFROM>,
        which: TestKey
      ): TagRegistryDataTestCase<TFROM> {
        return new TagRegistryDataTestCase(gtc, which);
      }

      public static getFactory<TFROM extends string | Subtags>(): GenericTagTestCaseFactory<
        TFROM,
        TagRegistryDataTestCase<TFROM>
      > {
        return new GenericTagTestCaseFactory(TagRegistryDataTestCase.create);
      }

      public invoke(): void {
        if (this.isSuccessTest) {
          expect(LanguageTag.create(this.from, this.options)).toSucceedAndSatisfy((lt: LanguageTag) => {
            expect(lt.tag).toEqual(this.expected);
            if (lt.subtags.primaryLanguage) {
              expect(lt.registry.primaryLanguage).toBeDefined();
              expect(lt.registry.primaryLanguage!.subtag.toLowerCase()).toEqual(
                lt.subtags.primaryLanguage?.toLowerCase()
              );
            } else {
              expect(lt.registry.primaryLanguage).toBeUndefined();
            }

            if (lt.subtags.extlangs) {
              expect(lt.registry.extlangs).toBeDefined();
              expect(lt.registry.extlangs!.map((e) => e.subtag.toLowerCase())).toEqual(
                lt.subtags.extlangs.map((e) => e.toLowerCase())
              );
            } else {
              expect(lt.registry.extlangs).toBeUndefined();
            }

            if (lt.subtags.script) {
              expect(lt.registry.script).toBeDefined();
              expect(lt.registry.script!.subtag.toLowerCase()).toEqual(lt.subtags.script.toLowerCase());
            } else {
              expect(lt.registry.script).toBeUndefined();
            }

            if (lt.effectiveScript) {
              expect(lt.registry.effectiveScript).toBeDefined();
              expect(lt.registry.effectiveScript!.subtag.toLowerCase()).toEqual(
                lt.effectiveScript.toLowerCase()
              );
            } else {
              expect(lt.registry.effectiveScript).toBeUndefined();
            }

            if (lt.subtags.region) {
              expect(lt.registry.region).toBeDefined();
              expect(lt.registry.region!.subtag.toLowerCase()).toEqual(lt.subtags.region.toLowerCase());
            } else {
              expect(lt.registry.region).toBeUndefined();
            }

            if (lt.subtags.variants) {
              expect(lt.registry.variants).toBeDefined();
              expect(lt.registry.variants!.map((v) => v.subtag.toLowerCase())).toEqual(
                lt.subtags.variants.map((e) => e.toLowerCase())
              );
            } else {
              expect(lt.registry.variants).toBeUndefined();
            }

            if (lt.subtags.extensions) {
              expect(lt.registry.extensions).toBeDefined();
              expect(lt.registry.extensions!.map((v) => v.singleton.toLowerCase())).toEqual(
                lt.subtags.extensions.map((e) => e.singleton.toLowerCase())
              );
            } else {
              expect(lt.registry.extensions).toBeUndefined();
            }

            if (lt.subtags.grandfathered) {
              expect(lt.registry.grandfathered).toBeDefined();
              expect(lt.registry.grandfathered!.tag.toLowerCase()).toEqual(
                lt.subtags.grandfathered.toLowerCase()
              );
            } else {
              expect(lt.registry.grandfathered).toBeUndefined();
            }

            expect(lt.tag.toString()).toEqual(lt.registry.toString());
          });
        } else if (this.isFailureTest) {
          expect('this line').toBe('unreached');
        }
      }

      protected _getExpectedValue(
        which: TestKey,
        gtc: GenericLanguageTagTest<TFROM, string | RegExp>,
        expected: string | RegExp | undefined
      ): string | RegExp | undefined {
        // if we aren't valid we don't know what's in the registry
        switch (which) {
          case 'default':
          case 'wellFormed':
          case 'wellFormedCanonical':
            return undefined;
        }
        // we can't do anything with a test case that expects to fail
        if (gtc.expected[which] instanceof RegExp) {
          return undefined;
        }
        return expected;
      }

      protected _getSuccessTestDescription(testTarget: string, from: TFROM, description: string): string {
        if (typeof from !== 'string') {
          const fromDesc = JSON.stringify(from, undefined, 2);
          return `${testTarget} succeeds for "${description}" with registry data for "${this.expected}" (${fromDesc})`;
        }
        return `${testTarget} succeeds for "${from}" with registry data for "${this.expected}" (${description})`;
      }
    }

    test.each(TagRegistryDataTestCase.getFactory().emit(allTestKeys, tagTestCases))('%p', (_desc, tc) => {
      tc.invoke();
    });
  });
});
