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
 * AI prompt generation for procedure entities.
 * @packageDocumentation
 */

import { Helpers, Model } from '../common';
import { createAiPrompt, IAiPrompt } from './model';

/**
 * Builds a detailed AI prompt for generating a procedure entity JSON object.
 *
 * @param procedureName - The display name of the procedure to generate data for
 * @returns A structured prompt with system/user split and combined version
 * @public
 */
export function buildProcedureAiPrompt(procedureName: string): IAiPrompt {
  const baseId = Helpers.toKebabCase(procedureName);

  const user = `Generate a JSON object representing the chocolate-making procedure "${procedureName}" for a chocolate-making application.`;

  const system = `Return ONLY valid JSON (no markdown, no explanation, no code fences). The JSON must conform exactly to the schema below.

## baseId
Generate from the name as lowercase-kebab-case: "${baseId}"

## Schema

### Required fields:
- "baseId": string — lowercase alphanumeric with hyphens. Pattern: /^[a-zA-Z0-9_-]+$/
- "name": string — display name
- "steps": array of step objects (see below) — may be empty if steps are unknown

### Optional fields:
- "description": string — overview of what the procedure accomplishes
- "category": one of [${Model.Enums.allProcedureTypes
    .map((t) => `"${t}"`)
    .join(', ')}] — the type of confection or filling this procedure applies to; omit if general/reusable
- "tags": array of strings — for searching/filtering (e.g., ["tempering", "ganache", "enrobing"])
- "notes": array of objects with "category" (string, e.g. "ai") and "note" (string)

### Step object (required fields):
- "order": number — 1-based step number
- "task": object — either an inline task or a library task reference (see below)

### Step object (optional fields):
- "activeTime": number — minutes actively working on this step
- "waitTime": number — minutes of passive waiting (e.g., cooling, resting)
- "holdTime": number — minutes to hold at temperature
- "temperature": number — target temperature in Celsius
- "notes": array of objects with "category" and "note"

### Inline task (use when the step is specific to this procedure):
\`\`\`json
{
  "task": {
    "baseId": "string — lowercase-kebab-case identifier (e.g. \"melt-chocolate\")",
    "name": "string — short action name",
    "template": "string — Mustache template describing the step (e.g. \"Melt {{chocolate}} to {{temp}}°C\")",
    "defaultActiveTime": number (minutes, optional),
    "defaultWaitTime": number (minutes, optional),
    "defaultHoldTime": number (minutes, optional),
    "defaultTemperature": number (Celsius, optional)
  },
  "params": { "key": "value" }
}
\`\`\`

### Library task reference (use when the step is a standard reusable task):
\`\`\`json
{
  "taskId": "string — full task ID in format \"collection.baseId\" (e.g. \"common.temper-chocolate\")",
  "params": { "key": "value" }
}
\`\`\`

## Instructions
- Use your knowledge of chocolate-making to describe accurate, ordered steps.
- Prefer inline tasks unless the step is clearly a standard reusable operation.
- Include temperatures in Celsius for any tempering, melting, or cooling steps.
- Include a "notes" array with at least one entry using category "ai" describing any assumptions or estimates.
- Populate as many optional fields as you can reasonably determine.
- Return ONLY the JSON object, nothing else.`;

  return createAiPrompt(user, system);
}
