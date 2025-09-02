package qualifiers

import (
	"testing"

	"github.com/fgv-vis/fgv/go/ts-res-runtime/pkg/types"
)

// Test platform hierarchy similar to TypeScript tests
// Hierarchy: some_stb_variant -> some_stb -> stb -> ctv
//           android -> mobile
//           ios -> mobile
var testPlatformHierarchy = LiteralValueHierarchyDecl{
	"some_stb_variant": "some_stb",
	"some_stb":         "stb",
	"other_stb":        "stb",
	"ya_stb":           "stb",
	"stb":              "ctv",
	"android":          "mobile",
	"ios":              "mobile",
	"androidtv":        "ctv",
	"appletv":          "ctv",
	"firetv":           "ctv",
	"webOs":            "ctv",
}

var testPlatformValues = []string{
	"some_stb", "some_stb_variant", "other_stb", "ya_stb",
	"android", "ios", "androidtv", "appletv", "firetv", "webOs",
	"stb", "ctv", "mobile", "web",
}

func TestNewLiteralValueHierarchy(t *testing.T) {
	// Test constrained hierarchy (with enumerated values)
	config := LiteralValueHierarchyConfig{
		Values:    testPlatformValues,
		Hierarchy: testPlatformHierarchy,
	}
	
	hierarchy, err := NewLiteralValueHierarchy(config)
	if err != nil {
		t.Fatalf("Expected hierarchy creation to succeed, got error: %v", err)
	}
	
	if hierarchy.IsOpenValues() {
		t.Error("Expected constrained hierarchy to not be open values")
	}
	
	// Check that all values are present
	for _, value := range testPlatformValues {
		if !hierarchy.HasValue(value) {
			t.Errorf("Expected hierarchy to have value '%s'", value)
		}
	}
	
	// Check parent-child relationships
	if !hierarchy.IsAncestor("some_stb", "some_stb_variant") {
		t.Error("Expected 'some_stb' to be ancestor of 'some_stb_variant'")
	}
	
	if !hierarchy.IsAncestor("ctv", "some_stb_variant") {
		t.Error("Expected 'ctv' to be ancestor of 'some_stb_variant'")
	}
	
	if hierarchy.IsAncestor("mobile", "some_stb_variant") {
		t.Error("Expected 'mobile' to NOT be ancestor of 'some_stb_variant'")
	}
}

func TestNewLiteralValueHierarchyOpen(t *testing.T) {
	// Test open hierarchy (no enumerated values)
	config := LiteralValueHierarchyConfig{
		Values:    nil, // No enumerated values = open hierarchy
		Hierarchy: testPlatformHierarchy,
	}
	
	hierarchy, err := NewLiteralValueHierarchy(config)
	if err != nil {
		t.Fatalf("Expected open hierarchy creation to succeed, got error: %v", err)
	}
	
	if !hierarchy.IsOpenValues() {
		t.Error("Expected open hierarchy to be open values")
	}
	
	// Should have all values from the hierarchy declaration
	expectedValues := make(map[string]bool)
	for child, parent := range testPlatformHierarchy {
		expectedValues[child] = true
		expectedValues[parent] = true
	}
	
	for value := range expectedValues {
		if !hierarchy.HasValue(value) {
			t.Errorf("Expected open hierarchy to have value '%s'", value)
		}
	}
}

