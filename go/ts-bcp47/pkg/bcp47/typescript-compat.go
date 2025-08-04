package bcp47

// TypeScript-compatible API functions
// These functions mirror the TypeScript BCP-47 API for easier migration

// Note: IsWellFormed, IsValid, and IsStrictlyValid are already defined in bcp47.go

// Tag parses a language tag with the specified validation and normalization options
// This mirrors the TypeScript Bcp47.tag() function
func Tag(tag string, options ...Option) (*LanguageTag, error) {
	return ParseTag(tag, options...)
}

// ValidateTag validates a language tag at the specified level
// Returns nil if valid, error if invalid
func ValidateTag(tag string, validity TagValidity) error {
	_, err := ParseTag(tag, WithValidity(validity))
	return err
}

// NormalizeTag normalizes a language tag to the specified level
func NormalizeTag(tag string, normalization TagNormalization) (*LanguageTag, error) {
	return ParseTag(tag, WithNormalization(normalization))
}

// GetSubtags parses a tag and returns just the subtags
func GetSubtags(tag string) (*Subtags, error) {
	lt, err := ParseTag(tag)
	if err != nil {
		return nil, err
	}
	return &lt.Subtags, nil
}

// TypeScript-style validation with options
type ValidationOptions struct {
	Validity      TagValidity      `json:"validity,omitempty"`
	Normalization TagNormalization `json:"normalization,omitempty"`
}

// ParseWithOptions parses a tag with TypeScript-style options
func ParseWithOptions(tag string, opts *ValidationOptions) (*LanguageTag, error) {
	var options []Option
	
	if opts != nil {
		if opts.Validity != WellFormed {
			options = append(options, WithValidity(opts.Validity))
		}
		if opts.Normalization != None {
			options = append(options, WithNormalization(opts.Normalization))
		}
	}
	
	return ParseTag(tag, options...)
}

// TypeScript-style convenience functions

// WellFormedTag parses a tag requiring only well-formed syntax
func WellFormedTag(tag string) (*LanguageTag, error) {
	return ParseTag(tag, WithValidity(WellFormed))
}

// ValidTag parses a tag requiring IANA validation
func ValidTag(tag string) (*LanguageTag, error) {
	return ParseTag(tag, WithValidity(Valid))
}

// StrictlyValidTag parses a tag requiring strict validation
func StrictlyValidTag(tag string) (*LanguageTag, error) {
	return ParseTag(tag, WithValidity(StrictlyValid))
}

// CanonicalTag parses and normalizes a tag to canonical form
func CanonicalTag(tag string) (*LanguageTag, error) {
	return ParseTag(tag, WithNormalization(Canonical))
}

// PreferredTag parses and normalizes a tag to preferred form
func PreferredTag(tag string) (*LanguageTag, error) {
	return ParseTag(tag, WithNormalization(Preferred))
}

// Utility functions for common validation patterns

// ValidateWellFormed returns an error if the tag is not well-formed
func ValidateWellFormed(tag string) error {
	return ValidateTag(tag, WellFormed)
}

// ValidateValid returns an error if the tag is not valid
func ValidateValid(tag string) error {
	return ValidateTag(tag, Valid)
}

// ValidateStrictlyValid returns an error if the tag is not strictly valid
func ValidateStrictlyValid(tag string) error {
	return ValidateTag(tag, StrictlyValid)
}