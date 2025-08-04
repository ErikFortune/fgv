package bcp47

import (
	"fmt"
	"strings"
)

// Subtags represents the individual components of a BCP-47 language tag
// This mirrors the TypeScript ISubtags interface
type Subtags struct {
	// Primary language subtag (required)
	PrimaryLanguage string `json:"primaryLanguage,omitempty"`
	
	// Extended language subtags (optional, up to 3)
	ExtLangs []string `json:"extlangs,omitempty"`
	
	// Script subtag (optional)
	Script string `json:"script,omitempty"`
	
	// Region subtag (optional)
	Region string `json:"region,omitempty"`
	
	// Variant subtags (optional, multiple allowed)
	Variants []string `json:"variants,omitempty"`
	
	// Extension subtags (optional, map of singleton to subtags)
	Extensions map[string][]string `json:"extensions,omitempty"`
	
	// Private use subtags (optional)
	PrivateUse []string `json:"privateUse,omitempty"`
	
	// Grandfathered tag (for irregular/regular grandfathered tags)
	Grandfathered string `json:"grandfathered,omitempty"`
}

// LanguageTag represents a complete BCP-47 language tag
// This mirrors the TypeScript LanguageTag class
type LanguageTag struct {
	// Original tag string
	Tag string `json:"tag"`
	
	// Parsed subtags
	Subtags Subtags `json:"subtags"`
	
	// Validation level of this tag
	validity TagValidity `json:"-"`
	
	// Normalization level of this tag  
	normalization TagNormalization `json:"-"`
	
	// Whether this tag is undetermined (language = "und")
	IsUndetermined bool `json:"isUndetermined"`
	
	// Whether this tag represents a macro language
	IsMacroLanguage bool `json:"isMacroLanguage"`
	
	// Whether this tag is a grandfathered tag
	IsGrandfathered bool `json:"isGrandfathered"`
}

// TagValidity represents the validation level of a language tag
// This mirrors the TypeScript TagValidity enum
type TagValidity int

const (
	// WellFormed means the tag meets basic BCP-47 syntax requirements
	WellFormed TagValidity = iota
	
	// Valid means the tag is well-formed and all subtags are in the IANA registry
	Valid
	
	// StrictlyValid means the tag is valid and meets all prefix requirements
	StrictlyValid
)

// String returns the string representation of TagValidity
func (tv TagValidity) String() string {
	switch tv {
	case WellFormed:
		return "wellFormed"
	case Valid:
		return "valid"
	case StrictlyValid:
		return "strictlyValid"
	default:
		return "unknown"
	}
}

// TagNormalization represents the normalization level applied to a language tag
// This mirrors the TypeScript TagNormalization enum
type TagNormalization int

const (
	// None means no normalization was applied
	None TagNormalization = iota
	
	// Canonical means the tag was normalized to canonical form (proper case, etc.)
	Canonical
	
	// Preferred means the tag was normalized to preferred form (using preferred values)
	Preferred
)

// String returns the string representation of TagNormalization
func (tn TagNormalization) String() string {
	switch tn {
	case None:
		return "none"
	case Canonical:
		return "canonical"
	case Preferred:
		return "preferred"
	default:
		return "unknown"
	}
}

// Option represents a configuration option for parsing/creating language tags
type Option func(*Config)

// Config holds configuration options for language tag operations
type Config struct {
	Validity      TagValidity
	Normalization TagNormalization
	// TODO: Add IANA registry references when implemented
}

// WithValidity sets the desired validation level
func WithValidity(validity TagValidity) Option {
	return func(c *Config) {
		c.Validity = validity
	}
}

// WithNormalization sets the desired normalization level
func WithNormalization(normalization TagNormalization) Option {
	return func(c *Config) {
		c.Normalization = normalization
	}
}

// DefaultConfig returns a default configuration
func DefaultConfig() *Config {
	return &Config{
		Validity:      WellFormed,
		Normalization: None,
	}
}

// ApplyOptions applies a list of options to a config
func ApplyOptions(config *Config, options ...Option) {
	for _, option := range options {
		option(config)
	}
}

// String returns the string representation of the language tag
func (lt *LanguageTag) String() string {
	return lt.Tag
}

// IsValid returns true if the tag is valid (not just well-formed)
func (lt *LanguageTag) IsValid() bool {
	return lt.validity >= Valid
}

// IsStrictlyValid returns true if the tag is strictly valid
func (lt *LanguageTag) IsStrictlyValid() bool {
	return lt.validity >= StrictlyValid
}

// GetValidity returns the validation level of the tag
func (lt *LanguageTag) GetValidity() TagValidity {
	return lt.validity
}

// GetNormalization returns the normalization level of the tag
func (lt *LanguageTag) GetNormalization() TagNormalization {
	return lt.normalization
}

