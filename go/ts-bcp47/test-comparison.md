# BCP-47 TypeScript vs Go Behavior Comparison

## Test Cases for Parity Verification

Based on TypeScript implementation analysis, here are the expected behaviors:

### Well-Formed Parsing (Should Accept)
| Input | TypeScript | Go Status | Notes |
|-------|------------|-----------|-------|
| `"en"` | ✅ Well-formed | ✅ Working | Basic 2-letter language |
| `"eng"` | ✅ Well-formed | ✅ Working | 3-letter language (not in IANA) |
| `"en-US"` | ✅ Well-formed | ✅ Working | Standard language-region |
| `"en-U"` | ✅ Well-formed | ❌ Failing | 1-letter region |
| `"en-USA"` | ✅ Well-formed | ❌ Failing | 3-letter non-numeric region |
| `"zh-Hans-CN"` | ✅ Well-formed | ✅ Working | Language-script-region |
| `"en-1234"` | ✅ Well-formed | ✅ Working | 4-digit variant |
| `"en-x-test"` | ✅ Well-formed | ✅ Working | Private use |

### Should Reject (Malformed)
| Input | TypeScript | Go Status | Notes |
|-------|------------|-----------|-------|
| `""` | ❌ Invalid | ✅ Working | Empty string |
| `"e"` | ❌ Invalid | ✅ Working | Too short |
| `"en-"` | ❌ Invalid | ✅ Working | Trailing dash |
| `"en--US"` | ❌ Invalid | ✅ Working | Double dash |
| `"-en"` | ❌ Invalid | ✅ Working | Leading dash |

### Validation Levels
| Input | Well-Formed | Valid | Strictly Valid | Notes |
|-------|-------------|-------|----------------|-------|
| `"en"` | ✅ | ✅ | ✅ | In IANA registry |
| `"eng"` | ✅ | ❌ | ❌ | Not in IANA registry |
| `"ENG-US"` | ✅ | ❌ | ❌ | Wrong case + not in registry |
| `"ca-valencia"` | ✅ | ✅ | ✅ | Correct prefix |
| `"es-valencia"` | ✅ | ✅ | ❌ | Wrong prefix (should be 'ca') |

## Data Dependencies

TypeScript uses these authoritative sources:
- **IANA Language Subtag Registry**: For valid subtags
- **UN M.49 Region Codes**: For region validation
- **Custom overrides.json**: For similarity scoring

## Current Go Implementation Gaps

1. **Parser too strict**: Rejects well-formed tags like "en-U", "en-USA"
2. **No IANA validation**: Only does well-formed checking
3. **Missing similarity data**: No macro-region, affinity data
4. **Case handling**: Need to verify case normalization matches

## Recommended Fix Order

1. ✅ **Document behavior differences** (this file)
2. 🚧 **Fix parser for well-formed acceptance**
3. ⏳ **Add IANA registry validation layer**
4. ⏳ **Add comprehensive edge case tests**
5. ⏳ **Create TypeScript cross-validation tests**
6. ⏳ **Performance and memory tests**

## Testing Strategy

### Option A: Fix Parser First
- Update Go parser to accept all well-formed tags
- Add validation layer for IANA registry checking
- Comprehensive test coverage

### Option B: Cross-Validation First  
- Create TypeScript test runner
- Generate test cases dynamically
- Fix Go implementation based on differences

**Recommendation**: Hybrid approach - fix obvious parser issues first, then use cross-validation for edge cases.