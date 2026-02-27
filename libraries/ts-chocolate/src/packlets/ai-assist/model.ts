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
 * Types for AI assist prompt generation and API integration.
 * @packageDocumentation
 */

/**
 * A structured AI prompt with system/user split for direct API calls,
 * and a combined version for copy/paste workflows.
 * @public
 */
export interface IAiPrompt {
  /** System instructions: schema documentation, format rules, general guidance. */
  readonly system: string;
  /** User request: the specific entity generation request. */
  readonly user: string;
  /** Combined single-string version (user + system joined) for copy/paste. */
  readonly combined: string;
}

// TODO: instead of a helper let's create an AiPrompt class and construct 'combined' on-the-fly or lazily.
/**
 * Helper to create an IAiPrompt from system and user parts.
 * @param user - The user request (specific entity to generate)
 * @param system - The system instructions (schema, rules, instructions)
 * @returns A structured prompt
 * @public
 */
export function createAiPrompt(user: string, system: string): IAiPrompt {
  return {
    system,
    user,
    combined: `${user}\n\n${system}`
  };
}
