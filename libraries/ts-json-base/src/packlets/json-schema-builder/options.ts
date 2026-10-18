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
import { JsonValue } from '../json';
import {
  schemaLengthConstraintKeywords,
  schemaNumberConstraintKeywords,
  schemaPatternConstraintKeywords
} from './keywordAdaptation';

/**
 * Common options accepted by every schema factory.
 *
 * @remarks
 * Every keyword here is either **validating** (enforced by the derived validator *and* emitted by
 * `toJson()`) or an **annotation** (emitted, never enforced). There is no third kind: a keyword the
 * wire states but the validator does not know about would break the rule that what the validator
 * accepts is what the wire schema states. An incoherent set — an annotation that is not JSON, or a
 * constraint that leaves no value accepted — is refused before any node exists: the factories
 * accept unchecked only the options that cannot be wrong (`PlainSchemaOptions`),
 * and everything else arrives as validated options, made by
 * `schemaOptions`, `numberOptions`,
 * `integerOptions` or `stringOptions`,
 * each of which returns a `Result`. A factory therefore never fails; `fromJson` reports the same
 * conditions as a `Failure` naming the path.
 * @public
 */
export interface ISchemaOptions {
  /**
   * Optional human-readable description emitted into the wire JSON Schema.
   */
  description?: string;

  /**
   * When `true`, the value may also be `null`: the derived static type widens to
   * `T | null`, the validator accepts `null`, and the wire schema declares a union
   * `type` (`['string', 'null']`).
   *
   * @remarks
   * **This is how you express an absent-able field to a provider that requires every
   * property to be required.** OpenAI's strict structured output rejects a schema with
   * any property missing from `required`, so `optional(...)` is unsendable there —
   * see `hasOptionalProperties` in `@fgv/ts-extras`, which refuses rather than
   * relocating the failure into a provider 400. A required-and-nullable property is
   * the sanctioned spelling, and because the schema *is* the validator, the wire
   * shape and the check cannot disagree about it.
   *
   * **If the field is genuinely absent-able *and* `null`-able, say both:**
   * `optional(string({ nullable: true }))` accepts absent, `null`, or a value.
   * That composition is what `@fgv/ts-extras`' `adaptOptionalToNullable` looks for —
   * on a format requiring every property to be required, it drops the optionality
   * for the wire, which is safe precisely because the authored schema already
   * accepts the `null` the model will then have to send. Reach for it in preference
   * to a bare `nullable` when absence is genuinely meaningful to you elsewhere;
   * the schema then states what your validator does rather than what one provider
   * demands.
   *
   * **The option's name is not the wire spelling.** It emits the draft-07 union
   * `type: ['string', 'null']`, **not** the OpenAPI-3.0 keyword `nullable: true` —
   * which OpenAI ignores. Gemini wants the other one, and the Gemini adapter in
   * `@fgv/ts-extras` translates; nothing here emits `nullable` as a keyword.
   *
   * Distinct from {@link JsonSchema.optional | optional}, which is about a key being
   * **absent**. The two compose as `optional(string({ nullable: true }))` — absent,
   * or present and null, or present and a string.
   *
   * A nullable node's constraints apply to its non-null values only: `null` is accepted
   * unconstrained.
   */
  nullable?: boolean;

  /**
   * A short title for the value, emitted as the JSON Schema `title` annotation.
   *
   * @remarks
   * An **annotation**: emitted by `toJson()`, never enforced by the validator.
   */
  title?: string;

  /**
   * The value a consumer should assume when none is supplied, emitted as the JSON Schema
   * `default` annotation.
   *
   * @remarks
   * An **annotation**: emitted, never enforced, and never applied. The validator does not
   * substitute it for a missing value.
   *
   * It must be a JSON value, so it reaches a factory only through validated options, which refuse
   * one that is not. It is deliberately **not** checked against the node: JSON Schema does not
   * require a `default` to validate, and checking it would refuse schemas servers already send.
   */
  default?: JsonValue;

  /**
   * Example values, emitted as the JSON Schema `examples` annotation.
   *
   * @remarks
   * An **annotation**, under the same rules as `default`: each member must be a JSON value, and
   * none is checked against the node.
   */
  examples?: ReadonlyArray<JsonValue>;
}

