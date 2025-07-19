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

describe('Name Inheritance in Resource Collections', () => {
  describe('mergeImporterResource', () => {
    describe('with base name and no resource ID', () => {
      test('inherits full ID from base name', () => {
        const resource: TsRes.ResourceJson.Normalized.IChildResourceDecl = {
          resourceTypeName: 'text',
          candidates: [
            {
              json: { message: 'Hello World' }
            }
          ]
        };

        expect(
          TsRes.ResourceJson.Helpers.mergeImporterResource(resource, 'pages.home.greeting')
        ).toSucceedAndSatisfy((merged) => {
          expect('id' in merged && merged.id).toBe('pages.home.greeting');
          expect(merged.candidates).toHaveLength(1);
          expect(merged.candidates![0].json).toEqual({ message: 'Hello World' });
        });
      });

      test('inherits ID and merges base conditions', () => {
        const resource: TsRes.ResourceJson.Normalized.IChildResourceDecl = {
          resourceTypeName: 'text',
          candidates: [
            {
              json: { message: 'Hello' },
              conditions: [{ qualifierName: 'language', value: 'en' }]
            }
          ]
        };

        const baseConditions = [{ qualifierName: 'territory', value: 'US' }];

        expect(
          TsRes.ResourceJson.Helpers.mergeImporterResource(resource, 'pages.greeting', baseConditions)
        ).toSucceedAndSatisfy((merged) => {
          expect('id' in merged && merged.id).toBe('pages.greeting');
          expect(merged.candidates).toHaveLength(1);
          expect(merged.candidates![0].conditions).toHaveLength(2);
          expect(merged.candidates![0].conditions).toEqual([
            { qualifierName: 'territory', value: 'US' },
            { qualifierName: 'language', value: 'en' }
          ]);
        });
      });
    });

    describe('with base name and existing resource ID', () => {
      test('joins base name with resource ID', () => {
        const resource: TsRes.ResourceJson.Normalized.ILooseResourceDecl = {
          id: 'welcome',
          resourceTypeName: 'text',
          candidates: [
            {
              json: { message: 'Welcome!' }
            }
          ]
        };

        expect(TsRes.ResourceJson.Helpers.mergeImporterResource(resource, 'pages.home')).toSucceedAndSatisfy(
          (merged) => {
            expect('id' in merged && merged.id).toBe('pages.home.welcome');
            expect(merged.candidates).toHaveLength(1);
          }
        );
      });

      test('handles hierarchical joining correctly', () => {
        const resource: TsRes.ResourceJson.Normalized.ILooseResourceDecl = {
          id: 'title.main',
          resourceTypeName: 'text',
          candidates: [
            {
              json: { title: 'Main Title' }
            }
          ]
        };

        expect(TsRes.ResourceJson.Helpers.mergeImporterResource(resource, 'pages.about')).toSucceedAndSatisfy(
          (merged) => {
            expect('id' in merged && merged.id).toBe('pages.about.title.main');
          }
        );
      });
    });

    describe('without base name', () => {
      test('preserves existing resource ID', () => {
        const resource: TsRes.ResourceJson.Normalized.ILooseResourceDecl = {
          id: 'standalone.resource',
          resourceTypeName: 'text',
          candidates: [
            {
              json: { content: 'Standalone Content' }
            }
          ]
        };

        expect(TsRes.ResourceJson.Helpers.mergeImporterResource(resource, undefined)).toSucceedAndSatisfy(
          (merged) => {
            expect('id' in merged && merged.id).toBe('standalone.resource');
          }
        );
      });

      test('returns child resource without ID for child resources without base name', () => {
        const resource: TsRes.ResourceJson.Normalized.IChildResourceDecl = {
          resourceTypeName: 'text',
          candidates: [
            {
              json: { content: 'Child Content' }
            }
          ]
        };

        expect(TsRes.ResourceJson.Helpers.mergeImporterResource(resource, undefined)).toSucceedAndSatisfy(
          (merged) => {
            expect('id' in merged).toBe(false);
            expect(merged.candidates).toHaveLength(1);
          }
        );
      });
    });

    describe('edge cases', () => {
      test('handles empty resource ID correctly', () => {
        const resource: TsRes.ResourceJson.Normalized.ILooseResourceDecl = {
          id: '',
          resourceTypeName: 'text',
          candidates: []
        };

        expect(TsRes.ResourceJson.Helpers.mergeImporterResource(resource, 'pages.test')).toSucceedAndSatisfy(
          (merged) => {
            expect('id' in merged && merged.id).toBe('pages.test');
          }
        );
      });

      test('handles resources with no candidates', () => {
        const resource: TsRes.ResourceJson.Normalized.IChildResourceDecl = {
          resourceTypeName: 'text',
          candidates: []
        };

        expect(
          TsRes.ResourceJson.Helpers.mergeImporterResource(resource, 'empty.resource')
        ).toSucceedAndSatisfy((merged) => {
          expect('id' in merged && merged.id).toBe('empty.resource');
          expect(merged.candidates).toHaveLength(0);
        });
      });
    });
  });

  describe('mergeImporterCandidate', () => {
    test('inherits ID from base name when candidate has no ID', () => {
      const candidate: TsRes.ResourceJson.Normalized.IChildResourceCandidateDecl = {
        json: { message: 'Hello World' }
      };

      expect(
        TsRes.ResourceJson.Helpers.mergeImporterCandidate(candidate, 'pages.home.greeting')
      ).toSucceedAndSatisfy((merged) => {
        expect('id' in merged && merged.id).toBe('pages.home.greeting');
        expect(merged.json).toEqual({ message: 'Hello World' });
      });
    });

    test('joins base name with existing candidate ID', () => {
      const candidate: TsRes.ResourceJson.Normalized.ILooseResourceCandidateDecl = {
        id: 'variant.formal',
        json: { greeting: 'Good day' }
      };

      expect(TsRes.ResourceJson.Helpers.mergeImporterCandidate(candidate, 'greetings')).toSucceedAndSatisfy(
        (merged) => {
          expect('id' in merged && merged.id).toBe('greetings.variant.formal');
          expect(merged.json).toEqual({ greeting: 'Good day' });
        }
      );
    });

    test('merges base conditions with candidate conditions', () => {
      const candidate: TsRes.ResourceJson.Normalized.IChildResourceCandidateDecl = {
        json: { message: 'Hello' },
        conditions: [{ qualifierName: 'language', value: 'en' }]
      };

      const baseConditions = [
        { qualifierName: 'territory', value: 'US' },
        { qualifierName: 'timeOfDay', value: 'morning' }
      ];

      expect(
        TsRes.ResourceJson.Helpers.mergeImporterCandidate(candidate, 'greetings.hello', baseConditions)
      ).toSucceedAndSatisfy((merged) => {
        expect('id' in merged && merged.id).toBe('greetings.hello');
        expect(merged.conditions).toHaveLength(3);
        expect(merged.conditions).toEqual([
          { qualifierName: 'territory', value: 'US' },
          { qualifierName: 'timeOfDay', value: 'morning' },
          { qualifierName: 'language', value: 'en' }
        ]);
      });
    });

    test('handles empty candidate ID correctly', () => {
      const candidate: TsRes.ResourceJson.Normalized.ILooseResourceCandidateDecl = {
        id: '',
        json: { content: 'Empty ID Candidate' }
      };

      expect(TsRes.ResourceJson.Helpers.mergeImporterCandidate(candidate, 'base.name')).toSucceedAndSatisfy(
        (merged) => {
          expect('id' in merged && merged.id).toBe('base.name');
          expect(merged.json).toEqual({ content: 'Empty ID Candidate' });
        }
      );
    });

    describe('error cases', () => {
      test('fails when child candidate has no ID and no base name', () => {
        const candidate: TsRes.ResourceJson.Normalized.IChildResourceCandidateDecl = {
          json: { content: 'No ID candidate' }
        };

        expect(TsRes.ResourceJson.Helpers.mergeLooseCandidate(candidate, undefined)).toFailWith(
          /id is required in mergeLooseCandidate/i
        );
      });
    });
  });

  describe('mergeLooseResource', () => {
    describe('error cases', () => {
      test('fails when child resource has no ID and no base name', () => {
        const resource: TsRes.ResourceJson.Normalized.IChildResourceDecl = {
          resourceTypeName: 'text',
          candidates: [
            {
              json: { content: 'No ID resource' }
            }
          ]
        };

        expect(TsRes.ResourceJson.Helpers.mergeLooseResource(resource, undefined)).toFailWith(
          /id is required in mergeLooseResource/i
        );
      });
    });
  });

  describe('Integration with ResourceDeclCollection', () => {
    test('creates collection with name inheritance from context', () => {
      const collectionJson = {
        context: {
          baseId: 'pages.home'
        },
        resources: [
          {
            resourceTypeName: 'text',
            candidates: [
              {
                json: { welcome: 'Welcome to our homepage!' }
              }
            ]
          }
        ]
      };

      expect(TsRes.ResourceJson.ResourceDeclCollection.create(collectionJson)).toSucceedAndSatisfy(
        (collection) => {
          const resources = collection.getImporterResources();
          expect(resources).toHaveLength(1);
          expect(TsRes.ResourceJson.Json.isLooseResourceDecl(resources[0]) && resources[0].id).toBe(
            'pages.home'
          );
          expect(resources[0].candidates).toHaveLength(1);
          expect(resources[0].candidates![0].json).toEqual({ welcome: 'Welcome to our homepage!' });
        }
      );
    });

    test('handles mixed resources with and without explicit IDs', () => {
      const collectionJson = {
        context: {
          baseId: 'components.nav'
        },
        resources: [
          {
            // Resource without ID - inherits from context
            resourceTypeName: 'component',
            candidates: [
              {
                json: { type: 'Navigation Component' }
              }
            ]
          },
          {
            id: 'links',
            resourceTypeName: 'list',
            candidates: [
              {
                json: { items: 'Navigation Links' }
              }
            ]
          }
        ]
      };

      expect(TsRes.ResourceJson.ResourceDeclCollection.create(collectionJson)).toSucceedAndSatisfy(
        (collection) => {
          const resources = collection.getImporterResources();
          expect(resources).toHaveLength(2);

          // First resource inherits full context ID
          expect(TsRes.ResourceJson.Json.isLooseResourceDecl(resources[0]) && resources[0].id).toBe(
            'components.nav'
          );
          expect(resources[0].candidates![0].json).toEqual({ type: 'Navigation Component' });

          // Second resource gets context + explicit ID
          expect(TsRes.ResourceJson.Json.isLooseResourceDecl(resources[1]) && resources[1].id).toBe(
            'components.nav.links'
          );
          expect(resources[1].candidates![0].json).toEqual({ items: 'Navigation Links' });
        }
      );
    });

    test('handles nested collections with name inheritance', () => {
      const collectionJson = {
        context: {
          baseId: 'pages'
        },
        collections: [
          {
            context: {
              baseId: 'home'
            },
            resources: [
              {
                resourceTypeName: 'page',
                candidates: [
                  {
                    json: { content: 'Home Page Content' }
                  }
                ]
              }
            ]
          }
        ]
      };

      expect(TsRes.ResourceJson.ResourceDeclCollection.create(collectionJson)).toSucceedAndSatisfy(
        (collection) => {
          const resources = collection.getImporterResources();
          expect(resources).toHaveLength(1);
          expect(TsRes.ResourceJson.Json.isLooseResourceDecl(resources[0]) && resources[0].id).toBe(
            'pages.home'
          );
          expect(resources[0].candidates![0].json).toEqual({ content: 'Home Page Content' });
        }
      );
    });

    test('handles candidates with name inheritance', () => {
      const collectionJson = {
        context: {
          baseId: 'shared.messages'
        },
        candidates: [
          {
            json: { message: 'Shared message content' }
          }
        ]
      };

      expect(TsRes.ResourceJson.ResourceDeclCollection.create(collectionJson)).toSucceedAndSatisfy(
        (collection) => {
          const candidates = collection.getImporterCandidates();
          expect(candidates).toHaveLength(1);
          expect(
            TsRes.ResourceJson.Json.isLooseResourceCandidateDecl(candidates[0]) && candidates[0].id
          ).toBe('shared.messages');
          expect(candidates[0].json).toEqual({ message: 'Shared message content' });
        }
      );
    });
  });

  describe('Name inheritance with different merge methods', () => {
    test('augment merge method joins context names', () => {
      const collectionJson = {
        context: {
          baseId: 'components',
          mergeMethod: 'augment'
        },
        collections: [
          {
            context: {
              baseId: 'buttons'
            },
            resources: [
              {
                resourceTypeName: 'component',
                candidates: [
                  {
                    json: { type: 'Button Component' }
                  }
                ]
              }
            ]
          }
        ]
      };

      expect(TsRes.ResourceJson.ResourceDeclCollection.create(collectionJson)).toSucceedAndSatisfy(
        (collection) => {
          const resources = collection.getImporterResources();
          expect(resources).toHaveLength(1);
          expect(TsRes.ResourceJson.Json.isLooseResourceDecl(resources[0]) && resources[0].id).toBe(
            'components.buttons'
          );
        }
      );
    });

    test('replace merge method uses only child context', () => {
      const collectionJson = {
        context: {
          baseId: 'pages'
        },
        collections: [
          {
            context: {
              baseId: 'standalone',
              mergeMethod: 'replace'
            },
            resources: [
              {
                resourceTypeName: 'page',
                candidates: [
                  {
                    json: { content: 'Standalone Content' }
                  }
                ]
              }
            ]
          }
        ]
      };

      expect(TsRes.ResourceJson.ResourceDeclCollection.create(collectionJson)).toSucceedAndSatisfy(
        (collection) => {
          const resources = collection.getImporterResources();
          expect(resources).toHaveLength(1);
          expect(TsRes.ResourceJson.Json.isLooseResourceDecl(resources[0]) && resources[0].id).toBe(
            'standalone'
          );
        }
      );
    });
  });
});
