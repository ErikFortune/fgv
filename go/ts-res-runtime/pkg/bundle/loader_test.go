package bundle

import (
	"encoding/json"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/fgv-vis/fgv/go/ts-res-runtime/pkg/types"
)

// Helper to create a test bundle JSON
func createTestBundleJSON() string {
	return `{
		"metadata": {
			"dateBuilt": "2025-01-15T10:30:00.000Z",
			"checksum": "12345678",
			"version": "1.0.0",
			"description": "Test bundle"
		},
		"config": {
			"qualifierTypes": [
				{
					"name": "language",
					"systemType": "language"
				}
			],
			"qualifiers": [
				{
					"name": "language",
					"type": 0,
					"defaultPriority": 1
				}
			],
			"resourceTypes": [
				{
					"name": "text"
				}
			]
		},
		"compiledCollection": {
			"qualifierTypes": [
				{
					"name": "language",
					"systemType": "language"
				}
			],
			"qualifiers": [
				{
					"name": "language",
					"type": 0,
					"defaultPriority": 1
				}
			],
			"resourceTypes": [
				{
					"name": "text"
				}
			],
			"conditions": [
				{
					"qualifierIndex": 0,
					"value": "en",
					"priority": 1
				}
			],
			"conditionSets": [
				{
					"conditions": [0]
				}
			],
			"decisions": [
				{
					"conditionSets": [0]
				}
			],
			"resources": [
				{
					"id": "greeting",
					"type": 0,
					"decision": 0,
					"candidates": [
						{
							"json": "Hello",
							"isPartial": false,
							"mergeMethod": "replace"
						}
					]
				}
			]
		}
	}`
}

func TestDefaultLoaderOptions(t *testing.T) {
	opts := DefaultLoaderOptions()
	
	if opts.SkipChecksumVerification {
		t.Error("Expected checksum verification to be enabled by default")
	}
	
	if opts.UseSHA256 {
		t.Error("Expected CRC32 to be used by default for browser compatibility")
	}
}

func TestLoadFromReader(t *testing.T) {
	bundleJSON := createTestBundleJSON()
	reader := strings.NewReader(bundleJSON)
	
	// Test with default options
	bundle, err := LoadFromReader(reader)
	if err != nil {
		t.Fatalf("Failed to load bundle: %v", err)
	}
	
	if bundle == nil {
		t.Fatal("Bundle is nil")
	}
	
	// Verify basic structure
	if bundle.Metadata.Checksum != "12345678" {
		t.Errorf("Expected checksum '12345678', got '%s'", bundle.Metadata.Checksum)
	}
	
	if *bundle.Metadata.Version != "1.0.0" {
		t.Errorf("Expected version '1.0.0', got '%s'", *bundle.Metadata.Version)
	}
	
	if len(bundle.CompiledCollection.Resources) != 1 {
		t.Errorf("Expected 1 resource, got %d", len(bundle.CompiledCollection.Resources))
	}
}

func TestLoadFromReaderWithSkipChecksum(t *testing.T) {
	bundleJSON := createTestBundleJSON()
	reader := strings.NewReader(bundleJSON)
	
	// Test with skip checksum verification
	bundle, err := LoadFromReader(reader, LoaderOptions{
		SkipChecksumVerification: true,
	})
	if err != nil {
		t.Fatalf("Failed to load bundle with skip checksum: %v", err)
	}
	
	if bundle == nil {
		t.Fatal("Bundle is nil")
	}
}

func TestLoadFromReaderInvalidJSON(t *testing.T) {
	reader := strings.NewReader("invalid json")
	
	_, err := LoadFromReader(reader)
	if err == nil {
		t.Error("Expected error with invalid JSON")
	}
}

func TestLoadFromReaderEmptyBundle(t *testing.T) {
	reader := strings.NewReader("{}")
	
	bundle, err := LoadFromReader(reader)
	if err != nil {
		t.Fatalf("Failed to load empty bundle: %v", err)
	}
	
	if bundle == nil {
		t.Fatal("Bundle is nil")
	}
}

func TestLoadFromFile(t *testing.T) {
	// Create a temporary file
	tmpFile, err := os.CreateTemp("", "test-bundle-*.json")
	if err != nil {
		t.Fatalf("Failed to create temp file: %v", err)
	}
	defer os.Remove(tmpFile.Name())
	defer tmpFile.Close()
	
	// Write test bundle to file
	bundleJSON := createTestBundleJSON()
	_, err = tmpFile.WriteString(bundleJSON)
	if err != nil {
		t.Fatalf("Failed to write to temp file: %v", err)
	}
	tmpFile.Close()
	
	// Load from file
	bundle, err := LoadFromFile(tmpFile.Name())
	if err != nil {
		t.Fatalf("Failed to load bundle from file: %v", err)
	}
	
	if bundle == nil {
		t.Fatal("Bundle is nil")
	}
	
	if bundle.Metadata.Checksum != "12345678" {
		t.Errorf("Expected checksum '12345678', got '%s'", bundle.Metadata.Checksum)
	}
}

func TestLoadFromFileNonexistent(t *testing.T) {
	_, err := LoadFromFile("nonexistent-file.json")
	if err == nil {
		t.Error("Expected error loading nonexistent file")
	}
}

func TestBundleMetadataUnmarshalJSON(t *testing.T) {
	metadataJSON := `{
		"dateBuilt": "2025-01-15T10:30:00.000Z",
		"checksum": "12345678",
		"version": "1.0.0"
	}`
	
	var metadata types.BundleMetadata
	err := json.Unmarshal([]byte(metadataJSON), &metadata)
	if err != nil {
		t.Fatalf("Failed to unmarshal metadata: %v", err)
	}
	
	expectedTime := time.Date(2025, 1, 15, 10, 30, 0, 0, time.UTC)
	if !metadata.DateBuilt.Equal(expectedTime) {
		t.Errorf("Expected date %v, got %v", expectedTime, metadata.DateBuilt)
	}
	
	if metadata.Checksum != "12345678" {
		t.Errorf("Expected checksum '12345678', got '%s'", metadata.Checksum)
	}
}

