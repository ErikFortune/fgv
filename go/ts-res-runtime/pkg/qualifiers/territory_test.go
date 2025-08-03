package qualifiers

import (
	"testing"

	"github.com/fgv-vis/fgv/go/ts-res-runtime/pkg/types"
)

var validTerritories = []string{"US", "DE", "SE", "CN", "TW", "us", "mx"}
var invalidTerritories = []string{"419", "mexico", "usa", "CAN"} // Note: CAN is actually valid but treating as invalid for test consistency

func TestNewTerritoryQualifierType(t *testing.T) {
	qt := NewTerritoryQualifierType()

	if qt.Name() != "territory" {
		t.Errorf("Expected name 'territory', got '%s'", qt.Name())
	}

	if qt.AllowContextList() {
		t.Error("Expected AllowContextList to be false by default")
	}

	if qt.GetAcceptLowercase() {
		t.Error("Expected AcceptLowercase to be false by default")
	}

	if qt.GetAllowedTerritories() != nil {
		t.Error("Expected no allowed territories by default")
	}

	if qt.Index() != nil {
		t.Error("Expected index to be nil initially")
	}

	if qt.GetHierarchy() != nil {
		t.Error("Expected no hierarchy by default")
	}
}

func TestNewTerritoryQualifierTypeWithConfig(t *testing.T) {
	index := 42
	config := TerritoryQualifierTypeConfig{
		Name:               "terr",
		AllowContextList:   true,
		AllowedTerritories: []string{"US", "DE", "se"}, // Mixed case
		AcceptLowercase:    true,
		Index:              &index,
	}

	qt, err := NewTerritoryQualifierTypeWithConfig(config)
	if err != nil {
		t.Fatalf("Expected territory qualifier creation to succeed, got error: %v", err)
	}

	if qt.Name() != "terr" {
		t.Errorf("Expected name 'terr', got '%s'", qt.Name())
	}

	if !qt.AllowContextList() {
		t.Error("Expected AllowContextList to be true")
	}

	if !qt.GetAcceptLowercase() {
		t.Error("Expected AcceptLowercase to be true")
	}

	// Allowed territories should be normalized to uppercase
	allowed := qt.GetAllowedTerritories()
	expected := []string{"US", "DE", "SE"}
	if len(allowed) != len(expected) {
		t.Errorf("Expected %d allowed territories, got %d", len(expected), len(allowed))
	}
	for i, exp := range expected {
		if allowed[i] != exp {
			t.Errorf("Expected allowed territory[%d] = '%s', got '%s'", i, exp, allowed[i])
		}
	}

	if qt.Index() == nil || *qt.Index() != 42 {
		t.Errorf("Expected index 42, got %v", qt.Index())
	}
}

func TestNewTerritoryQualifierTypeWithInvalidTerritory(t *testing.T) {
	config := TerritoryQualifierTypeConfig{
		Name:               "terr",
		AllowedTerritories: []string{"US", "invalid"}, // "invalid" is not a valid territory code
	}

	_, err := NewTerritoryQualifierTypeWithConfig(config)
	if err == nil {
		t.Error("Expected error for invalid territory code, but creation succeeded")
	}
}

func TestIsValidTerritoryCode(t *testing.T) {
	// Valid territory codes (2-letter)
	validCodes := []string{"US", "DE", "SE", "CN", "TW", "us", "mx", "AB", "xy"}
	for _, code := range validCodes {
		if !isValidTerritoryCode(code) {
			t.Errorf("Expected '%s' to be valid territory code", code)
		}
	}

	// Invalid territory codes
	invalidCodes := []string{"", "A", "ABC", "123", "U1", "A-", "U S"}
	for _, code := range invalidCodes {
		if isValidTerritoryCode(code) {
			t.Errorf("Expected '%s' to be invalid territory code", code)
		}
	}
}

func TestTerritoryQualifierTypeIsValidConditionValue(t *testing.T) {
	// Test without allowed territories (any valid territory code is accepted)
	qt := NewTerritoryQualifierType()

	validCodes := []string{"US", "DE", "SE", "CN", "TW"}
	for _, code := range validCodes {
		if !qt.IsValidConditionValue(code) {
			t.Errorf("Expected '%s' to be valid condition value", code)
		}
	}

	// Invalid codes
	invalidCodes := []string{"419", "mexico", "usa", ""}
	for _, code := range invalidCodes {
		if qt.IsValidConditionValue(code) {
			t.Errorf("Expected '%s' to be invalid condition value", code)
		}
	}

	// Test case sensitivity (default: strict uppercase)
	if qt.IsValidConditionValue("us") {
		t.Error("Expected lowercase 'us' to be invalid when acceptLowercase=false")
	}
}

