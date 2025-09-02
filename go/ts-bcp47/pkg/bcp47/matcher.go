package bcp47

import (
	"strings"
)

// SimilarityMatcher implements language tag similarity matching
// This mirrors the TypeScript LanguageSimilarityMatcher class
type SimilarityMatcher struct {
	// TODO: Add IANA and UNSD registry references when implemented
}

// NewSimilarityMatcher creates a new similarity matcher with default registries
func NewSimilarityMatcher() *SimilarityMatcher {
	return &SimilarityMatcher{
		// TODO: Initialize with IANA and UNSD registries
	}
}

// Match calculates the similarity score between two language tags
// This mirrors the TypeScript matchLanguageTags method
func (sm *SimilarityMatcher) Match(tag1, tag2 *LanguageTag) SimilarityScore {
	// Handle grandfathered tags - they must match exactly
	if tag1.IsGrandfathered || tag2.IsGrandfathered {
		if strings.EqualFold(tag1.Tag, tag2.Tag) {
			return SimilarityExact
		}
		return SimilarityNone
	}
	
	// No primary language means private use or grandfathered, which must match exactly
	if tag1.Subtags.PrimaryLanguage == "" || tag2.Subtags.PrimaryLanguage == "" {
		if strings.EqualFold(tag1.Tag, tag2.Tag) {
			return SimilarityExact
		}
		return SimilarityNone
	}
	
	// Start with primary language match
	quality := sm.matchPrimaryLanguage(tag1, tag2)
	
	// Each subsequent match can only maintain or reduce quality
	if quality > SimilarityNone {
		quality = Min(sm.matchExtLang(tag1, tag2), quality)
	}
	
	if quality > SimilarityNone {
		quality = Min(sm.matchScript(tag1, tag2), quality)
	}
	
	if quality > SimilarityNone {
		quality = Min(sm.matchRegion(tag1, tag2), quality)
	}
	
	if quality > SimilarityNone {
		quality = Min(sm.matchVariants(tag1, tag2), quality)
	}
	
	if quality > SimilarityNone {
		quality = Min(sm.matchExtensions(tag1, tag2), quality)
	}
	
	if quality > SimilarityNone {
		quality = Min(sm.matchPrivateUse(tag1, tag2), quality)
	}
	
	return quality
}

// matchPrimaryLanguage compares the primary language subtags
func (sm *SimilarityMatcher) matchPrimaryLanguage(tag1, tag2 *LanguageTag) SimilarityScore {
	lang1 := strings.ToLower(tag1.Subtags.PrimaryLanguage)
	lang2 := strings.ToLower(tag2.Subtags.PrimaryLanguage)
	
	if lang1 == lang2 {
		return SimilarityExact
	}
	
	// Handle undetermined language
	if tag1.IsUndetermined || tag2.IsUndetermined {
		return SimilarityUndetermined
	}
	
	// TODO: Add macro language and related language matching using IANA registry
	
	return SimilarityNone
}

// matchExtLang compares extended language subtags
func (sm *SimilarityMatcher) matchExtLang(tag1, tag2 *LanguageTag) SimilarityScore {
	extlangs1 := tag1.Subtags.ExtLangs
	extlangs2 := tag2.Subtags.ExtLangs
	
	// Must have same number of extlangs
	if len(extlangs1) != len(extlangs2) {
		return SimilarityNone
	}
	
	// All extlangs must match exactly
	for i := 0; i < len(extlangs1); i++ {
		if strings.ToLower(extlangs1[i]) != strings.ToLower(extlangs2[i]) {
			return SimilarityNone
		}
	}
	
	return SimilarityExact
}

