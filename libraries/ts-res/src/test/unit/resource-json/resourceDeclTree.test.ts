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

describe('ResourceDeclTree', () => {
  describe('create static method', () => {
    test('extracts resources from a valid tree root', () => {
      const json: TsRes.ResourceJson.Json.IResourceTreeRootDecl = {
        resources: {
          foo: {
            resourceTypeName: 'json',
            candidates: [
              {
                json: { myNameIs: 'foo' },
                conditions: { foo: 'bar' }
              }
            ]
          },
          bar: {
            resourceTypeName: 'json',
            candidates: [
              {
                json: { myNameIs: 'bar' },
                conditions: { foo: { value: 'baz', priority: 100 } },
                isPartial: true
              }
            ]
          }
        }
      };
      expect(TsRes.ResourceJson.ResourceDeclTree.create(json)).toSucceedAndSatisfy((tree) => {
        expect(tree.getLooseCandidates()).toEqual([]);
        expect(tree.getLooseResources()).toEqual([
          {
            id: 'foo',
            resourceTypeName: 'json',
            candidates: [
              {
                json: { myNameIs: 'foo' },
                conditions: [{ qualifierName: 'foo', value: 'bar' }]
              }
            ]
          },
          {
            id: 'bar',
            resourceTypeName: 'json',
            candidates: [
              {
                json: { myNameIs: 'bar' },
                conditions: [{ qualifierName: 'foo', value: 'baz', priority: 100 }],
                isPartial: true
              }
            ]
          }
        ]);
      });
    });

    test('extracts resources from a valid tree root with a base name', () => {
      const json: TsRes.ResourceJson.Json.IResourceTreeRootDecl = {
        context: {
          baseId: 'base'
        },
        resources: {
          foo: {
            resourceTypeName: 'json',
            candidates: [
              {
                json: { myNameIs: 'foo' },
                conditions: { foo: 'bar' }
              }
            ]
          },
          bar: {
            resourceTypeName: 'json',
            candidates: [
              {
                json: { myNameIs: 'bar' },
                conditions: { foo: { value: 'baz', priority: 100 } },
                isPartial: true
              }
            ]
          }
        }
      };
      expect(TsRes.ResourceJson.ResourceDeclTree.create(json)).toSucceedAndSatisfy((tree) => {
        expect(tree.getLooseResources()).toEqual([
          {
            id: 'base.foo',
            resourceTypeName: 'json',
            candidates: [
              {
                json: { myNameIs: 'foo' },
                conditions: [{ qualifierName: 'foo', value: 'bar' }]
              }
            ]
          },
          {
            id: 'base.bar',
            resourceTypeName: 'json',
            candidates: [
              {
                json: { myNameIs: 'bar' },
                conditions: [{ qualifierName: 'foo', value: 'baz', priority: 100 }],
                isPartial: true
              }
            ]
          }
        ]);
      });
    });

    test('extracts resources from an entire tree', () => {
      const json: TsRes.ResourceJson.Json.IResourceTreeRootDecl = {
        context: {
          baseId: 'base'
        },
        resources: {
          foo: {
            resourceTypeName: 'json',
            candidates: [
              {
                json: { myNameIs: 'foo' },
                conditions: { foo: 'bar' }
              }
            ]
          },
          bar: {
            resourceTypeName: 'json',
            candidates: [
              {
                json: { myNameIs: 'bar' },
                conditions: { foo: { value: 'baz', priority: 100 } },
                isPartial: true
              }
            ]
          }
        },
        children: {
          child1: {
            resources: {
              baz: {
                resourceTypeName: 'json',
                candidates: [
                  {
                    json: { myNameIs: 'baz' },
                    conditions: { foo: 'bar' }
                  }
                ]
              },
              qux: {
                resourceTypeName: 'json',
                candidates: [
                  {
                    json: { myNameIs: 'qux' },
                    conditions: { foo: { value: 'baz', priority: 100 } },
                    isPartial: true
                  }
                ]
              }
            }
          },
          child2: {
            resources: {
              quux: {
                resourceTypeName: 'json',
                candidates: [
                  {
                    json: { myNameIs: 'quux' },
                    conditions: { foo: 'bar' }
                  }
                ]
              },
              corge: {
                resourceTypeName: 'json',
                candidates: [
                  {
                    json: { myNameIs: 'corge' },
                    conditions: { foo: { value: 'baz', priority: 100 } },
                    isPartial: true
                  }
                ]
              }
            },
            children: {
              child3: {
                children: {
                  child4: {
                    resources: {
                      grault: {
                        resourceTypeName: 'json',
                        candidates: [
                          {
                            json: { myNameIs: 'grault' },
                            conditions: { foo: 'bar' }
                          }
                        ]
                      },
                      garply: {
                        resourceTypeName: 'json',
                        candidates: [
                          {
                            json: { myNameIs: 'garply' },
                            conditions: { foo: { value: 'baz', priority: 100 } },
                            isPartial: true
                          }
                        ]
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      expect(TsRes.ResourceJson.ResourceDeclTree.create(json)).toSucceedAndSatisfy((tree) => {
        expect(tree.getLooseResources()).toEqual([
          {
            id: 'base.foo',
            resourceTypeName: 'json',
            candidates: [
              {
                json: { myNameIs: 'foo' },
                conditions: [{ qualifierName: 'foo', value: 'bar' }]
              }
            ]
          },
          {
            id: 'base.bar',
            resourceTypeName: 'json',
            candidates: [
              {
                json: { myNameIs: 'bar' },
                conditions: [{ qualifierName: 'foo', value: 'baz', priority: 100 }],
                isPartial: true
              }
            ]
          },
          {
            id: 'base.child1.baz',
            resourceTypeName: 'json',
            candidates: [
              {
                json: { myNameIs: 'baz' },
                conditions: [{ qualifierName: 'foo', value: 'bar' }]
              }
            ]
          },
          {
            id: 'base.child1.qux',
            resourceTypeName: 'json',
            candidates: [
              {
                json: { myNameIs: 'qux' },
                conditions: [{ qualifierName: 'foo', value: 'baz', priority: 100 }],
                isPartial: true
              }
            ]
          },
          {
            id: 'base.child2.quux',
            resourceTypeName: 'json',
            candidates: [
              {
                json: { myNameIs: 'quux' },
                conditions: [{ qualifierName: 'foo', value: 'bar' }]
              }
            ]
          },
          {
            id: 'base.child2.corge',
            resourceTypeName: 'json',
            candidates: [
              {
                json: { myNameIs: 'corge' },
                conditions: [{ qualifierName: 'foo', value: 'baz', priority: 100 }],
                isPartial: true
              }
            ]
          },
          {
            id: 'base.child2.child3.child4.grault',
            resourceTypeName: 'json',
            candidates: [
              {
                json: { myNameIs: 'grault' },
                conditions: [{ qualifierName: 'foo', value: 'bar' }]
              }
            ]
          },
          {
            id: 'base.child2.child3.child4.garply',
            resourceTypeName: 'json',
            candidates: [
              {
                json: { myNameIs: 'garply' },
                conditions: [{ qualifierName: 'foo', value: 'baz', priority: 100 }],
                isPartial: true
              }
            ]
          }
        ]);
      });
    });

    test('fails if the tree is invalid', () => {
      expect(TsRes.ResourceJson.ResourceDeclTree.create({ bogus: 'property' })).toFailWith(
        /invalid resource tree/i
      );
    });
  });
});
