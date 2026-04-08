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
import { isJsonObject, JsonObject } from '@fgv/ts-json-base';
import { JsonEditor } from '@fgv/ts-json';
import { Runtime } from '@fgv/ts-res';
import { ITutorialPrinter } from '../utils';

const STRINGS_ID: string = 'resources.strings.greetings';
const ICONS_ID: string = 'resources.icons.icons';
const THEME_ID: string = 'resources.theme.theme';

/**
 * Lesson 4: Four ways to resolve a resource.
 *
 * @remarks
 * Once you have a `ResourceResolver`, there are four distinct resolution
 * strategies that solve different problems:
 *
 *   1. **Best match** - `resolveResource(id)` returns the single most
 *      specific candidate. This is the "just give me the answer" API and
 *      the right default for most apps.
 *
 *   2. **All matches** - `resolveAllResourceCandidates(id)` returns every
 *      candidate whose conditions matched, ordered by descending
 *      priority. Useful for introspection, debugging, fallbacks, and
 *      rendering resource galleries.
 *
 *   3. **Composed** - `resolveComposedResourceValue(id)` merges matching
 *      candidates together: highest-priority full candidate as the base,
 *      plus all higher-priority partial candidates layered on top. This
 *      is what you want for "theme overrides".
 *
 *   4. **Manually composed** - Take `resolveAllResourceCandidates()`,
 *      hand-pick a subset, and feed them to `JsonEditor.mergeObjectsInPlace`
 *      yourself. Use this when you want custom composition - e.g. merge
 *      only the candidates above some priority threshold, or include a
 *      runtime override that isn't in the resource file at all.
 *
 * @param printer - Sink for tutorial output.
 * @param resolver - The resolver built in lesson 3 (context:
 *                   language=fr, currentTerritory=CA, theme=dark,
 *                   density=xhdpi).
 * @returns `Success` when every demonstration completes.
 * @public
 */
export function runLesson4(printer: ITutorialPrinter, resolver: Runtime.ResourceResolver): Result<undefined> {
  printer.heading('Lesson 4 - Resolving resources');

  // Context in effect:
  //   language=fr  currentTerritory=CA  theme=dark  density=xhdpi
  // With territory-priority system configuration, "CA" outranks "fr".
  printer.line('Using the lesson-3 resolver. Active context:');
  printer.line('  language=fr  currentTerritory=CA  theme=dark  density=xhdpi');

  // --- Strategy 1: best match ------------------------------------------
  printer.subheading('(1) Best match  -  resolveResource()');
  printer.line('Returns the single highest-priority candidate. For');
  printer.line(`"${STRINGS_ID}" with the active context, territory CA +`);
  printer.line('language fr both match and the "BOTH: fr + CA" candidate');
  printer.line('has the most specific condition set, so it wins.');
  const best = resolver.resolveResource(STRINGS_ID).orThrow();
  printer.json('best match', best.json);

  // --- Strategy 2: all matches -----------------------------------------
  printer.subheading('(2) All matches  -  resolveAllResourceCandidates()');
  printer.line('Returns every matching candidate in priority order. Useful');
  printer.line('for debugging ("why did this one win?") and for showing');
  printer.line('all alternates.');
  const allStrings = resolver.resolveAllResourceCandidates(STRINGS_ID).orThrow();
  printer.line(`total matches: ${allStrings.length}`);
  allStrings.forEach((candidate, i) => {
    const summary =
      isJsonObject(candidate.json) && typeof candidate.json.source === 'string'
        ? candidate.json.source
        : JSON.stringify(candidate.json);
    printer.line(`  [${i}] isPartial=${candidate.isPartial}  ${summary}`);
  });

  // The density qualifier is more interesting here - adjacent buckets
  // still match (score 0.7) so a single context hits more than one
  // candidate in priority order.
  printer.line('');
  printer.line(`Same story for "${ICONS_ID}" - the custom density type`);
  printer.line('gives adjacent buckets a partial match:');
  const allIcons = resolver.resolveAllResourceCandidates(ICONS_ID).orThrow();
  allIcons.forEach((candidate, i) => {
    const bucket = isJsonObject(candidate.json) ? candidate.json.bucket : undefined;
    printer.line(`  [${i}] bucket=${String(bucket)}`);
  });

  // --- Strategy 3: composed resolution ---------------------------------
  printer.subheading('(3) Composed  -  resolveComposedResourceValue()');
  printer.line('Finds the highest-priority full candidate as the base and');
  printer.line('merges all higher-priority partial candidates on top of');
  printer.line(`it. For "${THEME_ID}":`);
  printer.line('  - base:    the theme=dark full candidate');
  printer.line('  - partial: density=xxhdpi (not active - xhdpi context)');
  printer.line('  - partial: language=fr   (active)');
  const composed = resolver.resolveComposedResourceValue(THEME_ID).orThrow();
  printer.json('composed theme (fr overrides font family)', composed);

  // --- Strategy 4: manually composed -----------------------------------
  printer.subheading('(4) Manually composed  -  hand-rolled merge');
  printer.line('Sometimes you want control that the built-in composition');
  printer.line("doesn't give you. Example: force every matching candidate");
  printer.line('to merge regardless of isPartial, plus splice in a runtime');
  printer.line('override computed from user settings.');

  const themeCandidates = resolver.resolveAllResourceCandidates(THEME_ID).orThrow();

  // Keep only JsonObject payloads - they are the only shape JsonEditor
  // can merge. In this tutorial every theme candidate is an object so
  // nothing is lost; the filter is there for safety.
  const candidatePayloads = themeCandidates
    .map((c) => c.json)
    .filter((v): v is JsonObject => isJsonObject(v));

  // A runtime override we'd like to apply on top - demonstrates that
  // manual composition lets you mix resource data with data from any
  // other source.
  const runtimeOverride: JsonObject = {
    palette: {
      accent: '#ff7f50'
    },
    experimental: {
      newShadow: '0 2px 8px rgba(0,0,0,0.25)'
    }
  };

  // Build the merge list in ascending priority order so later entries
  // win. resolveAllResourceCandidates returns descending priority, so
  // reverse it and stick the runtime override on the end.
  const mergeInputs: JsonObject[] = [...candidatePayloads].reverse();
  mergeInputs.push(runtimeOverride);

  const editor = JsonEditor.create({
    merge: {
      arrayMergeBehavior: 'replace',
      nullAsDelete: true
    }
  }).orThrow();

  const hand = editor.mergeObjectsInPlace({}, mergeInputs).orThrow();
  printer.json('hand-merged theme (adds runtime accent)', hand);

  return succeed(undefined);
}
