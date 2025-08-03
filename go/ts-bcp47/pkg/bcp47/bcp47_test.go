package bcp47

import (
	"testing"
)

func TestParseTag(t *testing.T) {
	tests := []struct {
		input    string
		expected Subtags
		wantErr  bool
	}{
		// Basic language tags
		{"en", Subtags{PrimaryLanguage: "en"}, false},
		{"fr", Subtags{PrimaryLanguage: "fr"}, false},
		{"zh", Subtags{PrimaryLanguage: "zh"}, false},
		
		// Language with region
		{"en-US", Subtags{PrimaryLanguage: "en", Region: "US"}, false},
		{"fr-FR", Subtags{PrimaryLanguage: "fr", Region: "FR"}, false},
		{"es-MX", Subtags{PrimaryLanguage: "es", Region: "MX"}, false},
		
		// Language with script
		{"zh-Hans", Subtags{PrimaryLanguage: "zh", Script: "Hans"}, false},
		{"zh-Hant", Subtags{PrimaryLanguage: "zh", Script: "Hant"}, false},
		
		// Language with script and region
		{"zh-Hans-CN", Subtags{PrimaryLanguage: "zh", Script: "Hans", Region: "CN"}, false},
		{"zh-Hant-HK", Subtags{PrimaryLanguage: "zh", Script: "Hant", Region: "HK"}, false},
		
		// Language with variants
		{"ca-valencia", Subtags{PrimaryLanguage: "ca", Variants: []string{"valencia"}}, false},
		{"en-US-oxendict", Subtags{PrimaryLanguage: "en", Region: "US", Variants: []string{"oxendict"}}, false},
		
		// Language with extensions
		{"en-US-u-co-phonebk", Subtags{
			PrimaryLanguage: "en",
			Region:          "US",
			Extensions:      map[string][]string{"u": {"co", "phonebk"}},
		}, false},
		
		// Language with private use
		{"en-x-mycompany", Subtags{
			PrimaryLanguage: "en",
			PrivateUse:      []string{"mycompany"},
		}, false},
		
		// Complex tags
		{"zh-Hans-CN-u-ca-chinese-co-pinyin", Subtags{
			PrimaryLanguage: "zh",
			Script:          "Hans",
			Region:          "CN",
			Extensions:      map[string][]string{"u": {"ca", "chinese", "co", "pinyin"}},
		}, false},
		
		// Grandfathered tags
		{"art-lojban", Subtags{Grandfathered: "art-lojban"}, false},
		{"i-klingon", Subtags{Grandfathered: "i-klingon"}, false},
		
		// Error cases
		{"", Subtags{}, true},                    // Empty tag
		{"e", Subtags{}, true},                   // Too short language
		{"eng", Subtags{}, true},                 // Invalid 3-letter language
		{"en-", Subtags{}, true},                 // Trailing dash
		{"en--US", Subtags{}, true},              // Double dash
		{"en-U", Subtags{}, true},                // Invalid region (too short)
		{"en-USA", Subtags{}, true},              // Invalid region (3 letters, not digits)
		{"en-US-valencia-valencia", Subtags{}, true}, // Duplicate variant
	}
	
	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			tag, err := ParseTag(tt.input)
			
			if tt.wantErr {
				if err == nil {
					t.Errorf("ParseTag(%q) expected error, got none", tt.input)
				}
				return
			}
			
			if err != nil {
				t.Errorf("ParseTag(%q) unexpected error: %v", tt.input, err)
				return
			}
			
			// Check primary language
			if tag.Subtags.PrimaryLanguage != tt.expected.PrimaryLanguage {
				t.Errorf("PrimaryLanguage: got %q, want %q", tag.Subtags.PrimaryLanguage, tt.expected.PrimaryLanguage)
			}
			
			// Check script
			if tag.Subtags.Script != tt.expected.Script {
				t.Errorf("Script: got %q, want %q", tag.Subtags.Script, tt.expected.Script)
			}
			
			// Check region
			if tag.Subtags.Region != tt.expected.Region {
				t.Errorf("Region: got %q, want %q", tag.Subtags.Region, tt.expected.Region)
			}
			
			// Check grandfathered
			if tag.Subtags.Grandfathered != tt.expected.Grandfathered {
				t.Errorf("Grandfathered: got %q, want %q", tag.Subtags.Grandfathered, tt.expected.Grandfathered)
			}
			
			// Check variants
			if len(tag.Subtags.Variants) != len(tt.expected.Variants) {
				t.Errorf("Variants length: got %d, want %d", len(tag.Subtags.Variants), len(tt.expected.Variants))
			} else {
				for i, variant := range tag.Subtags.Variants {
					if variant != tt.expected.Variants[i] {
						t.Errorf("Variant[%d]: got %q, want %q", i, variant, tt.expected.Variants[i])
					}
				}
			}
			
			// Check extensions
			if len(tag.Subtags.Extensions) != len(tt.expected.Extensions) {
				t.Errorf("Extensions length: got %d, want %d", len(tag.Subtags.Extensions), len(tt.expected.Extensions))
			} else {
				for singleton, subtags := range tt.expected.Extensions {
					gotSubtags, exists := tag.Subtags.Extensions[singleton]
					if !exists {
						t.Errorf("Extension %q missing", singleton)
						continue
					}
					if len(gotSubtags) != len(subtags) {
						t.Errorf("Extension %q subtags length: got %d, want %d", singleton, len(gotSubtags), len(subtags))
						continue
					}
					for i, subtag := range subtags {
						if gotSubtags[i] != subtag {
							t.Errorf("Extension %q subtag[%d]: got %q, want %q", singleton, i, gotSubtags[i], subtag)
						}
					}
				}
			}
			
			// Check private use
			if len(tag.Subtags.PrivateUse) != len(tt.expected.PrivateUse) {
				t.Errorf("PrivateUse length: got %d, want %d", len(tag.Subtags.PrivateUse), len(tt.expected.PrivateUse))
			} else {
				for i, pu := range tag.Subtags.PrivateUse {
					if pu != tt.expected.PrivateUse[i] {
						t.Errorf("PrivateUse[%d]: got %q, want %q", i, pu, tt.expected.PrivateUse[i])
					}
				}
			}
		})
	}
}

