import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

try { process.loadEnvFile('.env.local'); } catch {}

const url = process.env.PRIVATE_MCP_URL || `http://127.0.0.1:${process.env.MCP_PORT || 8791}/mcp`;
const token = process.env.PRIVATE_MCP_TOKEN;
if (!token) throw new Error('PRIVATE_MCP_TOKEN is required');
const client = new Client({ name: 'mcp-smoke', version: '0.1.0' });
await client.connect(new StreamableHTTPClientTransport(new URL(url), { requestInit: { headers: { Authorization: `Bearer ${token}` } } }));
const tools = await client.listTools();
if (tools.tools.length !== 3) throw new Error(`Expected 3 tools, got ${tools.tools.length}`);
const result = await client.callTool({ name: 'search_private_text', arguments: { query: 'Q3' } });
console.log(JSON.stringify({ ok: true, tools: tools.tools.map(tool => tool.name), result: result.content }, null, 2));
await client.close();
