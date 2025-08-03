// Package tsres provides a Go runtime for loading and resolving ts-res resource bundles.
//
// This package is compatible with bundle files produced by the TypeScript ts-res system
// and provides read-only access to browse bundle contents and resolve resources.
//
// Basic usage:
//
//	// Load a bundle
//	bundle, err := tsres.LoadBundle("path/to/bundle.json")
//	if err != nil {
//		log.Fatal(err)
//	}
//
//	// Create a resource manager
//	manager, err := tsres.NewManager(bundle)
//	if err != nil {
//		log.Fatal(err)
//	}
//
//	// Create a resolver with context
//	context := map[string]interface{}{
//		"language": "en",
//		"territory": "US",
//	}
//	resolver, err := tsres.NewResolver(manager, context)
//	if err != nil {
//		log.Fatal(err)
//	}
//
//	// Resolve a resource
//	value, err := resolver.ResolveValue("my.resource.id")
//	if err != nil {
//		log.Fatal(err)
//	}
//
package tsres

import (
	"github.com/fgv-vis/fgv/go/ts-res-runtime/pkg/bundle"
	"github.com/fgv-vis/fgv/go/ts-res-runtime/pkg/runtime"
	"github.com/fgv-vis/fgv/go/ts-res-runtime/pkg/types"
)

// Bundle represents a resource bundle
type Bundle = types.Bundle

// ResourceManager provides read-only access to bundle resources
type ResourceManager = runtime.ResourceManager

// ResourceResolver handles resource resolution with context
type ResourceResolver = runtime.ResourceResolver

// LoaderOptions configures bundle loading behavior
type LoaderOptions = bundle.LoaderOptions

// LoadBundle loads a bundle from a file
func LoadBundle(path string, opts ...LoaderOptions) (*Bundle, error) {
	return bundle.LoadFromFile(path, opts...)
}

// LoadBundleFromBytes loads a bundle from byte data
func LoadBundleFromBytes(data []byte, opts ...LoaderOptions) (*Bundle, error) {
	return bundle.LoadFromBytes(data, opts...)
}

// NewManager creates a new resource manager from a bundle
func NewManager(bundle *Bundle) (*ResourceManager, error) {
	return runtime.NewResourceManager(bundle)
}

// NewResolver creates a new resource resolver with context
func NewResolver(manager *ResourceManager, context map[string]interface{}) (*ResourceResolver, error) {
	return runtime.NewResourceResolver(manager, context)
}

// ValidateBundle performs validation on a bundle structure
func ValidateBundle(b *Bundle) error {
	return bundle.ValidateBundle(b)
}

// DefaultLoaderOptions returns default options for bundle loading
func DefaultLoaderOptions() LoaderOptions {
	return bundle.DefaultLoaderOptions()
}