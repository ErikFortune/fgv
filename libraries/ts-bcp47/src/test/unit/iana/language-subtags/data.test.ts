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
import * as Iana from '../../../../packlets/iana';

describe('IANA registry data files', () => {
  test('can load registry JAR JSON', () => {
    expect(
      Iana.LanguageSubtags.JarConverters.loadJsonSubtagRegistryFileSync(
        'src/test/data/iana/language-subtag-registry.json'
      )
    ).toSucceed();
  });

  test('can load registry.txt', () => {
    expect(
      Iana.LanguageSubtags.JarConverters.loadTxtSubtagRegistryFileSync(
        'src/test/data/iana/language-subtag-registry.txt'
      )
    ).toSucceed();
  });

  test('can load json', () => {
    expect(
      Iana.LanguageSubtags.Converters.loadLanguageSubtagsJsonFileSync('src/data/iana/language-subtags.json')
    ).toSucceed();
  });

  test('language-subtag-registry.json, language-subtags.json and registry.txt are equivalent', () => {
    const jsonJar = Iana.LanguageSubtags.JarConverters.loadJsonSubtagRegistryFileSync(
      'src/test/data/iana/language-subtag-registry.json'
    ).orThrow();
    const json = Iana.LanguageSubtags.Converters.loadLanguageSubtagsJsonFileSync(
      'src/data/iana/language-subtags.json'
    ).orThrow();
    const txt = Iana.LanguageSubtags.JarConverters.loadTxtSubtagRegistryFileSync(
      'src/test/data/iana/language-subtag-registry.txt'
    ).orThrow();
    expect(jsonJar).toEqual(json);
    expect(json).toEqual(txt);
  });
});
