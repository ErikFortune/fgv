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

import { JsonObject, JsonValue, isJsonObject } from '../json';

/**
 * A constraint or annotation keyword a schema node can carry beyond its structure — the keywords
 * whose provider support varies, and which `adaptSchemaKeywords` adapts.
 * @public
 */
export type SchemaConstraintKeyword =
  | 'minimum'
  | 'exclusiveMinimum'
  | 'maximum'
  | 'exclusiveMaximum'
  | 'multipleOf'
  | 'minLength'
  | 'maxLength'
  | 'format'
  | 'title'
  | 'default'
  | 'examples';

/**
 * Every `SchemaConstraintKeyword`, in the fixed order in which they are translated
 * and folded — so the fold sentence is the same for the same node, whatever order its keys arrived
 * in, and a cached prompt prefix stays stable.
 * @public
 */
export const schemaConstraintKeywords: ReadonlyArray<SchemaConstraintKeyword> = [
  'minimum',
  'exclusiveMinimum',
  'maximum',
  'exclusiveMaximum',
  'multipleOf',
  'minLength',
  'maxLength',
  'format',
  'title',
  'default',
  'examples'
];

/**
 * Rewrites a node to express one keyword in a provider's dialect.
 *
 * @remarks
 * Called with a node carrying the keyword; returns the node with the keyword **removed** and an
 * exactly equivalent statement in its place, or `undefined` when no exact equivalent exists for
 * this node — in which case the keyword is folded. A translator must never return a looser or a
 * tighter statement than the one it replaces: the wire would then disagree with the validator.
 * @public
 */
export type SchemaKeywordTranslator = (node: JsonObject) => JsonObject | undefined;

/**
 * What one wire format does with one keyword.
 *
 * - `'pass'` — the provider documents the keyword; it is sent as emitted.
 * - `'fold'` — removed, and stated in the node's description instead (see
 *   `adaptSchemaKeywords`).
 * - `{ passValues }` — sent only when its value is one of these (a `format` vocabulary); folded
 *   otherwise.
 * - `{ translate }` — rewritten into an exact equivalent the provider documents; folded where the
 *   translator finds none.
 * @public
 */
export type SchemaKeywordRule =
  | 'pass'
  | 'fold'
  | { readonly passValues: ReadonlyArray<string> }
  | { readonly translate: SchemaKeywordTranslator };

/**
 * A wire format's keyword-capability table: a rule for **every** keyword.
 *
 * @remarks
 * A total `Record`, so a table that forgets a keyword — or a keyword added later — is a compile
 * error rather than a silent default. Build a table so that anything not verified against the
 * provider's documentation is `'fold'`: folding is always safe (see
 * `adaptSchemaKeywords`), so an unverified `'pass'` is the only way a table can be
 * wrong in a harmful direction.
 * @public
 */
export type SchemaKeywordCapabilities = Readonly<Record<SchemaConstraintKeyword, SchemaKeywordRule>>;

/**
 * The table that folds every keyword — the safe choice for a wire whose support is undocumented.
 * @public
 */
export const foldAllSchemaKeywords: SchemaKeywordCapabilities = {
  minimum: 'fold',
  exclusiveMinimum: 'fold',
  maximum: 'fold',
  exclusiveMaximum: 'fold',
  multipleOf: 'fold',
  minLength: 'fold',
  maxLength: 'fold',
  format: 'fold',
  title: 'fold',
  default: 'fold',
  examples: 'fold'
};

/**
 * The sentence that states folded keywords in a description:
 * `Constraints: minimum 1; maximum 10.`
 *
 * @remarks
 * Each keyword is its name, a space, and its value as JSON (`format "email"`, `default null`,
 * `examples [1,2]`), joined by `"; "` in `schemaConstraintKeywords` order. Fixed
 * wording and order make the output byte-stable for prompt caching.
 * @param folded - The folded keywords and their values, in order.
 * @returns The sentence.
 * @public
 */
