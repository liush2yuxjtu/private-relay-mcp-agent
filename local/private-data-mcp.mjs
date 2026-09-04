import { createHash, timingSafeEqual } from 'node:crypto';
import { readdir, readFile, realpath, stat } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { z } from 'zod/v4';

try { process.loadEnvFile('.env.local'); } catch {}

const port = Number(process.env.MCP_PORT || 8791);
const root = await realpath(resolve(process.env.LOCAL_DATA_ROOT || './local-data'));
const token = process.env.PRIVATE_MCP_TOKEN;
if (!token) throw new Error('PRIVATE_MCP_TOKEN is required');

function authorized(value = '') {
  const actual = createHash('sha256').update(value.replace(/^Bearer\s+/i, '')).digest();
  const expected = createHash('sha256').update(token).digest();
  return timingSafeEqual(actual, expected);
}

async function safePath(input = '.') {
  const candidate = await realpath(resolve(root, input));
  const rel = relative(root, candidate);
  if (rel === '..' || rel.startsWith(`..${sep}`)) throw new Error('Path escapes LOCAL_DATA_ROOT');
  return candidate;
}

async function walk(dir, limit = 200) {
  const files = [];
  const queue = [dir];
  while (queue.length && files.length < limit) {
    const current = queue.shift();
    for (const entry of await readdir(current, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      const full = resolve(current, entry.name);
      if (entry.isDirectory()) queue.push(full);
      else if (entry.isFile()) files.push(full);
      if (files.length >= limit) break;
    }
  }
  return files;
}

function createServer() {
  const server = new McpServer({ name: 'private-local-data', version: '0.1.0' });

  server.registerTool('list_private_files', {
    title: 'List private files',
    description: 'List files inside the approved local data root. Hidden files are excluded.',
    inputSchema: { path: z.string().default('.') },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async ({ path }) => {
    const dir = await safePath(path);
    const files = await walk(dir);
    return { content: [{ type: 'text', text: files.map(file => relative(root, file)).join('\n') || '(empty)' }] };
  });

  server.registerTool('read_private_text_file', {
    title: 'Read private text file',
    description: 'Read one UTF-8 text file inside the approved local data root, capped at 40,000 characters.',
    inputSchema: { path: z.string().min(1) },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async ({ path }) => {
    const file = await safePath(path);
    const info = await stat(file);
    if (!info.isFile() || info.size > 512_000) throw new Error('File must be a text file smaller than 512 KB');
    const text = (await readFile(file, 'utf8')).slice(0, 40_000);
    return { content: [{ type: 'text', text }] };
  });

  server.registerTool('search_private_text', {
    title: 'Search private text',
    description: 'Case-insensitive text search across approved local files. Returns matching lines with paths.',
    inputSchema: { query: z.string().min(2).max(100), path: z.string().default('.') },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async ({ query, path }) => {
    const dir = await safePath(path);
    const matches = [];
    for (const file of await walk(dir, 100)) {
      const info = await stat(file);
      if (info.size > 256_000) continue;
      let text;
      try { text = await readFile(file, 'utf8'); } catch { continue; }
      for (const [index, line] of text.split('\n').entries()) {
        if (line.toLowerCase().includes(query.toLowerCase())) {
          matches.push(`${relative(root, file)}:${index + 1}: ${line.slice(0, 300)}`);
          if (matches.length >= 30) break;
        }
      }
      if (matches.length >= 30) break;
    }
    return { content: [{ type: 'text', text: matches.join('\n') || 'No matches' }] };
  });

  return server;
}

const app = createMcpExpressApp({ host: '0.0.0.0' });
app.get('/health', (_req, res) => res.json({ ok: true, root, tools: 3 }));
app.use('/mcp', (req, res, next) => {
  if (!authorized(req.headers.authorization)) return res.status(401).json({ error: 'Unauthorized' });
  next();
});
app.post('/mcp', async (req, res) => {
  const server = createServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    if (!res.headersSent) res.status(500).json({ error: error instanceof Error ? error.message : 'MCP failure' });
  } finally {
    res.on('close', () => { void transport.close(); void server.close(); });
  }
});
app.all('/mcp', (_req, res) => res.status(405).set('Allow', 'POST').send('Method Not Allowed'));
app.listen(port, '127.0.0.1', () => console.log(`Private MCP ready: http://127.0.0.1:${port}/mcp (${root})`));
