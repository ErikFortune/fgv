# CRITICAL: NO LEGACY COMPATIBILITY

## User Requirements (Stated Multiple Times)

**"stop with the backward compatibility. we do not need backward compatibility"**

**"backward compatibility adds complexity. it is unnecessary."**

**"we should not have fromLegacy at all. We should be upgrading our definitions. Compatibility layers add complexity. Compatibility is completely unnecessary here so we do not want the complexity."**

## Architecture Decision

- **NO `fromLegacy()` methods**
- **NO compatibility transformers**
- **NO legacy format support**
- **Port tests to new system directly**
- **Extend new system to support missing features (like Killer Sudoku)**

## Action Required

1. **Remove all `fromLegacy()` methods** from PuzzleDefinitionFactory
2. **Port killer sudoku tests** to use new IPuzzleDefinition format directly
3. **Extend new system** to handle killer sudoku cage definitions properly
4. **Update ALL tests** to use new PuzzleDefinitionFactory.create() with proper dimensions

## Do NOT Create:
- Legacy converters
- Backward compatibility layers
- Migration utilities
- Transformation functions

## DO Create:
- Direct killer sudoku support in new architecture
- Proper IPuzzleDefinition extensions for killer constraints
- Native cage definition support in new system