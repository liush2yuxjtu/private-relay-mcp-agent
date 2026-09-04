import { createMCPClient } from '@ai-sdk/mcp';

export async function openPrivateMcp() {
  const url = process.env.PRIVATE_MCP_URL;
  const token = process.env.PRIVATE_MCP_TOKEN;
  if (!url || !token) throw new Error('Private MCP connection is not configured');
  return createMCPClient({
    clientName: 'vercel-private-data-agent',
    transport: {
      type: 'http',
      url,
      headers: { Authorization: `Bearer ${token}` },
    },
  });
}