func TestLiteralValueHierarchyMatch(t *testing.T) {
	config := LiteralValueHierarchyConfig{
		Values:    testPlatformValues,
		Hierarchy: testPlatformHierarchy,
	}
	
	hierarchy, err := NewLiteralValueHierarchy(config)
	if err != nil {
		t.Fatalf("Failed to create hierarchy: %v", err)
	}
	
	// Test exact matches
	score := hierarchy.Match("some_stb_variant", "some_stb_variant", types.ConditionOperatorMatches)
	if score != types.PerfectMatch {
		t.Errorf("Expected perfect match for identical values, got %f", score)
	}
	
	// Test hierarchical matches with decreasing scores
	context := "some_stb_variant"
	
	// Direct parent should match with high score
	someStbScore := hierarchy.Match("some_stb", context, types.ConditionOperatorMatches)
	if someStbScore == types.NoMatch {
		t.Error("Expected 'some_stb' to match 'some_stb_variant' in hierarchy")
	}
	if someStbScore >= types.PerfectMatch {
		t.Error("Expected hierarchical match to have score less than perfect match")
	}
	
	// Grandparent should match with lower score
	stbScore := hierarchy.Match("stb", context, types.ConditionOperatorMatches)
	if stbScore == types.NoMatch {
		t.Error("Expected 'stb' to match 'some_stb_variant' in hierarchy")
	}
	if stbScore >= someStbScore {
		t.Error("Expected grandparent score to be less than parent score")
	}
	
	// Great-grandparent should match with even lower score
	ctvScore := hierarchy.Match("ctv", context, types.ConditionOperatorMatches)
	if ctvScore == types.NoMatch {
		t.Error("Expected 'ctv' to match 'some_stb_variant' in hierarchy")
	}
	if ctvScore >= stbScore {
		t.Error("Expected great-grandparent score to be less than grandparent score")
	}
	
	// Non-ancestor should not match
	mobileScore := hierarchy.Match("mobile", context, types.ConditionOperatorMatches)
	if mobileScore != types.NoMatch {
		t.Error("Expected 'mobile' to NOT match 'some_stb_variant' (not an ancestor)")
	}
	
	// Root with no parent should only match itself
	webScore := hierarchy.Match("web", "ctv", types.ConditionOperatorMatches)
	if webScore != types.NoMatch {
		t.Error("Expected root 'web' to NOT match non-descendant 'ctv'")
	}
}

func TestLiteralValueHierarchyNoMatch(t *testing.T) {
	config := LiteralValueHierarchyConfig{
		Values:    []string{"a", "b", "c", "parent", "root"},
		Hierarchy: LiteralValueHierarchyDecl{"a": "parent", "b": "parent", "parent": "root"},
	}
	
	hierarchy, err := NewLiteralValueHierarchy(config)
	if err != nil {
		t.Fatalf("Failed to create hierarchy: %v", err)
	}
	
	// Test condition not in hierarchy
	score := hierarchy.Match("not-in-hierarchy", "a", types.ConditionOperatorMatches)
	if score != types.NoMatch {
		t.Error("Expected NoMatch for condition not in hierarchy")
	}
	
	// Test context not in hierarchy
	score = hierarchy.Match("a", "not-in-hierarchy", types.ConditionOperatorMatches)
	if score != types.NoMatch {
		t.Error("Expected NoMatch for context not in hierarchy")
	}
	
	// Test context is root (no parent) and not equal to condition
	score = hierarchy.Match("a", "root", types.ConditionOperatorMatches)
	if score != types.NoMatch {
		t.Error("Expected NoMatch when context is root and not equal to condition")
	}
	
	// Test condition is not an ancestor of context
	score = hierarchy.Match("b", "a", types.ConditionOperatorMatches)
	if score != types.NoMatch {
		t.Error("Expected NoMatch when condition is not ancestor of context")
	}
}

