// Copyright (c) 2026 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/**
 * AI prompt generation for filling recipe entities.
 * @packageDocumentation
 */

import { AiAssist } from '@fgv/ts-extras';

import { Helpers } from '../common';

/**
 * Builds a detailed AI prompt for generating a filling recipe entity JSON object.
 *
 * @param fillingName - The display name of the filling recipe to generate data for
 * @returns A structured prompt with system/user split and combined version
 * @public
 */
export function buildFillingAiPrompt(fillingName: string): AiAssist.AiPrompt {
  const baseId = Helpers.toKebabCase(fillingName);

  const today = new Date().toISOString().split('T')[0]!;

  const user = `Generate a JSON object representing the filling recipe "${fillingName}" for a chocolate-making application.`;

  const system = `Return ONLY valid JSON (no markdown, no explanation, no code fences). The JSON must conform exactly to the schema below.

## baseId
Generate from the name as lowercase-kebab-case: "${baseId}"

## Schema

### Top-level required fields:
- "baseId": string — lowercase alphanumeric with hyphens. Pattern: /^[a-zA-Z0-9_-]+$/
- "name": string — display name
- "category": one of ["ganache", "caramel", "gianduja"]
- "goldenVariationSpec": string — must match the variationSpec of the first variation, e.g. "${today}"
- "variations": array — exactly one variation object (see below)

### Top-level optional fields:
- "description": string
- "tags": array of strings
- "urls": array of objects with "category" (string) and "url" (string)

### Variation object (required fields):
- "variationSpec": string — ISO date, e.g. "${today}"
- "createdDate": string — ISO date, e.g. "${today}"
- "baseWeight": number — total weight in grams (sum of all ingredient amounts in grams)
- "ingredients": array of ingredient objects (see below)

### Variation object (optional fields):
- "name": string — human-readable variation label
- "yield": string — e.g. "50 bonbons" or "500g"
- "notes": array of objects with "category" (string, e.g. "ai") and "note" (string)

### Ingredient object (required fields):
- "ingredient": object with:
  - "ids": array containing one string — the ingredient baseId in lowercase-kebab-case (e.g. "callebaut-811", "heavy-cream")
  - "preferredId": string — same as the single id
- "amount": number — amount in grams (or in the specified unit)

### Ingredient object (optional fields):
- "unit": string — measurement unit if not grams (e.g. "tsp", "Tbsp", "ml")
- "modifiers": object with optional:
  - "toTaste": boolean
  - "processNote": string — e.g. "steeped and strained", "reduced by simmering"
  - "yieldFactor": number — fraction of ingredient remaining after processing (0.0–1.0)
- "notes": array of objects with "category" and "note"

## Instructions
- Use your knowledge of chocolate-making to provide accurate ingredient IDs and amounts.
- Ingredient IDs should be lowercase-kebab-case names (e.g. "heavy-cream", "callebaut-811", "butter", "glucose-syrup", "invert-sugar").
- The baseWeight should equal the sum of all ingredient amounts converted to grams.
- Include a "notes" array on the variation with at least one entry using category "ai" describing any assumptions, especially estimated amounts or substitutions.
- Populate as many optional fields as you can reasonably determine.
- Return ONLY the JSON object, nothing else.`;

  return new AiAssist.AiPrompt(user, system);
}
