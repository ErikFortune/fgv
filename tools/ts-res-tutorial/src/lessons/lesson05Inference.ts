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

import * as path from 'path';
import { Result, succeed } from '@fgv/ts-utils';
import { Converters as JsonConverters, FileTree, isJsonObject } from '@fgv/ts-json-base';
import { Yaml } from '@fgv/ts-extras';
import { Config, Import, Resources, Runtime } from '@fgv/ts-res';
import { DATA_ROOT, ITutorialPrinter } from '../utils';

const INFERRED_ROOT: string = path.join(DATA_ROOT, 'inferred');
const INFERRED_RESOURCE_ID: string = 'inferred.messages.text';

/**
 * Lesson 5: Path-driven qualifier inference and id composition.
 *
 * @remarks
 * Lessons 2-4 import resources whose conditions are spelled out inside
 * each YAML file. That works but it is verbose - the same language/
 * territory combination has to be repeated in every candidate.
 *
 * The ts-res importer can also infer conditions and resource ids
 * directly from the filesystem layout:
 *
 *   - Every **folder name** and **file basename** may contain qualifier
 *     tokens. Parsing is applied to the LAST dot-separated segment of
 *     the name, which is split on commas into one or more
 *     `[qualifier=]value` pairs.
 *
 *   - A token may be **explicit** (`geo=CA`) or **tokenless** (just
 *     `CA`). Tokenless values only work for qualifiers with
 *     `tokenIsOptional: true`; the importer picks the single qualifier
 *     whose type accepts the value, and fails if zero or more than one
 *     qualifier matches.
 *
 *   - Explicit tokens are looked up by **qualifier name first, then
 *     qualifier token**. In `data/config/system.yaml` the qualifier
 *     `currentTerritory` declares `token: geo`, so `geo=CA` resolves to
 *     `currentTerritory=CA`.
 *
 *   - Whatever is left of the basename after tokens are stripped becomes
 *     a **resource id fragment**. Fragments stack as the importer walks
 *     the tree, so the final resource id is the path joined with `.`.
 *
 *   - Folders whose entire name parses as a token contribute conditions
 *     **but no id fragment**, which lets you keep a clean logical id
 *     while adding arbitrary nesting for organisation.
 *
 * This lesson imports the separate `data/inferred/` tree into a fresh
 * resource manager, lists what the importer produced, and then runs the
 * resolver under a few contexts to prove that path inference really
 * does wire up the expected conditions.
 *
 * @param printer - Sink for tutorial output.
 * @param systemConfig - The configuration from lesson 1. We reuse it so
 *                       the tokens and tokenIsOptional flags in
 *                       `data/config/system.yaml` apply.
 * @returns `Success` when the lesson finishes.
 * @public
 */
export function runLesson5(
  printer: ITutorialPrinter,
  systemConfig: Config.SystemConfiguration
): Result<undefined> {
  printer.heading('Lesson 5 - Path-driven qualifier inference');

  // --- Step 1: a fresh, empty resource manager for this lesson --------
  // We do NOT reuse the resource manager from Lesson 2 because that
  // lesson imports data/resources/ and the two trees are unrelated.
  // Building a second manager keeps each lesson self-contained.
  const resourceManager = Resources.ResourceManagerBuilder.create({
    qualifiers: systemConfig.qualifiers,
    resourceTypes: systemConfig.resourceTypes
  }).orThrow();

  // --- Step 2: importer with the YAML preprocessor --------------------
  // Same setup as Lesson 2. The inference logic lives in the
  // FsItemImporter and doesn't need any extra configuration - the
  // importer always parses folder and file basenames for qualifier
  // tokens, regardless of which file format you feed it.
  const fileTree = FileTree.forFilesystem().orThrow();
  const importManager = Import.ImportManager.create({
    resources: resourceManager,
    fileTree,
    fileContentConverter: Yaml.yamlConverter(JsonConverters.jsonObject),
    fileContentExtensions: ['.yaml', '.yml']
  }).orThrow();

  // --- Step 3: import the whole inferred/ tree ------------------------
  printer.subheading(`Importing from ${INFERRED_ROOT}`);
  printer.line('The tree contains 7 files organised by qualifier tokens');
  printer.line('in folder and file basenames. The importer discovers the');
  printer.line('conditions automatically - the YAML files themselves');
  printer.line('contain NO "conditions" blocks.');
  importManager.importFromFileSystem(INFERRED_ROOT).orThrow();
  resourceManager.build().orThrow();

  printer.line('');
  printer.line(`imported resources:  ${resourceManager.numResources}`);
  printer.line(`imported candidates: ${resourceManager.numCandidates}`);
  printer.line(`all candidates live under a single id: ${INFERRED_RESOURCE_ID}`);

  // --- Step 4: show the discovered conditions per candidate -----------
  // Pull the built resource and walk its candidates so readers can see
  // exactly which path produced which condition set.
  printer.subheading('Conditions the importer inferred per candidate');
  const resource = resourceManager.getBuiltResource(INFERRED_RESOURCE_ID).orThrow();
  resource.candidates.forEach((candidate, i) => {
    const source =
      isJsonObject(candidate.json) && typeof candidate.json.source === 'string'
        ? candidate.json.source
        : '(unknown)';
    printer.line(`  [${i}] ${source}`);
  });

  // --- Step 5: resolve under a few contexts ---------------------------
  // Each context below is designed to pick a DIFFERENT winning candidate
  // so readers can verify the inference produced the expected matches.
  //
  // Note the priority interplay from Lesson 1's system.yaml:
  //   currentTerritory priority 850 > language priority 800
  // so a territory match always beats a language match when both fire.
  // The contexts are chosen to exercise each branch - territory-only,
  // language-only (via a territory nobody has content for), and
  // combined matches where the most specific candidate wins.
  printer.subheading('Best match per context');
  const contexts: Array<Record<string, string>> = [
    { language: 'fr', currentTerritory: 'DE' },
    { language: 'en', currentTerritory: 'CA' },
    { language: 'fr', currentTerritory: 'CA' },
    { language: 'en', currentTerritory: 'GB' },
    { language: 'en', currentTerritory: 'US' }
  ];

  for (const context of contexts) {
    // Build a fresh resolver per context via withContext() so previous
    // caches don't hide bugs. This is the same pattern Lesson 3 shows.
    const resolver = Runtime.ResourceResolver.create({
      resourceManager,
      qualifierTypes: systemConfig.qualifierTypes,
      contextQualifierProvider: Runtime.ValidatingSimpleContextQualifierProvider.create({
        qualifiers: systemConfig.qualifiers,
        qualifierValues: context
      }).orThrow()
    }).orThrow();

    const candidate = resolver.resolveResource(INFERRED_RESOURCE_ID).orThrow();
    const hello = isJsonObject(candidate.json) ? candidate.json.hello : candidate.json;
    const source = isJsonObject(candidate.json) ? candidate.json.source : '(unknown)';
    const contextLabel = Object.entries(context)
      .map(([k, v]) => `${k}=${v}`)
      .join(' ');
    printer.line(`  ${contextLabel.padEnd(36)} -> ${String(hello)}`);
    printer.line(`  ${' '.repeat(36)}    (${String(source)})`);
  }

  return succeed(undefined);
}