func TestSimilarity(t *testing.T) {
	tests := []struct {
		tag1     string
		tag2     string
		expected SimilarityScore
		desc     string
	}{
		// Exact matches
		{"en", "en", SimilarityExact, "identical simple tags"},
		{"en-US", "en-US", SimilarityExact, "identical complex tags"},
		{"zh-Hans-CN", "zh-Hans-CN", SimilarityExact, "identical with script and region"},
		
		// Case insensitive matches
		{"en-us", "en-US", SimilarityExact, "case insensitive match"},
		{"EN-US", "en-us", SimilarityExact, "case insensitive match (reversed)"},
		
		// Region-level matches
		{"es", "es-MX", SimilarityNeutralRegion, "neutral vs regional"},
		{"es-MX", "es", SimilarityNeutralRegion, "regional vs neutral"},
		
		// Macro-region matches
		{"es-419", "es-MX", SimilarityMacroRegion, "macro-region contains specific region"},
		{"es-MX", "es-419", SimilarityMacroRegion, "specific region to macro-region"},
		
		// Sibling region matches
		{"es-MX", "es-AR", SimilaritySibling, "sibling regions in Latin America"},
		{"de-DE", "fr-FR", SimilarityNone, "different languages"},
		
		// Different scripts
		{"zh-Hans", "zh-Hant", SimilarityNone, "different scripts"},
		
		// Undetermined language
		{"und", "en", SimilarityUndetermined, "undetermined language"},
		{"en", "und", SimilarityUndetermined, "undetermined language (reversed)"},
		
		// No matches
		{"en", "zh", SimilarityNone, "completely different languages"},
		{"en-US", "zh-CN", SimilarityNone, "different languages with regions"},
		
		// Variant matches
		{"ca", "ca-valencia", SimilarityVariant, "base language vs variant"},
		{"ca-valencia", "ca", SimilarityVariant, "variant vs base language"},
		
		// Grandfathered tags
		{"art-lojban", "art-lojban", SimilarityExact, "identical grandfathered"},
		{"art-lojban", "i-klingon", SimilarityNone, "different grandfathered"},
		{"art-lojban", "en", SimilarityNone, "grandfathered vs normal"},
	}
	
	for _, tt := range tests {
		t.Run(tt.desc, func(t *testing.T) {
			score, err := Similarity(tt.tag1, tt.tag2)
			if err != nil {
				t.Errorf("Similarity(%q, %q) unexpected error: %v", tt.tag1, tt.tag2, err)
				return
			}
			
			if score != tt.expected {
				t.Errorf("Similarity(%q, %q) = %f, want %f", tt.tag1, tt.tag2, score, tt.expected)
			}
		})
	}
}

