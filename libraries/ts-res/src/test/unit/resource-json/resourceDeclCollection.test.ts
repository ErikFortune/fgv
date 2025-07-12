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
        context: {
          baseId: 'parent',
          conditions: { orphaned: 'false' }
        },
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
        context: {
          baseId: 'parent',
          conditions: { orphaned: 'false' }
        },
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

    test('extracts child collections, augmenting name and conditions', () => {
      const jsonDecl: TsRes.ResourceJson.Json.IResourceCollectionDecl = {
        context: {
          baseId: 'parent',
          conditions: { orphaned: 'false' }
        },
        collections: [
          {
            context: {
              baseId: 'child',
              conditions: { grandchild: 'true' },
              mergeMethod: 'augment'
            },
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
                context: {
                  baseId: 'grandchild',
                  conditions: { greatGrandchild: 'true' }
                },
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
              },
              {
                context: {
                  baseId: 'g2'
                },
                candidates: [
                  {
                    id: 'foo',
                    json: { myNameIs: 'foo' },
                    conditions: { foo: 'bar' }
                  }
                ]
              },
              {
                context: {
                  conditions: { g2: 'true' }
                },
                candidates: [
                  {
                    id: 'foo',
                    json: { myNameIs: 'foo' },
                    conditions: { foo: 'bar' }
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
          },
          {
            id: 'parent.child.g2.foo',
            json: { myNameIs: 'foo' },
            conditions: [
              { qualifierName: 'orphaned', value: 'false' },
              { qualifierName: 'grandchild', value: 'true' },
              { qualifierName: 'foo', value: 'bar' }
            ]
          },
          {
            id: 'parent.child.foo',
            json: { myNameIs: 'foo' },
            conditions: [
              { qualifierName: 'orphaned', value: 'false' },
              { qualifierName: 'grandchild', value: 'true' },
              { qualifierName: 'g2', value: 'true' },
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

    test('extracts child collections, replacing name and conditions if specified', () => {
      const jsonDecl: TsRes.ResourceJson.Json.IResourceCollectionDecl = {
        context: {
          baseId: 'parent',
          conditions: { orphaned: 'false' }
        },
        collections: [
          {
            context: {
              mergeMethod: 'replace',
              baseId: 'child',
              conditions: { grandchild: 'true' }
            },
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
            resources: [
              {
                id: 'foo_res',
                resourceTypeName: 'fooType',
                candidates: [
                  {
                    json: { myNameIs: 'foo' },
                    conditions: { foo: 'bar' }
                  },
                  {
                    json: { myNameIs: 'magic foo' },
                    conditions: { wut: { value: 'xyzzy', priority: 200 } }
                  }
                ]
              }
            ]
          },
          {
            context: {
              mergeMethod: 'replace',
              baseId: 'child2'
            },
            candidates: [
              {
                id: 'foo_the_second',
                json: { myNameIs: 'foo the second' },
                conditions: {
                  c2foo2: 'true'
                }
              }
            ]
          },
          {
            context: {
              mergeMethod: 'replace',
              conditions: { c3: 'true' }
            },
            candidates: [
              {
                id: 'foo_the_third',
                json: { myNameIs: 'foo the third' },
                conditions: {
                  c3foo3: 'true'
                }
              }
            ]
          }
        ]
      };
      expect(TsRes.ResourceJson.ResourceDeclCollection.create(jsonDecl)).toSucceedAndSatisfy((collection) => {
        expect(collection.getLooseCandidates()).toEqual([
          {
            id: 'child.foo',
            json: { myNameIs: 'foo' },
            conditions: [
              { qualifierName: 'grandchild', value: 'true' },
              { qualifierName: 'foo', value: 'bar' }
            ]
          },
          {
            id: 'child.bar',
            json: { myNameIs: 'bar' },
            conditions: [
              { qualifierName: 'grandchild', value: 'true' },
              { qualifierName: 'wut', value: 'xyzzy', priority: 200 }
            ]
          },
          {
            id: 'child2.foo_the_second',
            json: { myNameIs: 'foo the second' },
            conditions: [
              { qualifierName: 'orphaned', value: 'false' },
              { qualifierName: 'c2foo2', value: 'true' }
            ]
          },
          {
            id: 'parent.foo_the_third',
            json: { myNameIs: 'foo the third' },
            conditions: [
              { qualifierName: 'c3', value: 'true' },
              { qualifierName: 'c3foo3', value: 'true' }
            ]
          }
        ]);

        expect(collection.getLooseResources()).toEqual([
          {
            id: 'child.foo_res',
            resourceTypeName: 'fooType',
            candidates: [
              {
                json: { myNameIs: 'foo' },
                conditions: [
                  { qualifierName: 'grandchild', value: 'true' },
                  { qualifierName: 'foo', value: 'bar' }
                ]
              },
              {
                json: { myNameIs: 'magic foo' },
                conditions: [
                  { qualifierName: 'grandchild', value: 'true' },
                  { qualifierName: 'wut', value: 'xyzzy', priority: 200 }
                ]
              }
            ]
          }
        ]);
      });
    });

    test('extracts child collections, deleting name and conditions if specified', () => {
      const jsonDecl: TsRes.ResourceJson.Json.IResourceCollectionDecl = {
        context: {
          baseId: 'parent',
          conditions: { orphaned: 'false' }
        },
        collections: [
          {
            context: {
              mergeMethod: 'delete'
            },
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
            resources: [
              {
                id: 'foo_res',
                resourceTypeName: 'fooType',
                candidates: [
                  {
                    json: { myNameIs: 'foo' },
                    conditions: { foo: 'bar' }
                  },
                  {
                    json: { myNameIs: 'magic foo' },
                    conditions: { wut: { value: 'xyzzy', priority: 200 } }
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

        expect(collection.getLooseResources()).toEqual([
          {
            id: 'foo_res',
            resourceTypeName: 'fooType',
            candidates: [
              {
                json: { myNameIs: 'foo' },
                conditions: [{ qualifierName: 'foo', value: 'bar' }]
              },
              {
                json: { myNameIs: 'magic foo' },
                conditions: [{ qualifierName: 'wut', value: 'xyzzy', priority: 200 }]
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
