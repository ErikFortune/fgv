// Copyright (c) 2026 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import '@fgv/ts-utils-jest';
import { FileTree } from '@fgv/ts-json-base';

import { resolveImportRootForSubLibrary, SubLibraryId } from '../../../packlets/library-data';

describe('importResolver', () => {
  describe('resolveImportRootForSubLibrary', () => {
    describe('Case 1: canonical layout (data/<subLibraryId>)', () => {
      it('should resolve canonical library root with data/<subLibraryId> directory', () => {
        const files: FileTree.IInMemoryFile[] = [
          { path: '/data/ingredients/common.yaml', contents: 'test: value' }
        ];

        const tree = FileTree.inMemory(files).orThrow();
        const rootDir = tree.getItem('/').orThrow();
        if (rootDir.type !== 'directory') {
          throw new Error('Expected directory');
        }

        const result = resolveImportRootForSubLibrary(rootDir, 'ingredients' as SubLibraryId);
        expect(result).toSucceedAndSatisfy((resolved) => {
          expect(resolved.kind).toBe('canonical');
          expect(resolved.visited).toBe(1);
          expect(resolved.matches).toBe(1);

          // Verify the returned root works - can navigate to data/ingredients
          expect(resolved.root.getChildren()).toSucceedAndSatisfy((children) => {
            const dataDir = children.find((c) => c.type === 'directory' && c.name === 'data');
            expect(dataDir).toBeDefined();
          });
        });
      });

      it('should resolve canonical layout with multiple sub-libraries', () => {
        const files: FileTree.IInMemoryFile[] = [
          { path: '/data/ingredients/common.yaml', contents: 'test: value' },
          { path: '/data/fillings/common.yaml', contents: 'test: value' },
          { path: '/data/procedures/common.yaml', contents: 'test: value' }
        ];

        const tree = FileTree.inMemory(files).orThrow();
        const rootDir = tree.getItem('/').orThrow();
        if (rootDir.type !== 'directory') {
          throw new Error('Expected directory');
        }

        expect(resolveImportRootForSubLibrary(rootDir, 'fillings' as SubLibraryId)).toSucceedAndSatisfy(
          (resolved) => {
            expect(resolved.kind).toBe('canonical');
          }
        );
      });
    });

    describe('Case 2: data directory selected directly', () => {
      it('should resolve when data directory containing subLibrary is selected directly', () => {
        const files: FileTree.IInMemoryFile[] = [
          { path: '/data/ingredients/common.yaml', contents: 'test: value' }
        ];

        const tree = FileTree.inMemory(files).orThrow();
        const dataDir = tree.getItem('/data').orThrow();
        if (dataDir.type !== 'directory') {
          throw new Error('Expected directory');
        }

        const result = resolveImportRootForSubLibrary(dataDir, 'ingredients' as SubLibraryId);
        expect(result).toSucceedAndSatisfy((resolved) => {
          expect(resolved.kind).toBe('data-dir');
          expect(resolved.visited).toBe(1);
          expect(resolved.matches).toBe(1);

          // Verify the virtual root contains a 'data' directory that wraps our dataDir
          expect(resolved.root.getChildren()).toSucceedAndSatisfy((children) => {
            expect(children).toHaveLength(1);
            expect(children[0].name).toBe('data');
          });
        });
      });
    });

    describe('Case 3: direct sub-library directory', () => {
      it('should resolve when subLibrary directory is at root level', () => {
        const files: FileTree.IInMemoryFile[] = [
          { path: '/ingredients/common.yaml', contents: 'test: value' },
          { path: '/ingredients/extras.yaml', contents: 'more: data' }
        ];

        const tree = FileTree.inMemory(files).orThrow();
        const rootDir = tree.getItem('/').orThrow();
        if (rootDir.type !== 'directory') {
          throw new Error('Expected directory');
        }

        const result = resolveImportRootForSubLibrary(rootDir, 'ingredients' as SubLibraryId);
        expect(result).toSucceedAndSatisfy((resolved) => {
          expect(resolved.kind).toBe('direct-subdir');
          expect(resolved.visited).toBe(1);
          expect(resolved.matches).toBe(1);

          // Verify virtual directory structure: root -> data -> ingredients
          expect(resolved.root.getChildren()).toSucceedAndSatisfy((children) => {
            expect(children).toHaveLength(1);
            const dataDir = children[0];
            expect(dataDir.name).toBe('data');
            expect(dataDir.type).toBe('directory');

            if (dataDir.type === 'directory') {
              expect(dataDir.getChildren()).toSucceedAndSatisfy((dataChildren) => {
                expect(dataChildren).toHaveLength(1);
                expect(dataChildren[0].name).toBe('ingredients');
              });
            }
          });
        });
      });
    });

    describe('Case 4: loose collection files', () => {
      it('should resolve loose .yaml files at root', () => {
        const files: FileTree.IInMemoryFile[] = [
          { path: '/common.yaml', contents: 'test: value' },
          { path: '/extras.yaml', contents: 'more: data' }
        ];

        const tree = FileTree.inMemory(files).orThrow();
        const rootDir = tree.getItem('/').orThrow();
        if (rootDir.type !== 'directory') {
          throw new Error('Expected directory');
        }

        const result = resolveImportRootForSubLibrary(rootDir, 'ingredients' as SubLibraryId);
        expect(result).toSucceedAndSatisfy((resolved) => {
          expect(resolved.kind).toBe('loose-files');
          expect(resolved.visited).toBe(1);
          expect(resolved.matches).toBe(1);

          // Verify virtual directory structure: root -> data -> subLibraryId -> files
          expect(resolved.root.getChildren()).toSucceedAndSatisfy((children) => {
            expect(children).toHaveLength(1);
            const dataDir = children[0];
            expect(dataDir.name).toBe('data');
            expect(dataDir.type).toBe('directory');

            if (dataDir.type === 'directory') {
              expect(dataDir.getChildren()).toSucceedAndSatisfy((dataChildren) => {
                expect(dataChildren).toHaveLength(1);
                expect(dataChildren[0].name).toBe('ingredients');
                if (dataChildren[0].type === 'directory') {
                  expect(dataChildren[0].getChildren()).toSucceedAndSatisfy((ingredientFiles) => {
                    expect(ingredientFiles).toHaveLength(2);
                    expect(ingredientFiles.map((f) => f.name).sort()).toEqual(['common.yaml', 'extras.yaml']);
                  });
                }
              });
            }
          });
        });
      });

      it('should resolve loose .json files at root', () => {
        const files: FileTree.IInMemoryFile[] = [{ path: '/data.json', contents: '{"test": "value"}' }];

        const tree = FileTree.inMemory(files).orThrow();
        const rootDir = tree.getItem('/').orThrow();
        if (rootDir.type !== 'directory') {
          throw new Error('Expected directory');
        }

        const result = resolveImportRootForSubLibrary(rootDir, 'fillings' as SubLibraryId);
        expect(result).toSucceedAndSatisfy((resolved) => {
          expect(resolved.kind).toBe('loose-files');
        });
      });

      it('should resolve loose .yml files at root', () => {
        const files: FileTree.IInMemoryFile[] = [{ path: '/data.yml', contents: 'test: value' }];

        const tree = FileTree.inMemory(files).orThrow();
        const rootDir = tree.getItem('/').orThrow();
        if (rootDir.type !== 'directory') {
          throw new Error('Expected directory');
        }

        const result = resolveImportRootForSubLibrary(rootDir, 'procedures' as SubLibraryId);
        expect(result).toSucceedAndSatisfy((resolved) => {
          expect(resolved.kind).toBe('loose-files');
        });
      });

      it('should not match loose files when allowLooseFiles is false', () => {
        const files: FileTree.IInMemoryFile[] = [{ path: '/common.yaml', contents: 'test: value' }];

        const tree = FileTree.inMemory(files).orThrow();
        const rootDir = tree.getItem('/').orThrow();
        if (rootDir.type !== 'directory') {
          throw new Error('Expected directory');
        }

        const result = resolveImportRootForSubLibrary(rootDir, 'ingredients' as SubLibraryId, {
          allowLooseFiles: false
        });
        expect(result).toFailWith(/Unable to resolve import root/i);
      });

      it('should not match non-collection files as loose files', () => {
        const files: FileTree.IInMemoryFile[] = [
          { path: '/readme.txt', contents: 'readme' },
          { path: '/notes.md', contents: '# Notes' }
        ];

        const tree = FileTree.inMemory(files).orThrow();
        const rootDir = tree.getItem('/').orThrow();
        if (rootDir.type !== 'directory') {
          throw new Error('Expected directory');
        }

        const result = resolveImportRootForSubLibrary(rootDir, 'ingredients' as SubLibraryId);
        expect(result).toFailWith(/Unable to resolve import root/i);
      });
    });

    describe('resolution priority', () => {
      it('should prefer canonical layout over other layouts', () => {
        // Has both canonical data/ingredients AND loose files
        const files: FileTree.IInMemoryFile[] = [
          { path: '/data/ingredients/common.yaml', contents: 'canonical: true' },
          { path: '/loose.yaml', contents: 'loose: true' }
        ];

        const tree = FileTree.inMemory(files).orThrow();
        const rootDir = tree.getItem('/').orThrow();
        if (rootDir.type !== 'directory') {
          throw new Error('Expected directory');
        }

        const result = resolveImportRootForSubLibrary(rootDir, 'ingredients' as SubLibraryId);
        expect(result).toSucceedAndSatisfy((resolved) => {
          expect(resolved.kind).toBe('canonical');
        });
      });

      it('should prefer data-dir layout when directory is named data', () => {
        const files: FileTree.IInMemoryFile[] = [
          { path: '/data/ingredients/common.yaml', contents: 'test: value' }
        ];

        const tree = FileTree.inMemory(files).orThrow();
        // Navigate to the data directory
        const dataDir = tree.getItem('/data').orThrow();
        if (dataDir.type !== 'directory') {
          throw new Error('Expected directory');
        }

        const result = resolveImportRootForSubLibrary(dataDir, 'ingredients' as SubLibraryId);
        expect(result).toSucceedAndSatisfy((resolved) => {
          // Should detect we're at the data dir itself
          expect(resolved.kind).toBe('data-dir');
        });
      });
    });

    describe('BFS traversal', () => {
      it('should search nested directories up to maxDepth', () => {
        const files: FileTree.IInMemoryFile[] = [
          { path: '/level1/level2/data/ingredients/common.yaml', contents: 'test: value' }
        ];

        const tree = FileTree.inMemory(files).orThrow();
        const rootDir = tree.getItem('/').orThrow();
        if (rootDir.type !== 'directory') {
          throw new Error('Expected directory');
        }

        // Default maxDepth is 2, so depth 2 should be reachable
        const result = resolveImportRootForSubLibrary(rootDir, 'ingredients' as SubLibraryId);
        expect(result).toSucceedAndSatisfy((resolved) => {
          expect(resolved.kind).toBe('canonical');
          expect(resolved.visited).toBeGreaterThan(1);
        });
      });

      it('should not find matches beyond maxDepth', () => {
        const files: FileTree.IInMemoryFile[] = [
          { path: '/level1/level2/level3/data/ingredients/common.yaml', contents: 'test: value' }
        ];

        const tree = FileTree.inMemory(files).orThrow();
        const rootDir = tree.getItem('/').orThrow();
        if (rootDir.type !== 'directory') {
          throw new Error('Expected directory');
        }

        // With maxDepth 1, should not reach level3
        const result = resolveImportRootForSubLibrary(rootDir, 'ingredients' as SubLibraryId, {
          maxDepth: 1
        });
        expect(result).toFailWith(/Unable to resolve import root/i);
      });

      it('should respect visitLimit option', () => {
        // Create many directories to test visit limiting
        const files: FileTree.IInMemoryFile[] = [
          { path: '/dir1/empty.txt', contents: '' },
          { path: '/dir2/empty.txt', contents: '' },
          { path: '/dir3/empty.txt', contents: '' },
          { path: '/dir4/data/ingredients/common.yaml', contents: 'test: value' }
        ];

        const tree = FileTree.inMemory(files).orThrow();
        const rootDir = tree.getItem('/').orThrow();
        if (rootDir.type !== 'directory') {
          throw new Error('Expected directory');
        }

        // With visitLimit of 2, should not find the match in dir4
        const result = resolveImportRootForSubLibrary(rootDir, 'ingredients' as SubLibraryId, {
          visitLimit: 2
        });
        expect(result).toFailWith(/Unable to resolve import root/i);
      });

      it('should respect matchLimit and count matches correctly', () => {
        // Create multiple matching directories
        const files: FileTree.IInMemoryFile[] = [
          { path: '/match1/data/ingredients/common.yaml', contents: 'first: match' },
          { path: '/match2/data/ingredients/common.yaml', contents: 'second: match' },
          { path: '/match3/data/ingredients/common.yaml', contents: 'third: match' }
        ];

        const tree = FileTree.inMemory(files).orThrow();
        const rootDir = tree.getItem('/').orThrow();
        if (rootDir.type !== 'directory') {
          throw new Error('Expected directory');
        }

        const result = resolveImportRootForSubLibrary(rootDir, 'ingredients' as SubLibraryId, {
          matchLimit: 10
        });
        expect(result).toSucceedAndSatisfy((resolved) => {
          expect(resolved.matches).toBeGreaterThanOrEqual(1);
        });
      });
    });

    describe('error cases', () => {
      it('should fail when no matching sub-library is found', () => {
        const files: FileTree.IInMemoryFile[] = [
          { path: '/data/fillings/common.yaml', contents: 'test: value' }
        ];

        const tree = FileTree.inMemory(files).orThrow();
        const rootDir = tree.getItem('/').orThrow();
        if (rootDir.type !== 'directory') {
          throw new Error('Expected directory');
        }

        // Disable loose files so that the fillings yaml is not matched for ingredients
        const result = resolveImportRootForSubLibrary(rootDir, 'ingredients' as SubLibraryId, {
          allowLooseFiles: false
        });
        expect(result).toFailWith(/Unable to resolve import root.*ingredients/i);
      });

      it('should fail for empty directory', () => {
        // Create a minimal tree with just a directory
        const files: FileTree.IInMemoryFile[] = [{ path: '/placeholder.txt', contents: '' }];

        const tree = FileTree.inMemory(files).orThrow();
        const rootDir = tree.getItem('/').orThrow();
        if (rootDir.type !== 'directory') {
          throw new Error('Expected directory');
        }

        const result = resolveImportRootForSubLibrary(rootDir, 'ingredients' as SubLibraryId, {
          allowLooseFiles: false
        });
        expect(result).toFailWith(/Unable to resolve import root/i);
      });

      it('should include sub-library id in error message', () => {
        const files: FileTree.IInMemoryFile[] = [{ path: '/empty.txt', contents: '' }];

        const tree = FileTree.inMemory(files).orThrow();
        const rootDir = tree.getItem('/').orThrow();
        if (rootDir.type !== 'directory') {
          throw new Error('Expected directory');
        }

        const result = resolveImportRootForSubLibrary(rootDir, 'confections' as SubLibraryId, {
          allowLooseFiles: false
        });
        expect(result).toFailWith(/confections/i);
      });
    });

    describe('VirtualDirectoryItem behavior', () => {
      it('should create navigable virtual directories for data-dir case', () => {
        const files: FileTree.IInMemoryFile[] = [{ path: '/data/molds/common.yaml', contents: 'mold: data' }];

        const tree = FileTree.inMemory(files).orThrow();
        const dataDir = tree.getItem('/data').orThrow();
        if (dataDir.type !== 'directory') {
          throw new Error('Expected directory');
        }

        const result = resolveImportRootForSubLibrary(dataDir, 'molds' as SubLibraryId);
        expect(result).toSucceedAndSatisfy((resolved) => {
          expect(resolved.kind).toBe('data-dir');

          // Navigate through virtual structure
          expect(resolved.root.type).toBe('directory');
          expect(resolved.root.name).toBe('');
          expect(resolved.root.absolutePath).toBe('/');

          expect(resolved.root.getChildren()).toSucceedAndSatisfy((children) => {
            expect(children).toHaveLength(1);
            const data = children[0];
            expect(data.name).toBe('data');
            expect(data.type).toBe('directory');
          });
        });
      });

      it('should create navigable virtual directories for direct-subdir case', () => {
        const files: FileTree.IInMemoryFile[] = [{ path: '/procedures/common.yaml', contents: 'proc: data' }];

        const tree = FileTree.inMemory(files).orThrow();
        const rootDir = tree.getItem('/').orThrow();
        if (rootDir.type !== 'directory') {
          throw new Error('Expected directory');
        }

        const result = resolveImportRootForSubLibrary(rootDir, 'procedures' as SubLibraryId);
        expect(result).toSucceedAndSatisfy((resolved) => {
          expect(resolved.kind).toBe('direct-subdir');

          // Navigate: root -> data -> procedures
          expect(resolved.root.getChildren()).toSucceedAndSatisfy((children) => {
            const dataDir = children.find((c) => c.name === 'data');
            expect(dataDir).toBeDefined();
            expect(dataDir?.type).toBe('directory');

            if (dataDir?.type === 'directory') {
              expect(dataDir.getChildren()).toSucceedAndSatisfy((dataChildren) => {
                const procDir = dataChildren.find((c) => c.name === 'procedures');
                expect(procDir).toBeDefined();
                expect(procDir?.type).toBe('directory');
              });
            }
          });
        });
      });

      it('should create navigable virtual directories for loose-files case', () => {
        const files: FileTree.IInMemoryFile[] = [
          { path: '/task1.yaml', contents: 'task: 1' },
          { path: '/task2.json', contents: '{"task": 2}' }
        ];

        const tree = FileTree.inMemory(files).orThrow();
        const rootDir = tree.getItem('/').orThrow();
        if (rootDir.type !== 'directory') {
          throw new Error('Expected directory');
        }

        const result = resolveImportRootForSubLibrary(rootDir, 'tasks' as SubLibraryId);
        expect(result).toSucceedAndSatisfy((resolved) => {
          expect(resolved.kind).toBe('loose-files');

          // Navigate: root -> data -> tasks -> [files]
          expect(resolved.root.getChildren()).toSucceedAndSatisfy((children) => {
            const dataDir = children.find((c) => c.name === 'data');
            expect(dataDir?.type).toBe('directory');

            if (dataDir?.type === 'directory') {
              expect(dataDir.getChildren()).toSucceedAndSatisfy((dataChildren) => {
                const tasksDir = dataChildren.find((c) => c.name === 'tasks');
                expect(tasksDir?.type).toBe('directory');

                if (tasksDir?.type === 'directory') {
                  expect(tasksDir.getChildren()).toSucceedAndSatisfy((taskFiles) => {
                    expect(taskFiles).toHaveLength(2);
                    const fileNames = taskFiles.map((f) => f.name).sort();
                    expect(fileNames).toEqual(['task1.yaml', 'task2.json']);
                  });
                }
              });
            }
          });
        });
      });
    });

    describe('options handling', () => {
      it('should use default options when none provided', () => {
        const files: FileTree.IInMemoryFile[] = [
          { path: '/data/ingredients/common.yaml', contents: 'test: value' }
        ];

        const tree = FileTree.inMemory(files).orThrow();
        const rootDir = tree.getItem('/').orThrow();
        if (rootDir.type !== 'directory') {
          throw new Error('Expected directory');
        }

        // No options provided - should use defaults
        const result = resolveImportRootForSubLibrary(rootDir, 'ingredients' as SubLibraryId);
        expect(result).toSucceed();
      });

      it('should merge partial options with defaults', () => {
        const files: FileTree.IInMemoryFile[] = [
          { path: '/level1/data/ingredients/common.yaml', contents: 'test: value' }
        ];

        const tree = FileTree.inMemory(files).orThrow();
        const rootDir = tree.getItem('/').orThrow();
        if (rootDir.type !== 'directory') {
          throw new Error('Expected directory');
        }

        // Only specify maxDepth, other options should use defaults
        const result = resolveImportRootForSubLibrary(rootDir, 'ingredients' as SubLibraryId, {
          maxDepth: 3
        });
        expect(result).toSucceed();
      });
    });
  });
});