func TestNormalization(t *testing.T) {
	tests := []struct {
		input    string
		level    TagNormalization
		expected string
		desc     string
	}{
		{"en-us", Canonical, "en-US", "canonical case normalization"},
		{"EN-US", Canonical, "en-US", "canonical case normalization (uppercase)"},
		{"zh-hans-cn", Canonical, "zh-Hans-CN", "canonical script and region case"},
		{"es-valencia", Canonical, "es-valencia", "canonical variant case"},
	}
	
	for _, tt := range tests {
		t.Run(tt.desc, func(t *testing.T) {
			tag, err := Normalize(tt.input, tt.level)
			if err != nil {
				t.Errorf("Normalize(%q, %v) unexpected error: %v", tt.input, tt.level, err)
				return
			}
			
			if tag.Tag != tt.expected {
				t.Errorf("Normalize(%q, %v) = %q, want %q", tt.input, tt.level, tag.Tag, tt.expected)
			}
		})
	}
}

func TestChoose(t *testing.T) {
	desired := []string{"en-GB", "en-US", "fr"}
	available := []string{"en-US", "es", "de", "en", "fr-FR"}
	
	matches, err := Choose(desired, available)
	if err != nil {
		t.Errorf("Choose() unexpected error: %v", err)
		return
	}
	
	if len(matches) == 0 {
		t.Error("Choose() returned no matches")
		return
	}
	
	// First match should be the best - en-US matches en-US exactly
	if matches[0].Tag != "en-US" {
		t.Errorf("Choose() first match = %q, want %q", matches[0].Tag, "en-US")
	}
}

func TestValidation(t *testing.T) {
	tests := []struct {
		tag      string
		expected bool
		desc     string
	}{
		{"en", true, "simple language"},
		{"en-US", true, "language with region"},
		{"zh-Hans-CN", true, "language with script and region"},
		{"", false, "empty tag"},
		{"e", false, "too short"},
		{"eng", false, "invalid 3-letter language code"},
		{"en-", false, "trailing dash"},
		{"en-USA", false, "invalid region"},
	}
	
	for _, tt := range tests {
		t.Run(tt.desc, func(t *testing.T) {
			result := IsWellFormed(tt.tag)
			if result != tt.expected {
				t.Errorf("IsWellFormed(%q) = %v, want %v", tt.tag, result, tt.expected)
			}
		})
	}
}

func TestExtractors(t *testing.T) {
	tag := "zh-Hans-CN"
	
	// Test ExtractLanguage
	lang, err := ExtractLanguage(tag)
	if err != nil {
		t.Errorf("ExtractLanguage(%q) unexpected error: %v", tag, err)
	}
	if lang != "zh" {
		t.Errorf("ExtractLanguage(%q) = %q, want %q", tag, lang, "zh")
	}
	
	// Test ExtractScript
	script, err := ExtractScript(tag)
	if err != nil {
		t.Errorf("ExtractScript(%q) unexpected error: %v", tag, err)
	}
	if script != "Hans" {
		t.Errorf("ExtractScript(%q) = %q, want %q", tag, script, "Hans")
	}
	
	// Test ExtractRegion
	region, err := ExtractRegion(tag)
	if err != nil {
		t.Errorf("ExtractRegion(%q) unexpected error: %v", tag, err)
	}
	if region != "CN" {
		t.Errorf("ExtractRegion(%q) = %q, want %q", tag, region, "CN")
	}
}

