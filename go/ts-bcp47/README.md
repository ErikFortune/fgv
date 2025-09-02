# ts-bcp47

Go utilities for parsing, manipulating and comparing BCP-47 language tags.

## Summary

Go port of the TypeScript [@fgv/ts-bcp47](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-bcp47) library, providing utilities for parsing, manipulating and comparing BCP-47 language tags according to [RFC 5646](https://www.rfc-editor.org/rfc/rfc5646).

## Installation

```bash
go get github.com/fgv-vis/fgv/go/ts-bcp47
```

## Features

- **Parse and validate** BCP-47 language tags
- **Normalize** language tags into canonical or preferred form
- **Compare** language tags with sophisticated similarity scoring
- **Match** desired languages against available languages
- **Full compatibility** with TypeScript implementation

## Quick Start

```go
package main

import (
    "fmt"
    "log"
    
    "github.com/fgv-vis/fgv/go/ts-bcp47/pkg/bcp47"
)

func main() {
    // Parse a language tag
    tag, err := bcp47.ParseTag("en-US")
    if err != nil {
        log.Fatal(err)
    }
    
    fmt.Printf("Language: %s, Region: %s\n", tag.Subtags.PrimaryLanguage, tag.Subtags.Region)
    // Output: Language: en, Region: US
    
    // Calculate similarity between tags
    similarity, err := bcp47.Similarity("es-MX", "es-419")
    if err != nil {
        log.Fatal(err)
    }
    
    fmt.Printf("Similarity: %.1f\n", similarity)
    // Output: Similarity: 0.7 (macro-region match)
    
    // Choose best matching language
    desired := []string{"en-GB", "en-US", "fr"}
    available := []string{"en-US", "es", "de"}
    
    matches, err := bcp47.Choose(desired, available)
    if err != nil {
        log.Fatal(err)
    }
    
    fmt.Printf("Best match: %s\n", matches[0].Tag)
    // Output: Best match: en-US
}
```

## BCP-47 Language Tags

BCP-47 language tags consist of subtags that describe different aspects of a language:

- **Primary Language**: The main language (e.g., "en", "es", "zh")
- **Script**: Writing system (e.g., "Latn", "Hans", "Cyrl") 
- **Region**: Geographic region (e.g., "US", "MX", "419")
- **Variants**: Language variants (e.g., "valencia", "pinyin")
- **Extensions**: Additional language information
- **Private Use**: Private use subtags

### Examples

- `en` - English
- `en-US` - English as used in the United States
- `en-GB` - English as used in Great Britain
- `es-419` - Spanish as used in Latin America (UN M.49 region code)
- `zh-Hans` - Chinese written in Simplified script
- `zh-Hant-HK` - Chinese written in Traditional script as used in Hong Kong
- `ca-valencia` - Catalan as used in Valencia

## Similarity Scoring

The library provides sophisticated similarity scoring between language tags:

| Score | Similarity Level | Example |
|-------|------------------|---------|
| 1.0   | Exact match      | `en-US` ↔ `en-US` |
| 0.9   | Variant match    | `ca-valencia` ↔ `ca` |
| 0.8   | Region match     | `es` ↔ `es-MX` |
| 0.65  | Macro-region     | `es-419` ↔ `es-MX` |
| 0.5   | Neutral region   | `es-MX` ↔ `es` |
| 0.3   | Sibling regions  | `es-419` ↔ `es-ES` |
| 0.1   | Undetermined     | `und` ↔ `en` |
| 0.0   | No match         | `en` ↔ `zh` |

## API Reference

### Core Functions

#### ParseTag

```go
func ParseTag(tag string, options ...Option) (*LanguageTag, error)
```

Parse a BCP-47 language tag string into a structured LanguageTag.

#### Similarity

```go
func Similarity(tag1, tag2 string, options ...Option) (float64, error)
```

Calculate similarity score between two language tags (0.0 = no match, 1.0 = exact match).

#### Choose

```go
func Choose(desired, available []string, options ...Option) ([]*LanguageTag, error)
```

Match desired languages against available languages, returning ordered matches.

### Types

#### LanguageTag

```go
type LanguageTag struct {
    Tag     string   // Original tag string
    Subtags Subtags  // Parsed subtags
    // ... other fields
}
```

#### Subtags

```go
type Subtags struct {
    PrimaryLanguage string
    ExtLangs        []string
    Script          string
    Region          string
    Variants        []string
    Extensions      map[string][]string
    PrivateUse      []string
}
```

## Validation Levels

The library supports three levels of validation:

1. **Well-formed**: Meets basic BCP-47 syntax
2. **Valid**: All subtags are registered in IANA registry
3. **Strictly Valid**: Meets all validation rules including prefix requirements

## Normalization

Language tags can be normalized to:

- **Canonical form**: Standard case and deprecated tag replacement
- **Preferred form**: Uses preferred values from IANA registry

## Compatibility

This Go implementation maintains API compatibility with the TypeScript version:

- Identical similarity scoring algorithms
- Same validation levels and error handling patterns
- Compatible normalization behavior
- Equivalent language matching logic

## Performance

- Efficient parsing with minimal allocations
- Cached IANA registry data for fast lookups
- O(1) similarity scoring for common cases
- Optimized for high-throughput applications

## Testing

Run the test suite:

```bash
go test ./...
```

Run tests with coverage:

```bash
go test -cover ./...
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see [LICENSE](../../LICENSE) file for details.

## Related Projects

- [TypeScript ts-bcp47](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-bcp47) - Original TypeScript implementation
- [ts-res](../ts-res-runtime) - Resource management system using BCP-47 tags

---

**A complete, production-ready BCP-47 language tag library for Go.**