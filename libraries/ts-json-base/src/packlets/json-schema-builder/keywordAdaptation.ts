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

import { Result, StringOneOf, fail, mapResults, succeed } from '@fgv/ts-utils';
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
 * The regular-expression constraint keyword of a `string` node, in the order it is checked, emitted
 * and folded.
 *
 * @remarks
 * The wire receives the pattern's ECMAScript source, which JSON Schema reads as an unanchored
 * ECMA-262 regular expression with Unicode semantics. Provider engines implement dialects of it, so
 * a table passes `pattern` only where the provider documents the keyword with those semantics.
 * @public
 */
export const schemaPatternConstraintKeywords = ['pattern'] as const;

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
  ...schemaPatternConstraintKeywords,
  ...schemaAnnotationKeywords
] as const;

/**
 * A validating keyword: enforced by the validator.
 * @public
 */
export type SchemaValidatingKeyword =
  | StringOneOf<typeof schemaNumberConstraintKeywords>
  | StringOneOf<typeof schemaLengthConstraintKeywords>
  | StringOneOf<typeof schemaPatternConstraintKeywords>;

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
 * What a wire format does with a schema that states no `type` — see
 * `ISchemaShapeCapabilities.untyped`.
 * @public
 */
export type SchemaUntypedRule = 'pass' | 'pass-nested' | 'refuse';

/**
 * What a wire format does with the two schema shapes whose support varies independently of any
 * keyword: an `enum` whose members are not strings, and a schema with no `type`.
 *
 * @remarks
 * - `nonStringEnum` — `'pass'` sends a numeric or boolean `enum` as emitted; `'fold'` removes it and
 *   states it in the description (`Constraints: enum [1,2].`), keeping the `type`. A string enum is
 *   always passed.
 * - `untyped` — `'pass'` sends a schema with no `type` (`JsonSchema.anyValue`, `{}`) as emitted;
 *   `'refuse'` fails the adaptation, naming the path; `'pass-nested'` passes one beneath the root
 *   (in `properties` or `items`) and, for a wire that requires the root schema itself to state a
 *   `type`, refuses a root (`#`) with no `type` keyword — including one typed only by `enum`,
 *   `const`, `$ref` or a combinator, which such a wire rejects just the same. There is no fold for it: the only way to give the node a
 *   `type` is to pick one, which would narrow what the model may send below what the validator
 *   accepts, and a refusal is the one outcome that cannot mislead.
 * @public
 */
export interface ISchemaShapeCapabilities {
  /** What the wire does with an `enum` holding a number or a boolean. */
  readonly nonStringEnum: 'pass' | 'fold';
  /** What the wire does with a schema that states no `type`. */
  readonly untyped: SchemaUntypedRule;
}

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
> &
  ISchemaShapeCapabilities;

/**
 * The conservative table, for a wire whose support is undocumented: every keyword folds, except
 * `title` and `default`, which are dropped. A title restates the property name the model already
 * sees. A default folded into the description (`Default: 3.`) reads as though it were applied when
 * the field is omitted, and nothing applies it (the validator never substitutes a default), so
 * stating it would mislead the model about what an omitted field means. A non-string `enum` folds,
 * and a schema with no `type` is refused.
 * @public
 */
export const unverifiedWireSchemaKeywords: SchemaKeywordCapabilities = {
  minimum: 'fold',
  exclusiveMinimum: 'fold',
  maximum: 'fold',
  exclusiveMaximum: 'fold',
  multipleOf: 'fold',
  minLength: 'fold',
  maxLength: 'fold',
  pattern: 'fold',
  format: 'fold',
  title: 'drop',
  default: 'drop',
  examples: 'fold',
  nonStringEnum: 'fold',
  untyped: 'refuse'
};

/**
 * A keyword the fold can state in a description: a constraint or annotation keyword, or a
 * non-string `enum`.
 * @public
 */
export type SchemaFoldedKeyword = 'enum' | SchemaConstraintKeyword;

/** A folded keyword and its value. */
type Folded = readonly [SchemaFoldedKeyword, JsonValue];

