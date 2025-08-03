package main

import (
	"fmt"
	"log"

	"github.com/fgv-vis/fgv/go/ts-bcp47/pkg/bcp47"
)

func main() {
	fmt.Println("🌍 ts-bcp47 Go Demo")
	fmt.Println("==================")
	fmt.Println()

	// Demo 1: Basic parsing
	fmt.Println("1. Basic Language Tag Parsing:")
	tags := []string{"en", "en-US", "zh-Hans-CN", "ca-valencia", "es-419"}
	
	for _, tag := range tags {
		parsed, err := bcp47.ParseTag(tag)
		if err != nil {
			fmt.Printf("   ❌ %s: %v\n", tag, err)
			continue
		}
		
		fmt.Printf("   ✅ %s -> Language: %s", tag, parsed.Subtags.PrimaryLanguage)
		if parsed.Subtags.Script != "" {
			fmt.Printf(", Script: %s", parsed.Subtags.Script)
		}
		if parsed.Subtags.Region != "" {
			fmt.Printf(", Region: %s", parsed.Subtags.Region)
		}
		if len(parsed.Subtags.Variants) > 0 {
			fmt.Printf(", Variants: %v", parsed.Subtags.Variants)
		}
		fmt.Println()
	}
	fmt.Println()

	// Demo 2: Similarity matching
	fmt.Println("2. Language Tag Similarity:")
	similarities := [][]string{
		{"en-US", "en-US"},         // Exact match
		{"en-US", "en-GB"},         // Same language, different region
		{"es", "es-MX"},            // Neutral vs regional
		{"es-419", "es-MX"},        // Macro-region match
		{"es-MX", "es-AR"},         // Sibling regions
		{"zh-Hans", "zh-Hant"},     // Different scripts
		{"en", "fr"},               // Different languages
		{"und", "en"},              // Undetermined language
	}
	
	for _, pair := range similarities {
		score, err := bcp47.Similarity(pair[0], pair[1])
		if err != nil {
			fmt.Printf("   ❌ %s ↔ %s: %v\n", pair[0], pair[1], err)
			continue
		}
		
		fmt.Printf("   %s ↔ %s: %.2f (%s)\n", 
			pair[0], pair[1], score, score.String())
	}
	fmt.Println()

	// Demo 3: Language matching
	fmt.Println("3. Language Matching (Choose best matches):")
	desired := []string{"en-GB", "en-US", "fr-FR"}
	available := []string{"en-US", "en", "es", "de", "fr-CA", "zh"}
	
	fmt.Printf("   Desired: %v\n", desired)
	fmt.Printf("   Available: %v\n", available)
	
	matches, err := bcp47.Choose(desired, available)
	if err != nil {
		log.Printf("   ❌ Error: %v\n", err)
	} else {
		fmt.Println("   Best matches (ordered):")
		for i, match := range matches {
			fmt.Printf("     %d. %s\n", i+1, match.Tag)
		}
	}
	fmt.Println()

	// Demo 4: Normalization
	fmt.Println("4. Language Tag Normalization:")
	unnormalized := []string{"en-us", "zh-hans-cn", "ES-mx", "FR-fr"}
	
	for _, tag := range unnormalized {
		normalized, err := bcp47.ToCanonical(tag)
		if err != nil {
			fmt.Printf("   ❌ %s: %v\n", tag, err)
			continue
		}
		fmt.Printf("   %s → %s\n", tag, normalized.Tag)
	}
	fmt.Println()

	// Demo 5: Utility functions
	fmt.Println("5. Utility Functions:")
	testTag := "zh-Hans-CN"
	
	lang, _ := bcp47.ExtractLanguage(testTag)
	script, _ := bcp47.ExtractScript(testTag)
	region, _ := bcp47.ExtractRegion(testTag)
	
	fmt.Printf("   Tag: %s\n", testTag)
	fmt.Printf("   Language: %s\n", lang)
	fmt.Printf("   Script: %s\n", script) 
	fmt.Printf("   Region: %s\n", region)
	fmt.Printf("   Has script: %t\n", bcp47.HasScript(testTag))
	fmt.Printf("   Has region: %t\n", bcp47.HasRegion(testTag))
	fmt.Printf("   Is undetermined: %t\n", bcp47.IsUndetermined(testTag))
	fmt.Println()

	// Demo 6: Language filtering
	fmt.Println("6. Language Filtering:")
	allTags := []string{"en-US", "en-GB", "fr-FR", "fr-CA", "es-MX", "es-ES", "de-DE", "zh-CN"}
	
	languages, _ := bcp47.GetSupportedLanguages(allTags)
	fmt.Printf("   Supported languages: %v\n", languages)
	
	englishTags, _ := bcp47.FilterByLanguage(allTags, "en")
	fmt.Printf("   English variants: %v\n", englishTags)
	
	frenchTags, _ := bcp47.FilterByLanguage(allTags, "fr")
	fmt.Printf("   French variants: %v\n", frenchTags)
	fmt.Println()

	fmt.Println("🎉 Demo complete! The ts-bcp47 Go package is working.")
}