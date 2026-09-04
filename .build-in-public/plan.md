# Distribution plan

## Canonical artifact and version

Private Relay `0.1.0`: Next.js demo, read-only local MCP server, WeCom bridge, interactive TUI pitch page, and HyperFrames pitch-film source.

## Direct channels

- GitHub public repository: canonical source, issues, release history.
- Vercel production deployment: live product and pitch surface.

## Rejected channels and reasons

- npm/PyPI: application is not a reusable library or CLI yet.
- MCP registry: local server lacks production OAuth/device identity and stable named-tunnel packaging.

## Public metrics

GitHub stars/forks and Vercel request metrics remain separate; no fabricated user count.

## Release gates

Build, MCP smoke test, browser desktop/mobile flow, HyperFrames check, remote Mac mini render, secret scan, PR review, merge.

## Rollback

Revert merged commit and redeploy prior Vercel production deployment. Rotate any exposed credentials independently.
