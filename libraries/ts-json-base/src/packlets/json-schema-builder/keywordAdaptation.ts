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

import { StringOneOf } from '@fgv/ts-utils';
import { JsonObject, JsonValue, isJsonObject } from '../json';

/**
 * The numeric constraint keywords of a `number` / `integer` node, in the order they are checked,
 * emitted and folded.
 * @public
 */
export const schemaNumberConstraintKeywords = [
  'minimum',
  'exclusiveMinimum',
  'maximum',
  'exclusiveMaximum',
  'multipleOf'
] as const;

/**
 * The length constraint keywords of a `string` node, in the order they are checked, emitted and
 * folded.
 * @public
 */
export const schemaLengthConstraintKeywords = ['minLength', 'maxLength'] as const;

/**
 * The annotation keywords — emitted, never enforced — in the order they are folded.
 * @public
 */
export const schemaAnnotationKeywords = ['format', 'title', 'default', 'examples'] as const;

/**
 * Every keyword whose provider support varies, and which `adaptSchemaKeywords` adapts: the
 * validating keywords, then the annotations.
 *
 * @remarks
 * The **single** list: `SchemaConstraintKeyword` is derived from it, the walker iterates it, and
 * the factories, `fromJson` and `toJson()` copy fields through its two validating subsets — so a
 * keyword cannot be known to one of them and missing from another (which, for the walker, would
 * send it raw to every provider).
 * @public
 */
export const schemaConstraintKeywords = [
  ...schemaNumberConstraintKeywords,
  ...schemaLengthConstraintKeywords,
  ...schemaAnnotationKeywords
] as const;

/**
 * A validating keyword: enforced by the validator.
 * @public
 */
export type SchemaValidatingKeyword =
  | StringOneOf<typeof schemaNumberConstraintKeywords>
  | StringOneOf<typeof schemaLengthConstraintKeywords>;

/**
 * An annotation keyword: emitted, never enforced.
 * @public
 */
export type SchemaAnnotationKeyword = StringOneOf<typeof schemaAnnotationKeywords>;

/**
 * A constraint or annotation keyword a schema node can carry beyond its structure.
 * @public
 */
export type SchemaConstraintKeyword = StringOneOf<typeof schemaConstraintKeywords>;

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
 * - `'fold'` — removed, and stated in the node's description instead (see `adaptSchemaKeywords`).
 * - `{ passValues }` — sent only when its value is one of these (a `format` vocabulary); folded
 *   otherwise.
 * - `{ translate }` — rewritten into an exact equivalent the provider documents; folded where the
 *   translator finds none.
 *
 * An annotation may also be `'drop'` — see `SchemaAnnotationRule`.
 * @public
 */
export type SchemaKeywordRule =
  | 'pass'
  | 'fold'
  | { readonly passValues: ReadonlyArray<string> }
  | { readonly translate: SchemaKeywordTranslator };

/**
 * What one wire format does with one annotation: any `SchemaKeywordRule`, or `'drop'` — removed
 * and not restated.
 *
 * @remarks
 * Only an annotation may be dropped: it constrains nothing, so removing it cannot make the wire
 * looser than the validator. A validating keyword is always passed, translated or folded.
 * @public
 */
export type SchemaAnnotationRule = SchemaKeywordRule | 'drop';

/**
 * A wire format's keyword-capability table: a rule for **every** keyword.
 *
 * @remarks
 * Total, so a table that forgets a keyword — or a keyword added later — is a compile error rather
 * than a silent default. Build a table so that anything not verified against the provider's
 * documentation is `'fold'` (or, for an annotation, `'drop'`): folding is always safe (see
 * `adaptSchemaKeywords`), so an unverified `'pass'` is the only way a table can be wrong in a
 * harmful direction.
 * @public
 */
export type SchemaKeywordCapabilities = Readonly<
  Record<SchemaValidatingKeyword, SchemaKeywordRule> & Record<SchemaAnnotationKeyword, SchemaAnnotationRule>
>;

/**
 * The conservative table, for a wire whose support is undocumented: every keyword folds, except
 * `title`, which is dropped — a title restates the property name the model already sees.
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
  title: 'drop',
  default: 'fold',
  examples: 'fold'
};

/** A folded keyword and its value. */
type Folded = readonly [SchemaConstraintKeyword, JsonValue];

/** The sentence label for each annotation, in `schemaAnnotationKeywords` order. */
const ANNOTATION_LABELS: Readonly<Record<SchemaAnnotationKeyword, string>> = {
  format: 'Format',
  title: 'Title',
  default: 'Default',
  examples: 'Examples'
};

/** Whether a keyword is an annotation. */
function _isAnnotation(keyword: SchemaConstraintKeyword): keyword is SchemaAnnotationKeyword {
  return schemaAnnotationKeywords.some((k) => k === keyword);
}

