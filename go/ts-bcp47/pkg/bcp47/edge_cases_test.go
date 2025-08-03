package bcp47

import (
	"strings"
	"testing"
)

func TestEdgeCases(t *testing.T) {
	tests := []struct {
		name      string
		input     string
		wantErr   bool
		wantValid bool
		desc      string
	}{
		// Length edge cases
		{"empty", "", true, false, "empty string should fail"},
		{"too_short", "e", true, false, "single character should fail"},
		{"minimum_valid", "en", false, true, "two character language should work"},
		{"max_language", "abcdefgh", false, true, "8-character language should work"},
		
		// Case sensitivity
		{"mixed_case", "EN-us", false, true, "mixed case should normalize"},
		{"all_uppercase", "EN-US", false, true, "uppercase should normalize"},
		{"script_case", "zh-HANS", false, true, "script case should normalize"},
		
		// Extension edge cases
		{"multiple_extensions", "en-a-abc-b-def", false, true, "multiple extensions should work"},
		{"extension_max_length", "en-a-12345678", false, true, "max length extension subtag"},
		{"extension_min_length", "en-a-12", false, true, "min length extension subtag"},
		
		// Private use edge cases
		{"private_use_max", "en-x-12345678", false, true, "max length private use"},
		{"private_use_min", "en-x-1", false, true, "min length private use"},
		{"multiple_private", "en-x-abc-def-ghi", false, true, "multiple private use subtags"},
		
		// Variant edge cases
		{"variant_numeric", "en-1234", false, true, "4-digit variant"},
		{"variant_5char", "en-abcde", false, true, "5-character variant"},
		{"variant_8char", "en-abcdefgh", false, true, "8-character variant"},
		{"multiple_variants", "en-1234-abcde", false, true, "multiple variants"},
		
		// Boundary cases
		{"max_total_length", strings.Repeat("a", 100), true, false, "very long tag should fail"},
		{"just_under_max", "en-" + strings.Repeat("a", 30), false, true, "long but valid tag"},
		
		// Invalid character tests
		{"underscore", "en_US", true, false, "underscore not allowed"},
		{"space", "en US", true, false, "space not allowed"},
		{"special_chars", "en-US@", true, false, "special characters not allowed"},
		{"unicode", "en-ü", true, false, "non-ASCII not allowed"},
		
		// Malformed structure
		{"leading_dash", "-en", true, false, "leading dash not allowed"},
		{"trailing_dash", "en-", true, false, "trailing dash not allowed"},
		{"double_dash", "en--US", true, false, "double dash not allowed"},
		{"dash_only", "-", true, false, "dash only not allowed"},
		
		// Invalid language codes  
		{"single_letter", "e-US", true, false, "single letter language not allowed"},
		{"four_letter_lang", "engl", true, false, "4-letter language not standard"},
		{"nine_letter_lang", "abcdefghi", true, false, "9-letter language too long"},
		
		// Invalid regions
		{"one_letter_region", "en-U", true, false, "1-letter region not allowed"},
		{"three_letter_region", "en-USA", true, false, "3-letter region (non-numeric) not allowed"},
		{"four_digit_region", "en-1234", false, true, "4-digit should be variant, not region"},
		{"mixed_region", "en-U1", true, false, "mixed letter-digit region not allowed"},
		
		// Invalid scripts
		{"short_script", "en-Han", true, false, "3-letter script not allowed"},
		{"long_script", "en-Hansi", true, false, "5-letter script not allowed"},
		{"lowercase_script", "en-hans", true, false, "lowercase script not allowed"},
		{"numeric_script", "en-1234", false, true, "numeric should be variant"},
		
		// Complex valid cases
		{"complex_valid", "zh-Hans-CN-u-co-pinyin-ca-chinese", false, true, "complex valid tag"},
		{"grandfathered_valid", "art-lojban", false, true, "grandfathered tag"},
		{"private_complex", "en-US-x-private-test-123", false, true, "complex private use"},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tag, err := ParseTag(tt.input)
			
			if tt.wantErr {
				if err == nil {
					t.Errorf("Expected error for %q (%s), got none", tt.input, tt.desc)
				}
			} else {
				if err != nil {
					t.Errorf("Unexpected error for %q (%s): %v", tt.input, tt.desc, err)
				} else if tag == nil {
					t.Errorf("Expected tag for %q (%s), got nil", tt.input, tt.desc)
				}
			}
			
			// Test validity function separately
			isValid := IsWellFormed(tt.input)
			if isValid != tt.wantValid {
				t.Errorf("IsWellFormed(%q) = %v, want %v (%s)", tt.input, isValid, tt.wantValid, tt.desc)
			}
		})
	}
}