func TestTerritoryQualifierTypeIsValidConditionValueWithLowercase(t *testing.T) {
	config := TerritoryQualifierTypeConfig{
		AcceptLowercase: true,
	}

	qt, err := NewTerritoryQualifierTypeWithConfig(config)
	if err != nil {
		t.Fatalf("Failed to create territory qualifier: %v", err)
	}

	// Should accept both cases when acceptLowercase=true
	testCases := []string{"US", "us", "DE", "de"}
	for _, code := range testCases {
		if !qt.IsValidConditionValue(code) {
			t.Errorf("Expected '%s' to be valid when acceptLowercase=true", code)
		}
	}
}

func TestTerritoryQualifierTypeIsValidConditionValueWithAllowedTerritories(t *testing.T) {
	config := TerritoryQualifierTypeConfig{
		AllowedTerritories: []string{"US", "DE", "SE"},
		AcceptLowercase:    true,
	}

	qt, err := NewTerritoryQualifierTypeWithConfig(config)
	if err != nil {
		t.Fatalf("Failed to create territory qualifier: %v", err)
	}

	// Should accept allowed territories
	allowedCodes := []string{"US", "DE", "SE", "us", "de", "se"} // Both cases
	for _, code := range allowedCodes {
		if !qt.IsValidConditionValue(code) {
			t.Errorf("Expected allowed territory '%s' to be valid", code)
		}
	}

	// Should reject non-allowed territories (even if valid territory codes)
	nonAllowedCodes := []string{"FR", "GB", "CN"}
	for _, code := range nonAllowedCodes {
		if qt.IsValidConditionValue(code) {
			t.Errorf("Expected non-allowed territory '%s' to be invalid", code)
		}
	}
}

func TestTerritoryQualifierTypeMatches(t *testing.T) {
	qt := NewTerritoryQualifierType()

	// Perfect matches (case-insensitive for territories)
	testCases := []struct {
		condition, context string
		expected           types.QualifierMatchScore
	}{
		{"US", "US", types.PerfectMatch},
		{"US", "us", types.PerfectMatch}, // Case-insensitive matching
		{"us", "US", types.PerfectMatch}, // Case-insensitive matching  
		{"DE", "FR", types.NoMatch},
		{"", "", types.NoMatch}, // Empty values are invalid
	}

	for _, tc := range testCases {
		score := qt.Matches(
			types.QualifierConditionValue(tc.condition),
			types.QualifierContextValue(tc.context),
			types.ConditionOperatorMatches,
		)
		if score != tc.expected {
			t.Errorf("Expected match('%s', '%s') = %f, got %f", tc.condition, tc.context, tc.expected, score)
		}
	}
}

func TestTerritoryQualifierTypeMatchesWithOperators(t *testing.T) {
	qt := NewTerritoryQualifierType()
	condition := types.QualifierConditionValue("US")
	context := types.QualifierContextValue("US")

	// Test 'always' operator
	score := qt.Matches(condition, context, types.ConditionOperatorAlways)
	if score != types.PerfectMatch {
		t.Errorf("Expected 'always' operator to return PerfectMatch, got %f", score)
	}

	// Test 'never' operator
	score = qt.Matches(condition, context, types.ConditionOperatorNever)
	if score != types.NoMatch {
		t.Errorf("Expected 'never' operator to return NoMatch, got %f", score)
	}
}

func TestTerritoryQualifierTypeMatchesWithContextList(t *testing.T) {
	config := TerritoryQualifierTypeConfig{
		AllowContextList: true,
	}

	qt, err := NewTerritoryQualifierTypeWithConfig(config)
	if err != nil {
		t.Fatalf("Failed to create territory qualifier: %v", err)
	}

	condition := types.QualifierConditionValue("DE")
	context := types.QualifierContextValue("US,DE,FR")

	score := qt.Matches(condition, context, types.ConditionOperatorMatches)
	if score != types.PerfectMatch {
		t.Errorf("Expected perfect match against list containing condition, got %f", score)
	}

	// Test with condition not in list
	condition = types.QualifierConditionValue("CN")
	score = qt.Matches(condition, context, types.ConditionOperatorMatches)
	if score != types.NoMatch {
		t.Errorf("Expected no match against list not containing condition, got %f", score)
	}

	// Test with spaces
	context = types.QualifierContextValue("US, DE , FR")
	condition = types.QualifierConditionValue("DE")
	score = qt.Matches(condition, context, types.ConditionOperatorMatches)
	if score != types.PerfectMatch {
		t.Errorf("Expected perfect match against spaced list containing condition, got %f", score)
	}
}

