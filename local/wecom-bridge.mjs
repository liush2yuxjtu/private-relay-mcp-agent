import { WSClient, generateReqId } from '@wecom/aibot-node-sdk';

try { process.loadEnvFile('.env.local'); } catch {}

const botId = process.env.WECOM_BOT_ID;
const secret = process.env.WECOM_BOT_SECRET;
const agentUrl = process.env.REMOTE_AGENT_URL;
const accessKey = process.env.DEMO_ACCESS_KEY;
if (!botId || !secret || !agentUrl || !accessKey) {
  throw new Error('WECOM_BOT_ID, WECOM_BOT_SECRET, REMOTE_AGENT_URL and DEMO_ACCESS_KEY are required');
}

const client = new WSClient({ botId, secret, maxReconnectAttempts: -1 });
client.on('authenticated', () => console.log('WeCom bot connected to remote Vercel agent'));
client.on('message.text', async frame => {
  const content = frame.body.text?.content?.trim();
  if (!content) return;
  const streamId = generateReqId('vercel-agent');
  await client.replyStream(frame, streamId, '正在访问已授权的本地资料…', false);
  try {
    const response = await fetch(agentUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-demo-key': accessKey },
      body: JSON.stringify({ message: content }),
      signal: AbortSignal.timeout(55_000),
    });
    const data = await response.json();
    const answer = response.ok && typeof data.text === 'string' ? data.text : `远程 Agent 错误：${data.error || `HTTP ${response.status}`}`;
    await client.replyStream(frame, streamId, answer.slice(0, 20_000), true);
  } catch (error) {
    await client.replyStream(frame, streamId, `远程 Agent 不可用：${error instanceof Error ? error.message : 'unknown error'}`, true);
  }
});
client.on('error', error => console.error('WeCom:', error));
client.connect();
process.on('SIGINT', () => { client.disconnect(); process.exit(0); });
process.on('SIGTERM', () => { client.disconnect(); process.exit(0); });
