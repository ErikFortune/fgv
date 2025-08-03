package qualifiers

import (
	"fmt"
	"strings"

	"github.com/fgv-vis/fgv/go/ts-bcp47/pkg/bcp47"
	"github.com/fgv-vis/fgv/go/ts-res-runtime/pkg/types"
)

// LanguageQualifierType implements BCP-47 language tag matching
// This provides sophisticated language-aware resource resolution
type LanguageQualifierType struct {
	*types.BaseQualifierType
	allowedLanguages []string          // enumerated allowed language tags
	acceptMalformed  bool              // whether to accept malformed tags
	minimumScore     bcp47.SimilarityScore // minimum similarity score for matches
	normalization    bcp47.TagNormalization // normalization level to apply
	validation       bcp47.TagValidity     // validation level to require
}

// LanguageQualifierTypeConfig holds configuration for creating a LanguageQualifierType
type LanguageQualifierTypeConfig struct {
	Name               string
	AllowContextList   bool
	AllowedLanguages   []string                  // enumerated allowed language tags
	AcceptMalformed    bool                      // whether to accept malformed tags  
	MinimumScore       bcp47.SimilarityScore     // minimum similarity score for matches (default: 0.0)
	Normalization      bcp47.TagNormalization    // normalization to apply (default: canonical)
	Validation         bcp47.TagValidity         // validation level (default: well-formed)
	Index              *int
}

// NewLanguageQualifierType creates a new LanguageQualifierType with default settings
func NewLanguageQualifierType() *LanguageQualifierType {
	return &LanguageQualifierType{
		BaseQualifierType: types.NewBaseQualifierType("language", true), // Default: allow context lists
		allowedLanguages:  nil,
		acceptMalformed:   false,      // Default: require well-formed tags
		minimumScore:      bcp47.SimilarityNone, // Default: any positive match
		normalization:     bcp47.Canonical,     // Default: canonical normalization
		validation:        bcp47.WellFormed,    // Default: well-formed validation
	}
}

// NewLanguageQualifierTypeWithConfig creates a new LanguageQualifierType with the specified configuration
func NewLanguageQualifierTypeWithConfig(config LanguageQualifierTypeConfig) (*LanguageQualifierType, error) {
	name := config.Name
	if name == "" {
		name = "language"
	}

	qt := &LanguageQualifierType{
		BaseQualifierType: types.NewBaseQualifierType(name, config.AllowContextList),
		acceptMalformed:   config.AcceptMalformed,
		minimumScore:      config.MinimumScore,
		normalization:     config.Normalization,
		validation:        config.Validation,
	}

	// Validate and normalize allowed languages
	if config.AllowedLanguages != nil {
		normalizedLanguages := make([]string, len(config.AllowedLanguages))
		for i, lang := range config.AllowedLanguages {
			// Parse and normalize the language tag
			tag, err := bcp47.ParseTag(lang, 
				bcp47.WithNormalization(qt.normalization),
				bcp47.WithValidity(qt.validation))
			if err != nil {
				if !qt.acceptMalformed {
					return nil, fmt.Errorf("invalid allowed language '%s': %w", lang, err)
				}
				// Accept malformed tag as-is
				normalizedLanguages[i] = lang
			} else {
				normalizedLanguages[i] = tag.Tag
			}
		}
		qt.allowedLanguages = normalizedLanguages
	}

	if config.Index != nil {
		if err := qt.SetIndex(*config.Index); err != nil {
			return nil, fmt.Errorf("failed to set index: %w", err)
		}
	}

	return qt, nil
}

