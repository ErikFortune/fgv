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

describe('ResourceManagerBuilder.getBuiltResourceTree method', () => {
  let qualifierTypes: TsRes.QualifierTypes.QualifierTypeCollector;
  let qualifiers: TsRes.Qualifiers.QualifierCollector;
  let resourceTypes: TsRes.ResourceTypes.ResourceTypeCollector;

  beforeAll(() => {
    qualifierTypes = TsRes.QualifierTypes.QualifierTypeCollector.create({
      qualifierTypes: [
        TsRes.QualifierTypes.LanguageQualifierType.create().orThrow(),
        TsRes.QualifierTypes.TerritoryQualifierType.create().orThrow()
      ]
    }).orThrow();

    const qualifierDecls: TsRes.Qualifiers.IQualifierDecl[] = [
      {
        name: 'language',
        typeName: 'language',
        defaultPriority: 100
      },
      {
        name: 'homeTerritory',
        typeName: 'territory',
        defaultPriority: 200
      }
    ];

    qualifiers = TsRes.Qualifiers.QualifierCollector.create({
      qualifierTypes,
      qualifiers: qualifierDecls
    }).orThrow();

    resourceTypes = TsRes.ResourceTypes.ResourceTypeCollector.create({
      resourceTypes: [
        TsRes.ResourceTypes.JsonResourceType.create().orThrow(),
        TsRes.ResourceTypes.JsonResourceType.create({ key: 'other' }).orThrow()
      ]
    }).orThrow();
  });

  test('should create resource tree from hierarchical resources and cache result', () => {
    const builder = TsRes.Resources.ResourceManagerBuilder.create({
      qualifiers,
      resourceTypes
    }).orThrow();

    // Add hierarchical resources (only ones that don't conflict)
    builder
      .addLooseCandidate({
        id: 'app.messages.welcome',
        resourceTypeName: 'json',
        json: { text: 'Welcome!' },
        conditions: {}
      })
      .orThrow();

    builder
      .addLooseCandidate({
        id: 'app.settings.theme',
        resourceTypeName: 'json',
        json: { theme: 'dark' },
        conditions: {}
      })
      .orThrow();

    // Test tree creation and structure
    expect(builder.getBuiltResourceTree()).toSucceedAndSatisfy((tree) => {
      // Verify tree structure has 'app' at root level as a branch
      expect(tree.children.validating.getById('app')).toSucceedAndSatisfy((appBranch) => {
        expect(appBranch.isBranch).toBe(true);
        if (appBranch.isBranch) {
          // Verify 'messages' branch under 'app'
          expect(appBranch.children.validating.getById('messages')).toSucceedAndSatisfy((messagesBranch) => {
            expect(messagesBranch.isBranch).toBe(true);
            if (messagesBranch.isBranch) {
              // Verify 'welcome' leaf under 'messages'
              expect(messagesBranch.children.validating.getById('welcome')).toSucceedAndSatisfy(
                (welcomeLeaf) => {
                  expect(welcomeLeaf.isLeaf).toBe(true);
                  if (welcomeLeaf.isLeaf) {
                    expect(welcomeLeaf.resource.id).toBe('app.messages.welcome');
                  }
                }
              );
            }
          });

          // Verify 'settings' branch under 'app'
          expect(appBranch.children.validating.getById('settings')).toSucceedAndSatisfy((settingsBranch) => {
            expect(settingsBranch.isBranch).toBe(true);
            if (settingsBranch.isBranch) {
              // Verify 'theme' leaf under 'settings'
              expect(settingsBranch.children.validating.getById('theme')).toSucceedAndSatisfy((themeLeaf) => {
                expect(themeLeaf.isLeaf).toBe(true);
                if (themeLeaf.isLeaf) {
                  expect(themeLeaf.resource.id).toBe('app.settings.theme');
                }
              });
            }
          });
        }
      });
    });

    // Test caching - second call should return same tree instance
    const firstCall = builder.getBuiltResourceTree().orThrow();
    const secondCall = builder.getBuiltResourceTree().orThrow();
    expect(firstCall).toBe(secondCall); // Same instance due to caching
  });

  test('should handle empty resource collection', () => {
    const builder = TsRes.Resources.ResourceManagerBuilder.create({
      qualifiers,
      resourceTypes
    }).orThrow();

    expect(builder.getBuiltResourceTree()).toSucceedAndSatisfy((tree) => {
      // Empty tree should still be valid but have no children
      expect(tree.children.size).toBe(0);
    });
  });

  test('should handle single-level resource IDs (no hierarchy)', () => {
    const builder = TsRes.Resources.ResourceManagerBuilder.create({
      qualifiers,
      resourceTypes
    }).orThrow();

    const flatDecl = {
      id: 'welcome',
      resourceTypeName: 'json',
      json: { text: 'Hello' },
      conditions: {}
    };

    builder.addLooseCandidate(flatDecl).orThrow();

    expect(builder.getBuiltResourceTree()).toSucceedAndSatisfy((tree) => {
      // Should have single resource at root level
      expect(tree.children.validating.getById('welcome')).toSucceedAndSatisfy((welcomeNode) => {
        expect(welcomeNode.isLeaf).toBe(true);
        if (welcomeNode.isLeaf) {
          expect(welcomeNode.resource.id).toBe('welcome');
        }
      });
    });
  });

  test('should fail when adding resource with invalid qualifier', () => {
    const builder = TsRes.Resources.ResourceManagerBuilder.create({
      qualifiers,
      resourceTypes
    }).orThrow();

    // Add a resource with invalid conditions to cause failure
    const invalidDecl = {
      id: 'invalid',
      resourceTypeName: 'json',
      json: { text: 'Hello' },
      conditions: {
        nonexistent: 'test' // This qualifier doesn't exist
      }
    };

    // This should fail because the qualifier doesn't exist
    expect(builder.addLooseCandidate(invalidDecl)).toFail();
  });
});
