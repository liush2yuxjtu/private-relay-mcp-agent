# Private Relay

远程 Vercel AI SDK Agent 通过受保护的 Streamable HTTP MCP，只读访问本机指定目录；本机企业微信 WebSocket Bridge 把消息转发给同一个远程 Agent。

- Pitch landing page: https://private-relay-mcp-agent.vercel.app
- Interactive TUI demo: landing page 的 `Live demo` 区域
- Pitch film: `public/private-relay-pitch.mp4`
- HyperFrames source: `videos/private-relay-pitch/`

## Quick start

```bash
npm install
cp -R examples/local-data local-data
cp .env.example .env.local
# Fill strong random secrets and one supported model provider key.
npm run local:mcp
npm run local:tunnel
npm run dev
```

The public Vercel app needs `PRIVATE_MCP_URL`, `PRIVATE_MCP_TOKEN`, `DEMO_ACCESS_KEY`, and one model provider configuration. Never commit `.env.local` or point `LOCAL_DATA_ROOT` at your whole home directory.

```text
Browser / WeCom
      |
      v
Vercel ToolLoopAgent (AI SDK)
      |
      v  HTTPS + Bearer token
Cloudflare Tunnel
      |
      v
Local read-only MCP -> LOCAL_DATA_ROOT
```

## 安全边界

- MCP 仅暴露 `list/search/read` 三个只读工具。
- `realpath` 目录约束阻止 `../` 和符号链接逃逸。
- MCP bearer token、模型凭据只在服务端。
- 公网页面/API 另有 `DEMO_ACCESS_KEY`。
- 默认只共享 `./local-data`；不要把 `$HOME` 直接设为根目录。
- Quick Tunnel 只用于演示，Mac 休眠或进程退出后失效。生产应换固定域名的 Cloudflare Named Tunnel、设备身份认证和 Vercel Authentication。

## 本地 MCP

```bash
set -a; source .env.local; set +a
npm run local:mcp
npm run check:mcp
npm run local:tunnel
```

将隧道 URL 加 `/mcp` 后写入 Vercel `PRIVATE_MCP_URL`。`PRIVATE_MCP_TOKEN` 两端必须相同。

## 企业微信智能机器人

使用企业微信官方 `@wecom/aibot-node-sdk` 长连接模式，无需公网回调 URL：

```bash
set -a; source .env.local; set +a
npm run local:wecom
```

企业微信后台：应用管理 -> 智能机器人 -> 创建 -> API 模式选“长连接”，把 BotID、Secret 写入本机 `.env.local`。同一 BotID 同时只能有一个长连接。

## Vercel

```bash
vercel deploy -y --no-wait
```

部署端需要 `PRIVATE_MCP_URL`、`PRIVATE_MCP_TOKEN`、`DEMO_ACCESS_KEY`。当前 demo 优先直连 GLM Coding Plan：`GLM_CODING_PLAN_API_KEY`、`GLM_MODEL=glm-5.3-flash`、OpenAI-compatible endpoint；其次支持讯飞、Kimi 和 Vercel AI Gateway。
