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

import '@fgv/ts-utils-jest';
import { Result, fail, succeed } from '@fgv/ts-utils';
import { JsonObject } from '../../../packlets/json';
import { JsonSchema } from '../../..';

/** The patterns the test-only validator knows, each a literal so no test builds a `RegExp` from data. */
const KNOWN_PATTERNS: ReadonlyMap<string, RegExp> = new Map([
  ['^a', /^a/u],
  ['^1', /^1/u],
  ['^[a-z]+$', /^[a-z]+$/u],
  ['^[A-Z]{2}\\d+$', /^[A-Z]{2}\d+$/u]
]);

/**
 * A test-only validator built on `RegExp`. Fine here; a host handling untrusted schemas should use an
 * engine that is safe on hostile input.
 */
const regExpValidator: JsonSchema.SchemaPatternValidator = (source) => {
  const re = KNOWN_PATTERNS.get(source);
  return re === undefined ? fail(`no test pattern for ${source}`) : succeed((v: string) => re.test(v));
};

/** A schema with one string property `id` carrying `pattern`. */
function idSchema(pattern: unknown, extra: JsonObject = {}): JsonObject {
  return {
    type: 'object',
    properties: { id: { type: 'string', pattern, ...extra } as JsonObject },
    required: ['id']
  } as JsonObject;
}