/**
 * Options for the `number` and `integer` factories.
 *
 * @remarks
 * The range keywords are **validating**: the derived validator enforces them, with a failure that
 * names the keyword and the bound, and `toJson()` emits them. They reach a factory only through
 * `numberOptions` or `integerOptions`,
 * which refuse a non-finite bound, `minimum` greater than `maximum`, an exclusive bound that leaves
 * no value (for `integer`, no integer) in range, and a `multipleOf` that is not greater than zero.
 * @public
 */
export interface INumberSchemaOptions extends ISchemaOptions {
  /**
   * When `true` (default), the derived validator rejects numeric strings such as `'42'` and
   * accepts only genuine JSON numbers. Set `false` to opt into permissive coercion (numeric
   * strings are accepted and converted to their numeric value). Constraints apply to the
   * converted number.
   */
  strict?: boolean;

  /**
   * The value must be greater than or equal to this.
   */
  minimum?: number;

  /**
   * The value must be less than or equal to this.
   */
  maximum?: number;

  /**
   * The value must be strictly greater than this — the numeric form used by draft-06 and later,
   * not draft-04's boolean modifier.
   */
  exclusiveMinimum?: number;

  /**
   * The value must be strictly less than this, in the numeric form.
   */
  exclusiveMaximum?: number;

  /**
   * The value must be a multiple of this, which must be greater than zero.
   *
   * @remarks
   * Checked on the quotient `value / multipleOf`, which may differ from the nearest integer by
   * at most 4ε relative to its magnitude (`4 * Number.EPSILON * max(1, |q|)`) —
   * enough that `0.3` counts as a multiple of `0.1` despite binary floating point, and no more, so
   * a large quotient such as `2000000000.5 / 1` is still refused.
   */
  multipleOf?: number;
}

/**
 * Options for the `string` factory.
 *
 * @remarks
 * `minLength`, `maxLength` and `pattern` are **validating**; `format` is an **annotation**. They
 * reach the factory only through `stringOptions`, which refuses a
 * length that is not a non-negative integer, `minLength` greater than `maxLength`, and a `pattern`
 * that is not a `RegExp` whose only flag is `u`.
 * @public
 */
export interface IStringSchemaOptions extends ISchemaOptions {
  /**
   * The string must have at least this many characters.
   *
   * @remarks
   * Length is counted in Unicode code points, as JSON Schema specifies — not UTF-16 code units —
   * so an astral character such as an emoji counts once.
   */
  minLength?: number;

  /**
   * The string must have at most this many characters, counted in code points.
   */
  maxLength?: number;

  /**
   * A regular expression the string must match — the host's own, and therefore trusted.
   *
   * @remarks
   * **Validating**: the derived validator enforces it and `toJson()` emits `pattern: <source>`. It
   * is a `RegExp` rather than a source string so that the host compiles it — and owns its cost — and
   * this package never turns a string into a regular expression.
   *
   * **Write it with exactly the `u` flag: `/^[a-z]+$/u`.** A JSON Schema `pattern` is an ECMA-262
   * regular expression built with `u`, and **unanchored** (write `^…$` to match the whole string).
   * The wire carries only the source, so `stringOptions` refuses a `RegExp` with any other flag set
   * (`g`, `i`, `m`, `s`, `y`, `d`, `v`) or without `u`: only then does the `RegExp` mean exactly what
   * the wire states, and it is enforced as written, never recompiled.
   *
   * Its source and flags are read through the built-in accessors and it is matched with the
   * built-in `exec`, so a subclass overriding them changes neither the wire nor the check. Do not
   * re-initialise it afterwards with `compile()`: a node then fails every value closed rather than
   * enforcing a pattern the wire does not state.
   *
   * **The wire receives ECMAScript source.** Provider engines implement dialects of it — some
   * reject lookarounds or backreferences, and some anchor implicitly — so the provider adapters in
   * `@fgv/ts-extras` send `pattern` only where the provider documents it, and fold it into the
   * description elsewhere. Folding loosens only the wire; the validator still enforces the pattern.
   *
   * A schema read with `fromJson` never carries a `RegExp`: a server-supplied pattern is compiled,
   * if at all, by the caller's `patternValidator` (see `IFromJsonOptions`).
   */
  pattern?: RegExp;

  /**
   * A semantic format such as `'date-time'` or `'email'`, emitted as the JSON Schema `format`
   * annotation.
   *
   * @remarks
   * An **annotation**: emitted, never enforced, and not checked against any list. Format
   * vocabularies differ between providers and drafts, so enforcing one would refuse values another
   * accepts. Provider adapters in `@fgv/ts-extras` fold a format a provider does not document into
   * the description rather than sending it.
   */
  format?: string;
}

