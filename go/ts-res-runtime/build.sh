#!/bin/bash

# Build script for ts-res-runtime Go package

set -e

echo "Building ts-res-runtime Go package..."

# Ensure we're in the right directory
cd "$(dirname "$0")"

# Clean and get dependencies
echo "Getting dependencies..."
go mod tidy

# Build the package
echo "Building package..."
go build ./...

# Build the example CLI
echo "Building example CLI..."
cd cmd/example
go build -o ts-res-example .
echo "Example CLI built: ./cmd/example/ts-res-example"

# Run tests
echo "Running tests..."
cd ../..
go test ./...

echo "Build completed successfully!"
echo ""
echo "Usage examples:"
echo "  ./cmd/example/ts-res-example -bundle path/to/bundle.json -list"
echo "  ./cmd/example/ts-res-example -bundle path/to/bundle.json -resource 'greeting' -context '{\"language\":\"en\"}'"