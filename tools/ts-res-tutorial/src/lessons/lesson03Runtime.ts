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

import { Result, succeed } from '@fgv/ts-utils';
import { Config, Resources, Runtime } from '@fgv/ts-res';
import { ITutorialPrinter } from '../utils';

/**
 * Default runtime context used by every lesson that resolves resources.
 * Picked to exercise every qualifier defined in `data/config/system.yaml`.
 * @public
 */
export const DEFAULT_CONTEXT: Record<string, string> = {
  language: 'fr',
  currentTerritory: 'CA',
  theme: 'dark',
  density: 'xhdpi'
};

/**
 * Lesson 3: Setting up the runtime (context provider + resolver).
 *
 * @remarks
 * "Runtime" in ts-res refers to the objects that evaluate a context
 * against the built resources to pick winning candidates. There are two
 * pieces you own:
 *
 *   - A {@link Runtime.IContextQualifierProvider | context qualifier
 *     provider} that holds the current values of every qualifier (e.g.
 *     language=fr, density=xhdpi). The tutorial uses
 *     {@link Runtime.ValidatingSimpleContextQualifierProvider | ValidatingSimpleContextQualifierProvider}
 *     because it accepts plain string keys/values and validates them
 *     against the qualifier collection - no branded-type casting.
 *
 *   - A {@link Runtime.ResourceResolver | ResourceResolver} that pairs
 *     a resource manager, the qualifier types, and a context provider.
 *     Once created it owns an O(1) cache for condition, condition set,
 *     and decision resolution results.
 *
 * This lesson wires both up and then swaps the context to demonstrate
 * how the same resolver can serve multiple contexts.
 *
 * @param printer - Sink for tutorial output.
 * @param systemConfig - The configuration from lesson 1.
 * @param resourceManager - The built resource manager from lesson 2.
 * @returns `Success` with the new resolver if setup succeeded.
 * @public
 */
export function runLesson3(
  printer: ITutorialPrinter,
  systemConfig: Config.SystemConfiguration,
  resourceManager: Resources.ResourceManagerBuilder
): Result<Runtime.ResourceResolver> {
  printer.heading('Lesson 3 - Wiring the runtime');

  // --- Step 1: context provider ----------------------------------------
  printer.subheading('Creating a ValidatingSimpleContextQualifierProvider');
  printer.line('The provider holds "current" qualifier values. The');
  printer.line('validating variant accepts plain string keys/values and');
  printer.line('runs them through the qualifier collection so we catch');
  printer.line('typos and invalid values at setup time.');

  const contextProvider = Runtime.ValidatingSimpleContextQualifierProvider.create({
    qualifiers: systemConfig.qualifiers,
    qualifierValues: DEFAULT_CONTEXT
  }).orThrow();

  printer.line('');
  printer.line('Initial context:');
  for (const [key, value] of Object.entries(DEFAULT_CONTEXT)) {
    printer.line(`  ${key.padEnd(18)} = ${value}`);
  }

  // --- Step 2: resolver ------------------------------------------------
  printer.subheading('Creating a ResourceResolver');
  printer.line('The resolver marries three things: the resource manager');
  printer.line('(which provides the built resources), the qualifier type');
  printer.line('collector (so it can evaluate condition match scores),');
  printer.line('and the context provider we just built.');

  const resolver = Runtime.ResourceResolver.create({
    resourceManager,
    qualifierTypes: systemConfig.qualifierTypes,
    contextQualifierProvider: contextProvider
  }).orThrow();

  printer.line('');
  printer.line(`condition cache size:     ${resolver.conditionCacheSize}`);
  printer.line(`conditionSet cache size:  ${resolver.conditionSetCacheSize}`);
  printer.line(`decision cache size:      ${resolver.decisionCacheSize}`);
  printer.line('(caches are empty now and fill on demand)');

  // --- Step 3: swapping contexts ---------------------------------------
  printer.subheading('Creating an alternate resolver via withContext()');
  printer.line('ResourceResolver.withContext() returns a brand-new');
  printer.line('resolver instance tied to a different context provider.');
  printer.line('The resource data is shared, only the context changes.');

  const usEnglish = resolver
    .withContext({
      language: 'en',
      currentTerritory: 'US',
      theme: 'light',
      density: 'mdpi'
    })
    .orThrow();

  printer.line('');
  printer.line('US English context built from the same resources:');
  printer.line(`  same resource manager: ${usEnglish.resourceManager === resolver.resourceManager}`);
  printer.line(`  distinct resolver:     ${usEnglish !== resolver}`);

  // Hand back the original (fr/CA/dark/xhdpi) resolver since that's the
  // interesting context for the resolution lesson.
  return succeed(resolver);
}
