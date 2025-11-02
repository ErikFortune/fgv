/*
 * Copyright (c) 2025 Erik Fortune
 */

import '@fgv/ts-utils-jest';

import { Conversion, Converters as BaseConverters } from '@fgv/ts-utils';
import { JsonCompatibleType } from '../../../packlets/json';
import { Converters as JCConverters } from '../../../packlets/json-compatible';
import * as JC from '../../../packlets/json-compatible';

import {
  Assert,
  IsAssignable,
  IUser,
  IUserWithFunction,
  AlphaBeta,
  IAlpha,
  IBeta,
  makeUser,
  makeAlpha,
  makeBeta
} from './helpers';

describe('json-compatible/converters', () => {
  describe('compile-time typing', () => {
    test('object<T> returns ObjectConverter<JsonCompatibleType<T>>', () => {
      const c = JCConverters.object<IUser>(
        {
          id: BaseConverters.string,
          name: BaseConverters.string,
          age: BaseConverters.number,
          tags: BaseConverters.arrayOf(BaseConverters.string),
          meta: BaseConverters.recordOf(BaseConverters.string)
        },
        { optionalFields: ['age'] }
      );

      type Out = typeof c;
      type Expected = JC.ObjectConverter<IUser>;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _assert: Assert<IsAssignable<Out, Expected>> = true;
      expect(c).toBeDefined();
    });

    test('strictObject<T> is typed as ObjectConverter<JsonCompatibleType<T>> and enforces strict at runtime', () => {
      const c = JCConverters.strictObject<IUser>(
        {
          id: BaseConverters.string,
          name: BaseConverters.string,
          age: BaseConverters.number,
          tags: BaseConverters.arrayOf(BaseConverters.string),
          meta: BaseConverters.recordOf(BaseConverters.string)
        },
        { optionalFields: ['age'] }
      );

      type Out = typeof c;
      type Expected = JC.ObjectConverter<IUser>;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _assert: Assert<IsAssignable<Out, Expected>> = true;
      expect(c).toBeDefined();
    });

    test('arrayOf<T> returns Converter<JsonCompatibleType<T>[]>', () => {
      const ac = JCConverters.arrayOf<IUser>(
        JCConverters.object<IUser>(
          {
            id: BaseConverters.string,
            name: BaseConverters.string,
            age: BaseConverters.number,
            tags: BaseConverters.arrayOf(BaseConverters.string),
            meta: BaseConverters.recordOf(BaseConverters.string)
          },
          { optionalFields: ['age'] }
        )
      );
      type Out = typeof ac;
      type Expected = Conversion.Converter<JsonCompatibleType<IUser>[], unknown>;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _assert: Assert<IsAssignable<Out, Expected>> = true;
      expect(ac).toBeDefined();
    });

    test('recordOf<T> returns Converter<Record<TK, JsonCompatibleType<T>>>', () => {
      const rc = JCConverters.recordOf<number>(BaseConverters.number);
      type Out = typeof rc;
      type Expected = Conversion.Converter<Record<string, JsonCompatibleType<number>>, unknown>;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _assert: Assert<IsAssignable<Out, Expected>> = true;
      expect(rc).toBeDefined();
    });

    test('discriminatedObject is typed for compatible variants', () => {
      const alpha = JCConverters.object<IAlpha>({
        kind: BaseConverters.literal('alpha'),
        value: BaseConverters.string
      });
      const beta = JCConverters.object<IBeta>({
        kind: BaseConverters.literal('beta'),
        count: BaseConverters.number
      });

      const disc = JCConverters.discriminatedObject<AlphaBeta>('kind', {
        alpha,
        beta
      });
      type Out = typeof disc;
      type Expected = JC.Converter<AlphaBeta>;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _assert: Assert<IsAssignable<Out, Expected>> = true;
      expect(disc).toBeDefined();
    });

    test('non-JSON properties are rejected when defining field converters', () => {
      // compute is function -> JsonCompatibleType maps to error type; assigning any converter is invalid
      const bad = JCConverters.object<IUserWithFunction>({
        id: BaseConverters.string,
        name: BaseConverters.string,
        age: BaseConverters.number,
        tags: BaseConverters.arrayOf(BaseConverters.string),
        meta: BaseConverters.recordOf(BaseConverters.string),
        // @ts-expect-error
        compute: BaseConverters.number
      });
      expect(bad).toBeDefined();
    });
  });

  describe('runtime behavior (happy-path + a failure)', () => {
    test('object converts and preserves optional fields', () => {
      const c = JCConverters.object<IUser>({
        id: BaseConverters.string,
        name: BaseConverters.string,
        age: BaseConverters.optionalNumber,
        tags: BaseConverters.arrayOf(BaseConverters.string),
        meta: BaseConverters.recordOf(BaseConverters.string)
      });

      const src = { ...makeUser(), age: '42', meta: { active: 'true', score: '10' } } as unknown;
      expect(c.convert(src)).toSucceedWith({ ...makeUser(), age: 42, meta: { active: 'true', score: '10' } });

      const bad = { ...makeUser(), age: 'nope' } as unknown;
      expect(c.convert(bad)).toFail();
    });

    test('strictObject rejects extra properties', () => {
      const c = JCConverters.strictObject<IUser>({
        id: BaseConverters.string,
        name: BaseConverters.string,
        age: BaseConverters.optionalNumber,
        tags: BaseConverters.arrayOf(BaseConverters.string),
        meta: BaseConverters.recordOf(BaseConverters.string)
      });

      const extra = { ...makeUser(), extra: 'nope' } as unknown;
      expect(c.convert(extra)).toFailWith(/unexpected property/i);
    });

    test('arrayOf converts arrays (fail on error by default)', () => {
      const elem = JCConverters.object<IUser>({
        id: BaseConverters.string,
        name: BaseConverters.string,
        age: BaseConverters.optionalNumber,
        tags: BaseConverters.arrayOf(BaseConverters.string),
        meta: BaseConverters.recordOf(BaseConverters.string)
      });
      const arr = JCConverters.arrayOf<IUser>(elem);

      const src = [
        { ...makeUser(), age: '1', meta: { active: 'true', score: '10' } },
        { ...makeUser(), age: undefined, meta: { active: 'true', score: '10' } }
      ] as unknown;
      expect(arr.convert(src)).toSucceedWith([
        { ...makeUser(), age: 1, meta: { active: 'true', score: '10' } },
        { ...makeUser(), age: undefined, meta: { active: 'true', score: '10' } }
      ] as JsonCompatibleType<IUser>[]);

      const bad = [{ ...makeUser(), age: 'x' }] as unknown;
      expect(arr.convert(bad)).toFail();
    });

    test('recordOf converts string-keyed objects; key conversion optional', () => {
      const valueConv = BaseConverters.number;
      const keyConv = BaseConverters.enumeratedValue(['a', 'b', 'c'] as const);

      const rcDefault = JCConverters.recordOf<number>(valueConv);
      expect(rcDefault.convert({ a: 1, b: 2 })).toSucceedWith({ a: 1, b: 2 });

      const rcWithKeys = JCConverters.recordOf<number, unknown, 'a' | 'b' | 'c'>(valueConv, {
        keyConverter: keyConv
      });
      expect(rcWithKeys.convert({ a: 1, b: 2, d: 3 })).toFail();
    });

    test('discriminatedObject routes to matching converter by discriminator', () => {
      const alpha = JCConverters.object<IAlpha>({
        kind: BaseConverters.literal('alpha'),
        value: BaseConverters.string
      });
      const beta = JCConverters.object<IBeta>({
        kind: BaseConverters.literal('beta'),
        count: BaseConverters.number
      });
      const disc = JCConverters.discriminatedObject<AlphaBeta>('kind', { alpha, beta });

      expect(disc.convert(makeAlpha())).toSucceedWith(makeAlpha());
      expect(disc.convert(makeBeta())).toSucceedWith(makeBeta());

      expect(disc.convert({ kind: 'gamma', foo: 1 } as unknown)).toFailWith(/no converter/i);
    });
  });
});