/** The sentence label for each annotation, in `schemaAnnotationKeywords` order. */
const ANNOTATION_LABELS: Readonly<Record<SchemaAnnotationKeyword, string>> = {
  format: 'Format',
  title: 'Title',
  default: 'Default',
  examples: 'Examples'
};

/** Whether a keyword is an annotation. */
function _isAnnotation(keyword: SchemaFoldedKeyword): keyword is SchemaAnnotationKeyword {
  return schemaAnnotationKeywords.some((k) => k === keyword);
}

/**
 * The text that states folded keywords in a description: the validating keywords as one
 * `Constraints:` sentence, then one sentence per folded annotation.
 *
 * @remarks
 * - Validating keywords: `Constraints: minimum 1; maximum 10.` — each keyword name, a space and
 *   its value as JSON, joined by `"; "`. A folded non-string `enum` is one of them, and comes
 *   first: `Constraints: enum [1,2].`
 * - Annotations, each its own sentence so none reads as a constraint: `Format: email.`,
 *   `Title: Count.` (a string value written as it is), `Default: null.`, `Examples: ["a","b"].`
 *   (other values as JSON).
 *
 * Both follow `enum` then `schemaConstraintKeywords` order whatever order the keys arrived in, and the two
 * parts are joined by one space. Fixed wording and order make the output byte-stable for prompt
 * caching. Returns `''` for nothing folded.
 * @param folded - The folded keywords and their values.
 * @returns The text.
 * @public
 */
