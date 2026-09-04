import { hasAccess } from '@/lib/security';
import { openPrivateMcp } from '@/lib/mcp';

export const runtime = 'nodejs';
export const maxDuration = 20;

export async function GET(request: Request) {
  if (!hasAccess(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const client = await openPrivateMcp();
  try {
    const tools = await client.tools();
    return Response.json({ online: true, tools: Object.keys(tools) });
  } catch (error) {
    return Response.json({ online: false, error: error instanceof Error ? error.message : 'Connection failed' }, { status: 503 });
  } finally {
    await client.close();
  }
}