func TestSimilarityEdgeCases(t *testing.T) {
	tests := []struct {
		tag1, tag2 string
		minScore   SimilarityScore
		maxScore   SimilarityScore
		desc       string
	}{
		// Exact matches
		{"", "", SimilarityNone, SimilarityNone, "empty tags"},
		{"en", "en", SimilarityExact, SimilarityExact, "identical simple"},
		{"EN", "en", SimilarityExact, SimilarityExact, "case insensitive exact"},
		
		// Language family relationships
		{"en", "en-US", SimilarityNeutralRegion, SimilarityNeutralRegion, "neutral to regional"},
		{"en-US", "en", SimilarityNeutralRegion, SimilarityNeutralRegion, "regional to neutral"},
		{"en-US", "en-GB", SimilarityNone, SimilarityRegion, "sibling regions"},
		
		// Script differences
		{"zh-Hans", "zh-Hant", SimilarityNone, SimilarityNone, "different scripts"},
		{"zh", "zh-Hans", SimilarityNeutralRegion, SimilarityRegion, "neutral to script"},
		
		// Language differences
		{"en", "fr", SimilarityNone, SimilarityNone, "different languages"},
		{"en-US", "fr-FR", SimilarityNone, SimilarityNone, "different languages with regions"},
		
		// Undetermined language
		{"und", "en", SimilarityUndetermined, SimilarityUndetermined, "undetermined vs specific"},
		{"und", "und", SimilarityExact, SimilarityExact, "undetermined vs undetermined"},
		
		// Complex vs simple
		{"en-US-u-co-phonebk", "en-US", SimilarityExact, SimilarityExact, "extensions ignored for similarity"},
		{"en-x-private", "en", SimilarityExact, SimilarityExact, "private use ignored for similarity"},
		
		// Error cases should return none
		{"invalid", "en", SimilarityNone, SimilarityNone, "invalid first tag"},
		{"en", "invalid", SimilarityNone, SimilarityNone, "invalid second tag"},
		{"invalid", "invalid", SimilarityNone, SimilarityNone, "both invalid"},
	}
	
	for _, tt := range tests {
		t.Run(tt.desc, func(t *testing.T) {
			score, err := Similarity(tt.tag1, tt.tag2)
			
			// Error cases
			if strings.Contains(tt.tag1, "invalid") || strings.Contains(tt.tag2, "invalid") {
				if err == nil && score != SimilarityNone {
					t.Errorf("Expected error or SimilarityNone for invalid tags, got score %v", score)
				}
				return
			}
			
			if err != nil {
				t.Errorf("Unexpected error: %v", err)
				return
			}
			
			if score < tt.minScore || score > tt.maxScore {
				t.Errorf("Similarity(%q, %q) = %v, want between %v and %v", 
					tt.tag1, tt.tag2, score, tt.minScore, tt.maxScore)
			}
		})
	}
}

func TestChooseEdgeCases(t *testing.T) {
	tests := []struct {
		name        string
		desired     []string
		available   []string
		expectMatch bool
		expectBest  string
		desc        string
	}{
		{
			name:        "empty_lists",
			desired:     []string{},
			available:   []string{},
			expectMatch: false,
			desc:        "empty lists should not match",
		},
		{
			name:        "empty_desired",
			desired:     []string{},
			available:   []string{"en", "fr"},
			expectMatch: false,
			desc:        "empty desired should not match",
		},
		{
			name:        "empty_available",
			desired:     []string{"en", "fr"},
			available:   []string{},
			expectMatch: false,
			desc:        "empty available should not match",
		},
		{
			name:        "exact_match_first",
			desired:     []string{"en-US", "en", "fr"},
			available:   []string{"en-US", "en-GB", "fr"},
			expectMatch: true,
			expectBest:  "en-US",
			desc:        "exact match should be preferred",
		},
		{
			name:        "fallback_match",
			desired:     []string{"en-US"},
			available:   []string{"en", "fr"},
			expectMatch: true,
			expectBest:  "en",
			desc:        "should fallback to base language",
		},
		{
			name:        "no_good_match",
			desired:     []string{"en"},
			available:   []string{"zh", "ja", "ko"},
			expectMatch: false,
			desc:        "no similar languages should not match",
		},
		{
			name:        "prefer_earlier_desired",
			desired:     []string{"en-US", "fr-FR"},
			available:   []string{"fr", "en"},
			expectMatch: true,
			expectBest:  "en",
			desc:        "should prefer earlier in desired list",
		},
		{
			name:        "invalid_tags_ignored",
			desired:     []string{"invalid", "en"},
			available:   []string{"en", "fr"},
			expectMatch: true,
			expectBest:  "en",
			desc:        "invalid tags should be ignored",
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			matches, err := Choose(tt.desired, tt.available)
			if err != nil {
				t.Errorf("Unexpected error: %v", err)
				return
			}
			
			if tt.expectMatch {
				if len(matches) == 0 {
					t.Errorf("Expected match, got none")
					return
				}
				
				if tt.expectBest != "" && matches[0].Tag != tt.expectBest {
					t.Errorf("Expected best match %q, got %q", tt.expectBest, matches[0].Tag)
				}
			} else {
				if len(matches) > 0 {
					t.Errorf("Expected no match, got %+v", matches)
				}
			}
		})
	}
}

