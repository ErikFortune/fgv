package runtime

import (
	"testing"

	"github.com/fgv-vis/fgv/go/ts-res-runtime/pkg/bundle"
	"github.com/fgv-vis/fgv/go/ts-res-runtime/pkg/types"
)

// Helper function to create a test bundle
func createTestBundle() *types.Bundle {
	return &types.Bundle{
		Metadata: types.BundleMetadata{
			Checksum: "test-checksum",
			Version:  stringPtr("1.0.0"),
		},
		Config: types.SystemConfiguration{
			QualifierTypes: []types.CompiledQualifierType{
				{Name: "language", SystemType: "language"},
				{Name: "territory", SystemType: "territory"},
				{Name: "role", SystemType: "literal"},
			},
			Qualifiers: []types.CompiledQualifier{
				{Name: "language", Type: 0, DefaultPriority: 1},
				{Name: "territory", Type: 1, DefaultPriority: 2},
				{Name: "role", Type: 2, DefaultPriority: 3},
			},
			ResourceTypes: []types.CompiledResourceType{
				{Name: "text"},
			},
		},
		CompiledCollection: types.CompiledResourceCollection{
			QualifierTypes: []types.CompiledQualifierType{
				{Name: "language", SystemType: "language"},
				{Name: "territory", SystemType: "territory"},
				{Name: "role", SystemType: "literal"},
			},
			Qualifiers: []types.CompiledQualifier{
				{Name: "language", Type: 0, DefaultPriority: 1},
				{Name: "territory", Type: 1, DefaultPriority: 2},
				{Name: "role", Type: 2, DefaultPriority: 3},
			},
			ResourceTypes: []types.CompiledResourceType{
				{Name: "text"},
			},
			Conditions: []types.CompiledCondition{
				{QualifierIndex: 0, Value: "en", Priority: 1},      // condition 0: language=en
				{QualifierIndex: 0, Value: "fr", Priority: 1},      // condition 1: language=fr
				{QualifierIndex: 1, Value: "US", Priority: 2},      // condition 2: territory=US
				{QualifierIndex: 1, Value: "CA", Priority: 2},      // condition 3: territory=CA
				{QualifierIndex: 2, Value: "admin", Priority: 3},   // condition 4: role=admin
			},
			ConditionSets: []types.CompiledConditionSet{
				{Conditions: []int{0}},    // conditionSet 0: language=en
				{Conditions: []int{1}},    // conditionSet 1: language=fr
				{Conditions: []int{0, 2}}, // conditionSet 2: language=en AND territory=US
				{Conditions: []int{1, 3}}, // conditionSet 3: language=fr AND territory=CA
				{Conditions: []int{4}},    // conditionSet 4: role=admin
			},
			Decisions: []types.CompiledAbstractDecision{
				{ConditionSets: []int{0}},       // decision 0: English
				{ConditionSets: []int{1}},       // decision 1: French
				{ConditionSets: []int{2}},       // decision 2: English US
				{ConditionSets: []int{3}},       // decision 3: French Canada
				{ConditionSets: []int{0, 4}},    // decision 4: English OR admin
			},
			Resources: []types.CompiledResource{
				{
					ID:       "greeting",
					Type:     0,
					Decision: 0,
					Candidates: []types.CompiledCandidate{
						{JSON: "Hello", IsPartial: false},
					},
				},
				{
					ID:       "greeting",
					Type:     0,
					Decision: 1,
					Candidates: []types.CompiledCandidate{
						{JSON: "Bonjour", IsPartial: false},
					},
				},
				{
					ID:       "greeting",
					Type:     0,
					Decision: 2,
					Candidates: []types.CompiledCandidate{
						{JSON: "Hello America!", IsPartial: false},
					},
				},
				{
					ID:       "farewell",
					Type:     0,
					Decision: 4,
					Candidates: []types.CompiledCandidate{
						{JSON: "Goodbye", IsPartial: false},
					},
				},
			},
		},
	}
}

func stringPtr(s string) *string {
	return &s
}

func TestNewResourceManager(t *testing.T) {
	bundle := createTestBundle()
	
	manager, err := NewResourceManager(bundle)
	if err != nil {
		t.Fatalf("Failed to create resource manager: %v", err)
	}
	
	if manager == nil {
		t.Fatal("Resource manager is nil")
	}
	
	// Check that the manager has the expected structure
	if len(manager.qualifierTypes) != 3 {
		t.Errorf("Expected 3 qualifier types, got %d", len(manager.qualifierTypes))
	}
	
	if len(manager.qualifiers) != 3 {
		t.Errorf("Expected 3 qualifiers, got %d", len(manager.qualifiers))
	}
	
	if len(manager.bundle.CompiledCollection.Resources) != 4 {
		t.Errorf("Expected 4 resources, got %d", len(manager.bundle.CompiledCollection.Resources))
	}
}

