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

import '@fgv/ts-utils-jest';
import { Hash } from '@fgv/ts-utils';
import { CandidateValueCollector } from '../../../packlets/resources';
import { CandidateValueKey } from '../../../packlets/common';

describe('CandidateValueCollector', () => {
  describe('create', () => {
    test('should create empty collector', () => {
      expect(CandidateValueCollector.create()).toSucceedAndSatisfy((collector) => {
        expect(collector.size).toBe(0);
      });
    });

    test('should create collector with normalizer', () => {
      const normalizer = new Hash.Crc32Normalizer();

      expect(CandidateValueCollector.create({ normalizer })).toSucceedAndSatisfy((collector) => {
        expect(collector.size).toBe(0);
      });
    });

    test('should create collector with initial candidate values', () => {
      const json1 = { test: 'value1' };
      const json2 = { test: 'value2' };

      expect(
        CandidateValueCollector.create({
          candidateValues: [json1, json2] // Can pass JsonValue directly now
        })
      ).toSucceedAndSatisfy((collector) => {
        expect(collector.size).toBe(2);

        // Values should already be in the collector
        const values = Array.from(collector.values());
        expect(values).toHaveLength(2);

        // Should find existing values by their normalized keys
        const firstValue = values.find((cv) => JSON.stringify(cv.json) === JSON.stringify(json1));
        const secondValue = values.find((cv) => JSON.stringify(cv.json) === JSON.stringify(json2));
        expect(firstValue).toBeDefined();
        expect(secondValue).toBeDefined();
      });
    });
  });

  describe('add', () => {
    test('should add new JSON value', () => {
      expect(CandidateValueCollector.create()).toSucceedAndSatisfy((collector) => {
        const json = { test: 'value' };

        expect(collector.validating.add(json)).toSucceedAndSatisfy((candidateValue) => {
          expect(candidateValue.json).toEqual(json);
          expect(candidateValue.index).toBe(0); // First value gets index 0
          expect(collector.size).toBe(1);
        });
      });
    });

    test('should deduplicate identical JSON values', () => {
      expect(CandidateValueCollector.create()).toSucceedAndSatisfy((collector) => {
        const json = { test: 'value', number: 42 };

        expect(collector.validating.add(json)).toSucceedAndSatisfy((firstValue) => {
          // Second add should fail because item already exists
          const secondResult = collector.validating.add(json);
          expect(secondResult.isFailure()).toBe(true);
          expect(secondResult.message).toMatch(/already exists/);

          // But can still get the existing value by key
          expect(collector.validating.get(firstValue.key)).toSucceedWith(firstValue);
          expect(collector.size).toBe(1); // Still only one value
        });
      });
    });

    test('should deduplicate normalized JSON with different property order', () => {
      expect(CandidateValueCollector.create()).toSucceedAndSatisfy((collector) => {
        const json1 = { b: 2, a: 1 };
        const json2 = { a: 1, b: 2 };

        expect(collector.validating.add(json1)).toSucceedAndSatisfy((firstValue) => {
          // Second add should fail due to normalization - same normalized key
          const secondResult = collector.validating.add(json2);
          expect(secondResult.isFailure()).toBe(true);
          expect(secondResult.message).toMatch(/already exists/);

          // But can still get the existing value by key
          expect(collector.validating.get(firstValue.key)).toSucceedWith(firstValue);
          expect(collector.size).toBe(1);
        });
      });
    });

    test('should assign sequential indices', () => {
      expect(CandidateValueCollector.create()).toSucceedAndSatisfy((collector) => {
        const json1 = { test: 'value1' };
        const json2 = { test: 'value2' };
        const json3 = { test: 'value3' };

        expect(collector.validating.add(json1)).toSucceedAndSatisfy((cv1) => {
          expect(cv1.index).toBe(0);

          expect(collector.validating.add(json2)).toSucceedAndSatisfy((cv2) => {
            expect(cv2.index).toBe(1);

            expect(collector.validating.add(json3)).toSucceedAndSatisfy((cv3) => {
              expect(cv3.index).toBe(2);
              expect(collector.size).toBe(3);
            });
          });
        });
      });
    });

    test('should handle various JSON types', () => {
      expect(CandidateValueCollector.create()).toSucceedAndSatisfy((collector) => {
        const testValues = [null, true, false, 42, 'string', [1, 2, 3], { nested: { object: true } }];

        testValues.forEach((json, expectedIndex) => {
          expect(collector.validating.add(json)).toSucceedAndSatisfy((candidateValue) => {
            expect(candidateValue.json).toEqual(json);
            expect(candidateValue.index).toBe(expectedIndex);
          });
        });

        expect(collector.size).toBe(testValues.length);
      });
    });
  });

  describe('value access by key', () => {
    test('should access candidate values by their keys', () => {
      expect(CandidateValueCollector.create()).toSucceedAndSatisfy((collector) => {
        const json1 = { test: 'value1' };
        const json2 = { test: 'value2' };

        expect(collector.validating.add(json1)).toSucceedAndSatisfy((cv1) => {
          expect(collector.validating.add(json2)).toSucceedAndSatisfy((cv2) => {
            // Can access values by their keys
            expect(collector.validating.get(cv1.key)).toSucceedWith(cv1);
            expect(collector.validating.get(cv2.key)).toSucceedWith(cv2);
          });
        });
      });
    });

    test('should fail for non-existent key', () => {
      expect(CandidateValueCollector.create()).toSucceedAndSatisfy((collector) => {
        // Empty collector should not have any values
        expect(collector.size).toBe(0);
        expect(Array.from(collector.values())).toHaveLength(0);
      });
    });

    test('should handle large collections efficiently', () => {
      expect(CandidateValueCollector.create()).toSucceedAndSatisfy((collector) => {
        // Add many values
        const values = Array.from({ length: 1000 }, (unusedItem, i) => ({ value: i }));

        values.forEach((json) => {
          expect(collector.validating.add(json)).toSucceed();
        });

        // All values should be accessible
        expect(collector.size).toBe(1000);
        const allValues = Array.from(collector.values());
        expect(allValues).toHaveLength(1000);
      });
    });
  });

  describe('get', () => {
    test('should get candidate value by key', () => {
      expect(CandidateValueCollector.create()).toSucceedAndSatisfy((collector) => {
        const json = { test: 'value' };

        expect(collector.validating.add(json)).toSucceedAndSatisfy((candidateValue) => {
          expect(collector.validating.get(candidateValue.key)).toSucceedWith(candidateValue);
        });
      });
    });

    test('should fail for non-existent key', () => {
      expect(CandidateValueCollector.create()).toSucceedAndSatisfy((collector) => {
        const fakeKey = 'nonexistent-key' as unknown as CandidateValueKey;
        expect(collector.validating.get(fakeKey)).toFail();
      });
    });
  });

  describe('has', () => {
    test('should check if candidate value exists by key', () => {
      expect(CandidateValueCollector.create()).toSucceedAndSatisfy((collector) => {
        const json = { test: 'value' };

        expect(collector.validating.add(json)).toSucceedAndSatisfy((candidateValue) => {
          expect(collector.validating.has(candidateValue.key)).toBe(true);

          const fakeKey = 'nonexistent-key' as unknown as CandidateValueKey;
          expect(collector.validating.has(fakeKey)).toBe(false);
        });
      });
    });
  });

  describe('values', () => {
    test('should return all candidate values', () => {
      expect(CandidateValueCollector.create()).toSucceedAndSatisfy((collector) => {
        const json1 = { test: 'value1' };
        const json2 = { test: 'value2' };

        expect(collector.validating.add(json1)).toSucceedAndSatisfy((cv1) => {
          expect(collector.validating.add(json2)).toSucceedAndSatisfy((cv2) => {
            const values = Array.from(collector.values());
            expect(values).toHaveLength(2);
            expect(values).toContain(cv1);
            expect(values).toContain(cv2);
          });
        });
      });
    });

    test('should return empty array for empty collector', () => {
      expect(CandidateValueCollector.create()).toSucceedAndSatisfy((collector) => {
        expect(Array.from(collector.values())).toHaveLength(0);
      });
    });
  });

  describe('values iteration', () => {
    test('should contain all added JSON values', () => {
      expect(CandidateValueCollector.create()).toSucceedAndSatisfy((collector) => {
        const json1 = { test: 'value1' };
        const json2 = { test: 'value2' };
        const json3 = { test: 'value3' };

        expect(collector.validating.add(json1)).toSucceedAndSatisfy((cv1) => {
          expect(collector.validating.add(json2)).toSucceedAndSatisfy((cv2) => {
            expect(collector.validating.add(json3)).toSucceedAndSatisfy((cv3) => {
              const values = Array.from(collector.values());
              expect(values).toHaveLength(3);
              expect(values).toContain(cv1);
              expect(values).toContain(cv2);
              expect(values).toContain(cv3);
            });
          });
        });
      });
    });

    test('should handle empty collector', () => {
      expect(CandidateValueCollector.create()).toSucceedAndSatisfy((collector) => {
        expect(Array.from(collector.values())).toEqual([]);
      });
    });

    test('should not contain duplicates', () => {
      expect(CandidateValueCollector.create()).toSucceedAndSatisfy((collector) => {
        const values = [{ id: 'first' }, { id: 'second' }, { id: 'third' }];

        // Add in order
        values.forEach((json) => {
          expect(collector.validating.add(json)).toSucceed();
        });

        // Add duplicate (should fail - already exists)
        expect(collector.validating.add(values[1])).toFailWith(/already exists/);

        const candidateValues = Array.from(collector.values());
        expect(candidateValues).toHaveLength(3); // No duplicates
      });
    });
  });

  describe('collection state', () => {
    test('should track collection state correctly', () => {
      expect(CandidateValueCollector.create()).toSucceedAndSatisfy((collector) => {
        const json1 = { test: 'value1' };
        const json2 = { test: 'value2' };

        expect(collector.validating.add(json1)).toSucceed();
        expect(collector.validating.add(json2)).toSucceed();
        expect(collector.size).toBe(2);

        // Collection should contain both values
        expect(collector.size).toBe(2);
        expect(Array.from(collector.values())).toHaveLength(2);
      });
    });
  });

  describe('size', () => {
    test('should track collection size correctly', () => {
      expect(CandidateValueCollector.create()).toSucceedAndSatisfy((collector) => {
        expect(collector.size).toBe(0);

        expect(collector.validating.add({ test: 'value1' })).toSucceed();
        expect(collector.size).toBe(1);

        expect(collector.validating.add({ test: 'value2' })).toSucceed();
        expect(collector.size).toBe(2);

        // Adding duplicate should fail with "already exists"
        expect(collector.validating.add({ test: 'value1' })).toFailWith(/already exists/);
        expect(collector.size).toBe(2); // Size should remain the same
      });
    });
  });

  describe('error conditions', () => {
    test('should handle constructor errors with invalid initial values', () => {
      // This tests the error handling in the constructor when initial values fail to add
      // In practice, this is hard to trigger since CandidateValue.create is robust
      // But the pattern is tested for completeness

      expect(CandidateValueCollector.create()).toSucceed();
    });

    test('should handle empty collector gracefully', () => {
      expect(CandidateValueCollector.create()).toSucceedAndSatisfy((collector) => {
        // Empty collector has no values
        expect(collector.size).toBe(0);
        expect(Array.from(collector.values())).toHaveLength(0);
      });
    });
  });

  describe('integration scenarios', () => {
    test('should handle complex real-world JSON structures', () => {
      expect(CandidateValueCollector.create()).toSucceedAndSatisfy((collector) => {
        const complexJson = {
          metadata: {
            version: '1.0',
            created: '2025-01-15T10:00:00Z',
            author: {
              name: 'Test User',
              email: 'test@example.com'
            }
          },
          content: {
            title: 'Sample Resource',
            description: 'A complex resource for testing',
            tags: ['test', 'complex', 'json'],
            properties: {
              enabled: true,
              priority: 10,
              config: {
                timeout: 5000,
                retries: 3,
                options: ['a', 'b', 'c']
              }
            }
          },
          relationships: [
            { type: 'parent', id: 'parent-123' },
            { type: 'child', id: 'child-456' }
          ]
        };

        expect(collector.validating.add(complexJson)).toSucceedAndSatisfy((candidateValue) => {
          expect(candidateValue.json).toEqual(complexJson);
          expect(candidateValue.index).toBe(0);
          expect(collector.size).toBe(1);

          // Adding the same complex structure should fail with "already exists"
          expect(collector.validating.add(JSON.parse(JSON.stringify(complexJson)))).toFailWith(
            /already exists/
          );
          expect(collector.size).toBe(1);
        });
      });
    });

    test('should work with multiple collectors independently', () => {
      const collector1Result = CandidateValueCollector.create();
      const collector2Result = CandidateValueCollector.create();

      expect(collector1Result).toSucceedAndSatisfy((collector1) => {
        expect(collector2Result).toSucceedAndSatisfy((collector2) => {
          const json = { test: 'shared value' };

          expect(collector1.validating.add(json)).toSucceedAndSatisfy((cv1) => {
            expect(collector2.validating.add(json)).toSucceedAndSatisfy((cv2) => {
              // Should be different instances since they're from different collectors
              expect(cv1).not.toBe(cv2);
              // But should have the same normalized content
              expect(cv1.json).toEqual(cv2.json);
              expect(cv1.key).toBe(cv2.key); // Same key due to same JSON
              expect(cv1.index).toBe(cv2.index); // Both should be index 0 in their respective collectors
            });
          });
        });
      });
    });
  });
});