describe('JsonSchema pattern — trusted (host-written) path', () => {
  const slug = JsonSchema.stringOptions({ pattern: /^[a-z]+$/u }).shouldNotFail('slug pattern');

  test('the validator enforces it and toJson() emits the source', () => {
    const schema = JsonSchema.string(slug);
    expect(schema.toJson()).toEqual({ type: 'string', pattern: '^[a-z]+$' });
    expect(schema.validate('abc')).toSucceedWith('abc');
    expect(schema.convert('abc')).toSucceedWith('abc');
    expect(schema.validate('ab1')).toFailWith(/expected a string matching "\^\[a-z\]\+\$" \(pattern\)/);
    expect(schema.validate(5)).toFail();
  });

  test('options keep the RegExp the host passed', () => {
    const re = /^x/u;
    expect(JsonSchema.stringOptions({ pattern: re })).toSucceedAndSatisfy((opts) => {
      expect(opts.options.pattern).toBe(re);
    });
  });

  test('the pattern is emitted after the lengths and before format, whatever the input order', () => {
    const opts = JsonSchema.stringOptions({
      format: 'email',
      pattern: /@/u,
      maxLength: 9,
      minLength: 1
    }).shouldNotFail('ordered');
    expect(Object.keys(JsonSchema.string(opts).toJson())).toEqual([
      'type',
      'minLength',
      'maxLength',
      'pattern',
      'format'
    ]);
  });

  test('a pattern is unanchored, as JSON Schema specifies', () => {
    const schema = JsonSchema.string(JsonSchema.stringOptions({ pattern: /b/u }).shouldNotFail('b'));
    expect(schema.validate('abc')).toSucceed();
    expect(schema.validate('xyz')).toFailWith(/pattern/);
  });

  test("it has the 'u' semantics JSON Schema specifies", () => {
    const one = JsonSchema.string(JsonSchema.stringOptions({ pattern: /^.$/u }).shouldNotFail('one char'));
    expect(one.validate('😀')).toSucceed();
    const upper = JsonSchema.string(JsonSchema.stringOptions({ pattern: /^\p{Lu}$/u }).shouldNotFail('Lu'));
    expect(upper.toJson()).toEqual({ type: 'string', pattern: '^\\p{Lu}$' });
    expect(upper.validate('Ä')).toSucceed();
    expect(upper.validate('ä')).toFailWith(/pattern/);
  });

  test("anything but exactly the 'u' flag is refused", () => {
    expect(JsonSchema.stringOptions({ pattern: /a/ })).toFailWith(
      /^pattern \/a\/: a JSON Schema pattern is built with exactly the 'u' flag \(write \/a\/u\); the wire cannot state ''$/
    );
    for (const re of [
      new RegExp('a', 'gu'),
      new RegExp('a', 'iu'),
      new RegExp('a', 'mu'),
      new RegExp('a', 'su'),
      new RegExp('a', 'yu'),
      new RegExp('a', 'du'),
      new RegExp('a', 'v'),
      new RegExp('a', 'i')
    ]) {
      expect(JsonSchema.stringOptions({ pattern: re })).toFailWith(/the wire cannot state '[dgimsuvy]+'$/);
    }
  });

  test('a pattern that is not a RegExp is refused, and nothing throws', () => {
    expect(JsonSchema.stringOptions({ pattern: '^a' as unknown as RegExp })).toFailWith(
      /pattern must be a RegExp, got "\^a"/
    );
    expect(
      JsonSchema.stringOptions({ pattern: { source: 'a', flags: 'u' } as unknown as RegExp })
    ).toFailWith(/pattern must be a RegExp, got an object/);
    // Passes `instanceof`, but the built-in accessors throw on a value that is not a real RegExp.
    expect(JsonSchema.stringOptions({ pattern: new Proxy(/a/u, {}) })).toFailWith(
      /pattern is not a readable RegExp/
    );
  });

  test('a RegExp whose own source, test or exec lie changes neither the wire nor the check', () => {
    const re = /^a$/u;
    Object.defineProperty(re, 'source', { value: 'anything' });
    Object.defineProperty(re, 'flags', { value: 'u' });
    re.test = (): boolean => true;
    re.exec = (): RegExpExecArray | null => null;
    const schema = JsonSchema.string(JsonSchema.stringOptions({ pattern: re }).shouldNotFail('lying'));
    expect(schema.toJson()).toEqual({ type: 'string', pattern: '^a$' });
    expect(schema.validate('a')).toSucceed();
    expect(schema.validate('b')).toFailWith(/pattern/);
    // Nor can an own `global` accessor hide a flag the matcher has.
    const sticky = new RegExp('a', 'yu');
    Object.defineProperty(sticky, 'sticky', { value: false });
    Object.defineProperty(sticky, 'flags', { value: 'u' });
    expect(JsonSchema.stringOptions({ pattern: sticky })).toFailWith(/cannot state 'uy'/);
  });

  test('re-initialising the RegExp afterwards fails every value closed', () => {
    const re = /^a$/u;
    const schema = JsonSchema.string(JsonSchema.stringOptions({ pattern: re }).shouldNotFail('mutable'));
    expect(schema.validate('a')).toSucceed();
    // Annex B `compile()` re-initialises a RegExp in place.
    re.compile('^b$', 'u');
    expect(schema.toJson()).toEqual({ type: 'string', pattern: '^a$' });
    expect(schema.validate('a')).toFailWith(/re-initialised after stringOptions checked it/);
    expect(schema.validate('b')).toFailWith(/re-initialised/);
  });

  test('nullable: null is accepted unconstrained', () => {
    const opts = JsonSchema.stringOptions({ pattern: /^a/u, nullable: true }).shouldNotFail('nullable');
    const schema = JsonSchema.string(opts);
    expect(schema.toJson()).toEqual({ type: ['string', 'null'], pattern: '^a' });
    expect(schema.validate(null)).toSucceedWith(null);
    expect(schema.validate('b')).toFailWith(/pattern/);
  });

  test('a raw pattern is a compile error, and an unchecked one is never applied', () => {
    // @ts-expect-error -- `pattern` arrives only through `stringOptions`.
    expect(JsonSchema.string({ pattern: /a/u }).toJson()).toEqual({ type: 'string' });
    const loose: Record<string, unknown> = { pattern: /^a$/u, description: 'd' };
    const schema = JsonSchema.string(loose);
    expect(schema.toJson()).toEqual({ type: 'string', description: 'd' });
    expect(schema.validate('b')).toSucceed();
  });

  test('a host schema round-trips through fromJson only when a validator is supplied', () => {
    const json = JsonSchema.object({ id: JsonSchema.string(slug) }).toJson();
    expect(JsonSchema.fromJson(json)).toFailWith(
      /^#\/properties\/id: unsupported JSON Schema keyword 'pattern'/
    );
    expect(JsonSchema.fromJson(json, { patternValidator: regExpValidator })).toSucceedAndSatisfy((parsed) => {
      expect(parsed.toJson()).toEqual(json);
    });
  });

  describe('options from another installed copy of the package', () => {
    const marker = Symbol.for('@fgv/ts-json-base.validated-options');

    function foreign(options: Record<string, unknown>): JsonSchema.ValidatedStringOptions {
      const instance = { kind: 'validated-string-options', options };
      Object.defineProperty(instance, marker, { value: 'validated-string-options' });
      return instance as unknown as JsonSchema.ValidatedStringOptions;
    }

    test('a RegExp pattern is re-validated, then held and enforced', () => {
      const schema = JsonSchema.string(foreign({ pattern: /^a/u, description: 'd' }));
      expect(schema.toJson()).toEqual({ type: 'string', description: 'd', pattern: '^a' });
      expect(schema.validate('b')).toFailWith(/pattern/);
    });

    test('a pattern that fails re-validation leaves only the plain keys', () => {
      for (const pattern of ['^a', /^a/, new RegExp('^a', 'gu')]) {
        const schema = JsonSchema.string(foreign({ pattern, description: 'd' }));
        expect(schema.toJson()).toEqual({ type: 'string', description: 'd' });
        expect(schema.validate('b')).toSucceed();
      }
    });
  });
});