func TestNewResourceResolver(t *testing.T) {
	bundle := createTestBundle()
	manager, err := NewResourceManager(bundle)
	if err != nil {
		t.Fatalf("Failed to create resource manager: %v", err)
	}
	
	context := map[string]interface{}{
		"language": "en",
		"territory": "US",
	}
	
	resolver, err := NewResourceResolver(manager, context)
	if err != nil {
		t.Fatalf("Failed to create resource resolver: %v", err)
	}
	
	if resolver == nil {
		t.Fatal("Resource resolver is nil")
	}
	
	// Check that the resolver has the expected qualifier types
	if len(resolver.qualifierTypes) != 3 {
		t.Errorf("Expected 3 qualifier types in resolver, got %d", len(resolver.qualifierTypes))
	}
}

func TestResourceResolverBasicResolution(t *testing.T) {
	bundle := createTestBundle()
	manager, err := NewResourceManager(bundle)
	if err != nil {
		t.Fatalf("Failed to create resource manager: %v", err)
	}
	
	tests := []struct {
		name           string
		context        map[string]interface{}
		resourceID     string
		expectedValue  interface{}
		expectError    bool
	}{
		{
			name:          "English greeting",
			context:       map[string]interface{}{"language": "en"},
			resourceID:    "greeting",
			expectedValue: "Hello",
			expectError:   false,
		},
		{
			name:          "French greeting",
			context:       map[string]interface{}{"language": "fr"},
			resourceID:    "greeting",
			expectedValue: "Bonjour",
			expectError:   false,
		},
		{
			name:          "English US greeting (more specific)",
			context:       map[string]interface{}{"language": "en", "territory": "US"},
			resourceID:    "greeting",
			expectedValue: "Hello America!",
			expectError:   false,
		},
		{
			name:          "Admin farewell",
			context:       map[string]interface{}{"role": "admin"},
			resourceID:    "farewell",
			expectedValue: "Goodbye",
			expectError:   false,
		},
		{
			name:        "Non-existent resource",
			context:     map[string]interface{}{"language": "en"},
			resourceID:  "nonexistent",
			expectError: true,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resolver, err := NewResourceResolver(manager, tt.context)
			if err != nil {
				t.Fatalf("Failed to create resolver: %v", err)
			}
			
			resource, err := resolver.ResolveResource(tt.resourceID)
			
			if tt.expectError {
				if err == nil {
					t.Error("Expected error but got none")
				}
				return
			}
			
			if err != nil {
				t.Errorf("Unexpected error: %v", err)
				return
			}
			
			if resource == nil {
				t.Error("Expected resource but got nil")
				return
			}
			
			if resource.JSON != tt.expectedValue {
				t.Errorf("Expected %v, got %v", tt.expectedValue, resource.JSON)
			}
		})
	}
}

func TestResourceResolverLanguageMatching(t *testing.T) {
	bundle := createTestBundle()
	manager, err := NewResourceManager(bundle)
	if err != nil {
		t.Fatalf("Failed to create resource manager: %v", err)
	}
	
	// Test language similarity matching
	tests := []struct {
		name           string
		context        map[string]interface{}
		resourceID     string
		expectedValue  interface{}
		description    string
	}{
		{
			name:          "English exact match",
			context:       map[string]interface{}{"language": "en"},
			resourceID:    "greeting",
			expectedValue: "Hello",
			description:   "Should match exactly",
		},
		{
			name:          "English-US should prefer specific",
			context:       map[string]interface{}{"language": "en-US"},
			resourceID:    "greeting",
			expectedValue: "Hello America!",
			description:   "Should match en-US specific variant",
		},
		{
			name:          "English-GB should fallback to en",
			context:       map[string]interface{}{"language": "en-GB"},
			resourceID:    "greeting",
			expectedValue: "Hello",
			description:   "Should fallback to generic English",
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resolver, err := NewResourceResolver(manager, tt.context)
			if err != nil {
				t.Fatalf("Failed to create resolver: %v", err)
			}
			
			resource, err := resolver.ResolveResource(tt.resourceID)
			if err != nil {
				t.Errorf("Unexpected error: %v", err)
				return
			}
			
			if resource == nil {
				t.Error("Expected resource but got nil")
				return
			}
			
			if resource.JSON != tt.expectedValue {
				t.Errorf("Expected %v, got %v (%s)", tt.expectedValue, resource.JSON, tt.description)
			}
		})
	}
}

