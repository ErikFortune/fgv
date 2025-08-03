package tsres_test

import (
	"fmt"
	"log"

	"github.com/fgv-vis/fgv/go/ts-res-runtime"
)

// Example demonstrates basic usage of the ts-res Go runtime
func Example() {
	// Example bundle JSON (minimal structure for demonstration)
	bundleJSON := `{
		"metadata": {
			"dateBuilt": "2025-01-15T10:30:00.000Z",
			"checksum": "12345678",
			"version": "1.0.0",
			"description": "Example bundle"
		},
		"config": {
			"qualifierTypes": [
				{
					"name": "language",
					"valueType": "string",
					"description": "Language qualifier"
				}
			],
			"qualifiers": [
				{
					"name": "language",
					"qualifierType": "language",
					"value": "en",
					"description": "English language"
				}
			],
			"resourceTypes": [
				{
					"name": "text",
					"mergeMethod": "replace",
					"description": "Text resource type"
				}
			]
		},
		"compiledCollection": {
			"qualifierTypes": [
				{
					"name": "language",
					"valueType": "string",
					"description": "Language qualifier"
				}
			],
			"qualifiers": [
				{
					"name": "language",
					"qualifierType": "language",
					"value": "en",
					"description": "English language"
				}
			],
			"resourceTypes": [
				{
					"name": "text",
					"mergeMethod": "replace",
					"description": "Text resource type"
				}
			],
			"conditions": [
				{
					"key": "lang_en",
					"qualifier": "language",
					"operator": "eq",
					"value": "en",
					"priority": 100,
					"index": 0
				}
			],
			"conditionSets": [
				{
					"key": "en_set",
					"conditions": ["lang_en"],
					"priority": 100,
					"index": 0
				}
			],
			"decisions": [
				{
					"key": "greeting_decision",
					"conditionSets": ["en_set"],
					"index": 0
				}
			],
			"resources": [
				{
					"id": "greeting",
					"resourceType": "text",
					"decision": "greeting_decision",
					"candidates": [
						{
							"json": {"message": "Hello, World!"},
							"isPartial": false,
							"mergeMethod": "replace"
						}
					]
				}
			]
		}
	}`

	// Load bundle from bytes (skipping checksum verification for this example)
	options := tsres.LoaderOptions{
		SkipChecksumVerification: true,
	}
	bundle, err := tsres.LoadBundleFromBytes([]byte(bundleJSON), options)
	if err != nil {
		log.Fatal(err)
	}

	// Create resource manager
	manager, err := tsres.NewManager(bundle)
	if err != nil {
		log.Fatal(err)
	}

	// Create resolver with English context
	context := map[string]interface{}{
		"language": "en",
	}
	resolver, err := tsres.NewResolver(manager, context)
	if err != nil {
		log.Fatal(err)
	}

	// Resolve the greeting resource
	value, err := resolver.ResolveResourceValue("greeting")
	if err != nil {
		log.Fatal(err)
	}

	// Extract the message
	if valueMap, ok := value.(map[string]interface{}); ok {
		if message, ok := valueMap["message"].(string); ok {
			fmt.Println(message)
		}
	}

	// Output: Hello, World!
}