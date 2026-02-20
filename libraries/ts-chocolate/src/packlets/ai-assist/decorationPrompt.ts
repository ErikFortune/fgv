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
 * AI prompt generation for decoration entities.
 * @packageDocumentation
 */

import { Helpers } from '../common';

/**
 * Builds a detailed AI prompt for generating a decoration entity JSON object.
 *
 * @param decorationName - The display name of the decoration to generate data for
 * @returns A complete prompt string suitable for copying to clipboard or sending to an AI agent
 * @public
 */
export function buildDecorationAiPrompt(decorationName: string): string {
  const baseId = Helpers.toKebabCase(decorationName);

  return `Generate a JSON object representing the chocolate confection decoration "${decorationName}" for a chocolate-making application.

Return ONLY valid JSON (no markdown, no explanation, no code fences). The JSON must conform exactly to the schema below.

## baseId
Generate from the name as lowercase-kebab-case: "${baseId}"

## Schema

### Required fields:
- "baseId": string — lowercase alphanumeric with hyphens. Pattern: /^[a-zA-Z0-9_-]+$/
- "name": string — display name
- "ingredients": array of ingredient objects (see below) — may be empty if ingredients are unknown

### Optional fields:
- "description": string — what the decoration looks like and how it is applied
- "tags": array of strings — for searching/filtering (e.g., ["transfer-sheet", "cocoa-butter", "gold-leaf"])
- "notes": array of objects with "category" (string, e.g. "ai") and "note" (string)
- "ratings": array of rating objects (see below)

### Ingredient object (required fields):
- "ingredient": object with:
  - "ids": array containing one string — the ingredient baseId in lowercase-kebab-case (e.g. "colored-cocoa-butter", "gold-leaf", "cocoa-powder")
  - "preferredId": string — same as the single id
- "amount": number — amount in grams

### Ingredient object (optional fields):
- "notes": array of objects with "category" and "note"

### Rating object:
- "category": one of ["difficulty", "durability", "appearance", "workability"]
- "score": number from 1 to 5
- "notes": array of objects with "category" and "note" (optional)

## Instructions
- Use your knowledge of chocolate decoration techniques to describe accurate ingredients and amounts.
- Ingredient IDs should be lowercase-kebab-case names (e.g. "colored-cocoa-butter", "gold-leaf", "transfer-sheet", "cocoa-powder", "edible-glitter").
- Include a "notes" array with at least one entry using category "ai" describing any assumptions, especially about ingredients or application technique.
- If you can estimate difficulty or appearance ratings, include them.
- Populate as many optional fields as you can reasonably determine.
- Return ONLY the JSON object, nothing else.`;
}
