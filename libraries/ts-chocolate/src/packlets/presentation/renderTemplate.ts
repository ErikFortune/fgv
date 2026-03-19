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
 * Simple `{{variable}}` template renderer for presentation output.
 * @packageDocumentation
 */

/**
 * Renders a `{{variable}}` template string by substituting values from `params`.
 * Variables that are missing or empty are left as `{{variable}}` in the output.
 *
 * @param template - The template string with `{{varName}}` placeholders.
 * @param params - Map of variable names to substitution values.
 * @returns The rendered string.
 * @public
 */
export function renderTemplate(template: string, params: Record<string, string>): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, name: string) => {
    const trimmed = name.trim();
    return trimmed in params && params[trimmed] !== '' ? params[trimmed] : `{{${trimmed}}}`;
  });
}
