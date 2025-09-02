package qualifiers

import (
	"testing"

	"github.com/fgv-vis/fgv/go/ts-bcp47/pkg/bcp47"
	"github.com/fgv-vis/fgv/go/ts-res-runtime/pkg/types"
)

func TestNewLanguageQualifierType(t *testing.T) {
	qt := NewLanguageQualifierType()
	
	if qt.Name() != "language" {
		t.Errorf("Expected name 'language', got '%s'", qt.Name())
	}
	
	if !qt.AllowContextList() {
		t.Error("Expected to allow context lists by default")
	}
	
	if qt.GetAcceptMalformed() {
		t.Error("Expected not to accept malformed tags by default")
	}
	
	if qt.GetMinimumScore() != bcp47.SimilarityNone {
		t.Errorf("Expected minimum score %f, got %f", bcp47.SimilarityNone, qt.GetMinimumScore())
	}
	
	if qt.GetNormalization() != bcp47.Canonical {
		t.Errorf("Expected canonical normalization, got %v", qt.GetNormalization())
	}
	
	if qt.GetValidation() != bcp47.WellFormed {
		t.Errorf("Expected well-formed validation, got %v", qt.GetValidation())
	}
}

func TestNewLanguageQualifierTypeWithConfig(t *testing.T) {
	config := LanguageQualifierTypeConfig{
		Name:               "custom-language",
		AllowContextList:   false,
		AllowedLanguages:   []string{"en", "fr", "es"},
		AcceptMalformed:    true,
		MinimumScore:       bcp47.SimilarityRegion,
		Normalization:      bcp47.Preferred,
		Validation:         bcp47.Valid,
	}
	
	qt, err := NewLanguageQualifierTypeWithConfig(config)
	if err != nil {
		t.Fatalf("Failed to create language qualifier: %v", err)
	}
	
	if qt.Name() != "custom-language" {
		t.Errorf("Expected name 'custom-language', got '%s'", qt.Name())
	}
	
	if qt.AllowContextList() {
		t.Error("Expected not to allow context lists")
	}
	
	allowed := qt.GetAllowedLanguages()
	if len(allowed) != 3 {
		t.Errorf("Expected 3 allowed languages, got %d", len(allowed))
	}
	
	if qt.GetAcceptMalformed() != true {
		t.Error("Expected to accept malformed tags")
	}
	
	if qt.GetMinimumScore() != bcp47.SimilarityRegion {
		t.Errorf("Expected minimum score %f, got %f", bcp47.SimilarityRegion, qt.GetMinimumScore())
	}
}

func TestLanguageQualifierTypeIsValidConditionValue(t *testing.T) {
	tests := []struct {
		name      string
		config    LanguageQualifierTypeConfig
		value     string
		expected  bool
	}{
		{
			name:     "valid basic language",
			config:   LanguageQualifierTypeConfig{},
			value:    "en",
			expected: true,
		},
		{
			name:     "valid language with region",
			config:   LanguageQualifierTypeConfig{},
			value:    "en-US",
			expected: true,
		},
		{
			name:     "valid complex language tag",
			config:   LanguageQualifierTypeConfig{},
			value:    "zh-Hans-CN",
			expected: true,
		},
		{
			name:     "invalid language tag",
			config:   LanguageQualifierTypeConfig{},
			value:    "invalid-language-tag-that-is-too-long",
			expected: false,
		},
		{
			name: "invalid tag but malformed accepted",
			config: LanguageQualifierTypeConfig{
				AcceptMalformed: true,
			},
			value:    "invalid-tag",
			expected: true,
		},
		{
			name: "valid tag in allowed list",
			config: LanguageQualifierTypeConfig{
				AllowedLanguages: []string{"en", "fr", "es"},
			},
			value:    "en",
			expected: true,
		},
		{
			name: "valid tag not in allowed list",
			config: LanguageQualifierTypeConfig{
				AllowedLanguages: []string{"en", "fr", "es"},
			},
			value:    "de",
			expected: false,
		},
		{
			name: "case insensitive allowed list",
			config: LanguageQualifierTypeConfig{
				AllowedLanguages: []string{"en-US", "fr-FR"},
			},
			value:    "en-us",
			expected: true,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			qt, err := NewLanguageQualifierTypeWithConfig(tt.config)
			if err != nil {
				t.Fatalf("Failed to create qualifier: %v", err)
			}
			
			result := qt.IsValidConditionValue(tt.value)
			if result != tt.expected {
				t.Errorf("IsValidConditionValue(%q) = %v, want %v", tt.value, result, tt.expected)
			}
		})
	}
}