// IsValidConditionValue validates a condition value for language qualifier type
func (lqt *LanguageQualifierType) IsValidConditionValue(value string) bool {
	// Parse the language tag to validate it
	_, err := bcp47.ParseTag(value, bcp47.WithValidity(lqt.validation))
	if err != nil {
		// If malformed tags are accepted, allow any string
		return lqt.acceptMalformed
	}

	// If we have allowed languages, check against the list
	if lqt.allowedLanguages != nil {
		// Parse and normalize the value for comparison
		tag, err := bcp47.ParseTag(value, 
			bcp47.WithNormalization(lqt.normalization),
			bcp47.WithValidity(lqt.validation))
		if err != nil && !lqt.acceptMalformed {
			return false
		}
		
		normalizedValue := value
		if err == nil {
			normalizedValue = tag.Tag
		}
		
		for _, allowed := range lqt.allowedLanguages {
			if strings.EqualFold(allowed, normalizedValue) {
				return true
			}
		}
		return false
	}

	return true
}

// IsValidContextValue validates a context value for language qualifier type
func (lqt *LanguageQualifierType) IsValidContextValue(value string) bool {
	// Context values can be comma-separated lists if allowContextList is true
	if lqt.AllowContextList() && strings.Contains(value, ",") {
		// Split by comma and validate each part
		parts := strings.Split(value, ",")
		for _, part := range parts {
			trimmed := strings.TrimSpace(part)
			if trimmed == "" || !lqt.IsValidConditionValue(trimmed) {
				return false
			}
		}
		return true
	}

	// Single value - use the same validation as condition values
	return lqt.IsValidConditionValue(value)
}

// IsPotentialMatch determines if a condition value could potentially match a context value
func (lqt *LanguageQualifierType) IsPotentialMatch(conditionValue, contextValue string) bool {
	// Handle context lists if allowed
	if lqt.AllowContextList() && strings.Contains(contextValue, ",") {
		parts := strings.Split(contextValue, ",")
		for _, part := range parts {
			trimmed := strings.TrimSpace(part)
			if lqt.isPotentialMatchSingle(conditionValue, trimmed) {
				return true
			}
		}
		return false
	}

	return lqt.isPotentialMatchSingle(conditionValue, contextValue)
}

// isPotentialMatchSingle checks potential match between single values
func (lqt *LanguageQualifierType) isPotentialMatchSingle(conditionValue, contextValue string) bool {
	// First validate both values are acceptable
	if !lqt.IsValidConditionValue(conditionValue) || !lqt.IsValidContextValue(contextValue) {
		return false
	}
	
	// Use BCP-47 similarity to determine potential match
	score, err := bcp47.Similarity(conditionValue, contextValue,
		bcp47.WithNormalization(lqt.normalization),
		bcp47.WithValidity(lqt.validation))
	
	if err != nil {
		// If there's an error and we accept malformed tags, try string comparison
		if lqt.acceptMalformed {
			return strings.EqualFold(conditionValue, contextValue)
		}
		return false
	}

	return score > lqt.minimumScore
}

// ValidateCondition validates that a value and operator are valid for use in a condition
func (lqt *LanguageQualifierType) ValidateCondition(value string, operator types.ConditionOperator) (types.QualifierConditionValue, error) {
	// Use base implementation for operator validation
	baseResult, err := lqt.BaseQualifierType.ValidateCondition(value, operator)
	if err != nil {
		return "", err
	}

	// For 'matches' operator, validate the condition value
	if operator == types.ConditionOperatorMatches {
		if !lqt.IsValidConditionValue(value) {
			return "", fmt.Errorf("invalid language condition value '%s'", value)
		}
	}

	return baseResult, nil
}

// ValidateContextValue validates that a value is valid for use in a runtime context
func (lqt *LanguageQualifierType) ValidateContextValue(value string) (types.QualifierContextValue, error) {
	if !lqt.IsValidContextValue(value) {
		return "", fmt.Errorf("invalid language context value '%s'", value)
	}
	return types.QualifierContextValue(value), nil
}