// SubtagsToString converts subtags back to a string representation
// This mirrors the TypeScript subtagsToString function
func SubtagsToString(subtags Subtags) string {
	if subtags.Grandfathered != "" {
		return subtags.Grandfathered
	}
	
	var parts []string
	
	// Primary language (required unless grandfathered)
	if subtags.PrimaryLanguage != "" {
		parts = append(parts, subtags.PrimaryLanguage)
	}
	
	// Extended language subtags
	for _, extlang := range subtags.ExtLangs {
		parts = append(parts, extlang)
	}
	
	// Script
	if subtags.Script != "" {
		parts = append(parts, subtags.Script)
	}
	
	// Region
	if subtags.Region != "" {
		parts = append(parts, subtags.Region)
	}
	
	// Variants
	for _, variant := range subtags.Variants {
		parts = append(parts, variant)
	}
	
	// Extensions
	for singleton, extSubtags := range subtags.Extensions {
		parts = append(parts, singleton)
		parts = append(parts, extSubtags...)
	}
	
	// Private use
	if len(subtags.PrivateUse) > 0 {
		parts = append(parts, "x")
		parts = append(parts, subtags.PrivateUse...)
	}
	
	return strings.Join(parts, "-")
}

// HasPrimaryLanguage returns true if the tag has a primary language subtag
func (s *Subtags) HasPrimaryLanguage() bool {
	return s.PrimaryLanguage != ""
}

// HasScript returns true if the tag has a script subtag
func (s *Subtags) HasScript() bool {
	return s.Script != ""
}

// HasRegion returns true if the tag has a region subtag
func (s *Subtags) HasRegion() bool {
	return s.Region != ""
}

// HasVariants returns true if the tag has variant subtags
func (s *Subtags) HasVariants() bool {
	return len(s.Variants) > 0
}

// HasExtensions returns true if the tag has extension subtags
func (s *Subtags) HasExtensions() bool {
	return len(s.Extensions) > 0
}

// HasPrivateUse returns true if the tag has private use subtags
func (s *Subtags) HasPrivateUse() bool {
	return len(s.PrivateUse) > 0
}

// Copy creates a deep copy of the Subtags
func (s *Subtags) Copy() Subtags {
	copy := Subtags{
		PrimaryLanguage: s.PrimaryLanguage,
		Script:          s.Script,
		Region:          s.Region,
		Grandfathered:   s.Grandfathered,
	}
	
	if s.ExtLangs != nil {
		copy.ExtLangs = make([]string, len(s.ExtLangs))
		copy.copy(copy.ExtLangs, s.ExtLangs)
	}
	
	if s.Variants != nil {
		copy.Variants = make([]string, len(s.Variants))
		copy.copy(copy.Variants, s.Variants)
	}
	
	if s.Extensions != nil {
		copy.Extensions = make(map[string][]string)
		for k, v := range s.Extensions {
			copy.Extensions[k] = make([]string, len(v))
			copy.copy(copy.Extensions[k], v)
		}
	}
	
	if s.PrivateUse != nil {
		copy.PrivateUse = make([]string, len(s.PrivateUse))
		copy.copy(copy.PrivateUse, s.PrivateUse)
	}
	
	return copy
}

// copy is a helper method for copying string slices
func (s *Subtags) copy(dst, src []string) {
	for i, v := range src {
		dst[i] = v
	}
}

// Error types for BCP-47 operations
type Error struct {
	Type    ErrorType
	Message string
	Tag     string
	Detail  string
}

type ErrorType int

const (
	// Parsing errors
	ErrorTypeInvalidSyntax ErrorType = iota
	ErrorTypeInvalidLength
	ErrorTypeInvalidCharacters
	ErrorTypeInvalidStructure
	
	// Validation errors
	ErrorTypeInvalidSubtag
	ErrorTypeUnknownLanguage
	ErrorTypeUnknownScript
	ErrorTypeUnknownRegion
	ErrorTypeUnknownVariant
	ErrorTypeInvalidPrefix
	ErrorTypeDuplicateVariant
	ErrorTypeDuplicateExtension
	
	// General errors
	ErrorTypeUnknown
)

func (e *Error) Error() string {
	if e.Tag != "" {
		return fmt.Sprintf("BCP47 error in tag '%s': %s", e.Tag, e.Message)
	}
	return fmt.Sprintf("BCP47 error: %s", e.Message)
}

// NewError creates a new BCP-47 error
func NewError(errorType ErrorType, message, tag, detail string) *Error {
	return &Error{
		Type:    errorType,
		Message: message,
		Tag:     tag,
		Detail:  detail,
	}
}

// Constants for common values
const (
	// UndeterminedLanguage represents the "und" (undetermined) language tag
	UndeterminedLanguage = "und"
	
	// PrivateUseSingleton is the singleton character for private use extensions
	PrivateUseSingleton = "x"
	
	// MaxExtLangs is the maximum number of extended language subtags allowed
	MaxExtLangs = 3
	
	// MinTagLength is the minimum length of a valid language tag
	MinTagLength = 1
	
	// MaxTagLength is the maximum length of a valid language tag
	MaxTagLength = 1000 // Reasonable upper bound
)