func TestLanguageQualifierTypeIsValidContextValue(t *testing.T) {
	qt := NewLanguageQualifierType()
	
	// Test single values
	if !qt.IsValidContextValue("en") {
		t.Error("Expected 'en' to be valid context value")
	}
	
	if !qt.IsValidContextValue("en-US") {
		t.Error("Expected 'en-US' to be valid context value")
	}
	
	// Test context lists
	if !qt.IsValidContextValue("en,fr,es") {
		t.Error("Expected 'en,fr,es' to be valid context list")
	}
	
	if !qt.IsValidContextValue("en-US, fr-FR, es-MX") {
		t.Error("Expected 'en-US, fr-FR, es-MX' to be valid context list")
	}
	
	// Test invalid context list
	if qt.IsValidContextValue("en,invalid-language-tag-that-is-too-long") {
		t.Error("Expected 'en,invalid-language-tag-that-is-too-long' to be invalid context list")
	}
	
	// Test with context lists disabled
	qtNoList, _ := NewLanguageQualifierTypeWithConfig(LanguageQualifierTypeConfig{
		AllowContextList: false,
	})
	
	if qtNoList.IsValidContextValue("en,fr") {
		t.Error("Expected context list to be invalid when not allowed")
	}
}

func TestLanguageQualifierTypeIsPotentialMatch(t *testing.T) {
	qt := NewLanguageQualifierType()
	
	tests := []struct {
		condition string
		context   string
		expected  bool
		desc      string
	}{
		{"en", "en", true, "exact match"},
		{"en-US", "en-US", true, "exact match with region"},
		{"en", "en-US", true, "language matches region variant"},
		{"en-US", "en-GB", false, "same language different regions have low score"},
		{"es", "es-MX", true, "neutral vs regional"},
		{"es-419", "es-MX", true, "macro-region match"},
		{"zh-Hans", "zh-Hant", false, "different scripts"},
		{"en", "fr", false, "different languages"},
		{"invalid", "en", false, "invalid condition"},
		{"en", "invalid", false, "invalid context"},
	}
	
	for _, tt := range tests {
		t.Run(tt.desc, func(t *testing.T) {
			result := qt.IsPotentialMatch(tt.condition, tt.context)
			if result != tt.expected {
				t.Errorf("IsPotentialMatch(%q, %q) = %v, want %v", tt.condition, tt.context, result, tt.expected)
			}
		})
	}
}

func TestLanguageQualifierTypeIsPotentialMatchWithList(t *testing.T) {
	qt := NewLanguageQualifierType()
	
	// Test context list matching
	if !qt.IsPotentialMatch("en", "en,fr,es") {
		t.Error("Expected 'en' to potentially match 'en,fr,es'")
	}
	
	if !qt.IsPotentialMatch("fr", "en,fr,es") {
		t.Error("Expected 'fr' to potentially match 'en,fr,es'")
	}
	
	if qt.IsPotentialMatch("de", "en,fr,es") {
		t.Error("Expected 'de' not to potentially match 'en,fr,es'")
	}
	
	// Test with similar languages
	if !qt.IsPotentialMatch("en", "en-US,fr-FR") {
		t.Error("Expected 'en' to potentially match 'en-US,fr-FR'")
	}
}