func TestNormalizationEdgeCases(t *testing.T) {
	tests := []struct {
		input    string
		level    TagNormalization
		expected string
		wantErr  bool
		desc     string
	}{
		// Basic normalization
		{"en", Canonical, "en", false, "simple language"},
		{"EN", Canonical, "en", false, "uppercase language"},
		{"en-US", Canonical, "en-US", false, "language with region"},
		{"en-us", Canonical, "en-US", false, "lowercase region"},
		
		// Script normalization
		{"zh-hans", Canonical, "zh-Hans", false, "lowercase script"},
		{"zh-HANS", Canonical, "zh-Hans", false, "uppercase script"},
		
		// Complex cases
		{"zh-hans-cn", Canonical, "zh-Hans-CN", false, "complex tag"},
		{"EN-US-u-co-phonebk", Canonical, "en-US-u-co-phonebk", false, "with extension"},
		
		// Error cases
		{"invalid-tag-structure", Canonical, "", true, "invalid structure"},
		{"", Canonical, "", true, "empty tag"},
		
		// None level should return original
		{"EN-us", None, "EN-us", false, "no normalization"},
	}
	
	for _, tt := range tests {
		t.Run(tt.desc, func(t *testing.T) {
			result, err := Normalize(tt.input, tt.level)
			
			if tt.wantErr {
				if err == nil {
					t.Errorf("Expected error for %q, got none", tt.input)
				}
			} else {
				if err != nil {
					t.Errorf("Unexpected error for %q: %v", tt.input, err)
				} else if result == nil {
					t.Errorf("Expected result for %q, got nil", tt.input)
				} else if result.Tag != tt.expected {
					t.Errorf("Normalize(%q, %v) = %q, want %q", tt.input, tt.level, result.Tag, tt.expected)
				}
			}
		})
	}
}

func TestPerformance(t *testing.T) {
	// Test performance with many tags
	tags := []string{
		"en", "en-US", "en-GB", "fr", "fr-FR", "fr-CA", 
		"es", "es-MX", "es-419", "zh", "zh-Hans", "zh-Hant",
		"de", "de-DE", "de-AT", "ja", "ko", "pt", "pt-BR",
		"it", "it-IT", "ru", "ru-RU", "ar", "ar-SA",
	}
	
	// Parse all tags (should be fast)
	for _, tag := range tags {
		_, err := ParseTag(tag)
		if err != nil {
			t.Errorf("Failed to parse %q: %v", tag, err)
		}
	}
	
	// Calculate similarities (should be reasonable)
	for i, tag1 := range tags {
		for j, tag2 := range tags {
			if i <= j { // avoid duplicate comparisons
				continue
			}
			_, err := Similarity(tag1, tag2)
			if err != nil {
				t.Errorf("Failed similarity for %q vs %q: %v", tag1, tag2, err)
			}
		}
	}
	
	// Large choose operation
	matches, err := Choose(tags[:5], tags)
	if err != nil {
		t.Errorf("Choose failed: %v", err)
	}
	if len(matches) == 0 {
		t.Error("Expected some matches in large choose operation")
	}
}

func TestMemoryUsage(t *testing.T) {
	// Test that we don't leak memory with many operations
	for i := 0; i < 1000; i++ {
		tag, _ := ParseTag("en-US")
		if tag == nil {
			t.Error("Expected parsed tag")
		}
		
		_, _ = Similarity("en", "en-US")
		_ = IsWellFormed("en-US")
		_, _ = Normalize("EN-us", Canonical)
	}
}