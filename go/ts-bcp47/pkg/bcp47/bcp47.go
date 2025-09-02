package bcp47

import (
	"sort"
	"strings"
)

// Similarity calculates the similarity score between two language tags
// Returns a score from 0.0 (no match) to 1.0 (exact match)
func Similarity(tag1, tag2 string, options ...Option) (SimilarityScore, error) {
	// Parse both tags
	lt1, err := ParseTag(tag1, options...)
	if err != nil {
		return SimilarityNone, err
	}
	
	lt2, err := ParseTag(tag2, options...)
	if err != nil {
		return SimilarityNone, err
	}
	
	// Calculate similarity
	matcher := NewSimilarityMatcher()
	return matcher.Match(lt1, lt2), nil
}

// SimilarityWithResult calculates similarity and returns detailed results
func SimilarityWithResult(tag1, tag2 string, options ...Option) (*MatchResult, error) {
	// Parse both tags
	lt1, err := ParseTag(tag1, options...)
	if err != nil {
		return nil, err
	}
	
	lt2, err := ParseTag(tag2, options...)
	if err != nil {
		return nil, err
	}
	
	// Calculate similarity with details
	matcher := NewSimilarityMatcher()
	score := matcher.Match(lt1, lt2)
	
	return &MatchResult{
		Score: score,
		Tag1:  lt1,
		Tag2:  lt2,
		// TODO: Add detailed breakdown
	}, nil
}

// ChoiceOption represents options for the Choose function
type ChoiceOption struct {
	// MinimumScore is the minimum similarity score required for a match
	MinimumScore SimilarityScore
	
	// MaxResults limits the number of results returned
	MaxResults int
}

// DefaultChoiceOption returns default choice options
func DefaultChoiceOption() *ChoiceOption {
	return &ChoiceOption{
		MinimumScore: SimilarityNone,
		MaxResults:   10,
	}
}

// Choose matches desired language tags against available language tags
// Returns an ordered list of matches from best to worst
func Choose(desired, available []string, options ...Option) ([]*LanguageTag, error) {
	return ChooseWithOptions(desired, available, DefaultChoiceOption(), options...)
}

// ChooseWithOptions provides more control over the matching process
func ChooseWithOptions(desired, available []string, choiceOpts *ChoiceOption, options ...Option) ([]*LanguageTag, error) {
	// Parse desired languages
	desiredTags := make([]*LanguageTag, len(desired))
	for i, tag := range desired {
		parsed, err := ParseTag(tag, options...)
		if err != nil {
			return nil, err
		}
		desiredTags[i] = parsed
	}
	
	// Parse available languages
	availableTags := make([]*LanguageTag, len(available))
	for i, tag := range available {
		parsed, err := ParseTag(tag, options...)
		if err != nil {
			return nil, err
		}
		availableTags[i] = parsed
	}
	
	// Match and score
	type scoredMatch struct {
		tag   *LanguageTag
		score SimilarityScore
	}
	
	var matches []scoredMatch
	matcher := NewSimilarityMatcher()
	
	// For each available language, find the best match against desired languages
	for _, availableTag := range availableTags {
		bestScore := SimilarityNone
		
		for _, desiredTag := range desiredTags {
			score := matcher.Match(desiredTag, availableTag)
			if score > bestScore {
				bestScore = score
			}
		}
		
		// Include if it meets minimum score
		if bestScore >= choiceOpts.MinimumScore {
			matches = append(matches, scoredMatch{
				tag:   availableTag,
				score: bestScore,
			})
		}
	}
	
	// Sort by score (highest first)
	sort.Slice(matches, func(i, j int) bool {
		return matches[i].score > matches[j].score
	})
	
	// Limit results
	if choiceOpts.MaxResults > 0 && len(matches) > choiceOpts.MaxResults {
		matches = matches[:choiceOpts.MaxResults]
	}
	
	// Extract tags
	result := make([]*LanguageTag, len(matches))
	for i, match := range matches {
		result[i] = match.tag
	}
	
	return result, nil
}

// ParseTags parses multiple language tag strings
func ParseTags(tags []string, options ...Option) ([]*LanguageTag, error) {
	result := make([]*LanguageTag, len(tags))
	for i, tag := range tags {
		parsed, err := ParseTag(tag, options...)
		if err != nil {
			return nil, err
		}
		result[i] = parsed
	}
	return result, nil
}

// IsWellFormed checks if a language tag is well-formed (basic syntax check)
func IsWellFormed(tag string) bool {
	_, err := ParseTag(tag, WithValidity(WellFormed))
	return err == nil
}

// IsValid checks if a language tag is valid (well-formed + registry validation)
func IsValid(tag string) bool {
	_, err := ParseTag(tag, WithValidity(Valid))
	return err == nil
}

// IsStrictlyValid checks if a language tag is strictly valid (includes prefix validation)
func IsStrictlyValid(tag string) bool {
	_, err := ParseTag(tag, WithValidity(StrictlyValid))
	return err == nil
}

// Normalize normalizes a language tag to canonical or preferred form
func Normalize(tag string, level TagNormalization, options ...Option) (*LanguageTag, error) {
	opts := append(options, WithNormalization(level))
	return ParseTag(tag, opts...)
}

// ToCanonical converts a language tag to canonical form
func ToCanonical(tag string, options ...Option) (*LanguageTag, error) {
	return Normalize(tag, Canonical, options...)
}

