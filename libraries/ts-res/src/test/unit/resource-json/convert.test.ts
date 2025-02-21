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
import * as TsRes from '../../../index';

describe('ResourceJson', () => {
  describe('conditionSetDecl converter', () => {
    test('converts a condition set containing string values', () => {
      expect(
        TsRes.ResourceJson.Convert.conditionSetDecl.convert({
          foo: 'bar',
          wut: 'xyzzy'
        })
      ).toSucceedWith([
        {
          qualifierName: 'foo',
          value: 'bar'
        },
        {
          qualifierName: 'wut',
          value: 'xyzzy'
        }
      ]);
    });

    test('converts a condition set containing child condition declarations', () => {
      expect(
        TsRes.ResourceJson.Convert.conditionSetDecl.convert({
          foo: { value: 'bar', priority: 100 },
          wut: { value: 'xyzzy', priority: 200 }
        })
      ).toSucceedWith([
        {
          priority: 100,
          qualifierName: 'foo',
          value: 'bar'
        },
        {
          priority: 200,
          qualifierName: 'wut',
          value: 'xyzzy'
        }
      ]);
    });

    test('converts a condition set containing both string values and child condition declarations', () => {
      expect(
        TsRes.ResourceJson.Convert.conditionSetDecl.convert({
          foo: 'bar',
          wut: { value: 'xyzzy', priority: 200 }
        })
      ).toSucceedWith([
        {
          qualifierName: 'foo',
          value: 'bar'
        },
        {
          qualifierName: 'wut',
          value: 'xyzzy',
          priority: 200
        }
      ]);
    });

    test('converts an array of loose condition declarations', () => {
      expect(
        TsRes.ResourceJson.Convert.conditionSetDecl.convert([
          { qualifierName: 'foo', value: 'bar' },
          { qualifierName: 'wut', value: 'xyzzy', priority: 200 }
        ])
      ).toSucceedWith([
        {
          qualifierName: 'foo',
          value: 'bar'
        },
        {
          qualifierName: 'wut',
          value: 'xyzzy',
          priority: 200
        }
      ]);
    });

    test('fails if the input is not an object or array', () => {
      expect(TsRes.ResourceJson.Convert.conditionSetDecl.convert('foo')).toFailWith(/expected an object/i);
    });
  });

  describe('resourceCollectionDecl converter', () => {
    test('converts a valid resource collection declaration', () => {
      const input: TsRes.ResourceJson.Json.IResourceCollectionDecl = {
        candidates: [
          {
            id: 'someType.someKey',
            json: { someQualifier: 'someValue' },
            conditions: { someQualifier: 'someValue' }
          }
        ]
      };

      const result = TsRes.ResourceJson.Convert.resourceCollectionDecl.convert(input);
      expect(result).toSucceedWith({
        candidates: [
          {
            id: 'someType.someKey',
            json: { someQualifier: 'someValue' },
            conditions: [
              {
                qualifierName: 'someQualifier',
                value: 'someValue'
              }
            ]
          }
        ]
      });
    });

    test('converts a nested resource collection declaration', () => {
      const input: TsRes.ResourceJson.Json.IResourceCollectionDecl = {
        baseName: 'some',
        candidates: [
          {
            id: 'someType.someKey',
            json: { someQualifier: 'someValue' },
            conditions: { someQualifier: 'someValue' }
          }
        ],
        collections: [
          {
            baseName: 'other',
            candidates: [
              {
                id: 'someType.someKey',
                json: { someQualifier: 'someValue' },
                conditions: { someQualifier: 'someValue' }
              }
            ]
          }
        ]
      };

      const result = TsRes.ResourceJson.Convert.resourceCollectionDecl.convert(input);
      expect(result).toSucceedWith({
        baseName: 'some',
        candidates: [
          {
            id: 'someType.someKey',
            json: { someQualifier: 'someValue' },
            conditions: [
              {
                qualifierName: 'someQualifier',
                value: 'someValue'
              }
            ]
          }
        ],
        collections: [
          {
            baseName: 'other',
            candidates: [
              {
                id: 'someType.someKey',
                json: { someQualifier: 'someValue' },
                conditions: [
                  {
                    qualifierName: 'someQualifier',
                    value: 'someValue'
                  }
                ]
              }
            ]
          }
        ]
      });
    });
  });

  describe('resourceTreeRootDecl converter', () => {
    test('converts a valid nested resource tree', () => {
      expect(
        TsRes.ResourceJson.Convert.resourceTreeRootDecl.convert({
          baseName: 'some',
          resources: {
            resource1: {
              resourceTypeName: 'type1',
              candidates: [
                {
                  json: { payload: 'someValue' },
                  conditions: { someQualifier: 'someValue' }
                }
              ]
            }
          },
          children: {
            child1: {
              resources: {
                resource2: {
                  resourceTypeName: 'type3',
                  candidates: [
                    {
                      json: { payload: 'some other value' },
                      conditions: { someQualifier: { value: 'someValue', priority: 200 } }
                    }
                  ]
                }
              }
            }
          }
        })
      ).toSucceedWith({
        baseName: 'some',
        resources: {
          resource1: {
            resourceTypeName: 'type1',
            candidates: [
              {
                json: { payload: 'someValue' },
                conditions: [
                  {
                    qualifierName: 'someQualifier',
                    value: 'someValue'
                  }
                ]
              }
            ]
          }
        },
        children: {
          child1: {
            resources: {
              resource2: {
                resourceTypeName: 'type3',
                candidates: [
                  {
                    json: { payload: 'some other value' },
                    conditions: [
                      {
                        qualifierName: 'someQualifier',
                        value: 'someValue',
                        priority: 200
                      }
                    ]
                  }
                ]
              }
            }
          }
        }
      });
    });
  });
});