// matchScript compares script subtags
func (sm *SimilarityMatcher) matchScript(tag1, tag2 *LanguageTag) SimilarityScore {
	script1 := tag1.Subtags.Script
	script2 := tag2.Subtags.Script
	
	// If both have scripts, they must match
	if script1 != "" && script2 != "" {
		if strings.EqualFold(script1, script2) {
			return SimilarityExact
		}
		return SimilarityNone
	}
	
	// If only one has a script, check if it's the default script for the language
	// TODO: Implement suppress-script logic using IANA registry
	// For now, treat missing script as compatible
	
	return SimilarityExact
}

// matchRegion compares region subtags
func (sm *SimilarityMatcher) matchRegion(tag1, tag2 *LanguageTag) SimilarityScore {
	region1 := tag1.Subtags.Region
	region2 := tag2.Subtags.Region
	
	// Exact match
	if region1 != "" && region2 != "" {
		if strings.EqualFold(region1, region2) {
			return SimilarityExact
		}
		
		// Check for macro-region relationships
		if sm.isMacroRegionMatch(region1, region2) {
			return SimilarityMacroRegion
		}
		
		// Check for sibling regions (same macro-region)
		if sm.areSiblingRegions(region1, region2) {
			return SimilaritySibling
		}
		
		return SimilarityNone
	}
	
	// One has region, other doesn't - neutral match
	if (region1 != "") != (region2 != "") {
		return SimilarityNeutralRegion
	}
	
	// Neither has region
	return SimilarityExact
}

// matchVariants compares variant subtags
func (sm *SimilarityMatcher) matchVariants(tag1, tag2 *LanguageTag) SimilarityScore {
	variants1 := tag1.Subtags.Variants
	variants2 := tag2.Subtags.Variants
	
	// If both have no variants, perfect match
	if len(variants1) == 0 && len(variants2) == 0 {
		return SimilarityExact
	}
	
	// If only one has variants, variant-level match
	if len(variants1) == 0 || len(variants2) == 0 {
		return SimilarityVariant
	}
	
	// Both have variants - they must match exactly
	if len(variants1) != len(variants2) {
		return SimilarityVariant
	}
	
	// Create normalized sets for comparison
	set1 := make(map[string]bool)
	for _, v := range variants1 {
		set1[strings.ToLower(v)] = true
	}
	
	set2 := make(map[string]bool)
	for _, v := range variants2 {
		set2[strings.ToLower(v)] = true
	}
	
	// Check if sets are equal
	if len(set1) != len(set2) {
		return SimilarityVariant
	}
	
	for v := range set1 {
		if !set2[v] {
			return SimilarityVariant
		}
	}
	
	return SimilarityExact
}

// matchExtensions compares extension subtags
func (sm *SimilarityMatcher) matchExtensions(tag1, tag2 *LanguageTag) SimilarityScore {
	ext1 := tag1.Subtags.Extensions
	ext2 := tag2.Subtags.Extensions
	
	// If both have no extensions, perfect match
	if len(ext1) == 0 && len(ext2) == 0 {
		return SimilarityExact
	}
	
	// If only one has extensions, apply penalty
	if len(ext1) == 0 || len(ext2) == 0 {
		penalty := ExtensionMismatchPenalty * float64(max(len(ext1), len(ext2)))
		return SimilarityScore(float64(SimilarityExact) - penalty)
	}
	
	// Both have extensions - check for matches
	penalties := 0.0
	
	// Find all unique singletons
	allSingletons := make(map[string]bool)
	for singleton := range ext1 {
		allSingletons[singleton] = true
	}
	for singleton := range ext2 {
		allSingletons[singleton] = true
	}
	
	// Compare each singleton
	for singleton := range allSingletons {
		subtags1, exists1 := ext1[singleton]
		subtags2, exists2 := ext2[singleton]
		
		if !exists1 || !exists2 {
			// Extension exists in only one tag
			penalties += ExtensionMismatchPenalty
			continue
		}
		
		// Both have this extension - subtags must match
		if !stringSlicesEqual(subtags1, subtags2) {
			penalties += ExtensionMismatchPenalty
		}
	}
	
	score := float64(SimilarityExact) - penalties
	if score < 0 {
		score = 0
	}
	
	return SimilarityScore(score)
}