func TestHelperFunctions(t *testing.T) {
	// Test HasRegion
	if !HasRegion("en-US") {
		t.Error("HasRegion('en-US') should be true")
	}
	if HasRegion("en") {
		t.Error("HasRegion('en') should be false")
	}
	
	// Test HasScript
	if !HasScript("zh-Hans") {
		t.Error("HasScript('zh-Hans') should be true")
	}
	if HasScript("en") {
		t.Error("HasScript('en') should be false")
	}
	
	// Test IsUndetermined
	if !IsUndetermined("und") {
		t.Error("IsUndetermined('und') should be true")
	}
	if IsUndetermined("en") {
		t.Error("IsUndetermined('en') should be false")
	}
}

func TestSubtagsToString(t *testing.T) {
	tests := []struct {
		subtags  Subtags
		expected string
		desc     string
	}{
		{
			Subtags{PrimaryLanguage: "en"},
			"en",
			"simple language",
		},
		{
			Subtags{PrimaryLanguage: "en", Region: "US"},
			"en-US",
			"language with region",
		},
		{
			Subtags{PrimaryLanguage: "zh", Script: "Hans", Region: "CN"},
			"zh-Hans-CN",
			"language with script and region",
		},
		{
			Subtags{PrimaryLanguage: "ca", Variants: []string{"valencia"}},
			"ca-valencia",
			"language with variant",
		},
		{
			Subtags{
				PrimaryLanguage: "en",
				Extensions:      map[string][]string{"u": {"co", "phonebk"}},
			},
			"en-u-co-phonebk",
			"language with extension",
		},
		{
			Subtags{
				PrimaryLanguage: "en",
				PrivateUse:      []string{"mycompany"},
			},
			"en-x-mycompany",
			"language with private use",
		},
		{
			Subtags{Grandfathered: "art-lojban"},
			"art-lojban",
			"grandfathered tag",
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.desc, func(t *testing.T) {
			result := SubtagsToString(tt.subtags)
			if result != tt.expected {
				t.Errorf("SubtagsToString() = %q, want %q", result, tt.expected)
			}
		})
	}
}

func TestMatchingFunctions(t *testing.T) {
	// Test ExactMatch
	exact, err := ExactMatch("en-US", "en-US")
	if err != nil {
		t.Errorf("ExactMatch() unexpected error: %v", err)
	}
	if !exact {
		t.Error("ExactMatch('en-US', 'en-US') should be true")
	}
	
	exact, err = ExactMatch("en-US", "en-GB")
	if err != nil {
		t.Errorf("ExactMatch() unexpected error: %v", err)
	}
	if exact {
		t.Error("ExactMatch('en-US', 'en-GB') should be false")
	}
	
	// Test AnyMatch
	any, err := AnyMatch("es", "es-MX")
	if err != nil {
		t.Errorf("AnyMatch() unexpected error: %v", err)
	}
	if !any {
		t.Error("AnyMatch('es', 'es-MX') should be true")
	}
	
	any, err = AnyMatch("en", "zh")
	if err != nil {
		t.Errorf("AnyMatch() unexpected error: %v", err)
	}
	if any {
		t.Error("AnyMatch('en', 'zh') should be false")
	}
}

func TestFilterFunctions(t *testing.T) {
	tags := []string{"en-US", "en-GB", "fr-FR", "es-MX", "de-DE"}
	
	// Test FilterByLanguage
	englishTags, err := FilterByLanguage(tags, "en")
	if err != nil {
		t.Errorf("FilterByLanguage() unexpected error: %v", err)
	}
	
	expected := []string{"en-US", "en-GB"}
	if len(englishTags) != len(expected) {
		t.Errorf("FilterByLanguage() length = %d, want %d", len(englishTags), len(expected))
	}
	
	// Test GetSupportedLanguages
	languages, err := GetSupportedLanguages(tags)
	if err != nil {
		t.Errorf("GetSupportedLanguages() unexpected error: %v", err)
	}
	
	expectedLanguages := []string{"de", "en", "es", "fr"}
	if len(languages) != len(expectedLanguages) {
		t.Errorf("GetSupportedLanguages() length = %d, want %d", len(languages), len(expectedLanguages))
	}
	
	for i, lang := range expectedLanguages {
		if languages[i] != lang {
			t.Errorf("GetSupportedLanguages()[%d] = %q, want %q", i, languages[i], lang)
		}
	}
}