func TestBundleMetadataMarshalJSON(t *testing.T) {
	metadata := types.BundleMetadata{
		DateBuilt: time.Date(2025, 1, 15, 10, 30, 0, 0, time.UTC),
		Checksum:  "12345678",
		Version:   stringPtr("1.0.0"),
	}
	
	data, err := json.Marshal(metadata)
	if err != nil {
		t.Fatalf("Failed to marshal metadata: %v", err)
	}
	
	var result map[string]interface{}
	err = json.Unmarshal(data, &result)
	if err != nil {
		t.Fatalf("Failed to unmarshal result: %v", err)
	}
	
	if result["dateBuilt"] != "2025-01-15T10:30:00Z" {
		t.Errorf("Expected dateBuilt '2025-01-15T10:30:00Z', got '%v'", result["dateBuilt"])
	}
}

func TestLoadWithInvalidDateFormat(t *testing.T) {
	bundleJSON := `{
		"metadata": {
			"dateBuilt": "invalid-date",
			"checksum": "12345678"
		},
		"config": {},
		"compiledCollection": {}
	}`
	
	reader := strings.NewReader(bundleJSON)
	_, err := LoadFromReader(reader)
	if err == nil {
		t.Error("Expected error with invalid date format")
	}
}

func TestBundleIntegrityVerification(t *testing.T) {
	// Test bundle with intentionally wrong checksum
	bundleWithWrongChecksum := `{
		"metadata": {
			"dateBuilt": "2025-01-15T10:30:00.000Z",
			"checksum": "wrongsum"
		},
		"config": {
			"qualifierTypes": []
		},
		"compiledCollection": {}
	}`
	
	reader := strings.NewReader(bundleWithWrongChecksum)
	_, err := LoadFromReader(reader)
	if err == nil {
		t.Error("Expected checksum verification to fail")
	}
	
	// Same bundle but with checksum verification skipped should work
	reader = strings.NewReader(bundleWithWrongChecksum)
	_, err = LoadFromReader(reader, LoaderOptions{
		SkipChecksumVerification: true,
	})
	if err != nil {
		t.Errorf("Unexpected error with skip checksum: %v", err)
	}
}

func TestLoadRealExtendedBundle(t *testing.T) {
	// Test with the actual extended bundle if available
	bundlePath := "/workspace/data/test/ts-res/extended.resource-bundle.json"
	
	bundle, err := LoadFromFile(bundlePath, LoaderOptions{
		SkipChecksumVerification: true,
	})
	if err != nil {
		t.Skipf("Skipping real bundle test, file not available: %v", err)
		return
	}
	
	if bundle == nil {
		t.Fatal("Bundle is nil")
	}
	
	// Basic validation of extended bundle structure
	if len(bundle.CompiledCollection.QualifierTypes) == 0 {
		t.Error("Expected qualifier types in extended bundle")
	}
	
	if len(bundle.CompiledCollection.Resources) == 0 {
		t.Error("Expected resources in extended bundle")
	}
	
	// Check that language qualifier type is present and properly configured
	foundLanguage := false
	for _, qt := range bundle.CompiledCollection.QualifierTypes {
		if qt.Name == "language" && qt.SystemType == "language" {
			foundLanguage = true
			break
		}
	}
	
	if !foundLanguage {
		t.Error("Expected to find language qualifier type with system type")
	}
	
	t.Logf("Extended bundle loaded successfully with %d resources", len(bundle.CompiledCollection.Resources))
}

func TestLargeBundle(t *testing.T) {
	// Create a bundle with many resources to test performance
	var resources []string
	for i := 0; i < 1000; i++ {
		resource := `{
			"id": "resource` + strings.Replace(string(rune(i+48)), "\x00", "0", -1) + `",
			"type": 0,
			"decision": 0,
			"candidates": [
				{
					"json": "Value ` + strings.Replace(string(rune(i+48)), "\x00", "0", -1) + `",
					"isPartial": false
				}
			]
		}`
		resources = append(resources, resource)
	}
	
	largeBundleJSON := `{
		"metadata": {
			"dateBuilt": "2025-01-15T10:30:00.000Z",
			"checksum": "12345678"
		},
		"config": {
			"qualifierTypes": [{"name": "test"}],
			"qualifiers": [{"name": "test", "type": 0}],
			"resourceTypes": [{"name": "text"}]
		},
		"compiledCollection": {
			"qualifierTypes": [{"name": "test"}],
			"qualifiers": [{"name": "test", "type": 0}],
			"resourceTypes": [{"name": "text"}],
			"conditions": [{"qualifierIndex": 0, "value": "test"}],
			"conditionSets": [{"conditions": [0]}],
			"decisions": [{"conditionSets": [0]}],
			"resources": [` + strings.Join(resources, ",") + `]
		}
	}`
	
	reader := strings.NewReader(largeBundleJSON)
	bundle, err := LoadFromReader(reader, LoaderOptions{
		SkipChecksumVerification: true,
	})
	if err != nil {
		t.Fatalf("Failed to load large bundle: %v", err)
	}
	
	if len(bundle.CompiledCollection.Resources) != 1000 {
		t.Errorf("Expected 1000 resources, got %d", len(bundle.CompiledCollection.Resources))
	}
}

func stringPtr(s string) *string {
	return &s
}