func TestLiteralValueHierarchyUtilities(t *testing.T) {
	config := LiteralValueHierarchyConfig{
		Values:    testPlatformValues,
		Hierarchy: testPlatformHierarchy,
	}
	
	hierarchy, err := NewLiteralValueHierarchy(config)
	if err != nil {
		t.Fatalf("Failed to create hierarchy: %v", err)
	}
	
	// Test GetAncestors
	ancestors, err := hierarchy.GetAncestors("some_stb_variant")
	if err != nil {
		t.Errorf("Expected GetAncestors to succeed, got error: %v", err)
	}
	
	expected := []string{"some_stb", "stb", "ctv"}
	if len(ancestors) != len(expected) {
		t.Errorf("Expected %d ancestors, got %d", len(expected), len(ancestors))
	}
	
	for i, expectedAncestor := range expected {
		if i >= len(ancestors) || ancestors[i] != expectedAncestor {
			t.Errorf("Expected ancestor[%d] = '%s', got '%s'", i, expectedAncestor, ancestors[i])
		}
	}
	
	// Test GetDescendants
	descendants, err := hierarchy.GetDescendants("stb")
	if err != nil {
		t.Errorf("Expected GetDescendants to succeed, got error: %v", err)
	}
	
	expectedDescendants := []string{"some_stb", "other_stb", "ya_stb", "some_stb_variant"}
	if len(descendants) != len(expectedDescendants) {
		t.Errorf("Expected %d descendants, got %d", len(expectedDescendants), len(descendants))
	}
	
	// Convert to map for easier checking (order doesn't matter)
	descendantMap := make(map[string]bool)
	for _, desc := range descendants {
		descendantMap[desc] = true
	}
	
	for _, expected := range expectedDescendants {
		if !descendantMap[expected] {
			t.Errorf("Expected descendant '%s' not found", expected)
		}
	}
	
	// Test error cases
	_, err = hierarchy.GetAncestors("not-in-hierarchy")
	if err == nil {
		t.Error("Expected error for GetAncestors with invalid value")
	}
	
	_, err = hierarchy.GetDescendants("not-in-hierarchy")
	if err == nil {
		t.Error("Expected error for GetDescendants with invalid value")
	}
}

func TestLiteralQualifierTypeWithHierarchy(t *testing.T) {
	config := LiteralQualifierTypeConfig{
		Name:             "platform",
		AllowContextList: true,
		CaseSensitive:    false,
		EnumeratedValues: testPlatformValues,
		Hierarchy:        testPlatformHierarchy,
	}
	
	qt := NewLiteralQualifierTypeWithConfig(config)
	
	if qt.GetHierarchy() == nil {
		t.Error("Expected qualifier type to have hierarchy")
	}
	
	// Test hierarchical matching through qualifier type
	score := qt.Matches(
		types.QualifierConditionValue("stb"),
		types.QualifierContextValue("some_stb_variant"),
		types.ConditionOperatorMatches,
	)
	
	if score == types.NoMatch {
		t.Error("Expected hierarchical match through qualifier type")
	}
	
	if score >= types.PerfectMatch {
		t.Error("Expected hierarchical match to have score less than perfect")
	}
	
	// Test IsPotentialMatch with hierarchy
	if !qt.IsPotentialMatch("ctv", "some_stb_variant") {
		t.Error("Expected hierarchical potential match")
	}
	
	if qt.IsPotentialMatch("mobile", "some_stb_variant") {
		t.Error("Expected no potential match for non-ancestor")
	}
}

func TestLiteralQualifierTypeWithoutHierarchy(t *testing.T) {
	// Test that qualifier type works without hierarchy (fallback behavior)
	config := LiteralQualifierTypeConfig{
		Name:             "simple",
		AllowContextList: true,
		CaseSensitive:    false,
		EnumeratedValues: []string{"a", "b", "c"},
		Hierarchy:        nil, // No hierarchy
	}
	
	qt := NewLiteralQualifierTypeWithConfig(config)
	
	if qt.GetHierarchy() != nil {
		t.Error("Expected qualifier type to have no hierarchy")
	}
	
	// Should fall back to direct matching
	score := qt.Matches(
		types.QualifierConditionValue("a"),
		types.QualifierContextValue("a"),
		types.ConditionOperatorMatches,
	)
	
	if score != types.PerfectMatch {
		t.Error("Expected perfect match for direct equality without hierarchy")
	}
	
	score = qt.Matches(
		types.QualifierConditionValue("a"),
		types.QualifierContextValue("b"),
		types.ConditionOperatorMatches,
	)
	
	if score != types.NoMatch {
		t.Error("Expected no match for different values without hierarchy")
	}
}