func TestLanguageQualifierTypeMatches(t *testing.T) {
	qt := NewLanguageQualifierType()
	
	tests := []struct {
		condition string
		context   string
		operator  types.ConditionOperator
		expected  types.QualifierMatchScore
		desc      string
	}{
		{"en", "en", types.ConditionOperatorMatches, types.PerfectMatch, "exact match"},
		{"en-US", "en-US", types.ConditionOperatorMatches, types.PerfectMatch, "exact match with region"},
		{"", "", types.ConditionOperatorAlways, types.PerfectMatch, "always operator"},
		{"", "", types.ConditionOperatorNever, types.NoMatch, "never operator"},
		{"en", "fr", types.ConditionOperatorMatches, types.NoMatch, "different languages"},
	}
	
	for _, tt := range tests {
		t.Run(tt.desc, func(t *testing.T) {
			score := qt.Matches(
				types.QualifierConditionValue(tt.condition),
				types.QualifierContextValue(tt.context),
				tt.operator,
			)
			if score != tt.expected {
				t.Errorf("Matches(%q, %q, %v) = %f, want %f", tt.condition, tt.context, tt.operator, score, tt.expected)
			}
		})
	}
}

func TestLanguageQualifierTypeMatchesSimilarity(t *testing.T) {
	qt := NewLanguageQualifierType()
	
	// Test BCP-47 similarity scoring
	tests := []struct {
		condition string
		context   string
		minScore  types.QualifierMatchScore
		desc      string
	}{
		{"en", "en-US", 0.4, "neutral vs regional should score >= 0.4"},
		{"es-419", "es-MX", 0.6, "macro-region should score >= 0.6"},
		{"es-MX", "es-AR", 0.2, "sibling regions should score >= 0.2"},
		{"zh-Hans", "zh-Hant", 0.0, "different scripts should score 0"},
	}
	
	for _, tt := range tests {
		t.Run(tt.desc, func(t *testing.T) {
			score := qt.Matches(
				types.QualifierConditionValue(tt.condition),
				types.QualifierContextValue(tt.context),
				types.ConditionOperatorMatches,
			)
			if score < tt.minScore {
				t.Errorf("Matches(%q, %q) = %f, want >= %f", tt.condition, tt.context, score, tt.minScore)
			}
		})
	}
}

func TestLanguageQualifierTypeMatchesWithList(t *testing.T) {
	qt := NewLanguageQualifierType()
	
	// Test matching against context lists
	score := qt.Matches(
		types.QualifierConditionValue("en"),
		types.QualifierContextValue("fr,en-US,es"),
		types.ConditionOperatorMatches,
	)
	
	// Should match en-US with good similarity
	if score < 0.4 {
		t.Errorf("Expected score >= 0.4 for 'en' matching 'fr,en-US,es', got %f", score)
	}
	
	// Test exact match in list
	score = qt.Matches(
		types.QualifierConditionValue("fr"),
		types.QualifierContextValue("en,fr,es"),
		types.ConditionOperatorMatches,
	)
	
	if score != types.PerfectMatch {
		t.Errorf("Expected perfect match for 'fr' in 'en,fr,es', got %f", score)
	}
}

func TestLanguageQualifierTypeWithMinimumScore(t *testing.T) {
	// Create qualifier that requires region-level similarity
	qt, err := NewLanguageQualifierTypeWithConfig(LanguageQualifierTypeConfig{
		MinimumScore: bcp47.SimilarityRegion, // 0.8
	})
	if err != nil {
		t.Fatalf("Failed to create qualifier: %v", err)
	}
	
	// Test that low-similarity matches are rejected
	if qt.IsPotentialMatch("es-MX", "es-AR") {
		t.Error("Expected sibling regions to not meet minimum score requirement")
	}
	
	// Test that medium-similarity matches are rejected (neutral vs regional = 0.5 < 0.8)
	if qt.IsPotentialMatch("en", "en-US") {
		t.Error("Expected neutral vs regional to not meet high minimum score requirement")
	}
	
	// Test exact match still works
	if !qt.IsPotentialMatch("en-US", "en-US") {
		t.Error("Expected exact match to meet minimum score requirement")
	}
}

