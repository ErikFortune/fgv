/*
 * Copyright (c) 2025 Erik Fortune
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

import '../../helpers/jest';
import { Failure, fail } from '../../..';
import { ValidatorFunc, Validator, Base, Validators } from '../../../packlets/validation';

interface INestedData {
  value: string;
  children?: INestedData[];
}

describe('Recursive Validation with self parameter', () => {
  describe('Tree structure validation', () => {
    test('should validate nested tree structures using self parameter', () => {
      const nestedDataValidator: ValidatorFunc<INestedData, unknown> = (
        from: unknown,
        context?: unknown,
        self?: Validator<INestedData, unknown>
      ): boolean | Failure<INestedData> => {
        if (typeof from !== 'object' || from === null || Array.isArray(from)) {
          return fail('Expected object');
        }

        const obj = from as Record<string, unknown>;

        // Validate required 'value' field
        if (typeof obj.value !== 'string') {
          return fail('Expected string value field');
        }

        // Validate optional 'children' field recursively using self
        if (obj.children !== undefined) {
          if (!Array.isArray(obj.children)) {
            return fail('Children must be an array');
          }

          if (!self) {
            return fail('Self parameter required for recursive validation');
          }

          // Recursively validate each child using self
          for (let i = 0; i < obj.children.length; i++) {
            const childResult = self.validate(obj.children[i], context);
            if (childResult.isFailure()) {
              return fail(`Child ${i}: ${childResult.message}`);
            }
          }
        }

        return true;
      };

      const validator = new Base.GenericValidator({ validator: nestedDataValidator });

      // Test valid nested structure
      const validData: INestedData = {
        value: 'root',
        children: [
          { value: 'child1' },
          {
            value: 'child2',
            children: [{ value: 'grandchild1' }, { value: 'grandchild2' }]
          }
        ]
      };

      expect(validator.validate(validData)).toSucceed();

      // Test invalid nested structure
      const invalidData = {
        value: 'root',
        children: [
          { value: 'child1' },
          {
            value: 'child2',
            children: [
              { value: 123 } // Invalid: number instead of string
            ]
          }
        ]
      };

      expect(validator.validate(invalidData)).toFailWith(/Child 1: Child 0: Expected string value field/);
    });

    test('should demonstrate that self parameter is available when using GenericValidator', () => {
      const validatorWithoutSelf: ValidatorFunc<INestedData, unknown> = (
        from: unknown,
        context?: unknown,
        self?: Validator<INestedData, unknown>
      ): boolean | Failure<INestedData> => {
        if (typeof from !== 'object' || from === null || Array.isArray(from)) {
          return fail('Expected object');
        }

        const obj = from as Record<string, unknown>;

        if (typeof obj.value !== 'string') {
          return fail('Expected string value field');
        }

        // When self is not available, we can skip recursive validation
        // or use an alternative approach
        if (obj.children !== undefined) {
          // Note: In this test, self will actually be available since it's passed by GenericValidator
          // This test demonstrates that self is indeed available when using GenericValidator
          if (self) {
            // We could use self here for recursive validation, but for this test
            // we'll just validate that self is indeed available
            return fail('This test demonstrates that self parameter is available');
          } else {
            return fail('Recursive validation not supported without self parameter');
          }
        }

        return true;
      };

      const validator = new Base.GenericValidator({ validator: validatorWithoutSelf });

      // Test data without children works
      const simpleData: INestedData = { value: 'simple' };
      expect(validator.validate(simpleData)).toSucceed();

      // Test data with children fails gracefully
      const dataWithChildren: INestedData = {
        value: 'parent',
        children: [{ value: 'child' }]
      };
      expect(validator.validate(dataWithChildren)).toFailWith(
        /This test demonstrates that self parameter is available/
      );
    });
  });

  describe('Validation using existing validators with self', () => {
    test('should demonstrate self parameter availability in built-in validators', () => {
      // Create a custom validator that uses self parameter for complex structures
      const complexValidator: ValidatorFunc<{ data: unknown }, unknown> = (
        from: unknown,
        context?: unknown,
        self?: Validator<{ data: unknown }, unknown>
      ): boolean | Failure<{ data: unknown }> => {
        if (typeof from !== 'object' || from === null || Array.isArray(from)) {
          return fail('Expected object');
        }

        const obj = from as Record<string, unknown>;
        if (!('data' in obj)) {
          return fail('Missing data field');
        }

        // Example: validate that data field matches the same structure when it's an object
        if (typeof obj.data === 'object' && obj.data !== null && !Array.isArray(obj.data) && self) {
          const recursiveResult = self.validate(obj.data, context);
          if (recursiveResult.isFailure()) {
            return fail(`Recursive data validation failed: ${recursiveResult.message}`);
          }
        }

        return true;
      };

      const validator = new Base.GenericValidator({ validator: complexValidator });

      // Test recursive structure
      const recursiveData = {
        data: {
          data: {
            data: 'leaf'
          }
        }
      };

      expect(validator.validate(recursiveData)).toSucceed();

      // Test invalid recursive structure
      const invalidRecursiveData = {
        data: {
          invalidField: true // Missing 'data' field
        }
      };

      expect(validator.validate(invalidRecursiveData)).toFailWith(
        /Recursive data validation failed: Missing data field/
      );
    });
  });

  describe('Self parameter in combination with other validators', () => {
    test('should work with object validator and recursive structures', () => {
      interface IRecursiveNode {
        id: string;
        value: number;
        left?: IRecursiveNode;
        right?: IRecursiveNode;
      }

      const recursiveNodeValidator: ValidatorFunc<IRecursiveNode, unknown> = (
        from: unknown,
        context?: unknown,
        self?: Validator<IRecursiveNode, unknown>
      ): boolean | Failure<IRecursiveNode> => {
        // Use existing validators for basic structure
        const basicValidator = Validators.object<IRecursiveNode>({
          id: Validators.string,
          value: Validators.number,
          left: Validators.generic<IRecursiveNode | undefined>((from: unknown) => {
            if (from === undefined) return true;
            if (!self) return fail('Self parameter required for recursive validation');
            const result = self.validate(from);
            return result.isSuccess() ? true : result;
          }).optional(),
          right: Validators.generic<IRecursiveNode | undefined>((from: unknown) => {
            if (from === undefined) return true;
            if (!self) return fail('Self parameter required for recursive validation');
            const result = self.validate(from);
            return result.isSuccess() ? true : result;
          }).optional()
        });

        const result = basicValidator.validate(from, context);
        return result.isSuccess() ? true : result;
      };

      const validator = new Base.GenericValidator({ validator: recursiveNodeValidator });

      // Test valid binary tree
      const validTree: IRecursiveNode = {
        id: 'root',
        value: 1,
        left: {
          id: 'left',
          value: 2,
          left: { id: 'left-left', value: 4 },
          right: { id: 'left-right', value: 5 }
        },
        right: {
          id: 'right',
          value: 3
        }
      };

      expect(validator.validate(validTree)).toSucceed();

      // Test invalid tree (invalid value type in nested node)
      const invalidTree = {
        id: 'root',
        value: 1,
        left: {
          id: 'left',
          value: 'invalid', // Should be number
          left: { id: 'left-left', value: 4 }
        }
      };

      expect(validator.validate(invalidTree)).toFailWith(/not a number/);
    });
  });
});