export function foldedKeywordsText(folded: ReadonlyArray<readonly [SchemaFoldedKeyword, JsonValue]>): string {
  const rank = (keyword: SchemaFoldedKeyword): number =>
    keyword === 'enum' ? -1 : schemaConstraintKeywords.indexOf(keyword);
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

/** Whether a node's `enum` lists a member that is neither a string nor `null`. */
function _hasNonStringEnum(node: JsonObject): boolean {
  const members: JsonValue | undefined = node.enum;
  return Array.isArray(members) && members.some((m) => m !== null && typeof m !== 'string');
}

/** Adapts one node's own keywords, its children already adapted. */
function _adaptOwnKeywords(node: JsonObject, capabilities: SchemaKeywordCapabilities): JsonObject {
  const translated = _translate(node, capabilities);
  const removed = new Set<string>();
  const folded: Folded[] = [];
  if (capabilities.nonStringEnum === 'fold' && _hasNonStringEnum(translated)) {
    removed.add('enum');
    folded.push(['enum', translated.enum]);
  }
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

/** Keywords that let a node state no `type` of its own without being a schema that matches anything. */
const _TYPED_ELSEWHERE: readonly string[] = ['type', 'enum', 'const', '$ref', 'anyOf', 'oneOf', 'allOf'];

/** Whether a node states no `type` — and nothing standing in for one — so it matches any value. */
function _isUntyped(node: JsonObject): boolean {
  return !_TYPED_ELSEWHERE.some((keyword) => keyword in node);
}

/**
 * The refusal, if any, the `untyped` rule makes of a schema-position node at `path` (`'#'` is the
 * root). Under `'pass-nested'` the root must carry an actual `type` keyword; beneath it, and under
 * `'refuse'` everywhere, only a node matching any value is refused.
 */
function _untypedRefusal(rule: SchemaUntypedRule, node: JsonObject, path: string): string | undefined {
  if (_isUntyped(node) && (rule === 'refuse' || (rule === 'pass-nested' && path === '#'))) {
    return `${path}: a schema with no 'type' (matching any value) cannot be sent on this wire`;
  }
  if (rule === 'pass-nested' && path === '#' && !('type' in node)) {
    return `${path}: a root schema with no 'type' keyword cannot be sent on this wire`;
  }
  return undefined;
}

/** Where a node sits, for the `untyped` rule. */
type NodePosition = 'schema' | 'additionalProperties';

/**
 * Adapts a wire schema's constraint and annotation keywords, and its non-string enums and untyped
 * nodes, to one provider's documented support, per `capabilities`: each keyword is passed,
 * translated, folded into the node's description, or (an annotation) dropped; a non-string `enum`
 * is passed or folded; and a node with no `type` is passed or refused.
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
 * **A node with no `type` is never given one.** Where the table refuses it, adaptation fails with
 * the node's JSON Pointer path: inventing a `type` would narrow what the model may send below what
 * the validator accepts, which is the one direction an adaptation must never move. A schema-valued
 * `additionalProperties` with no `type` is exempt — it says "any value" for the undeclared keys,
 * which a wire that drops or ignores `additionalProperties` already means.
 *
 * Walks the schema grammar `toJson()` emits — a node's `properties` values, `items` and
 * schema-valued `additionalProperties` are nodes and are adapted; every other value, `default`,
 * `examples` and `enum` among them, is data and is copied untouched. A property *named* like a
 * keyword is a name, not a keyword. A value that is not an object is returned as it is.
 * @param schema - A wire schema, typically `schema.toJson()`.
 * @param capabilities - The target wire format's keyword-capability table.
 * @returns The adapted schema — the input is not modified — or a `Failure` naming the path of a
 * node the wire cannot carry.
 * @public
 */
export function adaptSchemaKeywords(
  schema: JsonValue,
  capabilities: SchemaKeywordCapabilities
): Result<JsonValue> {
  return _adaptNode(schema, capabilities, '#', 'schema');
}

/** Adapts one node and everything beneath it; `path` is its JSON Pointer. */
function _adaptNode(
  schema: JsonValue,
  capabilities: SchemaKeywordCapabilities,
  path: string,
  position: NodePosition
): Result<JsonValue> {
  if (!isJsonObject(schema)) {
    return succeed(schema);
  }
  const refusal = position === 'schema' ? _untypedRefusal(capabilities.untyped, schema, path) : undefined;
  if (refusal !== undefined) {
    return fail(refusal);
  }
  return mapResults(
    Object.entries(schema).map(([key, value]) =>
      _adaptMember(key, value, capabilities, path).onSuccess((adapted) =>
        succeed<[string, JsonValue]>([key, adapted])
      )
    )
  ).onSuccess((entries) => {
    const out: JsonObject = {};
    for (const [key, value] of entries) {
      out[key] = value;
    }
    return succeed(_adaptOwnKeywords(out, capabilities));
  });
}

/** Adapts one member of a node: its sub-schemas are adapted, anything else is data, copied as is. */
function _adaptMember(
  key: string,
  value: JsonValue,
  capabilities: SchemaKeywordCapabilities,
  path: string
): Result<JsonValue> {
  if (key === 'properties' && isJsonObject(value)) {
    return mapResults(
      Object.entries(value).map(([name, child]) =>
        _adaptNode(child, capabilities, `${path}/properties/${_escapeToken(name)}`, 'schema').onSuccess(
          (adapted) => succeed<[string, JsonValue]>([name, adapted])
        )
      )
    ).onSuccess((entries) => {
      const properties: JsonObject = {};
      for (const [name, adapted] of entries) {
        properties[name] = adapted;
      }
      return succeed<JsonValue>(properties);
    });
  }
  if (key === 'items') {
    return _adaptNode(value, capabilities, `${path}/items`, 'schema');
  }
  if (key === 'additionalProperties') {
    return _adaptNode(value, capabilities, `${path}/additionalProperties`, 'additionalProperties');
  }
  return succeed(value);
}

/**
 * Escapes a key as one JSON Pointer token (RFC 6901 § 3) — `~` → `~0` first, then `/` → `~1` — with
 * every control character spelled `\uXXXX`, since a property name may be server-supplied and ends
 * up in an error message.
 */
function _escapeToken(key: string): string {
  return Array.from(key.replace(/~/g, '~0').replace(/\//g, '~1'), (ch) => {
    const code = ch.charCodeAt(0);
    const control = code < 0x20 || (code >= 0x7f && code <= 0x9f) || code === 0x2028 || code === 0x2029;
    return control ? `\\u${code.toString(16).padStart(4, '0')}` : ch;
  }).join('');
}