export function foldedConstraintsSentence(
  folded: ReadonlyArray<readonly [SchemaConstraintKeyword, JsonValue]>
): string {
  return `Constraints: ${folded
    .map(([keyword, value]) => `${keyword} ${JSON.stringify(value)}`)
    .join('; ')}.`;
}

/** Whether `rule` sends a keyword whose value is `value`. */
function _passes(rule: SchemaKeywordRule, value: JsonValue): boolean {
  if (rule === 'pass') {
    return true;
  }
  if (rule === 'fold') {
    return false;
  }
  if ('passValues' in rule) {
    return typeof value === 'string' && rule.passValues.includes(value);
  }
  // A translator that ran and found an equivalent removed the keyword; one still present had none.
  return false;
}

/** Applies every translator in the table to a node, in keyword order. */
function _translate(node: JsonObject, capabilities: SchemaKeywordCapabilities): JsonObject {
  let out = node;
  for (const keyword of schemaConstraintKeywords) {
    const rule = capabilities[keyword];
    if (keyword in out && typeof rule === 'object' && 'translate' in rule) {
      out = rule.translate(out) ?? out;
    }
  }
  return out;
}

/** Adapts one node's own keywords, its children already adapted. */
function _adaptOwnKeywords(node: JsonObject, capabilities: SchemaKeywordCapabilities): JsonObject {
  const translated = _translate(node, capabilities);
  const folded = schemaConstraintKeywords
    .filter((keyword) => keyword in translated && !_passes(capabilities[keyword], translated[keyword]))
    .map((keyword) => [keyword, translated[keyword]] as const);
  if (folded.length === 0) {
    return translated;
  }
  const out: JsonObject = {};
  for (const [key, value] of Object.entries(translated)) {
    if (!folded.some(([keyword]) => keyword === key)) {
      out[key] = value;
    }
  }
  const sentence = foldedConstraintsSentence(folded);
  const existing = out.description;
  // An existing description keeps its position; a new one goes last.
  return {
    ...out,
    description: typeof existing === 'string' && existing.length > 0 ? `${existing} ${sentence}` : sentence
  };
}

/**
 * Adapts a wire schema's constraint and annotation keywords to one provider's documented support:
 * each keyword is passed, translated, or folded into the node's description, per `capabilities`.
 *
 * @remarks
 * **Folding loosens the wire, never the validator.** A folded keyword is removed from the node and
 * restated in one deterministic sentence appended to its `description` — see
 * `foldedConstraintsSentence`. The schema's validator still enforces it, so the
 * validator stays authoritative: a model that ignores a folded constraint gets a correctable
 * validation error on a tool call, and a validation failure on a structured-output reply. That is
 * why folding is always safe, and why a capability table should fold anything not verified.
 *
 * Walks the schema grammar `toJson()` emits — a node's `properties` values, `items` and
 * schema-valued `additionalProperties` are nodes and are adapted; every other value, `default`,
 * `examples` and `enum` among them, is data and is copied untouched. A property *named* like a
 * keyword is a name, not a keyword. A value that is not an object is returned as it is. Infallible,
 * so it returns a plain value rather than a `Result`.
 * @param schema - A wire schema, typically `schema.toJson()`.
 * @param capabilities - The target wire format's keyword-capability table.
 * @returns The adapted schema; the input is not modified.
 * @public
 */
export function adaptSchemaKeywords(schema: JsonValue, capabilities: SchemaKeywordCapabilities): JsonValue {
  if (!isJsonObject(schema)) {
    return schema;
  }
  const out: JsonObject = {};
  for (const [key, value] of Object.entries(schema)) {
    if (key === 'properties' && isJsonObject(value)) {
      const properties: JsonObject = {};
      for (const [name, child] of Object.entries(value)) {
        properties[name] = adaptSchemaKeywords(child, capabilities);
      }
      out[key] = properties;
    } else if (key === 'items' || key === 'additionalProperties') {
      out[key] = adaptSchemaKeywords(value, capabilities);
    } else {
      out[key] = value;
    }
  }
  return _adaptOwnKeywords(out, capabilities);
}
