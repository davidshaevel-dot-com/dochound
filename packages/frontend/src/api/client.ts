/**
 * API client for DocHound backend
 */

const API_BASE = '/api';

export interface Source {
  documentId: string;
  documentName: string;
  excerpt: string;
  score: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
}

export interface ChatResponse {
  message: string;
  sources: Source[];
}

export interface Tenant {
  id: string;
  name: string;
  documentCount: number;
}

/**
 * Send a chat message to a specific tenant
 */
export async function sendChatMessage(
  tenantId: string,
  message: string
): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE}/tenants/${tenantId}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Chat request failed with status ${response.status}: ${errorText || response.statusText}`);
  }

  return response.json();
}

/**
 * Get list of available tenants
 */
export async function getTenants(): Promise<Tenant[]> {
  const response = await fetch(`${API_BASE}/tenants`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch tenants with status ${response.status}: ${errorText || response.statusText}`);
  }

  return response.json();
}

/**
 * Get details for a specific tenant
 */
export async function getTenant(tenantId: string): Promise<Tenant> {
  const response = await fetch(`${API_BASE}/tenants/${tenantId}`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch tenant with status ${response.status}: ${errorText || response.statusText}`);
  }

  return response.json();
}
