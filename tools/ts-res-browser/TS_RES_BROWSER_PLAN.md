# ts-res-browser Enhancement Plan

## Phase 1: Base Library Enhancements (ts-res library)

### 1.1 Enhanced Cache Listener Events
- **Timing Information**: Add timestamps to cache events in `IResourceResolverCacheListener`
- **Resolution Context**: Include which resource/candidate triggered the cache operation
- **Performance Metrics**: Add resolution time information to cache events

### 1.2 Cache Introspection Methods
- **Cache Content Inspection**: Add methods to `ResourceResolver` to examine cache contents safely
- **Cache Statistics**: Built-in methods to get cache utilization stats
- **Resolution Tracing**: Optional detailed tracing of resolution steps

### 1.3 Metrics Collection Enhancement
- **Per-resource Metrics**: Track cache performance per resource in `ResourceResolverCacheMetricsListener`
- **Resolution Path Metrics**: Track common resolution patterns
- **Time-based Metrics**: Add timing information to cache operations

## Phase 2: Compact Cache Dashboard

### 2.1 Inline Cache Metrics Display ✅ COMPLETED
- **Compact Dashboard**: Horizontal strip between qualifier and resource panes
  - Format: `Cond: 2/10 (100%) | CondSet: 1/5 (100%) | Dec: 1/3 (100%) [Reset]`
  - Color coding: Green (>80%), Yellow (50-80%), Red (<50%), Gray (no activity)
  - Custom tooltip component with detailed cache information
- **Cache Metrics**: Use existing `ResourceResolverCacheMetricsListener` with `AggregateCacheMetrics`
- **State Management**: Persist across resource selections, reset on context changes
- **Updates**: After each resolution operation
- **Cache Reset Button**: Single button to clear all caches and reset metrics
- **Tooltip Details**: Shows filled slots, total accesses, hits/misses/errors breakdown

### 2.2 Cache State Visualization
- **Cache Size Information**: Display cache array sizes and current utilization using publicly exposed cache arrays
- **Live Activity Indicators**: Show recent cache operations with visual feedback
- **Tooltips**: Basic hover information (defer detailed tooltips until needed)

## Phase 3: Enhanced Resolution View

### 3.1 Candidate Resolution Details (Stage 1) ✅ COMPLETED
- **Condition Results**: Show individual condition evaluation results in candidate view
  - Format: `lang=en-GB(0.9), home=US(1.0)` etc. for each candidate
- **Condition Set Results**: Display condition set evaluation outcomes
- **Decision Results**: Show decision resolution details
- **Implementation**: Added ConditionEvaluationDisplay component with tooltips showing detailed condition matching logic
- **Views**: Integrated condition evaluation display into 'all' view (matching and non-matching candidates) and 'best' view

### 3.2 Resource Structure View (Stage 2) ✅ COMPLETED
- **Cache Contents Display**: Added expandable cache contents section in left pane showing:
  - **Condition Cache**: Shows cached condition scores with qualifier names and values
  - **Condition Set Cache**: Shows cached condition set results with success/failure status  
  - **Decision Cache**: Shows cached decision results with matching candidate counts
  - **Interactive Design**: Expandable/collapsible with hover tooltips for detailed information
  - **Real-time Updates**: Updates as resources are resolved and cache is populated
- **Parallel Structure Display**: Extend resource view to show condition/condition set/decision results
- **Similar to Compiled View**: Mirror the internal structure display from compiled browser
- **Hierarchical Display**: Show the resolution hierarchy (conditions → condition sets → decisions)

### 3.3 Resolution Path Visualization (Stage 3)
- **Step-by-step Resolution**: Show the exact sequence of cache operations during resolution
- **Dependency Tree**: Visual representation of which conditions/condition sets/decisions were accessed
- **Cache Impact Highlighting**: Show which parts of the resolution benefited from caching

## Phase 4: Context Change Impact Analysis

### 4.1 Cache Invalidation Preview
- **Context Change Effects**: Show what cache entries would be invalidated by context changes
- **Before/After Comparison**: Visual diff of cache state before/after context changes
- **Resource Impact**: Highlight which resources would be affected by context changes

### 4.2 Resolution Diff Analysis
- **Context Comparison**: Compare resolution results between different contexts
- **Change Highlighting**: Visual indicators of what changed in resolution results
- **Impact Assessment**: Show scope of changes from context modifications

## Phase 5: Performance Analysis (Future)

### 5.1 Resolution Performance Metrics
- **Resolution Time**: Time taken for each resolution method
- **Cache Contribution**: How much time was saved by cache hits
- **Bottleneck Identification**: Highlight slow resolution paths

### 5.2 Historical Analysis
- **Resolution History**: Track resolution performance over time
- **Cache Evolution**: Show how cache effectiveness changes with usage patterns
- **Performance Trends**: Identify patterns in cache usage and resolution efficiency

## Phase 6: Advanced Features (Future)

### 6.1 Cache Management
- **Fine-grained Cache Clear**: Individual clear buttons for each cache type
- **Cache Preloading**: Option to pre-resolve common scenarios to warm the cache
- **Cache Inspection Tools**: Click on cache slots to see their contents

### 6.2 Context Optimization
- **Context Suggestions**: Suggest context values that would improve cache efficiency
- **Usage Pattern Analysis**: Identify optimal context configurations
- **Performance Recommendations**: Suggest improvements based on cache usage patterns

## UI/UX Considerations

### Design Principles
- **Compact Information**: Use tooltips and expandable sections to avoid clutter
- **Live Updates**: Real-time feedback during resolution operations
- **Progressive Disclosure**: Show basic info by default, detailed info on demand
- **Visual Hierarchy**: Clear organization of information from general to specific

### Tooltip Usage
- **Cache Metrics**: Detailed explanations of hit rates, cache sizes, etc.
- **Resolution Details**: Additional context about condition evaluations
- **Performance Insights**: Explanations of timing and efficiency metrics
- **Context Impact**: Details about how context changes affect resolution

## Implementation Priority

1. **Phase 2**: Compact Cache Dashboard (immediate value, low complexity)
2. **Phase 3.1**: Candidate Resolution Details (high value, medium complexity)
3. **Phase 1**: Base Library Enhancements (enables advanced features)
4. **Phase 3.2**: Resource Structure View (medium value, medium complexity)
5. **Phase 4**: Context Change Impact Analysis (high value, high complexity)
6. **Phase 3.3**: Resolution Path Visualization (medium value, high complexity)

## Success Metrics

- **Developer Productivity**: Faster debugging of resource resolution issues
- **Cache Efficiency**: Improved understanding of cache performance
- **Resolution Transparency**: Clear visibility into resolution decision-making
- **Context Optimization**: Better context configuration through insights