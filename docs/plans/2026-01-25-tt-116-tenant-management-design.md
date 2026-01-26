# TT-116: Tenant Management System Design

**Date:** January 25, 2026
**Issue:** [TT-116](https://linear.app/davidshaevel-dot-com/issue/TT-116/implement-tenant-management-system)

---

## Overview

Create a tenant management system for multi-tenant isolation in DocHound. The system auto-discovers tenants from the filesystem while supporting optional configuration overrides.

## Design Decisions

### Tenant Discovery: Hybrid Approach

**Choice:** Auto-discover from directories + optional `tenant.json` for overrides

**Rationale:**
- Zero config needed for basic setup (just add a directory)
- Optional customization for display names
- Balances simplicity with flexibility for MVP timeline

### ChromaDB Compatibility

The design decouples tenant config from storage implementation:

| Provider | Uses tenantId for | Uses indexPath for |
|----------|-------------------|-------------------|
| SimpleVectorStore | Logging/isolation | Filesystem storage |
| ChromaDB (future) | Collection name | Can ignore or use as cache |

No changes needed when ChromaDB is implemented.

---

## Interfaces

### TenantConfig

```typescript
// tenant.interface.ts
export interface TenantConfig {
  id: string;           // Directory name (e.g., "manufacturing-demo")
  name: string;         // Display name (from tenant.json or derived from id)
  corpusPath: string;   // Absolute path to corpus directory
  indexPath: string;    // Absolute path to index-data directory
}

// Optional tenant.json schema
export interface TenantJsonConfig {
  name?: string;        // Override display name
  // Future: chunking settings, model preferences, etc.
}
```

### Discovery Logic

1. Scan `packages/backend/tenants/` for directories
2. For each directory with a `corpus/` subfolder → valid tenant
3. If `tenant.json` exists, read display name override
4. Otherwise, derive name from directory (e.g., `manufacturing-demo` → `Manufacturing Demo`)

### Paths

- Corpus: `tenants/{id}/corpus/`
- Index: `tenants/{id}/index-data/`

---

## TenantService Class

```typescript
// tenant.service.ts
export class TenantService {
  private tenants: Map<string, TenantConfig> = new Map();
  private vectorStores: Map<string, VectorStoreProvider> = new Map();
  private initialized = false;

  /** Discover and load all tenants from filesystem */
  async initialize(): Promise<void>

  /** Get all available tenants */
  getTenants(): TenantConfig[]

  /** Get a specific tenant by ID */
  getTenant(id: string): TenantConfig | undefined

  /** Get or create vector store for a tenant (lazy initialization) */
  async getVectorStore(tenantId: string): Promise<VectorStoreProvider>
}
```

### Key Behaviors

1. **Single initialization** - Call `initialize()` once at server startup
2. **Lazy vector stores** - Created on first access, not at startup (faster boot)
3. **Singleton pattern** - Export single instance for use across the app

### Usage Example

```typescript
const tenant = tenantService.getTenant(req.params.tenantId);
if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

const vectorStore = await tenantService.getVectorStore(tenant.id);
```

---

## File Structure

```
src/tenants/
├── tenant.interface.ts    # TenantConfig, TenantJsonConfig types
├── tenant.service.ts      # TenantService class + singleton export
└── index.ts               # Re-exports for clean imports
```

### Exports (index.ts)

```typescript
export type { TenantConfig, TenantJsonConfig } from './tenant.interface.js';
export { TenantService, tenantService } from './tenant.service.js';
```

---

## Helper Functions

### Name Derivation

```typescript
// "manufacturing-demo" → "Manufacturing Demo"
function deriveDisplayName(id: string): string {
  return id
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
```

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Missing `tenants/` directory | Throw at initialization (misconfigured) |
| Empty `tenants/` directory | Warn, but don't fail (valid edge case) |
| Invalid `tenant.json` | Warn and use defaults (graceful degradation) |
| Request for unknown tenant ID | Return `undefined`, let caller handle 404 |

---

## Acceptance Criteria

- [ ] Service discovers both `manufacturing-demo` and `interview-prep` tenants
- [ ] Each tenant has isolated vector store instance
- [ ] Tenant can be retrieved by ID
- [ ] Display name can be overridden via `tenant.json`
