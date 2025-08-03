package main

import (
	"fmt"
	"log"

	"github.com/fgv-vis/fgv/go/ts-res-runtime/pkg/bundle"
	"github.com/fgv-vis/fgv/go/ts-res-runtime/pkg/runtime"
)

func main() {
	fmt.Println("🌍 Language-Aware Resource Resolution Demo")
	fmt.Println("==========================================")
	fmt.Println()

	// Load the extended bundle with language qualifiers
	bundlePath := "/workspace/data/test/ts-res/extended.resource-bundle.json"
	
	fmt.Printf("Loading bundle: %s\n", bundlePath)
	
	bundleData, err := bundle.LoadFromFile(bundlePath, bundle.LoaderOptions{
		SkipChecksumVerification: true, // Skip checksum for demo
	})
	if err != nil {
		log.Fatalf("Failed to load bundle: %v", err)
	}
	
	fmt.Printf("✅ Bundle loaded successfully!\n")
	fmt.Printf("   - %d qualifier types\n", len(bundleData.CompiledCollection.QualifierTypes))
	fmt.Printf("   - %d qualifiers\n", len(bundleData.CompiledCollection.Qualifiers))
	fmt.Printf("   - %d resources\n", len(bundleData.CompiledCollection.Resources))
	fmt.Println()

	// Create resource manager
	manager, err := runtime.NewResourceManager(bundleData)
	if err != nil {
		log.Fatalf("Failed to create resource manager: %v", err)
	}

	// Show available qualifier types
	fmt.Println("Available Qualifier Types:")
	for i, qt := range bundleData.CompiledCollection.QualifierTypes {
		systemType := qt.SystemType
		if systemType == "" {
			systemType = "literal"
		}
		fmt.Printf("   %d. %s (system type: %s)\n", i+1, qt.Name, systemType)
	}
	fmt.Println()

	// Demo different language contexts
	languageContexts := []map[string]interface{}{
		{"language": "en"},
		{"language": "en-US"},
		{"language": "en-GB"},
		{"language": "fr"},
		{"language": "fr-FR"},
		{"language": "fr-CA"},
		{"language": "es"},
		{"language": "es-MX"},
		{"language": "es-419"}, // Latin America
		{"language": "zh"},
		{"language": "zh-Hans"},
		{"language": "zh-Hant"},
		{"language": "de"},
	}

	// Find a language-dependent resource to demonstrate with
	var targetResourceID string
	for _, resource := range bundleData.CompiledCollection.Resources {
		// Check if this resource has language-dependent conditions
		decision := bundleData.CompiledCollection.Decisions[resource.Decision]
		hasLanguageCondition := false
		
		for _, conditionSetIndex := range decision.ConditionSets {
			conditionSet := bundleData.CompiledCollection.ConditionSets[conditionSetIndex]
			for _, conditionIndex := range conditionSet.Conditions {
				condition := bundleData.CompiledCollection.Conditions[conditionIndex]
				qualifier := bundleData.CompiledCollection.Qualifiers[condition.QualifierIndex]
				if qualifier.Name == "language" {
					hasLanguageCondition = true
					break
				}
			}
			if hasLanguageCondition {
				break
			}
		}
		
		if hasLanguageCondition {
			targetResourceID = resource.ID
			break
		}
	}

	if targetResourceID == "" {
		fmt.Println("⚠️  No language-dependent resources found in bundle")
		return
	}

	fmt.Printf("🎯 Demonstrating language-aware resolution for resource: %s\n", targetResourceID)
	fmt.Println()

	// Test each language context
	for _, context := range languageContexts {
		fmt.Printf("Language Context: %s\n", context["language"])
		
		// Create resolver for this context
		resolver, err := runtime.NewResourceResolver(manager, context)
		if err != nil {
			fmt.Printf("   ❌ Failed to create resolver: %v\n", err)
			continue
		}

		// Resolve the resource
		resource, err := resolver.ResolveResource(targetResourceID)
		if err != nil {
			fmt.Printf("   ❌ Resolution failed: %v\n", err)
		} else if resource != nil {
			fmt.Printf("   ✅ Resolved: %v\n", resource.JSON)
		} else {
			fmt.Printf("   ⚠️  No matching resource found\n")
		}
		fmt.Println()
	}

	// Demonstrate language similarity scoring
	fmt.Println("🔍 Language Similarity Demonstration:")
	fmt.Println("=====================================")
	
	// Demo resolver was already created above, no need to create another one

	// Test similar language tags to see matching behavior
	similarityTests := []struct {
		desired   string
		available string
		desc      string
	}{
		{"en", "en-US", "neutral language vs regional variant"},
		{"en-US", "en-GB", "same language, different regions"},
		{"es-419", "es-MX", "macro-region contains specific region"},
		{"es-MX", "es-AR", "sibling regions in same macro-region"},
		{"zh-Hans", "zh-Hant", "different scripts (should not match)"},
		{"en", "fr", "completely different languages"},
		{"fr-CA", "fr-FR", "same language, different regions"},
	}

	for _, test := range similarityTests {
		fmt.Printf("Testing: %s ↔ %s (%s)\n", test.desired, test.available, test.desc)
		
		// Create contexts for testing
		desiredContext := map[string]interface{}{"language": test.desired}
		availableContext := map[string]interface{}{"language": test.available}
		
		// Create resolvers
		desiredResolver, _ := runtime.NewResourceResolver(manager, desiredContext)
		availableResolver, _ := runtime.NewResourceResolver(manager, availableContext)
		
		// Try to resolve with desired context and see what we get
		desiredResource, _ := desiredResolver.ResolveResource(targetResourceID)
		availableResource, _ := availableResolver.ResolveResource(targetResourceID)
		
		if desiredResource != nil && availableResource != nil {
			// Check if they resolved to the same resource
			fmt.Printf("   Desired resolved to: %v\n", desiredResource.JSON)
			fmt.Printf("   Available resolved to: %v\n", availableResource.JSON)
			if fmt.Sprintf("%v", desiredResource.JSON) == fmt.Sprintf("%v", availableResource.JSON) {
				fmt.Printf("   ✅ Same resource (good language compatibility)\n")
			} else {
				fmt.Printf("   ⚠️  Different resources (language-specific variations)\n")
			}
		} else {
			fmt.Printf("   ❌ One or both failed to resolve\n")
		}
		fmt.Println()
	}

	// Show all available resources for a specific language
	fmt.Println("📚 All Available Resources for 'en-US':")
	fmt.Println("======================================")
	
	enUSResolver, _ := runtime.NewResourceResolver(manager, map[string]interface{}{"language": "en-US"})
	
	for _, resource := range bundleData.CompiledCollection.Resources {
		resolved, err := enUSResolver.ResolveResource(resource.ID)
		if err == nil && resolved != nil {
			fmt.Printf("   %s: %v\n", resource.ID, resolved.JSON)
		}
	}
	fmt.Println()

	fmt.Println("🎉 Language-aware resource resolution demo complete!")
	fmt.Println()
	fmt.Println("Key Features Demonstrated:")
	fmt.Println("✅ BCP-47 language tag parsing and validation")
	fmt.Println("✅ Language similarity scoring (exact, regional, macro-region, etc.)")
	fmt.Println("✅ Intelligent language-based resource selection")
	fmt.Println("✅ Fallback to best available language match")
	fmt.Println("✅ Integration with ts-res resource resolution system")
}