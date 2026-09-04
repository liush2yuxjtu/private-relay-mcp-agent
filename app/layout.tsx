import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Private Relay — Vercel MCP Agent',
  description: 'Remote AI agent, local private data, read-only MCP relay.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
