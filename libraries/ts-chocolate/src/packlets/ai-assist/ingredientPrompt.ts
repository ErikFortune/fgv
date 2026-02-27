// Copyright (c) 2024 Erik Fortune
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
 * AI prompt generation for ingredient entities.
 * @packageDocumentation
 */

import { AiAssist } from '@fgv/ts-extras';

import { Helpers, Model } from '../common';

/**
 * Builds a detailed AI prompt for generating an ingredient entity JSON object.
 * The prompt includes the full schema, all enum values, field descriptions,
 * and instructions for the AI to include notes describing assumptions.
 *
 * @param ingredientName - The display name of the ingredient to generate data for
 * @returns A structured prompt with system/user split and combined version
 * @public
 */
export function buildIngredientAiPrompt(ingredientName: string): AiAssist.AiPrompt {
  const baseId = Helpers.toKebabCase(ingredientName);

  const user = `Generate a JSON object representing the ingredient "${ingredientName}" for a chocolate-making application.`;

  const system = `Return ONLY valid JSON (no markdown, no explanation, no code fences). The JSON must conform exactly to the schema below.

## baseId
Generate from the name as lowercase-kebab-case: "${baseId}"

## Schema

### Required fields (all ingredients):
- "baseId": string — lowercase alphanumeric with hyphens, no dots. Pattern: /^[a-zA-Z0-9_-]+$/
- "name": string — display name, 1-200 characters
- "category": one of [${Model.Enums.allIngredientCategories.map((c) => `"${c}"`).join(', ')}]
- "ganacheCharacteristics": object with ALL of these required number fields (percentages 0-100):
  - "cacaoFat": number — percentage of cacao fat
  - "sugar": number — percentage of sugar
  - "milkFat": number — percentage of milk fat
  - "water": number — percentage of water
  - "solids": number — percentage of solids
  - "otherFats": number — percentage of other fats

### Optional fields (all ingredients):
- "description": string — up to 2000 characters
- "manufacturer": string — up to 200 characters
- "allergens": array of [${Model.Enums.allAllergens.map((a) => `"${a}"`).join(', ')}]
- "traceAllergens": array of allergen values (same enum as allergens)
- "certifications": array of [${Model.Enums.allCertifications.map((c) => `"${c}"`).join(', ')}]
- "vegan": boolean
- "tags": array of strings — for searching/filtering
- "density": number — g/mL, between 0.1 and 5.0 (default 1.0)
- "phase": one of [${Model.Enums.allIngredientPhases.map((p) => `"${p}"`).join(', ')}]
- "measurementUnits": object with:
  - "options": array of objects with "id" field, where id is one of [${Model.Enums.allMeasurementUnits
    .map((u) => `"${u}"`)
    .join(', ')}]
  - "preferredId": one of the measurement unit values above (optional)
- "urls": array of objects with "category" (string) and "url" (string)
- "notes": array of objects with "category" (string, e.g. "ai") and "note" (string). Use category "ai" for any assumptions or estimates you want to communicate.

### Category-specific fields:

#### If category is "chocolate":
- "chocolateType" (REQUIRED): one of [${Model.Enums.allChocolateTypes.map((t) => `"${t}"`).join(', ')}]
- "cacaoPercentage" (REQUIRED): number 0-100
- "fluidityStars": one of [${Model.Enums.allFluidityStars.join(', ')}]
- "viscosityMcM": number — viscosity in degrees MacMichael
- "temperatureCurve": object with required "melt" and optional "cool", "working" (all numbers in Celsius)
- "beanVarieties": array of [${Model.Enums.allCacaoVarieties.map((v) => `"${v}"`).join(', ')}]
- "applications": array of [${Model.Enums.allChocolateApplications.map((a) => `"${a}"`).join(', ')}]
- "origins": array of strings

#### If category is "sugar":
- "hydrationNumber": number — water molecules per sugar molecule
- "sweetnessPotency": number — relative to sucrose (1.0 = sucrose)

#### If category is "dairy":
- "fatContent": number 0-100 — fat content percentage
- "waterContent": number 0-100 — water content percentage

#### If category is "fat":
- "meltingPoint": number — melting point in Celsius

#### If category is "alcohol":
- "alcoholByVolume": number 0-100 — ABV percentage
- "flavorProfile": string — flavor description

## Instructions
- Use your knowledge to fill in accurate values. Research the specific product if a manufacturer is identifiable.
- For ganacheCharacteristics, provide your best estimates of each component as a percentage of total weight. The six values (cacaoFat, sugar, milkFat, water, solids, otherFats) represent the ingredient's composition and MUST sum to exactly 100. For example, Valrhona Guanaja 70% dark chocolate might be: cacaoFat 38, sugar 29, milkFat 0, water 1, solids 31, otherFats 1.
- Include a "notes" array with at least one entry using category "ai" describing any assumptions you made, especially unconfirmed estimates. These notes are preserved on the entity and shown to the user.
- Populate as many optional fields as you can reasonably determine.
- Return ONLY the JSON object, nothing else.`;

  return new AiAssist.AiPrompt(user, system);
}