func TestResourceResolverContextUpdate(t *testing.T) {
	bundle := createTestBundle()
	manager, err := NewResourceManager(bundle)
	if err != nil {
		t.Fatalf("Failed to create resource manager: %v", err)
	}
	
	resolver, err := NewResourceResolver(manager, map[string]interface{}{"language": "en"})
	if err != nil {
		t.Fatalf("Failed to create resolver: %v", err)
	}
	
	// Initial resolution
	resource, err := resolver.ResolveResource("greeting")
	if err != nil {
		t.Fatalf("Failed to resolve resource: %v", err)
	}
	if resource.JSON != "Hello" {
		t.Errorf("Expected 'Hello', got %v", resource.JSON)
	}
	
	// Update context
	err = resolver.UpdateContext(map[string]interface{}{"language": "fr"})
	if err != nil {
		t.Fatalf("Failed to update context: %v", err)
	}
	
	// Resolution after context update
	resource, err = resolver.ResolveResource("greeting")
	if err != nil {
		t.Fatalf("Failed to resolve resource after context update: %v", err)
	}
	if resource.JSON != "Bonjour" {
		t.Errorf("Expected 'Bonjour', got %v", resource.JSON)
	}
}

func TestResourceResolverAllResources(t *testing.T) {
	bundle := createTestBundle()
	manager, err := NewResourceManager(bundle)
	if err != nil {
		t.Fatalf("Failed to create resource manager: %v", err)
	}
	
	resolver, err := NewResourceResolver(manager, map[string]interface{}{"language": "en"})
	if err != nil {
		t.Fatalf("Failed to create resolver: %v", err)
	}
	
	candidates, err := resolver.ResolveAllResourceCandidates("greeting")
	if err != nil {
		t.Fatalf("Failed to resolve candidates: %v", err)
	}
	
	// Should find at least one candidate for English
	if len(candidates) == 0 {
		t.Error("Expected at least one candidate")
	}
	
	// Check that we get a candidate
	found := false
	for _, candidate := range candidates {
		if candidate.JSON == "Hello" {
			found = true
			break
		}
	}
	
	if !found {
		t.Error("Expected to find 'Hello' candidate")
	}
}

func TestResourceResolverErrorCases(t *testing.T) {
	// Test with nil bundle
	_, err := NewResourceManager(nil)
	if err == nil {
		t.Error("Expected error with nil bundle")
	}
	
	// Test with invalid bundle structure
	invalidBundle := &types.Bundle{
		CompiledCollection: types.CompiledResourceCollection{
			Conditions: []types.CompiledCondition{
				{QualifierIndex: 999, Value: "test"}, // Invalid qualifier index
			},
		},
	}
	
	_, err = NewResourceManager(invalidBundle)
	if err == nil {
		t.Error("Expected error with invalid bundle structure")
	}
}

func TestResourceResolverWithRealBundle(t *testing.T) {
	// Test with the actual extended bundle if available
	bundlePath := "/workspace/data/test/ts-res/extended.resource-bundle.json"
	
	bundleData, err := bundle.LoadFromFile(bundlePath, bundle.LoaderOptions{
		SkipChecksumVerification: true,
	})
	if err != nil {
		t.Skipf("Skipping real bundle test, file not available: %v", err)
		return
	}
	
	manager, err := NewResourceManager(bundleData)
	if err != nil {
		t.Fatalf("Failed to create resource manager with real bundle: %v", err)
	}
	
	resolver, err := NewResourceResolver(manager, map[string]interface{}{
		"language": "en-US",
		"role":     "user",
	})
	if err != nil {
		t.Fatalf("Failed to create resolver: %v", err)
	}
	
	// Try to resolve any available resource
	if len(bundleData.CompiledCollection.Resources) > 0 {
		resourceID := bundleData.CompiledCollection.Resources[0].ID
		resource, err := resolver.ResolveResource(resourceID)
		
		// It's OK if no resource matches our context, but there shouldn't be errors
		if err != nil {
			t.Errorf("Unexpected error resolving real bundle resource: %v", err)
		}
		
		t.Logf("Resolved resource %s: %v", resourceID, resource)
	}
}