// Matches determines the extent to which a condition matches a context value
func (lqt *LanguageQualifierType) Matches(condition types.QualifierConditionValue, context types.QualifierContextValue, operator types.ConditionOperator) types.QualifierMatchScore {
	// Handle special operators
	switch operator {
	case types.ConditionOperatorAlways:
		return types.PerfectMatch
	case types.ConditionOperatorNever:
		return types.NoMatch
	case types.ConditionOperatorMatches:
		// Handle context lists if allowed
		if lqt.AllowContextList() && strings.Contains(string(context), ",") {
			return lqt.matchAgainstList(condition, context)
		}
		return lqt.matchOne(condition, context, operator)
	default:
		return types.NoMatch
	}
}

// matchOne performs matching against a single context value
func (lqt *LanguageQualifierType) matchOne(condition types.QualifierConditionValue, context types.QualifierContextValue, operator types.ConditionOperator) types.QualifierMatchScore {
	// First validate that both values are valid for this qualifier type
	if !lqt.IsValidConditionValue(string(condition)) || !lqt.IsValidContextValue(string(context)) {
		return types.NoMatch
	}
	
	// Use BCP-47 similarity scoring
	score, err := bcp47.Similarity(string(condition), string(context),
		bcp47.WithNormalization(lqt.normalization),
		bcp47.WithValidity(lqt.validation))
	
	if err != nil {
		// If there's an error and we accept malformed tags, try string comparison
		if lqt.acceptMalformed {
			if strings.EqualFold(string(condition), string(context)) {
				return types.PerfectMatch
			}
		}
		return types.NoMatch
	}

	// Convert BCP-47 similarity score to qualifier match score
	// BCP-47 scores are 0.0-1.0, same as QualifierMatchScore
	return types.QualifierMatchScore(score)
}

// matchAgainstList performs matching against a comma-separated list of context values
func (lqt *LanguageQualifierType) matchAgainstList(condition types.QualifierConditionValue, context types.QualifierContextValue) types.QualifierMatchScore {
	parts := strings.Split(string(context), ",")
	var bestScore types.QualifierMatchScore = types.NoMatch

	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		score := lqt.matchOne(condition, types.QualifierContextValue(trimmed), types.ConditionOperatorMatches)
		if score > bestScore {
			bestScore = score
		}
		// Short circuit on perfect match
		if bestScore == types.PerfectMatch {
			break
		}
	}

	return bestScore
}

// GetAllowedLanguages returns the allowed languages constraint, if any
func (lqt *LanguageQualifierType) GetAllowedLanguages() []string {
	if lqt.allowedLanguages == nil {
		return nil
	}
	// Return a copy to prevent external modification
	result := make([]string, len(lqt.allowedLanguages))
	copy(result, lqt.allowedLanguages)
	return result
}

// GetAcceptMalformed returns whether this qualifier type accepts malformed language tags
func (lqt *LanguageQualifierType) GetAcceptMalformed() bool {
	return lqt.acceptMalformed
}

// GetMinimumScore returns the minimum similarity score required for matches
func (lqt *LanguageQualifierType) GetMinimumScore() bcp47.SimilarityScore {
	return lqt.minimumScore
}

// GetNormalization returns the normalization level applied to language tags
func (lqt *LanguageQualifierType) GetNormalization() bcp47.TagNormalization {
	return lqt.normalization
}

// GetValidation returns the validation level required for language tags
func (lqt *LanguageQualifierType) GetValidation() bcp47.TagValidity {
	return lqt.validation
}

// ParseLanguageTag is a convenience method to parse a language tag with this qualifier's settings
func (lqt *LanguageQualifierType) ParseLanguageTag(tag string) (*bcp47.LanguageTag, error) {
	return bcp47.ParseTag(tag,
		bcp47.WithNormalization(lqt.normalization),
		bcp47.WithValidity(lqt.validation))
}

// SimilarityScore calculates the BCP-47 similarity score between two language tags
func (lqt *LanguageQualifierType) SimilarityScore(tag1, tag2 string) (bcp47.SimilarityScore, error) {
	return bcp47.Similarity(tag1, tag2,
		bcp47.WithNormalization(lqt.normalization),
		bcp47.WithValidity(lqt.validation))
}