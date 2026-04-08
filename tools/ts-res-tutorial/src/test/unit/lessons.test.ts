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
import { isJsonObject } from '@fgv/ts-json-base';
import {
  CapturingTutorialPrinter,
  runAllLessons,
  runLesson1,
  runLesson2,
  runLesson3,
  runLesson4
} from '../../index';

describe('Tutorial lessons', () => {
  describe('Lesson 1 - load config', () => {
    test('builds a system configuration with the custom density qualifier type', () => {
      const printer = new CapturingTutorialPrinter();
      expect(runLesson1(printer)).toSucceedAndSatisfy((systemConfig) => {
        expect(systemConfig.name).toBe(undefined); // name is optional in YAML
        // Every qualifier type declared in system.yaml must be present
        // after loading, including the custom "density" type.
        const typeNames = Array.from(systemConfig.qualifierTypes.values(), (t) => t.name);
        expect(typeNames).toEqual(expect.arrayContaining(['language', 'territory', 'theme', 'density']));
        const qualifierNames = Array.from(systemConfig.qualifiers.values(), (q) => q.name);
        expect(qualifierNames).toEqual(
          expect.arrayContaining(['currentTerritory', 'language', 'theme', 'density'])
        );
      });
      // Headline checks on the output so the lesson prose doesn't silently
      // regress.
      expect(printer.text).toMatch(/Lesson 1/);
      expect(printer.text).toMatch(/density/);
    });
  });

  describe('Lesson 2 - import YAML', () => {
    test('imports every YAML resource file via the preprocessor', () => {
      const printer = new CapturingTutorialPrinter();
      const systemConfig = runLesson1(printer).orThrow();
      expect(runLesson2(printer, systemConfig)).toSucceedAndSatisfy((resourceManager) => {
        const ids = resourceManager.resourceIds.map((id) => String(id));
        // Three files, four resources total (strings.yaml contains two).
        expect(ids).toEqual(
          expect.arrayContaining([
            'resources.strings.greetings',
            'resources.strings.uiLabels',
            'resources.theme.theme',
            'resources.icons.icons'
          ])
        );
      });
      expect(printer.text).toMatch(/Lesson 2/);
      expect(printer.text).toMatch(/Yaml\.yamlConverter/);
    });
  });

  describe('Lesson 3 - runtime setup', () => {
    test('creates a resolver that sees the same resources', () => {
      const printer = new CapturingTutorialPrinter();
      const systemConfig = runLesson1(printer).orThrow();
      const resourceManager = runLesson2(printer, systemConfig).orThrow();
      expect(runLesson3(printer, systemConfig, resourceManager)).toSucceedAndSatisfy((resolver) => {
        expect(resolver.resourceIds.length).toBe(resourceManager.resourceIds.length);
      });
      expect(printer.text).toMatch(/Lesson 3/);
      expect(printer.text).toMatch(/withContext/);
    });
  });

  describe('Lesson 4 - resolve', () => {
    test('demonstrates all four resolution strategies without errors', () => {
      const printer = new CapturingTutorialPrinter();
      const systemConfig = runLesson1(printer).orThrow();
      const resourceManager = runLesson2(printer, systemConfig).orThrow();
      const resolver = runLesson3(printer, systemConfig, resourceManager).orThrow();

      expect(runLesson4(printer, resolver)).toSucceed();
      // The lesson 4 prose should hit every strategy heading.
      expect(printer.text).toMatch(/Best match/);
      expect(printer.text).toMatch(/All matches/);
      expect(printer.text).toMatch(/Composed/);
      expect(printer.text).toMatch(/Manually composed/);
    });

    test('best-match picks the fr+CA candidate for the active context', () => {
      const printer = new CapturingTutorialPrinter();
      const systemConfig = runLesson1(printer).orThrow();
      const resourceManager = runLesson2(printer, systemConfig).orThrow();
      const resolver = runLesson3(printer, systemConfig, resourceManager).orThrow();

      // Sanity-check the matching behaviour directly rather than parsing
      // printed output. The default context is language=fr,
      // currentTerritory=CA, so the combined candidate should win.
      expect(resolver.resolveResource('resources.strings.greetings')).toSucceedAndSatisfy((candidate) => {
        expect(isJsonObject(candidate.json)).toBe(true);
        if (isJsonObject(candidate.json)) {
          expect(candidate.json.source).toBe('BOTH: fr + CA');
        }
      });
    });

    test('composed theme resolves to the dark theme with french font overrides', () => {
      const printer = new CapturingTutorialPrinter();
      const systemConfig = runLesson1(printer).orThrow();
      const resourceManager = runLesson2(printer, systemConfig).orThrow();
      const resolver = runLesson3(printer, systemConfig, resourceManager).orThrow();

      expect(resolver.resolveComposedResourceValue('resources.theme.theme')).toSucceedAndSatisfy((value) => {
        expect(isJsonObject(value)).toBe(true);
        if (isJsonObject(value)) {
          expect(value.name).toBe('dark');
          // The fr partial candidate overrides the base font family.
          const typography = value.typography;
          expect(isJsonObject(typography)).toBe(true);
          if (isJsonObject(typography)) {
            expect(typography.family).toMatch(/Merriweather/);
          }
        }
      });
    });
  });

  describe('runAllLessons', () => {
    test('runs the whole tutorial end-to-end without errors', () => {
      const printer = new CapturingTutorialPrinter();
      expect(runAllLessons(printer)).toSucceed();
      expect(printer.text).toMatch(/Lesson 1/);
      expect(printer.text).toMatch(/Lesson 2/);
      expect(printer.text).toMatch(/Lesson 3/);
      expect(printer.text).toMatch(/Lesson 4/);
    });
  });
});
