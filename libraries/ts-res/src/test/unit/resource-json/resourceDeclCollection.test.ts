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

describe('ResourceDeclCollection', () => {
  describe('create static method', () => {
    test('extracts loose candidates with no parent name or conditions', () => {
      const jsonDecl: TsRes.ResourceJson.Json.IResourceCollectionDecl = {
        candidates: [
          {
            id: 'foo',
            json: { myNameIs: 'foo' },
            conditions: { foo: 'bar' }
          },
          {
            id: 'bar',
            json: { myNameIs: 'bar' },
            conditions: { wut: { value: 'xyzzy', priority: 200 } }
          }
        ]
      };
      expect(TsRes.ResourceJson.ResourceDeclCollection.create(jsonDecl)).toSucceedAndSatisfy((collection) => {
        expect(collection.getLooseCandidates()).toEqual([
          {
            id: 'foo',
            json: { myNameIs: 'foo' },
            conditions: [{ qualifierName: 'foo', value: 'bar' }]
          },
          {
            id: 'bar',
            json: { myNameIs: 'bar' },
            conditions: [{ qualifierName: 'wut', value: 'xyzzy', priority: 200 }]
          }
        ]);
      });
    });

    test('extracts loose candidates with parent name and conditions', () => {
      const jsonDecl: TsRes.ResourceJson.Json.IResourceCollectionDecl = {
        baseName: 'parent',
        baseConditions: { orphaned: 'false' },
        candidates: [
          {
            id: 'foo',
            json: { myNameIs: 'foo' },
            conditions: { foo: 'bar' }
          },
          {
            id: 'bar',
            json: { myNameIs: 'bar' },
            conditions: { wut: { value: 'xyzzy', priority: 200 } }
          }
        ]
      };
      expect(TsRes.ResourceJson.ResourceDeclCollection.create(jsonDecl)).toSucceedAndSatisfy((collection) => {
        expect(collection.getLooseCandidates()).toEqual([
          {
            id: 'parent.foo',
            json: { myNameIs: 'foo' },
            conditions: [
              { qualifierName: 'orphaned', value: 'false' },
              { qualifierName: 'foo', value: 'bar' }
            ]
          },
          {
            id: 'parent.bar',
            json: { myNameIs: 'bar' },
            conditions: [
              { qualifierName: 'orphaned', value: 'false' },
              { qualifierName: 'wut', value: 'xyzzy', priority: 200 }
            ]
          }
        ]);
      });
    });

    test('extracts loose resources with no parent name or conditions', () => {
      const jsonDecl: TsRes.ResourceJson.Json.IResourceCollectionDecl = {
        resources: [
          {
            id: 'foo.bar',
            resourceTypeName: 'fooType',
            candidates: [
              {
                json: { myNameIs: 'foo' },
                conditions: { foo: 'bar' }
              },
              {
                json: { myNameIs: 'bar' },
                conditions: { wut: { value: 'xyzzy', priority: 200 } }
              }
            ]
          }
        ]
      };
      expect(TsRes.ResourceJson.ResourceDeclCollection.create(jsonDecl)).toSucceedAndSatisfy((collection) => {
        expect(collection.getLooseResources()).toEqual([
          {
            id: 'foo.bar',
            resourceTypeName: 'fooType',
            candidates: [
              {
                json: { myNameIs: 'foo' },
                conditions: [{ qualifierName: 'foo', value: 'bar' }]
              },
              {
                json: { myNameIs: 'bar' },
                conditions: [{ qualifierName: 'wut', value: 'xyzzy', priority: 200 }]
              }
            ]
          }
        ]);
      });
    });

    test('extracts loose resources with parent name and conditions', () => {
      const jsonDecl: TsRes.ResourceJson.Json.IResourceCollectionDecl = {
        baseName: 'parent',
        baseConditions: { orphaned: 'false' },
        resources: [
          {
            id: 'foo.bar',
            resourceTypeName: 'fooType',
            candidates: [
              {
                json: { myNameIs: 'foo' },
                conditions: { foo: 'bar' }
              },
              {
                json: { myNameIs: 'bar' },
                conditions: { wut: { value: 'xyzzy', priority: 200 } }
              }
            ]
          }
        ]
      };
      expect(TsRes.ResourceJson.ResourceDeclCollection.create(jsonDecl)).toSucceedAndSatisfy((collection) => {
        expect(collection.getLooseResources()).toEqual([
          {
            id: 'parent.foo.bar',
            resourceTypeName: 'fooType',
            candidates: [
              {
                json: { myNameIs: 'foo' },
                conditions: [
                  { qualifierName: 'orphaned', value: 'false' },
                  { qualifierName: 'foo', value: 'bar' }
                ]
              },
              {
                json: { myNameIs: 'bar' },
                conditions: [
                  { qualifierName: 'orphaned', value: 'false' },
                  { qualifierName: 'wut', value: 'xyzzy', priority: 200 }
                ]
              }
            ]
          }
        ]);
      });
    });

    test('extracts child collections, aggregating name and conditions', () => {
      const jsonDecl: TsRes.ResourceJson.Json.IResourceCollectionDecl = {
        baseName: 'parent',
        baseConditions: { orphaned: 'false' },
        collections: [
          {
            baseName: 'child',
            baseConditions: { grandchild: 'true' },
            candidates: [
              {
                id: 'foo',
                json: { myNameIs: 'foo' },
                conditions: { foo: 'bar' }
              },
              {
                id: 'bar',
                json: { myNameIs: 'bar' },
                conditions: { wut: { value: 'xyzzy', priority: 200 } }
              }
            ],
            collections: [
              {
                baseName: 'grandchild',
                baseConditions: { greatGrandchild: 'true' },
                candidates: [
                  {
                    id: 'foo',
                    json: { myNameIs: 'foo' },
                    conditions: { foo: 'bar' }
                  }
                ],
                resources: [
                  {
                    id: 'foo',
                    resourceTypeName: 'fooType',
                    candidates: [
                      {
                        json: { myNameIs: 'foo' },
                        conditions: { foo: 'bar' }
                      },
                      {
                        json: { myNameIs: 'bar' },
                        conditions: { wut: { value: 'xyzzy', priority: 200 } }
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      };
      expect(TsRes.ResourceJson.ResourceDeclCollection.create(jsonDecl)).toSucceedAndSatisfy((collection) => {
        expect(collection.getLooseCandidates()).toEqual([
          {
            id: 'parent.child.foo',
            json: { myNameIs: 'foo' },
            conditions: [
              { qualifierName: 'orphaned', value: 'false' },
              { qualifierName: 'grandchild', value: 'true' },
              { qualifierName: 'foo', value: 'bar' }
            ]
          },
          {
            id: 'parent.child.bar',
            json: { myNameIs: 'bar' },
            conditions: [
              { qualifierName: 'orphaned', value: 'false' },
              { qualifierName: 'grandchild', value: 'true' },
              { qualifierName: 'wut', value: 'xyzzy', priority: 200 }
            ]
          },
          {
            id: 'parent.child.grandchild.foo',
            json: { myNameIs: 'foo' },
            conditions: [
              { qualifierName: 'orphaned', value: 'false' },
              { qualifierName: 'grandchild', value: 'true' },
              { qualifierName: 'greatGrandchild', value: 'true' },
              { qualifierName: 'foo', value: 'bar' }
            ]
          }
        ]);

        expect(collection.getLooseResources()).toEqual([
          {
            id: 'parent.child.grandchild.foo',
            resourceTypeName: 'fooType',
            candidates: [
              {
                json: { myNameIs: 'foo' },
                conditions: [
                  { qualifierName: 'orphaned', value: 'false' },
                  { qualifierName: 'grandchild', value: 'true' },
                  { qualifierName: 'greatGrandchild', value: 'true' },
                  { qualifierName: 'foo', value: 'bar' }
                ]
              },
              {
                json: { myNameIs: 'bar' },
                conditions: [
                  { qualifierName: 'orphaned', value: 'false' },
                  { qualifierName: 'grandchild', value: 'true' },
                  { qualifierName: 'greatGrandchild', value: 'true' },
                  { qualifierName: 'wut', value: 'xyzzy', priority: 200 }
                ]
              }
            ]
          }
        ]);
      });
    });

    test('fails if the input is not valid', () => {
      expect(TsRes.ResourceJson.ResourceDeclCollection.create({ bogus: 'property' })).toFailWith(
        /invalid resource collection/i
      );
    });
  });
});