func TestLanguageQualifierTypeValidation(t *testing.T) {
	qt := NewLanguageQualifierType()
	
	// Test ValidateCondition
	_, err := qt.ValidateCondition("en", types.ConditionOperatorMatches)
	if err != nil {
		t.Errorf("Expected 'en' to be valid condition: %v", err)
	}
	
	_, err = qt.ValidateCondition("invalid-language-tag-that-is-too-long", types.ConditionOperatorMatches)
	if err == nil {
		t.Error("Expected long invalid tag to be invalid condition")
	}
	
	// Test ValidateContextValue
	_, err = qt.ValidateContextValue("en-US")
	if err != nil {
		t.Errorf("Expected 'en-US' to be valid context: %v", err)
	}
	
	_, err = qt.ValidateContextValue("invalid-language-tag-that-is-too-long")
	if err == nil {
		t.Error("Expected long invalid tag to be invalid context")
	}
}

func TestLanguageQualifierTypeConvenienceMethods(t *testing.T) {
	qt := NewLanguageQualifierType()
	
	// Test ParseLanguageTag
	tag, err := qt.ParseLanguageTag("en-US")
	if err != nil {
		t.Errorf("Failed to parse 'en-US': %v", err)
	}
	if tag.Subtags.PrimaryLanguage != "en" {
		t.Errorf("Expected language 'en', got '%s'", tag.Subtags.PrimaryLanguage)
	}
	if tag.Subtags.Region != "US" {
		t.Errorf("Expected region 'US', got '%s'", tag.Subtags.Region)
	}
	
	// Test SimilarityScore
	score, err := qt.SimilarityScore("en", "en-US")
	if err != nil {
		t.Errorf("Failed to calculate similarity: %v", err)
	}
	if score <= bcp47.SimilarityNone {
		t.Errorf("Expected positive similarity score, got %f", score)
	}
}

func TestLanguageQualifierTypeSetIndex(t *testing.T) {
	qt := NewLanguageQualifierType()
	
	err := qt.SetIndex(42)
	if err != nil {
		t.Errorf("Failed to set index: %v", err)
	}
	
	if qt.Index() == nil || *qt.Index() != 42 {
		t.Errorf("Expected index 42, got %v", qt.Index())
	}
}

func TestLanguageQualifierTypeWithMalformedTags(t *testing.T) {
	qt, err := NewLanguageQualifierTypeWithConfig(LanguageQualifierTypeConfig{
		AcceptMalformed: true,
	})
	if err != nil {
		t.Fatalf("Failed to create qualifier: %v", err)
	}
	
	// Test that malformed tags are accepted
	if !qt.IsValidConditionValue("invalid-language-tag-that-is-too-long") {
		t.Error("Expected malformed tag to be accepted")
	}
	
	// Test string-based matching for malformed tags
	score := qt.Matches(
		types.QualifierConditionValue("invalid-language-tag-that-is-too-long"),
		types.QualifierContextValue("invalid-language-tag-that-is-too-long"),
		types.ConditionOperatorMatches,
	)
	if score != types.PerfectMatch {
		t.Errorf("Expected perfect match for identical malformed tags, got %f", score)
	}
	
	// Test no match for different malformed tags
	score = qt.Matches(
		types.QualifierConditionValue("completely-different-malformed-tag"),
		types.QualifierContextValue("another-totally-different-malformed-tag"),
		types.ConditionOperatorMatches,
	)
	if score != types.NoMatch {
		t.Errorf("Expected no match for different malformed tags, got %f", score)
	}
}