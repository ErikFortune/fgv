package bcp47

// SimilarityScore represents the numeric quality of a language tag match
// Range is 0.0 (no match) to 1.0 (exact match)
type SimilarityScore float64

// Common levels of match quality for language tag matching
// These constants mirror the TypeScript tagSimilarity values
const (
	// Perfect match - tags are identical
	SimilarityExact SimilarityScore = 1.0
	
	// Variant-level match - same language, different variant
	SimilarityVariant SimilarityScore = 0.9
	
	// Region-level match - same language and script, different region
	SimilarityRegion SimilarityScore = 0.8
	
	// Macro-region match - region is contained within macro region
	SimilarityMacroRegion SimilarityScore = 0.65
	
	// Neutral region match - one tag has region, other doesn't
	SimilarityNeutralRegion SimilarityScore = 0.5
	
	// Preferred affinity - related through preferred mappings
	SimilarityPreferredAffinity SimilarityScore = 0.45
	
	// General affinity - related languages
	SimilarityAffinity SimilarityScore = 0.4
	
	// Preferred region - region related through preferred mappings
	SimilarityPreferredRegion SimilarityScore = 0.35
	
	// Sibling match - regions within same macro region
	SimilaritySibling SimilarityScore = 0.3
	
	// Undetermined language match
	SimilarityUndetermined SimilarityScore = 0.1
	
	// No match
	SimilarityNone SimilarityScore = 0.0
)

// Penalty values for mismatched subtags
// These constants mirror the TypeScript subtagMismatchPenalty values
const (
	// Penalty for private use subtag mismatch
	PrivateUseMismatchPenalty = 0.05
	
	// Penalty for extension subtag mismatch  
	ExtensionMismatchPenalty = 0.04
	
	// Penalty for variant subtag mismatch
	VariantMismatchPenalty = 0.1
)

// String returns a human-readable description of the similarity score
func (s SimilarityScore) String() string {
	switch s {
	case SimilarityExact:
		return "exact"
	case SimilarityVariant:
		return "variant"
	case SimilarityRegion:
		return "region"
	case SimilarityMacroRegion:
		return "macroRegion"
	case SimilarityNeutralRegion:
		return "neutralRegion"
	case SimilarityPreferredAffinity:
		return "preferredAffinity"
	case SimilarityAffinity:
		return "affinity"
	case SimilarityPreferredRegion:
		return "preferredRegion"
	case SimilaritySibling:
		return "sibling"
	case SimilarityUndetermined:
		return "undetermined"
	case SimilarityNone:
		return "none"
	default:
		if s > SimilarityExact {
			return "exact+"
		} else if s > SimilarityNone {
			return "partial"
		}
		return "none"
	}
}

// IsMatch returns true if the similarity score indicates a match
func (s SimilarityScore) IsMatch() bool {
	return s > SimilarityNone
}

// IsExact returns true if the similarity score indicates an exact match
func (s SimilarityScore) IsExact() bool {
	return s >= SimilarityExact
}

// Quality returns a quality description of the match
func (s SimilarityScore) Quality() string {
	switch {
	case s >= SimilarityExact:
		return "excellent"
	case s >= SimilarityVariant:
		return "very good"
	case s >= SimilarityRegion:
		return "good"
	case s >= SimilarityMacroRegion:
		return "fair"
	case s >= SimilarityNeutralRegion:
		return "marginal"
	case s > SimilarityNone:
		return "poor"
	default:
		return "none"
	}
}

// Min returns the minimum of two similarity scores
func Min(a, b SimilarityScore) SimilarityScore {
	if a < b {
		return a
	}
	return b
}

// Max returns the maximum of two similarity scores
func Max(a, b SimilarityScore) SimilarityScore {
	if a > b {
		return a
	}
	return b
}

// MatchResult represents the result of matching two language tags
type MatchResult struct {
	// The similarity score
	Score SimilarityScore `json:"score"`
	
	// The two tags that were compared
	Tag1 *LanguageTag `json:"tag1"`
	Tag2 *LanguageTag `json:"tag2"`
	
	// Detailed breakdown of the match
	Details MatchDetails `json:"details,omitempty"`
}

// MatchDetails provides a detailed breakdown of how two tags matched
type MatchDetails struct {
	// Language match details
	LanguageMatch string `json:"languageMatch,omitempty"`
	
	// Script match details
	ScriptMatch string `json:"scriptMatch,omitempty"`
	
	// Region match details
	RegionMatch string `json:"regionMatch,omitempty"`
	
	// Variant match details
	VariantMatch string `json:"variantMatch,omitempty"`
	
	// Extension match details
	ExtensionMatch string `json:"extensionMatch,omitempty"`
	
	// Private use match details
	PrivateUseMatch string `json:"privateUseMatch,omitempty"`
	
	// Any penalties applied
	Penalties []string `json:"penalties,omitempty"`
}

// IsMatch returns true if this result represents a match
func (mr *MatchResult) IsMatch() bool {
	return mr.Score.IsMatch()
}

// IsExact returns true if this result represents an exact match
func (mr *MatchResult) IsExact() bool {
	return mr.Score.IsExact()
}

// Quality returns a quality description of the match
func (mr *MatchResult) Quality() string {
	return mr.Score.Quality()
}