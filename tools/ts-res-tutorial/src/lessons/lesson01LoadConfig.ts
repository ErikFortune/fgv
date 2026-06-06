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

import * as fs from 'fs';
import { Result, succeed } from '@fgv/ts-utils';
import { Converters as JsonConverters } from '@fgv/ts-json-base';
import { Yaml } from '@fgv/ts-extras';
import { Config } from '@fgv/ts-res';
import { DensityQualifierTypeFactory } from '../qualifierTypes';
import { CONFIG_FILE, ITutorialPrinter } from '../utils';

/**
 * Lesson 1: Loading a qualifier configuration.
 *
 * @remarks
 * ts-res ships with a handful of predefined system configurations
 * (`default`, `language-priority`, `territory-priority`,
 * `extended-example`) exposed via
 * {@link Config.getPredefinedSystemConfiguration}. They're a great way to
 * get started, but real applications usually want a custom configuration
 * with their own qualifier types and priorities.
 *
 * This lesson shows:
 *   1. Loading a predefined configuration and inspecting it.
 *   2. Reading a custom configuration from a YAML file using the
 *      `ts-extras` YAML converter and validating it with the ts-res
 *      `Config.Convert.systemConfiguration` converter.
 *   3. Wiring a custom qualifier type factory so that the configuration
 *      can reference a `systemType` the built-in factory doesn't know
 *      about (here: `density`).
 *
 * @param printer - Sink for everything the lesson produces. Tests pass a
 *                  capturing printer so they can assert on output.
 * @returns `Success` with the materialised custom `SystemConfiguration`
 *          if the lesson runs to completion.
 * @public
 */
export function runLesson1(printer: ITutorialPrinter): Result<Config.SystemConfiguration> {
  printer.heading('Lesson 1 - Loading a qualifier configuration');
  printer.line('Predefined configurations are the quickest way to get a');
  printer.line('working system. Each one bundles qualifier types,');
  printer.line('qualifiers and resource types with sensible priorities.');

  // --- Step 1: predefined configuration --------------------------------
  printer.subheading('Predefined: "default" (territory-priority)');
  const predefined = Config.getPredefinedSystemConfiguration('default').orThrow();
  printer.line(`name:        ${predefined.name}`);
  printer.line(`description: ${predefined.description}`);
  printer.line(`qualifiers:  ${Array.from(predefined.qualifiers.values(), (q) => q.name).join(', ')}`);

  // --- Step 2: custom configuration from a YAML file -------------------
  printer.subheading('Custom: loaded from data/config/system.yaml');
  printer.line('We parse the YAML ourselves here so you can see the layers:');
  printer.line('  raw string -> YAML -> unknown JSON -> validated config.');
  printer.line('Lesson 2 uses the same pre-processor from the importer side.');

  // Step 2a: read the file from disk. Real apps might get this from an
  // HTTP response, a bundled asset, etc - ts-res doesn't care where the
  // string comes from.
  const rawYaml = fs.readFileSync(CONFIG_FILE, 'utf-8');

  // Step 2b: YAML -> JsonValue. yamlConverter wraps js-yaml and then
  // validates the result with whatever JsonConverter you pass it.
  // jsonObject is strict enough to ensure the top level is an object.
  const yamlToJson = Yaml.yamlConverter(JsonConverters.jsonObject);
  const parsed = yamlToJson.convert(rawYaml).orThrow();

  // Step 2c: JsonValue -> ISystemConfiguration. Converters give us a
  // strongly-typed result with friendly error messages. Doing the shape
  // validation yourself by hand is an anti-pattern in this repo.
  const declaration = Config.Convert.systemConfiguration.convert(parsed).orThrow();
  printer.line(
    `parsed ${declaration.qualifierTypes.length} qualifier types and ` +
      `${declaration.qualifiers.length} qualifiers from YAML`
  );

  // --- Step 3: wire the custom density qualifier type ------------------
  printer.subheading('Wiring a custom qualifier type factory');
  printer.line('system.yaml declares `systemType: density`. The built-in');
  printer.line('factory only knows language/territory/literal - we supply');
  printer.line('a DensityQualifierTypeFactory that handles the rest.');

  const qualifierTypeFactory = new Config.QualifierTypeFactory([
    // Tried first; returns Failure for anything it doesn't know.
    new DensityQualifierTypeFactory()
    // The BuiltInQualifierTypeFactory is appended automatically by the
    // QualifierTypeFactory constructor so language/territory/literal
    // keep working.
  ]);

  const systemConfig = Config.SystemConfiguration.create(declaration, {
    qualifierTypeFactory
  }).orThrow();

  printer.line(`qualifier types built: ${systemConfig.qualifierTypes.size}`);
  printer.line(`qualifiers built:      ${systemConfig.qualifiers.size}`);
  printer.line(`resource types built:  ${systemConfig.resourceTypes.size}`);

  // List qualifiers by priority so the priority-ordering becomes obvious
  // when lessons 3 and 4 start matching candidates.
  printer.line('');
  printer.line('Qualifier priorities (higher wins):');
  const sorted = Array.from(systemConfig.qualifiers.values()).sort(
    (a, b) => b.defaultPriority - a.defaultPriority
  );
  for (const q of sorted) {
    printer.line(`  ${String(q.defaultPriority).padStart(4)}  ${q.name.padEnd(18)}  ${q.type.name}`);
  }

  return succeed(systemConfig);
}