// ToPreferred converts a language tag to preferred form
func ToPreferred(tag string, options ...Option) (*LanguageTag, error) {
	return Normalize(tag, Preferred, options...)
}

// ExtractLanguage extracts just the primary language from a language tag
func ExtractLanguage(tag string) (string, error) {
	parsed, err := ParseTag(tag)
	if err != nil {
		return "", err
	}
	
	if parsed.IsGrandfathered {
		return parsed.Subtags.Grandfathered, nil
	}
	
	return parsed.Subtags.PrimaryLanguage, nil
}

// ExtractRegion extracts the region subtag from a language tag
func ExtractRegion(tag string) (string, error) {
	parsed, err := ParseTag(tag)
	if err != nil {
		return "", err
	}
	
	return parsed.Subtags.Region, nil
}

// ExtractScript extracts the script subtag from a language tag
func ExtractScript(tag string) (string, error) {
	parsed, err := ParseTag(tag)
	if err != nil {
		return "", err
	}
	
	return parsed.Subtags.Script, nil
}

// HasRegion checks if a language tag has a region subtag
func HasRegion(tag string) bool {
	parsed, err := ParseTag(tag)
	if err != nil {
		return false
	}
	
	return parsed.Subtags.HasRegion()
}

// HasScript checks if a language tag has a script subtag
func HasScript(tag string) bool {
	parsed, err := ParseTag(tag)
	if err != nil {
		return false
	}
	
	return parsed.Subtags.HasScript()
}

// IsUndetermined checks if a language tag represents undetermined language
func IsUndetermined(tag string) bool {
	parsed, err := ParseTag(tag)
	if err != nil {
		return false
	}
	
	return parsed.IsUndetermined
}

// Match is a convenience function that returns true if two tags match with a minimum score
func Match(tag1, tag2 string, minimumScore SimilarityScore, options ...Option) (bool, error) {
	score, err := Similarity(tag1, tag2, options...)
	if err != nil {
		return false, err
	}
	
	return score >= minimumScore, nil
}

// ExactMatch checks if two language tags match exactly
func ExactMatch(tag1, tag2 string, options ...Option) (bool, error) {
	return Match(tag1, tag2, SimilarityExact, options...)
}

// GoodMatch checks if two language tags have a good match (>= region level)
func GoodMatch(tag1, tag2 string, options ...Option) (bool, error) {
	return Match(tag1, tag2, SimilarityRegion, options...)
}

// AnyMatch checks if two language tags have any positive match
func AnyMatch(tag1, tag2 string, options ...Option) (bool, error) {
	score, err := Similarity(tag1, tag2, options...)
	if err != nil {
		return false, err
	}
	
	return score > SimilarityNone, nil
}

// CompareNormalized compares two tags after normalizing them to canonical form
func CompareNormalized(tag1, tag2 string, options ...Option) (bool, error) {
	normalizeOpts := append(options, WithNormalization(Canonical))
	
	norm1, err := ParseTag(tag1, normalizeOpts...)
	if err != nil {
		return false, err
	}
	
	norm2, err := ParseTag(tag2, normalizeOpts...)
	if err != nil {
		return false, err
	}
	
	return strings.EqualFold(norm1.Tag, norm2.Tag), nil
}

// FilterByLanguage filters a list of language tags to only those matching a specific language
func FilterByLanguage(tags []string, language string, options ...Option) ([]string, error) {
	var result []string
	
	for _, tag := range tags {
		parsed, err := ParseTag(tag, options...)
		if err != nil {
			continue // Skip invalid tags
		}
		
		if strings.EqualFold(parsed.Subtags.PrimaryLanguage, language) {
			result = append(result, tag)
		}
	}
	
	return result, nil
}

// FilterByRegion filters a list of language tags to only those matching a specific region
func FilterByRegion(tags []string, region string, options ...Option) ([]string, error) {
	var result []string
	
	for _, tag := range tags {
		parsed, err := ParseTag(tag, options...)
		if err != nil {
			continue // Skip invalid tags
		}
		
		if strings.EqualFold(parsed.Subtags.Region, region) {
			result = append(result, tag)
		}
	}
	
	return result, nil
}

// GetSupportedLanguages extracts unique primary languages from a list of tags
func GetSupportedLanguages(tags []string, options ...Option) ([]string, error) {
	languageSet := make(map[string]bool)
	
	for _, tag := range tags {
		parsed, err := ParseTag(tag, options...)
		if err != nil {
			continue // Skip invalid tags
		}
		
		if parsed.Subtags.PrimaryLanguage != "" {
			languageSet[parsed.Subtags.PrimaryLanguage] = true
		}
	}
	
	// Convert set to sorted slice
	languages := make([]string, 0, len(languageSet))
	for lang := range languageSet {
		languages = append(languages, lang)
	}
	
	sort.Strings(languages)
	return languages, nil
}

// GetSupportedRegions extracts unique regions from a list of tags
func GetSupportedRegions(tags []string, options ...Option) ([]string, error) {
	regionSet := make(map[string]bool)
	
	for _, tag := range tags {
		parsed, err := ParseTag(tag, options...)
		if err != nil {
			continue // Skip invalid tags
		}
		
		if parsed.Subtags.Region != "" {
			regionSet[parsed.Subtags.Region] = true
		}
	}
	
	// Convert set to sorted slice
	regions := make([]string, 0, len(regionSet))
	for region := range regionSet {
		regions = append(regions, region)
	}
	
	sort.Strings(regions)
	return regions, nil
}