/**
 * Tenant API routes
 *
 * GET /api/tenants - List all tenants
 * GET /api/tenants/:tenantId - Get tenant details
 */
import { Router, Request, Response, NextFunction } from 'express';
import { existsSync } from 'fs';
import { readdir } from 'fs/promises';
import { tenantService } from '../tenants/index.js';

export const tenantsRouter = Router();

/**
 * API response type for tenant (matches frontend Tenant interface)
 */
interface TenantResponse {
  id: string;
  name: string;
  documentCount: number;
}

/**
 * Count documents in a corpus directory
 */
async function countDocuments(corpusPath: string): Promise<number> {
  if (!existsSync(corpusPath)) {
    return 0;
  }
  const files = await readdir(corpusPath);
  // Count only supported file types
  return files.filter(f =>
    f.endsWith('.md') || f.endsWith('.txt') || f.endsWith('.pdf')
  ).length;
}

/**
 * Convert TenantConfig to API response format
 */
async function toTenantResponse(tenant: { id: string; name: string; corpusPath: string }): Promise<TenantResponse> {
  return {
    id: tenant.id,
    name: tenant.name,
    documentCount: await countDocuments(tenant.corpusPath),
  };
}

/**
 * GET /api/tenants
 * List all available tenants
 */
tenantsRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const tenants = tenantService.getTenants();

    // Map to API response format with document counts
    const response: TenantResponse[] = await Promise.all(
      tenants.map(toTenantResponse)
    );

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tenants/:tenantId
 * Get details for a specific tenant
 */
tenantsRouter.get('/:tenantId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.params;
    const tenant = tenantService.getTenant(tenantId);

    if (!tenant) {
      res.status(404).json({
        error: 'Not Found',
        message: `Tenant '${tenantId}' not found`,
      });
      return;
    }

    res.json(await toTenantResponse(tenant));
  } catch (error) {
    next(error);
  }
});
