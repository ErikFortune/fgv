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

import { AiAssist } from '@fgv/ts-extras';

import { Helpers, Model } from '../common';

/**
 * Builds a detailed AI prompt for generating a mold entity JSON object.
 * The prompt includes the full schema, all enum values, field descriptions,
 * and instructions for the AI to include notes describing assumptions.
 *
 * @param moldDescription - A description of the mold, typically manufacturer and model number
 * @param additionalInstructions - Optional additional instructions to append to the user message
 * @returns A structured prompt with system/user split and combined version
 * @public
 */
export function buildMoldAiPrompt(
  moldDescription: string,
  additionalInstructions?: string
): AiAssist.AiPrompt {
  const baseId = Helpers.toKebabCase(moldDescription);

  const userBase = `Generate a JSON object representing the polycarbonatechocolate mold "${moldDescription}" for a chocolate-making application.`;
  const user = additionalInstructions
    ? `${userBase}\n\nAdditional instructions from the user:\n${additionalInstructions}`
    : userBase;

  const system = `Return ONLY valid JSON (no markdown, no explanation, no code fences). The JSON must conform exactly to the schema below.

## baseId
Generate from the description as lowercase-kebab-case: "${baseId}"

## Schema

### Required fields:
- "baseId": string — lowercase alphanumeric with hyphens, no dots. Pattern: /^[a-zA-Z0-9_-]+$/
- "manufacturer": string — manufacturer name (e.g., "Chocolate World", "Martellato", "Pavoni")
- "productNumber": string — manufacturer's product/model number
- "name": string — human-readable name for the mold shape (e.g., "sphere", "heart", "bar")
- "cavities": object — one of two formats (see below)
- "format": one of [${Model.Enums.allMoldFormats
    .map((f) => `"${f}"`)
    .join(', ')}], where "series-1000" are 135x275mm and "series-2000" are 175x275mm.

### Optional fields:
- "description": string — optional longer description of the mold shape or design
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
- Return ONLY the JSON object, nothing else.
- Authoritative manufacturer sites are: https://www.chocolateworld.be, https://www.greyas.com, https://www.martellato.com, https://www.cabrellon.it/en/, https://www.silikomart.com/en/, and https://imrenplastik.com/en (for Implast)
- Preferred retail sites include https://www.bakedeco.com, https://www.chocolat-chocolat.com and https://www.amazon.com
- Typical part number prefix: CW for Chocolate World, CM for Greyas, MA for Martellato
- For generic descriptions (e.g. "sphere mold", "heart bonbon mold"), estimate reasonable values and note your assumptions. This is fine and expected.
- For specific part numbers or branded products (e.g. "CW1212", "Chocolate World sphere 25mm"), you must be confident you know the actual product. If you are not confident, do NOT guess or hallucinate — return an error object instead (see below).

### Error Object Format

If you cannot confidently identify the requested mold, return this instead of a mold entity:
\`\`\`json
{
  "error": "string describing why you cannot generate the entity",
  "term": "the original search term"
}
\`\`\`
For example: \`{"error": "Cannot confidently identify mold CW9999 — part number not recognized", "term": "CW9999"}\``;
  return new AiAssist.AiPrompt(user, system);
}
