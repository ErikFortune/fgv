# Merge Plan: erik/alpha → erik/release

## Strategy
- Create child branches off `erik/release` for each logical chunk
- Create PRs from child branches to `erik/release`
- Watch PR #45 (erik/alpha → main) shrink as we merge chunks

## Phase 1: Non-Rush Collateral

### Chunk 1: Documentation & Agent Files
- **Branch**: `erik/release-docs`
- **Files**: 
  - `.agents/` directory (10 files) - Planning documents
  - `.claude/` directory (2 files) - Claude agent configs  
  - Root docs: `CLAUDE.md`
  - Remove: `bug_analysis_and_fix.md` (if temporary)
- **Size**: ~13 files
- **Dependencies**: None

### Chunk 2: Test Data
- **Branch**: `erik/release-test-data`
- **Files**: `data/test/` directory (56 files)
- **Size**: 56 files
- **Dependencies**: None (just test fixtures)

## Phase 2: Libraries (in dependency order)

### Chunk 3: Base Utilities
- **Branch**: `erik/release-ts-utils`
- **Package**: `ts-utils` (765 files)
- **Dependencies**: None

### Chunk 4: Utils Extensions
- **Branch**: `erik/release-utils-extras`
- **Packages**: 
  - `ts-utils-jest` (24 files)
  - `ts-extras` (77 files)
- **Dependencies**: ts-utils

### Chunk 5: JSON Base & Sudoku
- **Branch**: `erik/release-json-base`
- **Packages**:
  - `ts-json-base` (43 files)
  - `ts-sudoku-lib` (59 files)  
- **Dependencies**: ts-utils, ts-extras

### Chunk 6: JSON & BCP47
- **Branch**: `erik/release-json-bcp47`
- **Packages**:
  - `ts-json` (169 files)
  - `ts-bcp47` (127 files)
- **Dependencies**: ts-json-base, ts-utils, ts-extras

### Chunk 7: Resource System (may need sub-chunks)
- **Branch**: `erik/release-ts-res`
- **Package**: `ts-res` (2124 files!)
- **Dependencies**: ts-json, ts-bcp47, ts-json-base, ts-utils, ts-extras
- **Consider splitting**:
  - Core packlets
  - Import/export functionality  
  - Tests and documentation

### Chunk 8: UI Components
- **Branch**: `erik/release-ui-components`
- **Package**: `ts-res-ui-components` (692 files)
- **Dependencies**: ts-res, ts-json, ts-utils

### Chunk 9: CLI Tools
- **Branch**: `erik/release-cli-tools`
- **Packages**:
  - `ts-res-cli` (22 files)
  - `ts-res-browser-cli` (11 files)
- **Dependencies**: ts-res

### Chunk 10: Browser Tools
- **Branch**: `erik/release-browser-tools`
- **Packages**:
  - `ts-res-browser` (86 files)
  - `ts-res-ui-playground` (94 files)
- **Dependencies**: ts-res, ts-res-ui-components

## Phase 3: Rush Configuration (at the end)

### Chunk 11: Rush & Build Config
- **Branch**: `erik/release-rush-final`
- **Files**:
  - `rush.json`
  - `package.json`  
  - `.github/workflows/publish-alpha.yml`
  - `.vscode/settings.json`
  - `common/config/rush/` (3 files)
  - `common/changes/` (change files - handle conflicts)
- **Note**: Will need to:
  - Update Rush to latest version
  - Bump all package versions to 5.0.0
  - Resolve conflicts from incremental package additions

## Process for Each Chunk

1. Switch to `erik/release` branch
2. Create child branch (e.g., `erik/release-docs`)
3. Cherry-pick or copy specific files/directories from `erik/alpha`
4. For packages: ensure tests pass with `rush build` and `rush test`
5. Commit with descriptive message
6. Push branch and create PR to `erik/release`
7. Review and merge PR
8. Verify PR #45 shows reduction in files

## Notes

- Rush configuration must come last since it references all packages
- May need to handle merge conflicts in rush.json and package.json as we go
- Consider using `git checkout erik/alpha -- <path>` for whole directories
- For packages, might need to also bring their entries in rush.json temporarily