/**
 * Options for the `object` factory.
 * @public
 */
export interface IObjectSchemaOptions extends ISchemaOptions {
  /**
   * Whether the object is open to properties it does not declare.
   *
   * @remarks
   * When `false` (default), the validator rejects any undeclared property and the emitted
   * schema sets `additionalProperties: false`.
   *
   * When `true`, the object is **open**: declared properties convert through their schemas as
   * usual, every undeclared property is carried through to the result as a validated
   * `JsonValue` (after the declared ones), and the emitted schema omits `additionalProperties`,
   * which JSON Schema reads as open. A value that is not
   * a JSON object, or an undeclared property that is not a JSON value, is refused. The static
   * type widens to `OpenObjectStatic`.
   *
   * Either way, what the validator accepts is what the wire schema states: the converter never
   * drops a key the schema told the model it could send — with one exception, an own
   * `"__proto__"` key, which is dropped at every depth rather than carried (see
   * `Converters.jsonObject`).
   */
  additionalProperties?: boolean;
}

/**
 * Options for the `anyValue` factory: the annotations only.
 *
 * @remarks
 * There is no `nullable`, because a node that accepts any JSON value already accepts `null`.
 * @public
 */
export type IAnySchemaOptions = Omit<ISchemaOptions, 'nullable'>;

// ---------------------------------------------------------------------------
// Plain and validated options
// ---------------------------------------------------------------------------

/**
 * The options a factory accepts as a plain object literal: the ones that cannot be wrong —
 * `description`, `title` and `nullable`.
 *
 * @remarks
 * A factory never fails, so it accepts unchecked only what needs no check. `default` and
 * `examples` must be JSON values, which the type cannot fully guarantee (`NaN` is a `number`), so
 * they are declared `never` here and arrive through `schemaOptions`
 * instead, as validated options. `kind` is declared `never` so that a spread of a validated-options
 * instance, which copies its `kind` discriminant and nothing else, is not mistaken for plain options.
 *
 * **What a factory reads from plain options:** only the plain keys — `description`, `title`,
 * `nullable`, `strict`, `format`, `additionalProperties` — each of its declared type. Every other
 * key, and a plain key of the wrong type, is ignored, so the validator and `toJson()` always agree.
 * That matters for one case the types do not catch: a value whose type has an index signature
 * (`Record<string, unknown>`, or an interface declaring `[key: string]: unknown`) is assignable to
 * every plain-options type, because TypeScript does not check an index signature against the
 * `never` keys. Such a value compiles, and its constraint keys are ignored rather than applied. An
 * object literal, a declared options interface, `Partial<…>` and `as const` are all refused at
 * compile time.
 * @public
 */
export type PlainSchemaOptions = Pick<ISchemaOptions, 'description' | 'title' | 'nullable'> & {
  readonly default?: never;
  readonly examples?: never;
  readonly kind?: never;
};

/**
 * The `number` / `integer` options accepted as a plain object literal: the
 * `plain annotations` and `strict`. Every range keyword is
 * declared `never`, so a raw `{ minimum: 0 }` is a compile error — range keywords arrive through
 * `numberOptions` or `integerOptions`.
 * @public
 */
export type PlainNumberSchemaOptions = PlainSchemaOptions &
  Pick<INumberSchemaOptions, 'strict'> & {
    readonly [K in StringOneOf<typeof schemaNumberConstraintKeywords>]?: never;
  };

/**
 * The `string` options accepted as a plain object literal: the
 * `plain annotations` and `format`, which is an annotation
 * and cannot be incoherent. The length keywords and `pattern` are declared `never` and arrive
 * through `stringOptions`.
 * @public
 */
export type PlainStringSchemaOptions = PlainSchemaOptions &
  Pick<IStringSchemaOptions, 'format'> & {
    readonly [K in
      | StringOneOf<typeof schemaLengthConstraintKeywords>
      | StringOneOf<typeof schemaPatternConstraintKeywords>]?: never;
  };

/**
 * The `object` options accepted as a plain object literal: the
 * `plain annotations` and `additionalProperties`.
 * @public
 */
export type PlainObjectSchemaOptions = PlainSchemaOptions &
  Pick<IObjectSchemaOptions, 'additionalProperties'>;

/**
 * The `anyValue` options accepted as a plain object literal: `description` and `title`.
 * @public
 */
export type PlainAnySchemaOptions = Omit<PlainSchemaOptions, 'nullable'>;
