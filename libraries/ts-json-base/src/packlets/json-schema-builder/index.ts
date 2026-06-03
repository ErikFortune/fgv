/*
 * Copyright (c) 2026 Erik Fortune
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

/**
 * Typed JSON Schema for the LLM-tool subset: author a schema with the factories, derive its
 * static TypeScript type with {@link Static}, and call `schema.validate(input)` directly or
 * emit the wire JSON Schema with `schema.toJson()` — all from the single declaration.
 *
 * @remarks
 * Surface change from the first-pass implementation:
 * - `toConverter(schema)` removed — schemas ARE Validators; call `schema.validate(input)`.
 * - `toJson(schema)` removed — call `schema.toJson()` instead.
 * - `fromJson(json)` returns `ISchemaValidator<JsonValue>` (honest supertype — a runtime-parsed schema may validate strings, numbers, booleans, arrays, or objects, not just objects).
 */
export * from './types';
export * from './factories';
export * from './fromJson';
