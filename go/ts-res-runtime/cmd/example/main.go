package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"

	"github.com/fgv-vis/fgv/go/ts-res-runtime/pkg/bundle"
	"github.com/fgv-vis/fgv/go/ts-res-runtime/pkg/runtime"
)

func main() {
	var (
		bundleFile = flag.String("bundle", "", "Path to the bundle JSON file")
		listOnly   = flag.Bool("list", false, "List all resources in the bundle")
		resourceID = flag.String("resource", "", "ID of the resource to resolve")
		contextStr = flag.String("context", "{}", "JSON context for resource resolution")
		verbose    = flag.Bool("verbose", false, "Enable verbose output")
		skipChecksum = flag.Bool("skip-checksum", false, "Skip checksum verification")
	)
	flag.Parse()

	if *bundleFile == "" {
		fmt.Fprintf(os.Stderr, "Usage: %s -bundle <bundle.json> [options]\n", os.Args[0])
		flag.PrintDefaults()
		os.Exit(1)
	}

	// Load the bundle
	if *verbose {
		fmt.Printf("Loading bundle from: %s\n", *bundleFile)
	}
	
	opts := bundle.DefaultLoaderOptions()
	opts.SkipChecksumVerification = *skipChecksum
	
	loadedBundle, err := bundle.LoadFromFile(*bundleFile, opts)
	if err != nil {
		log.Fatalf("Failed to load bundle: %v", err)
	}

	if *verbose {
		fmt.Printf("Bundle loaded successfully:\n")
		fmt.Printf("  Date Built: %s\n", loadedBundle.Metadata.DateBuilt.Format("2006-01-02 15:04:05"))
		fmt.Printf("  Checksum: %s\n", loadedBundle.Metadata.Checksum)
		if loadedBundle.Metadata.Version != nil {
			fmt.Printf("  Version: %s\n", *loadedBundle.Metadata.Version)
		}
		if loadedBundle.Metadata.Description != nil {
			fmt.Printf("  Description: %s\n", *loadedBundle.Metadata.Description)
		}
		fmt.Printf("  Resources: %d\n", len(loadedBundle.CompiledCollection.Resources))
		fmt.Printf("  Conditions: %d\n", len(loadedBundle.CompiledCollection.Conditions))
		fmt.Printf("  Decisions: %d\n", len(loadedBundle.CompiledCollection.Decisions))
		fmt.Println()
	}

	// Validate the bundle
	if err := bundle.ValidateBundle(loadedBundle); err != nil {
		log.Fatalf("Bundle validation failed: %v", err)
	}

	// Create resource manager
	manager, err := runtime.NewResourceManager(loadedBundle)
	if err != nil {
		log.Fatalf("Failed to create resource manager: %v", err)
	}

	if *verbose {
		fmt.Printf("Resource manager created successfully:\n")
		fmt.Printf("  Total resources: %d\n", manager.GetNumResources())
		fmt.Printf("  Total candidates: %d\n", manager.GetNumCandidates())
		fmt.Println()
	}

	// List resources if requested
	if *listOnly {
		resourceIDs := manager.ListResourceIDs()
		fmt.Printf("Resources in bundle (%d total):\n", len(resourceIDs))
		for _, id := range resourceIDs {
			resource, err := manager.GetResource(id)
			if err != nil {
				fmt.Printf("  ❌ %s (error: %v)\n", id, err)
				continue
			}
			fmt.Printf("  ✓ %s (type index: %d, candidates: %d)\n", id, resource.Type, len(resource.Candidates))
		}
		return
	}

	// Resolve a specific resource
	if *resourceID == "" {
		fmt.Println("No resource ID specified. Use -list to see available resources or -resource <id> to resolve one.")
		return
	}

	// Parse context
	var context map[string]interface{}
	if err := json.Unmarshal([]byte(*contextStr), &context); err != nil {
		log.Fatalf("Failed to parse context JSON: %v", err)
	}

	if *verbose && len(context) > 0 {
		fmt.Printf("Context:\n")
		for key, value := range context {
			fmt.Printf("  %s: %v\n", key, value)
		}
		fmt.Println()
	}

	// Create resolver
	resolver, err := runtime.NewResourceResolver(manager, context)
	if err != nil {
		log.Fatalf("Failed to create resource resolver: %v", err)
	}

	// Get resource metadata
	resource, err := manager.GetResource(*resourceID)
	if err != nil {
		log.Fatalf("Resource not found: %v", err)
	}

	fmt.Printf("Resource: %s\n", *resourceID)
	fmt.Printf("  Type Index: %d\n", resource.Type)
	fmt.Printf("  Decision Index: %d\n", resource.Decision)
	fmt.Printf("  Candidates: %d\n", len(resource.Candidates))
	fmt.Println()

	// Resolve to best candidate
	fmt.Println("=== Best Candidate ===")
	candidate, err := resolver.ResolveResource(*resourceID)
	if err != nil {
		fmt.Printf("❌ Failed to resolve resource: %v\n", err)
	} else {
		fmt.Printf("✓ Resolved successfully\n")
		fmt.Printf("  Is Partial: %t\n", candidate.IsPartial)
		fmt.Printf("  Merge Method: %s\n", candidate.MergeMethod)
		fmt.Printf("  JSON Value:\n")
		jsonBytes, err := json.MarshalIndent(candidate.JSON, "    ", "  ")
		if err != nil {
			fmt.Printf("    Error marshaling JSON: %v\n", err)
		} else {
			fmt.Printf("    %s\n", string(jsonBytes))
		}
	}
	fmt.Println()

	// Resolve to composed value
	fmt.Println("=== Composed Value ===")
	composedValue, err := resolver.ResolveResourceValue(*resourceID)
	if err != nil {
		fmt.Printf("❌ Failed to resolve composed value: %v\n", err)
	} else {
		fmt.Printf("✓ Composed successfully\n")
		jsonBytes, err := json.MarshalIndent(composedValue, "  ", "  ")
		if err != nil {
			fmt.Printf("  Error marshaling JSON: %v\n", err)
		} else {
			fmt.Printf("  %s\n", string(jsonBytes))
		}
	}
	fmt.Println()

	// Show all matching candidates if verbose
	if *verbose {
		fmt.Println("=== All Matching Candidates ===")
		candidates, err := resolver.ResolveAllResourceCandidates(*resourceID)
		if err != nil {
			fmt.Printf("❌ Failed to get all candidates: %v\n", err)
		} else {
			fmt.Printf("✓ Found %d matching candidates\n", len(candidates))
			for i, candidate := range candidates {
				fmt.Printf("  Candidate %d:\n", i+1)
				fmt.Printf("    Is Partial: %t\n", candidate.IsPartial)
				fmt.Printf("    Merge Method: %s\n", candidate.MergeMethod)
				jsonBytes, err := json.MarshalIndent(candidate.JSON, "    ", "  ")
				if err != nil {
					fmt.Printf("    Error marshaling JSON: %v\n", err)
				} else {
					fmt.Printf("    JSON: %s\n", string(jsonBytes))
				}
			}
		}
	}
}