describe('JsonSchema pattern — untrusted (fromJson) path', () => {
  test('refused by default — a pathological pattern is never compiled', () => {
    const raws = [
      idSchema('(a+)+$'),
      idSchema(5),
      { type: 'number', pattern: '(a+)+$' },
      { type: 'string', enum: ['a'], pattern: '(a+)+$' }
    ] as JsonObject[];
    // While the spy is installed, the matchers' own `instanceof RegExp` would see the spy, so the
    // results are collected first and asserted after it is restored.
    const spy = jest.spyOn(globalThis, 'RegExp');
    let results: Result<JsonSchema.ISchemaValidator<unknown>>[] = [];
    try {
      results = raws.flatMap((raw) => [JsonSchema.fromJson(raw), JsonSchema.fromJson(raw, {})]);
      expect(spy).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
    expect(results).toHaveLength(8);
    for (const result of results) {
      expect(result).toFailWith(/unsupported JSON Schema keyword 'pattern'/);
    }
  });

  test('jsonSchemaConverter takes no validator, so it always refuses pattern', () => {
    expect(JsonSchema.jsonSchemaConverter.convert(idSchema('^a'))).toFailWith(
      /^#\/properties\/id: unsupported JSON Schema keyword 'pattern'/
    );
  });

  test('with a validator, the source reaches it unchanged, the predicate enforces, and the source is emitted', () => {
    const seen: string[] = [];
    // Built without `RegExp`, so the library's own construction count can be checked.
    const validator: JsonSchema.SchemaPatternValidator = (source) => {
      seen.push(source);
      return succeed((v: string) => v.startsWith('ok'));
    };
    const spy = jest.spyOn(globalThis, 'RegExp');
    let parsed: Result<JsonSchema.ISchemaValidator<unknown>> = fail('not run');
    let accepted: Result<unknown> = fail('not run');
    let rejected: Result<unknown> = fail('not run');
    let wire: JsonObject = {};
    try {
      parsed = JsonSchema.fromJson(idSchema('(a+)+$'), { patternValidator: validator });
      const schema = parsed.orThrow();
      wire = schema.toJson();
      accepted = schema.validate({ id: 'ok-1' });
      rejected = schema.validate({ id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!' });
      expect(spy).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
    expect(parsed).toSucceed();
    expect(wire).toEqual({
      type: 'object',
      properties: { id: { type: 'string', pattern: '(a+)+$' } },
      required: ['id']
    });
    expect(accepted).toSucceed();
    expect(rejected).toFailWith(/expected a string matching "\(a\+\)\+\$" \(pattern\)/);
    expect(seen).toEqual(['(a+)+$']);
  });

  test('a validator failure refuses the schema, naming the path', () => {
    const refuse: JsonSchema.SchemaPatternValidator = (source) => fail(`too complex: ${source}`);
    expect(JsonSchema.fromJson(idSchema('(a+)+$'), { patternValidator: refuse })).toFailWith(
      /^#\/properties\/id: pattern "\(a\+\)\+\$" was refused: too complex: \(a\+\)\+\$/
    );
    expect(JsonSchema.fromJson(idSchema('a{'), { patternValidator: regExpValidator })).toFailWith(
      /^#\/properties\/id: pattern "a\{" was refused/
    );
  });

  test('a validator that throws, or returns no function, refuses the schema rather than throwing', () => {
    const throws: JsonSchema.SchemaPatternValidator = () => {
      throw new Error('boom');
    };
    expect(JsonSchema.fromJson(idSchema('^a'), { patternValidator: throws })).toFailWith(
      /^#\/properties\/id: pattern "\^a" was refused: boom/
    );
    const notAFunction = (() => succeed('yes')) as unknown as JsonSchema.SchemaPatternValidator;
    expect(JsonSchema.fromJson(idSchema('^a'), { patternValidator: notAFunction })).toFailWith(
      /^#\/properties\/id: pattern "\^a" was refused/
    );
  });

  test('a predicate that throws, or answers anything but true, fails the value', () => {
    const throwing: JsonSchema.SchemaPatternValidator = () =>
      succeed(() => {
        throw new Error('engine fault');
      });
    const schema = JsonSchema.fromJson(idSchema('^a'), { patternValidator: throwing }).orThrow();
    expect(schema.validate({ id: 'a' })).toFailWith(
      /could not check the string against pattern "\^a": engine fault/
    );
    const truthy = (() => succeed(() => 'yes')) as unknown as JsonSchema.SchemaPatternValidator;
    expect(
      JsonSchema.fromJson(idSchema('^a'), { patternValidator: truthy }).orThrow().validate({ id: 'a' })
    ).toFailWith(/pattern/);
  });

  test('a pattern that is not a string is refused', () => {
    expect(JsonSchema.fromJson(idSchema(5), { patternValidator: regExpValidator })).toFailWith(
      /^#\/properties\/id: 'pattern' must be a string/
    );
  });

  test('pattern beside enum or const is refused', () => {
    const options = { patternValidator: regExpValidator };
    expect(JsonSchema.fromJson({ type: 'string', enum: ['a'], pattern: '^a' }, options)).toFailWith(
      /^#: unsupported JSON Schema keyword 'pattern' beside 'enum'/
    );
    expect(JsonSchema.fromJson({ type: 'string', const: 'a', pattern: '^a' }, options)).toFailWith(
      /^#: unsupported JSON Schema keyword 'pattern' beside 'const'/
    );
  });

  test('on a node that is not a string it constrains nothing, and is neither compiled nor emitted', () => {
    const calls: string[] = [];
    const validator: JsonSchema.SchemaPatternValidator = (source) => {
      calls.push(source);
      return regExpValidator(source);
    };
    expect(
      JsonSchema.fromJson({ type: 'number', pattern: '^1' }, { patternValidator: validator })
    ).toSucceedAndSatisfy((schema) => {
      expect(schema.toJson()).toEqual({ type: 'number' });
      expect(schema.validate(2)).toSucceed();
    });
    expect(calls).toEqual([]);
  });

  test('nullable spellings, $ref and nesting keep the validator', () => {
    const options = { patternValidator: regExpValidator };
    const expectA = (result: Result<JsonSchema.ISchemaValidator<unknown>>): void => {
      expect(result).toSucceedAndSatisfy((schema) => {
        expect(schema.validate('ab')).toSucceed();
        expect(schema.validate('b')).toFailWith(/pattern/);
      });
    };
    expectA(JsonSchema.fromJson({ anyOf: [{ type: 'string', pattern: '^a' }, { type: 'null' }] }, options));
    expectA(JsonSchema.fromJson({ type: ['string', 'null'], pattern: '^a' }, options));
    expectA(
      JsonSchema.fromJson({ $defs: { a: { type: 'string', pattern: '^a' } }, $ref: '#/$defs/a' }, options)
    );
    expect(
      JsonSchema.fromJson({ type: 'array', items: { type: 'string', pattern: '^a' } }, options)
    ).toSucceedAndSatisfy((schema) => {
      expect(schema.validate(['a', 'ab'])).toSucceed();
      expect(schema.validate(['a', 'b'])).toFailWith(/pattern/);
    });
  });

  test('a parsed schema re-parses to the same wire', () => {
    const raw = idSchema('^[A-Z]{2}\\d+$', { minLength: 3, format: 'x' });
    const once = JsonSchema.fromJson(raw, { patternValidator: regExpValidator }).orThrow().toJson();
    expect((once.properties as JsonObject).id).toEqual({
      type: 'string',
      minLength: 3,
      pattern: '^[A-Z]{2}\\d+$',
      format: 'x'
    });
    expect(JsonSchema.fromJson(once, { patternValidator: regExpValidator }).orThrow().toJson()).toEqual(once);
  });
});

describe('JsonSchema pattern — wire adaptation', () => {
  const schema = JsonSchema.string(
    JsonSchema.stringOptions({ minLength: 1, pattern: /^\d+$/u, format: 'x' }).shouldNotFail('digits')
  );

  test('the conservative table folds it, after the lengths, with its source as JSON', () => {
    expect(
      JsonSchema.adaptSchemaKeywords(schema.toJson(), JsonSchema.unverifiedWireSchemaKeywords)
    ).toSucceedWith({
      type: 'string',
      description: 'Constraints: minLength 1; pattern "^\\\\d+$". Format: x.'
    });
  });

  test('a passing table sends it as emitted, and the folded schema still validates as authored', () => {
    const passPattern: JsonSchema.SchemaKeywordCapabilities = {
      ...JsonSchema.unverifiedWireSchemaKeywords,
      pattern: 'pass'
    };
    expect(JsonSchema.adaptSchemaKeywords(schema.toJson(), passPattern)).toSucceedWith({
      type: 'string',
      pattern: '^\\d+$',
      description: 'Constraints: minLength 1. Format: x.'
    });
    expect(schema.validate('12a')).toFailWith(/pattern/);
  });

  test('fold text pins the pattern among the constraints', () => {
    expect(
      JsonSchema.foldedKeywordsText([
        ['pattern', '^a$'],
        ['maxLength', 3]
      ])
    ).toBe('Constraints: maxLength 3; pattern "^a$".');
  });
});

describe('JsonSchema pattern — review round 1', () => {
  test('a lastIndex whose valueOf re-initialises the RegExp mid-match cannot swap the pattern', () => {
    const re = /^a$/u;
    const schema = JsonSchema.string(JsonSchema.stringOptions({ pattern: re }).shouldNotFail('swap'));
    let swapped = false;
    // `exec` converts `lastIndex` before running the matcher; this one swaps the pattern when it is.
    re.lastIndex = {
      valueOf: (): number => {
        swapped = true;
        re.compile('^b$', 'u');
        return 0;
      }
    } as unknown as number;
    expect(schema.validate('b')).toFailWith(/pattern/);
    expect(schema.validate('a')).toSucceed();
    expect(swapped).toBe(false);
  });

  test('a RegExp whose lastIndex cannot be reset fails closed', () => {
    const re = /^a$/u;
    const schema = JsonSchema.string(JsonSchema.stringOptions({ pattern: re }).shouldNotFail('frozen'));
    re.lastIndex = 3;
    Object.freeze(re);
    expect(schema.validate('a')).toFailWith(/lastIndex could not be reset to 0/);
  });

  test('a validator that returns something other than a Result refuses the schema, naming the path', () => {
    const raw = ((source: string) => (v: string) =>
      v === source) as unknown as JsonSchema.SchemaPatternValidator;
    expect(JsonSchema.fromJson(idSchema('^a'), { patternValidator: raw })).toFailWith(
      /^#\/properties\/id: pattern "\^a" was refused: the pattern validator returned a function, not a Result$/
    );
    const nothing = (() => undefined) as unknown as JsonSchema.SchemaPatternValidator;
    expect(JsonSchema.fromJson(idSchema('^a'), { patternValidator: nothing })).toFailWith(
      /was refused: the pattern validator returned undefined, not a Result$/
    );
    const nulled = (() => null) as unknown as JsonSchema.SchemaPatternValidator;
    expect(JsonSchema.fromJson(idSchema('^a'), { patternValidator: nulled })).toFailWith(
      /was refused: the pattern validator returned null, not a Result$/
    );
    const listed = (() => []) as unknown as JsonSchema.SchemaPatternValidator;
    expect(JsonSchema.fromJson(idSchema('^a'), { patternValidator: listed })).toFailWith(
      /was refused: the pattern validator returned an array, not a Result$/
    );
    const notAFunction = (() => succeed('yes')) as unknown as JsonSchema.SchemaPatternValidator;
    expect(JsonSchema.fromJson(idSchema('^a'), { patternValidator: notAFunction })).toFailWith(
      /was refused: the pattern validator succeeded with a string, not a function$/
    );
  });

  test('a predicate that answers something other than a boolean fails the value with a clear message', () => {
    const truthy = (() => succeed(() => 'yes')) as unknown as JsonSchema.SchemaPatternValidator;
    const schema = JsonSchema.fromJson(idSchema('^a'), { patternValidator: truthy }).orThrow();
    expect(schema.validate({ id: 'a' })).toFailWith(
      /the pattern predicate for "\^a" returned "yes", not a boolean/
    );
  });
});