func TestTerritoryQualifierTypeIsPotentialMatch(t *testing.T) {
	qt := NewTerritoryQualifierType()

	// Valid potential matches
	if !qt.IsPotentialMatch("US", "US") {
		t.Error("Expected exact match to be potential match")
	}

	if !qt.IsPotentialMatch("US", "us") {
		t.Error("Expected case-insensitive match to be potential match")
	}

	// Invalid potential matches
	if qt.IsPotentialMatch("US", "DE") {
		t.Error("Expected different territories to not be potential match")
	}

	if qt.IsPotentialMatch("invalid", "US") {
		t.Error("Expected invalid condition to not be potential match")
	}

	if qt.IsPotentialMatch("US", "invalid") {
		t.Error("Expected invalid context to not be potential match")
	}
}

func TestTerritoryQualifierTypeWithHierarchy(t *testing.T) {
	// Create a hierarchy using valid 2-letter codes: DE,FR -> EU, US,CA -> NA
	hierarchy := LiteralValueHierarchyDecl{
		"DE": "EU",
		"FR": "EU", 
		"US": "NA",
		"CA": "NA",
	}

	config := TerritoryQualifierTypeConfig{
		Name:               "territory",
		AllowedTerritories: []string{"DE", "FR", "EU", "US", "CA", "NA"},
		AcceptLowercase:    true,
		Hierarchy:          hierarchy,
	}

	qt, err := NewTerritoryQualifierTypeWithConfig(config)
	if err != nil {
		t.Fatalf("Failed to create territory qualifier with hierarchy: %v", err)
	}

	if qt.GetHierarchy() == nil {
		t.Error("Expected qualifier type to have hierarchy")
	}

	// Test hierarchical matching
	score := qt.Matches(
		types.QualifierConditionValue("EU"),
		types.QualifierContextValue("DE"),
		types.ConditionOperatorMatches,
	)

	if score == types.NoMatch {
		t.Error("Expected hierarchical match (EU -> DE)")
	}

	if score >= types.PerfectMatch {
		t.Error("Expected hierarchical match to have score less than perfect")
	}

	// Test IsPotentialMatch with hierarchy
	if !qt.IsPotentialMatch("EU", "DE") {
		t.Error("Expected hierarchical potential match (EU -> DE)")
	}

	if qt.IsPotentialMatch("NA", "DE") {
		t.Error("Expected no potential match for non-ancestor (NA -> DE)")
	}
}

func TestTerritoryQualifierTypeValidation(t *testing.T) {
	qt := NewTerritoryQualifierType()

	// Test ValidateCondition
	_, err := qt.ValidateCondition("US", types.ConditionOperatorMatches)
	if err != nil {
		t.Errorf("Expected valid territory condition to pass validation, got error: %v", err)
	}

	_, err = qt.ValidateCondition("invalid", types.ConditionOperatorMatches)
	if err == nil {
		t.Error("Expected invalid territory condition to fail validation")
	}

	// Test ValidateContextValue
	_, err = qt.ValidateContextValue("US")
	if err != nil {
		t.Errorf("Expected valid territory context to pass validation, got error: %v", err)
	}

	_, err = qt.ValidateContextValue("invalid")
	if err == nil {
		t.Error("Expected invalid territory context to fail validation")
	}
}

func TestHelperFunctions(t *testing.T) {
	// Test IsValidTerritoryConditionValue
	if !IsValidTerritoryConditionValue("US", false) {
		t.Error("Expected 'US' to be valid territory condition value")
	}

	if IsValidTerritoryConditionValue("us", false) {
		t.Error("Expected lowercase 'us' to be invalid when acceptLowercase=false")
	}

	if !IsValidTerritoryConditionValue("us", true) {
		t.Error("Expected lowercase 'us' to be valid when acceptLowercase=true")
	}

	// Test ToTerritoryConditionValue
	result, err := ToTerritoryConditionValue("us", true)
	if err != nil {
		t.Errorf("Expected territory conversion to succeed, got error: %v", err)
	}

	if string(result) != "US" {
		t.Errorf("Expected normalized result 'US', got '%s'", result)
	}

	_, err = ToTerritoryConditionValue("invalid", true)
	if err == nil {
		t.Error("Expected territory conversion to fail for invalid code")
	}
}

func TestTerritoryQualifierTypeSetIndex(t *testing.T) {
	qt := NewTerritoryQualifierType()

	// First set should succeed
	err := qt.SetIndex(10)
	if err != nil {
		t.Errorf("Expected first SetIndex to succeed, got error: %v", err)
	}

	if qt.Index() == nil || *qt.Index() != 10 {
		t.Errorf("Expected index to be 10, got %v", qt.Index())
	}

	// Second set should fail (immutable)
	err = qt.SetIndex(20)
	if err == nil {
		t.Error("Expected second SetIndex to fail, but it succeeded")
	}

	// Index should remain unchanged
	if qt.Index() == nil || *qt.Index() != 10 {
		t.Errorf("Expected index to remain 10 after failed set, got %v", qt.Index())
	}
}