/**
 * The text that states folded keywords in a description: the validating keywords as one
 * `Constraints:` sentence, then one sentence per folded annotation.
 *
 * @remarks
 * - Validating keywords: `Constraints: minimum 1; maximum 10.` — each keyword name, a space and
 *   its value as JSON, joined by `"; "`.
 * - Annotations, each its own sentence so none reads as a constraint: `Format: email.`,
 *   `Title: Count.` (a string value written as it is), `Default: null.`, `Examples: ["a","b"].`
 *   (other values as JSON).
 *
 * Both follow `schemaConstraintKeywords` order whatever order the keys arrived in, and the two
 * parts are joined by one space. Fixed wording and order make the output byte-stable for prompt
 * caching. Returns `''` for nothing folded.
 * @param folded - The folded keywords and their values.
 * @returns The text.
 * @public
 */
export function foldedKeywordsText(
  folded: ReadonlyArray<readonly [SchemaConstraintKeyword, JsonValue]>
): string {
  const rank = (keyword: SchemaConstraintKeyword): number => schemaConstraintKeywords.indexOf(keyword);
  const ordered = [...folded].sort(([a], [b]) => rank(a) - rank(b));
  const constraints = ordered.filter(([keyword]) => !_isAnnotation(keyword));
  const parts: string[] = [];
  if (constraints.length > 0) {
    parts.push(
      `Constraints: ${constraints
        .map(([keyword, value]) => `${keyword} ${JSON.stringify(value)}`)
        .join('; ')}.`
    );
  }
  for (const [keyword, value] of ordered) {
    if (_isAnnotation(keyword)) {
      const shown = typeof value === 'string' && keyword !== 'default' ? value : JSON.stringify(value);
      parts.push(`${ANNOTATION_LABELS[keyword]}: ${shown}.`);
    }
  }
  return parts.join(' ');
}

/** What `rule` does with a keyword whose value is `value`, once any translator has run. */
function _disposition(rule: SchemaAnnotationRule, value: JsonValue): 'pass' | 'fold' | 'drop' {
  if (rule === 'pass' || rule === 'fold' || rule === 'drop') {
    return rule;
  }
  if ('passValues' in rule) {
    return typeof value === 'string' && rule.passValues.includes(value) ? 'pass' : 'fold';
  }
  // A translator that ran and found an equivalent removed the keyword; one still present had none.
  return 'fold';
}

/** Applies every translator in the table to a node, in keyword order. */
function _translate(node: JsonObject, capabilities: SchemaKeywordCapabilities): JsonObject {
  let out = node;
  for (const keyword of schemaConstraintKeywords) {
    const rule: SchemaAnnotationRule = capabilities[keyword];
    if (keyword in out && typeof rule === 'object' && 'translate' in rule) {
      out = rule.translate(out) ?? out;
    }
  }
  return out;
}

/** Adapts one node's own keywords, its children already adapted. */
function _adaptOwnKeywords(node: JsonObject, capabilities: SchemaKeywordCapabilities): JsonObject {
  const translated = _translate(node, capabilities);
  const removed = new Set<string>();
  const folded: Folded[] = [];
  for (const keyword of schemaConstraintKeywords) {
    if (keyword in translated) {
      const disposition = _disposition(capabilities[keyword], translated[keyword]);
      if (disposition !== 'pass') {
        removed.add(keyword);
      }
      if (disposition === 'fold') {
        folded.push([keyword, translated[keyword]]);
      }
    }
  }
  if (removed.size === 0) {
    return translated;
  }
  const out: JsonObject = {};
  for (const [key, value] of Object.entries(translated)) {
    if (!removed.has(key)) {
      out[key] = value;
    }
  }
  if (folded.length === 0) {
    return out;
  }
  const text = foldedKeywordsText(folded);
  const existing = out.description;
  // An existing description keeps its position; a new one goes last.
  return {
    ...out,
    description: typeof existing === 'string' && existing.length > 0 ? `${existing} ${text}` : text
  };
}

/**
 * Adapts a wire schema's constraint and annotation keywords to one provider's documented support:
 * each keyword is passed, translated, folded into the node's description, or (an annotation)
 * dropped, per `capabilities`.
 *
 * @remarks
 * **Folding loosens the wire, never the validator.** A folded keyword is removed from the node and
 * restated in deterministic text appended to its `description` — see `foldedKeywordsText`. The
 * schema's validator still enforces it, so the validator stays authoritative: a model that ignores
 * a folded constraint gets a correctable validation error on a tool call, and a validation failure
 * on a structured-output reply. That is why folding is always safe, and why a capability table
 * should fold anything not verified. Dropping is safe for the same reason, and is allowed only for
 * annotations, which constrain nothing.
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
