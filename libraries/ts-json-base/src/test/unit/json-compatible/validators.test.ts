/*
 * Copyright (c) 2025 Erik Fortune
 */

import '@fgv/ts-utils-jest';

import { Validation, Validators as BaseValidators } from '@fgv/ts-utils';
import { JsonCompatibleType } from '../../../packlets/json';
import { Validators as JCValidators } from '../../../packlets/json-compatible';
import * as JC from '../../../packlets/json-compatible';

import { Assert, IsAssignable, IUser, IUserWithFunction, makeUser } from './helpers';

describe('json-compatible/validators', () => {
  describe('compile-time typing', () => {
    test('object<T> returns ObjectValidator<JsonCompatibleType<T>>', () => {
      const v = JCValidators.object<IUser>(
        {
          id: BaseValidators.string,
          name: BaseValidators.string,
          age: BaseValidators.number,
          tags: BaseValidators.arrayOf(BaseValidators.string),
          meta: BaseValidators.recordOf(BaseValidators.string)
        },
        { options: { optionalFields: ['age'] } }
      );

      type Out = typeof v;
      type Expected = JC.ObjectValidator<IUser>;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _assert: Assert<IsAssignable<Out, Expected>> = true;
      expect(v).toBeDefined();
    });

    test('recordOf<T> returns Validator<Record<TK, JsonCompatibleType<T>>', () => {
      const rv = JCValidators.recordOf<number>(BaseValidators.number);
      type Out = typeof rv;
      type Expected = Validation.Validator<Record<string, JsonCompatibleType<number>>, unknown>;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _assert: Assert<IsAssignable<Out, Expected>> = true;
      expect(rv).toBeDefined();
    });

    test('arrayOf<T> returns ArrayValidator<JsonCompatibleType<T>>', () => {
      const av = JCValidators.arrayOf<string>(BaseValidators.string);
      type Out = typeof av;
      type Expected = Validation.Classes.ArrayValidator<JsonCompatibleType<string>, unknown>;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _assert: Assert<IsAssignable<Out, Expected>> = true;
      expect(av).toBeDefined();
    });

    test('non-JSON properties are rejected when defining field validators', () => {
      // Attempting to validate a function-valued property should be a type error
      const bad = JCValidators.object<IUserWithFunction>({
        id: BaseValidators.string,
        name: BaseValidators.string,
        age: BaseValidators.number,
        tags: BaseValidators.arrayOf(BaseValidators.string),
        meta: BaseValidators.recordOf(BaseValidators.string),
        // compute is function -> JsonCompatibleType maps to error type; assigning any validator is invalid
        // @ts-expect-error
        compute: BaseValidators.number
      });
      expect(bad).toBeDefined();
    });
  });

  describe('runtime behavior (happy-path + a failure)', () => {
    test('arrayOf can be constructed with params (branch coverage)', () => {
      const av = JCValidators.arrayOf<string>(BaseValidators.string, {});
      expect(av.validate(['a', 'b'])).toSucceedWith(['a', 'b']);
    });

    test('recordOf supports options.onError=ignore (branch coverage)', () => {
      const rv = JCValidators.recordOf<string>(BaseValidators.string, { onError: 'ignore' });
      // should succeed even if one property is invalid
      const mixed = { ok: 'yes', bad: 123 as unknown as string };
      expect(rv.validate(mixed)).toSucceed();
    });

    test('object without params (branch coverage)', () => {
      const simple = JCValidators.object<{ id: string }>({ id: BaseValidators.string });
      expect(simple.validate({ id: 'x' })).toSucceedWith({ id: 'x' });
    });
    test('object validator validates a compatible user with optional fields', () => {
      const userValidator = JCValidators.object<IUser>(
        {
          id: BaseValidators.string,
          name: BaseValidators.string,
          age: BaseValidators.number,
          tags: BaseValidators.arrayOf(BaseValidators.string),
          meta: BaseValidators.recordOf(BaseValidators.string)
        },
        { options: { optionalFields: ['age'] } }
      );

      const good = {
        ...makeUser({ age: 42 }),
        meta: { active: 'true', score: '10' } as Record<string, string>
      } as IUser;
      expect(userValidator.validate(good)).toSucceedWith(good);

      const goodWithoutOptional = {
        ...makeUser(),
        meta: { active: 'true', score: '10' } as Record<string, string>
      } as IUser;
      expect(userValidator.validate(goodWithoutOptional)).toSucceedWith(goodWithoutOptional);

      const bad = { ...makeUser(), tags: ['a', 1, 'c'] } as unknown;
      expect(userValidator.validate(bad)).toFail();
    });

    test('object validator with strict rejects extra properties', () => {
      const v = JCValidators.object<IUser>(
        {
          id: BaseValidators.string,
          name: BaseValidators.string,
          age: BaseValidators.number,
          tags: BaseValidators.arrayOf(BaseValidators.string),
          meta: BaseValidators.recordOf(BaseValidators.string)
        },
        { options: { optionalFields: ['age'], strict: true } }
      );

      const extra = { ...makeUser(), extra: 'nope' } as unknown;
      expect(v.validate(extra)).toFailWith(/unexpected field/i);
    });

    test('arrayOf validator validates array of compatible objects', () => {
      const elem = JCValidators.object<IUser>(
        {
          id: BaseValidators.string,
          name: BaseValidators.string,
          age: BaseValidators.number,
          tags: BaseValidators.arrayOf(BaseValidators.string),
          meta: BaseValidators.recordOf(BaseValidators.string)
        },
        { options: { optionalFields: ['age'] } }
      );

      const arrayValidator = JCValidators.arrayOf(elem);

      const good = [
        { ...makeUser({ age: 1 }), meta: { active: 'true', score: '10' } as Record<string, string> } as IUser,
        {
          ...makeUser({ age: undefined }),
          meta: { active: 'true', score: '10' } as Record<string, string>
        } as IUser
      ];
      expect(arrayValidator.validate(good)).toSucceedWith(good as JsonCompatibleType<IUser>[]);

      const bad = [...good, { id: 'x', name: 'y', tags: ['z'], meta: {}, age: 'nope' }] as unknown;
      expect(arrayValidator.validate(bad)).toFail();
    });

    test('recordOf validator validates string-keyed records', () => {
      const rv = JCValidators.recordOf<number>(BaseValidators.number);
      const good: Record<string, number> = { a: 1, b: 2 };
      expect(rv.validate(good)).toSucceedWith(good);

      const bad = { a: 1, b: 'no' } as unknown;
      expect(rv.validate(bad)).toFail();
    });
  });
});
