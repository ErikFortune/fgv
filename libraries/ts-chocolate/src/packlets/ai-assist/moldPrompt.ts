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
 * AI prompt generation for mold entities.
 * @packageDocumentation
 */

import { Helpers, Model } from '../common';
import { createAiPrompt, IAiPrompt } from './model';

/**
 * Builds a detailed AI prompt for generating a mold entity JSON object.
 * The prompt includes the full schema, all enum values, field descriptions,
 * and instructions for the AI to include notes describing assumptions.
 *
 * @param moldDescription - A description of the mold, typically manufacturer and model number
 * @returns A structured prompt with system/user split and combined version
 * @public
 */
export function buildMoldAiPrompt(moldDescription: string): IAiPrompt {
  const baseId = Helpers.toKebabCase(moldDescription);

  const user = `Generate a JSON object representing the chocolate mold "${moldDescription}" for a chocolate-making application.`;

  const system = `Return ONLY valid JSON (no markdown, no explanation, no code fences). The JSON must conform exactly to the schema below.

## baseId
Generate from the description as lowercase-kebab-case: "${baseId}"

## Schema

### Required fields:
- "baseId": string — lowercase alphanumeric with hyphens, no dots. Pattern: /^[a-zA-Z0-9_-]+$/
- "manufacturer": string — manufacturer name (e.g., "Chocolate World", "Martellato", "Pavoni")
- "productNumber": string — manufacturer's product/model number
- "cavities": object — one of two formats (see below)
- "format": one of [${Model.Enums.allMoldFormats
    .map((f) => `"${f}"`)
    .join(', ')}], where "series-1000" are 135x275mm and "series-2000" are 175x257mm.

### Optional fields:
- "description": string — human-readable description of the mold shape (e.g., "sphere", "heart", "bar")
- "tags": array of strings — for searching/filtering (e.g., ["sphere", "bonbon", "polycarbonate"])
- "related": array of strings — IDs of related molds (e.g., different sizes of the same shape)
- "urls": array of objects with "category" (string, e.g., "manufacturer", "purchase") and "url" (string)
- "notes": array of objects with "category" (string, e.g., "ai") and "note" (string). Use category "ai" for any assumptions or estimates you want to communicate.

### Cavities format (choose one):

#### Grid layout (for molds with rows and columns):
\`\`\`json
{
  "kind": "grid",
  "columns": number,
  "rows": number,
  "info": {
    "weight": number (grams per cavity, optional),
    "dimensions": {
      "width": number (mm),
      "length": number (mm),
      "depth": number (mm)
    }
  }
}
\`\`\`

#### Count layout (for molds with irregular or single-row layouts):
\`\`\`json
{
  "kind": "count",
  "count": number,
  "info": {
    "weight": number (grams per cavity, optional),
    "dimensions": {
      "width": number (mm),
      "length": number (mm),
      "depth": number (mm)
    }
  }
}
\`\`\`

## Instructions
- Use your knowledge to fill in accurate values. Research the specific product by manufacturer and model number.
- Most professional chocolate molds use "grid" layout. Use "count" only for irregular layouts.
- The "format" field indicates the mold frame series. Use "other" if unknown.
- Cavity "weight" is the chocolate capacity per cavity in grams.
- Cavity "dimensions" are the internal dimensions of each cavity in millimeters.
- Include a "notes" array with at least one entry using category "ai" describing any assumptions you made, especially unconfirmed dimensions or weights.
- Include "urls" if you can identify the manufacturer's product page or a purchase link.
- Populate as many optional fields as you can reasonably determine.
- Return ONLY the JSON object, nothing else.`;

  return createAiPrompt(user, system);
}
