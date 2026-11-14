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
import * as path from 'path';
import { Converters as JsonConverters, FileTree, isJsonObject } from '@fgv/ts-json-base';
import { Yaml } from '@fgv/ts-extras';
import { Config, Import, Resources, Runtime } from '@fgv/ts-res';
import {
  CapturingTutorialPrinter,
  DATA_ROOT,
  runAllLessons,
  runLesson1,
  runLesson2,
  runLesson3,
  runLesson4,
  runLesson5
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

  describe('Lesson 5 - path inference', () => {
    test('imports the inferred/ tree and collapses every file to one resource id', () => {
      const printer = new CapturingTutorialPrinter();
      const systemConfig = runLesson1(printer).orThrow();
      expect(runLesson5(printer, systemConfig)).toSucceed();

      // Lesson 5 prints per-candidate sources that mention every
      // inference pattern the tree exercises.
      expect(printer.text).toMatch(/LANGUAGE: fr \(inferred from filename\)/);
      expect(printer.text).toMatch(/TERRITORY: US \(inferred from filename\)/);
      expect(printer.text).toMatch(/LANGUAGE: en \(inferred from folder\)/);
      expect(printer.text).toMatch(/TERRITORY: CA \(inferred from "geo=CA" folder\)/);
      expect(printer.text).toMatch(/stacked across nested folders/);
      expect(printer.text).toMatch(/comma-separated filename tokens/);
    });

    test('every file in the inferred tree produces the same resource id with distinct conditions', () => {
      // Build an isolated resource manager so we can introspect what
      // the importer produced without mixing it with Lesson 2's data.
      const printer = new CapturingTutorialPrinter();
      const systemConfig = runLesson1(printer).orThrow();
      runLesson5(printer, systemConfig).orThrow();

      // Re-run the import here (we cannot reach into Lesson 5's
      // internal manager) to verify candidate count matches file count.
      const resourceManager = importInferredTree(systemConfig);
      const resource = resourceManager.getBuiltResource('inferred.messages.text').orThrow();
      expect(resource.candidates.length).toBe(7);

      // Hit every distinct condition pattern via the resolver. Remember
      // that the system configuration gives currentTerritory priority
      // 850 and language priority 800, so territory beats language when
      // both match - that's why {fr, US} picks the US candidate over
      // the French candidate.
      const probes: Array<[Record<string, string>, string]> = [
        // Language-only contexts fall back to the LANGUAGE candidates
        // because no territory-conditioned candidate matches.
        [{ language: 'fr', currentTerritory: 'DE' }, 'LANGUAGE: fr (inferred from filename)'],
        [{ language: 'en', currentTerritory: 'DE' }, 'LANGUAGE: en (inferred from folder)'],
        // Territory-only matches pick the territory candidate.
        [{ language: 'fr', currentTerritory: 'US' }, 'TERRITORY: US (inferred from filename)'],
        [{ language: 'en', currentTerritory: 'US' }, 'TERRITORY: US (inferred from filename)'],
        [{ language: 'en', currentTerritory: 'CA' }, 'TERRITORY: CA (inferred from "geo=CA" folder)'],
        // Combined candidates win when both conditions match - their
        // condition set is strictly more specific than either piece alone.
        [{ language: 'fr', currentTerritory: 'CA' }, 'BOTH: CA + fr (stacked across nested folders)'],
        [{ language: 'en', currentTerritory: 'GB' }, 'BOTH: GB + en (comma-separated filename tokens)']
      ];

      for (const [context, expectedSource] of probes) {
        const resolver = Runtime.ResourceResolver.create({
          resourceManager,
          qualifierTypes: systemConfig.qualifierTypes,
          contextQualifierProvider: Runtime.ValidatingSimpleContextQualifierProvider.create({
            qualifiers: systemConfig.qualifiers,
            qualifierValues: context
          }).orThrow()
        }).orThrow();

        expect(resolver.resolveResource('inferred.messages.text')).toSucceedAndSatisfy((candidate) => {
          expect(isJsonObject(candidate.json)).toBe(true);
          if (isJsonObject(candidate.json)) {
            expect(candidate.json.source).toBe(expectedSource);
          }
        });
      }
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
      expect(printer.text).toMatch(/Lesson 5/);
    });
  });
});

/**
 * Minimal standalone importer for Lesson 5's data folder. Used by the
 * test that wants to introspect the built manager directly (lesson 5
 * itself keeps its manager private because the lesson only needs to
 * print).
 */
function importInferredTree(systemConfig: Config.SystemConfiguration): Resources.ResourceManagerBuilder {
  const resourceManager = Resources.ResourceManagerBuilder.create({
    qualifiers: systemConfig.qualifiers,
    resourceTypes: systemConfig.resourceTypes
  }).orThrow();

  const importManager = Import.ImportManager.create({
    resources: resourceManager,
    fileTree: FileTree.forFilesystem().orThrow(),
    fileContentConverter: Yaml.yamlConverter(JsonConverters.jsonObject),
    fileContentExtensions: ['.yaml', '.yml']
  }).orThrow();

  importManager.importFromFileSystem(path.join(DATA_ROOT, 'inferred')).orThrow();
  resourceManager.build().orThrow();
  return resourceManager;
}