// matchPrivateUse compares private use subtags
func (sm *SimilarityMatcher) matchPrivateUse(tag1, tag2 *LanguageTag) SimilarityScore {
	private1 := tag1.Subtags.PrivateUse
	private2 := tag2.Subtags.PrivateUse
	
	// If both have no private use, perfect match
	if len(private1) == 0 && len(private2) == 0 {
		return SimilarityExact
	}
	
	// If only one has private use, apply penalty
	if len(private1) == 0 || len(private2) == 0 {
		penalty := PrivateUseMismatchPenalty * float64(max(len(private1), len(private2)))
		return SimilarityScore(float64(SimilarityExact) - penalty)
	}
	
	// Both have private use - they must match exactly
	if stringSlicesEqual(private1, private2) {
		return SimilarityExact
	}
	
	// Different private use subtags
	penalty := PrivateUseMismatchPenalty * float64(max(len(private1), len(private2)))
	score := float64(SimilarityExact) - penalty
	if score < 0 {
		score = 0
	}
	
	return SimilarityScore(score)
}

// isMacroRegionMatch checks if one region is a macro-region containing the other
func (sm *SimilarityMatcher) isMacroRegionMatch(region1, region2 string) bool {
	// TODO: Implement using UNSD M.49 region codes
	// For now, implement basic known macro-regions
	
	macroRegions := map[string][]string{
		"419": {"MX", "AR", "BR", "CL", "CO", "EC", "PE", "UY", "VE"}, // Latin America
		"150": {"DE", "FR", "IT", "ES", "PL", "NL", "BE", "GR"},       // Europe
		"142": {"CN", "JP", "KR", "IN", "TH", "VN", "SG"},            // Asia
	}
	
	// Check if region1 is a macro-region containing region2
	if contained, exists := macroRegions[region1]; exists {
		for _, country := range contained {
			if strings.EqualFold(country, region2) {
				return true
			}
		}
	}
	
	// Check if region2 is a macro-region containing region1
	if contained, exists := macroRegions[region2]; exists {
		for _, country := range contained {
			if strings.EqualFold(country, region1) {
				return true
			}
		}
	}
	
	return false
}

// areSiblingRegions checks if two regions are siblings (in the same macro-region)
func (sm *SimilarityMatcher) areSiblingRegions(region1, region2 string) bool {
	// TODO: Implement using UNSD M.49 region codes
	// For now, implement basic known macro-regions
	
	macroRegions := [][]string{
		{"MX", "AR", "BR", "CL", "CO", "EC", "PE", "UY", "VE"}, // Latin America
		{"DE", "FR", "IT", "ES", "PL", "NL", "BE", "GR"},       // Europe
		{"CN", "JP", "KR", "IN", "TH", "VN", "SG"},            // Asia
		{"US", "CA"},                                           // North America
		{"AU", "NZ"},                                           // Oceania
	}
	
	for _, regions := range macroRegions {
		found1, found2 := false, false
		for _, region := range regions {
			if strings.EqualFold(region, region1) {
				found1 = true
			}
			if strings.EqualFold(region, region2) {
				found2 = true
			}
		}
		if found1 && found2 {
			return true
		}
	}
	
	return false
}

// Helper functions

// stringSlicesEqual compares two string slices for equality (order-independent)
func stringSlicesEqual(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}
	
	// Create normalized sets
	setA := make(map[string]bool)
	for _, s := range a {
		setA[strings.ToLower(s)] = true
	}
	
	setB := make(map[string]bool)
	for _, s := range b {
		setB[strings.ToLower(s)] = true
	}
	
	// Compare sets
	for s := range setA {
		if !setB[s] {
			return false
		}
	}
	
	return true
}

// max returns the maximum of two integers
func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}