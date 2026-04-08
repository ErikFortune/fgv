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

import { Result } from '@fgv/ts-utils';
import { Converters as JsonConverters, FileTree } from '@fgv/ts-json-base';
import { Yaml } from '@fgv/ts-extras';
import { Config, Import, Resources } from '@fgv/ts-res';
import { ITutorialPrinter, RESOURCES_ROOT } from '../utils';

/**
 * Lesson 2: Setting up the importer with a YAML preprocessor.
 *
 * @remarks
 * ts-res imports are driven by an {@link Import.ImportManager | ImportManager}
 * that owns a chain of importers: `PathImporter`, `FsItemImporter`,
 * `JsonImporter`, `CollectionImporter`. Out of the box they read `.json`.
 *
 * The `ImportManager.create()` parameters include two important knobs
 * that were added to enable transparent YAML (or TOML, JSON5, ...) loading:
 *
 *   - `fileContentConverter`: any `Converter<JsonValue>` applied to raw
 *     file contents before the rest of the import pipeline runs.
 *   - `fileContentExtensions`: the file extensions that should flow
 *     through the converter. `.json` is still handled natively.
 *
 * Combined, they turn "import a directory of YAML resources" into a
 * one-liner: the importer reads each `.yaml` file as text, hands it to
 * the YAML converter to produce a `JsonObject`, and the rest of the
 * pipeline is unchanged.
 *
 * This lesson:
 *   1. Builds the same `SystemConfiguration` as lesson 1.
 *   2. Creates a `ResourceManagerBuilder` for the configuration.
 *   3. Creates an `ImportManager` with a YAML preprocessor for `.yaml`.
 *   4. Imports the entire `data/resources/` tree.
 *   5. Builds the resources and prints a summary.
 *
 * The returned `ResourceManagerBuilder` is handed to Lesson 3 which
 * wires up the runtime.
 *
 * @param printer - Sink for tutorial output.
 * @returns `Success` with the built resource manager if import succeeded.
 * @public
 */
export function runLesson2(
  printer: ITutorialPrinter,
  systemConfig: Config.SystemConfiguration
): Result<Resources.ResourceManagerBuilder> {
  printer.heading('Lesson 2 - Importing YAML resources transparently');
  printer.line('The ts-res importer reads `.json` natively. To accept a');
  printer.line('different serialization we supply a preprocessor -');
  printer.line('a `Converter<JsonValue>` that turns raw text into JSON.');

  // --- Step 1: the YAML preprocessor -----------------------------------
  printer.subheading('Building the YAML preprocessor');
  // `Yaml.yamlConverter` takes an inner converter that validates the
  // parsed YAML. We use `jsonObject` because the import pipeline needs
  // the top level to be an object. Any Converter<JsonValue> works - the
  // preprocessor is intentionally generic so you can plug in TOML or a
  // templated JSON format just as easily.
  const preprocessor = Yaml.yamlConverter(JsonConverters.jsonObject);
  printer.line('preprocessor:          Yaml.yamlConverter(jsonObject)');
  printer.line("fileContentExtensions: ['.yaml', '.yml']");

  // --- Step 2: resource manager builder --------------------------------
  // Same shape as lesson 1 - a mutable builder seeded with the qualifiers
  // and resource types from the configuration.
  const resourceManager = Resources.ResourceManagerBuilder.create({
    qualifiers: systemConfig.qualifiers,
    resourceTypes: systemConfig.resourceTypes
  }).orThrow();

  // --- Step 3: importer ------------------------------------------------
  printer.subheading('Creating an ImportManager with the preprocessor');
  // A `FileTree` tells the importer how to read files. `forFilesystem()`
  // is the normal choice; an in-memory tree is handy for tests.
  const fileTree = FileTree.forFilesystem().orThrow();

  // `fileContentConverter` + `fileContentExtensions` is the extension
  // point - the rest of the import pipeline is unchanged.
  const importManager = Import.ImportManager.create({
    resources: resourceManager,
    fileTree,
    fileContentConverter: preprocessor,
    fileContentExtensions: ['.yaml', '.yml']
  }).orThrow();

  // --- Step 4: import the resource tree --------------------------------
  printer.subheading(`Importing from ${RESOURCES_ROOT}`);
  // `importFromFileSystem` walks the path recursively. Directories and
  // individual files both work. Errors from any single file short-circuit
  // the whole import, returning a Failure with an aggregated message.
  importManager.importFromFileSystem(RESOURCES_ROOT).orThrow();

  // --- Step 5: build and summarise -------------------------------------
  // `.build()` finalises the collected candidates into built Resource
  // objects that Lesson 4 can then resolve.
  resourceManager.build().orThrow();

  printer.line(`imported resources:    ${resourceManager.numResources}`);
  printer.line(`imported candidates:   ${resourceManager.numCandidates}`);
  printer.line('');
  printer.line('Resource ids:');
  for (const id of [...resourceManager.resourceIds].sort()) {
    printer.line(`  ${id}`);
  }

  return resourceManager.build();
}
