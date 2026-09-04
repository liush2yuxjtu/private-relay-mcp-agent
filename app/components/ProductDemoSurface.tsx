'use client';

import { FormEvent, PointerEvent, ReactNode, useRef, useState } from 'react';

type DemoId = 'q3' | 'customers' | 'security';
type PaneId = 'workspace' | 'agent' | 'terminal' | 'evidence';
type Pane = { left: number; top: number; width: number; height: number; z: number };
type Interaction =
  | { kind: 'drag'; id: PaneId; pointerId: number; x: number; y: number; left: number; top: number }
  | { kind: 'resize'; id: PaneId; pointerId: number; x: number; y: number; width: number; height: number };

type Demo = { label: string; prompt: string; command: string; proof: string };

const demoIds: DemoId[] = ['q3', 'customers', 'security'];

const demos: Record<DemoId, Demo> = {
  q3: { label: 'Q3 brief', prompt: '搜索 Q3，列出目标、负责人和风险，并引用来源文件。', command: 'relay ask --source local://brief.md', proof: 'Target · owner · risk · source' },
  customers: { label: 'Customer pulse', prompt: '读取 customers.csv，按区域总结客户状态与下一行动。', command: 'relay ask --source local://customers.csv', proof: '3 accounts · actions mapped' },
  security: { label: 'Boundary proof', prompt: '列出你能使用的本地工具，并说明为什么不能访问授权目录之外的文件。', command: 'relay inspect --policy read-only', proof: '3 tools · zero write access' },
};

const defaults: Record<PaneId, Pane> = {
  workspace: { left: 34, top: 72, width: 520, height: 420, z: 2 },
  agent: { left: 530, top: 120, width: 510, height: 400, z: 3 },
  terminal: { left: 86, top: 430, width: 570, height: 220, z: 4 },
  evidence: { left: 642, top: 452, width: 440, height: 230, z: 5 },
};

export function ProductDemoSurface() {
  const [demoId, setDemoId] = useState<DemoId>('q3');
  const [key, setKey] = useState('');
  const [prompt, setPrompt] = useState(demos.q3.prompt);
  const [status, setStatus] = useState<'ready' | 'connecting' | 'running' | 'done' | 'error'>('ready');
  const [answer, setAnswer] = useState('Connect your private relay, then run a task.');
  const [events, setEvents] = useState<string[]>(['system  private relay ready', 'policy  read-only · scoped root']);
  const [panes, setPanes] = useState(defaults);
  const [interaction, setInteraction] = useState<Interaction | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const demo = demos[demoId];

  const statusLabel = { ready: 'STANDBY', connecting: 'CONNECTING', running: 'AGENT RUNNING', done: 'VERIFIED', error: 'CHECK LINK' }[status];

  function pick(id: DemoId) {
    setDemoId(id);
    setPrompt(demos[id].prompt);
    setAnswer(demos[id].proof);
    setStatus('ready');
    setEvents(current => [...current.slice(-3), `task    selected ${demos[id].label}`]);
  }

  async function run(event?: FormEvent) {
    event?.preventDefault();
    if (!key.trim() || !prompt.trim() || status === 'running') return;
    setStatus('connecting');
    setAnswer('Opening authenticated MCP session…');
    setEvents(current => [...current.slice(-4), 'auth    demo key accepted', 'mcp     discovering tools']);
    try {
      const health = await fetch('/api/status', { headers: { 'x-demo-key': key } });
      if (!health.ok) throw new Error(health.status === 401 ? 'Invalid demo key' : `MCP status ${health.status}`);
      setStatus('running');
      setEvents(current => [...current.slice(-4), 'tools   list · search · read', 'model   astron-code-latest']);
      const response = await fetch('/api/agent', { method: 'POST', headers: { 'content-type': 'application/json', 'x-demo-key': key }, body: JSON.stringify({ message: prompt }) });
      const data: unknown = await response.json();
      if (!response.ok || !data || typeof data !== 'object' || !('text' in data) || typeof data.text !== 'string') {
        const detail = data && typeof data === 'object' && 'error' in data && typeof data.error === 'string' ? data.error : `Agent status ${response.status}`;
        throw new Error(detail);
      }
      setAnswer(data.text);
      setStatus('done');
      setEvents(current => [...current.slice(-4), 'source  local files cited', 'exit    0 · evidence returned']);
    } catch (error) {
      setStatus('error');
      setAnswer(error instanceof Error ? error.message : 'Request failed');
      setEvents(current => [...current.slice(-4), 'error   request stopped safely']);
    }
  }

  function beginDrag(id: PaneId, event: PointerEvent<HTMLDivElement>) {
    if (window.matchMedia('(max-width: 760px)').matches) return;
    const pane = panes[id];
    event.currentTarget.setPointerCapture(event.pointerId);
    setInteraction({ kind: 'drag', id, pointerId: event.pointerId, x: event.clientX, y: event.clientY, left: pane.left, top: pane.top });
    setPanes(current => ({ ...current, [id]: { ...current[id], z: 9 } }));
  }

  function beginResize(id: PaneId, event: PointerEvent<HTMLButtonElement>) {
    if (window.matchMedia('(max-width: 760px)').matches) return;
    const pane = panes[id];
    event.currentTarget.setPointerCapture(event.pointerId);
    setInteraction({ kind: 'resize', id, pointerId: event.pointerId, x: event.clientX, y: event.clientY, width: pane.width, height: pane.height });
    setPanes(current => ({ ...current, [id]: { ...current[id], z: 9 } }));
    event.preventDefault();
  }

  function move(event: PointerEvent<HTMLDivElement>) {
    if (!interaction || !stageRef.current) return;
    const stage = stageRef.current.getBoundingClientRect();
    const dx = event.clientX - interaction.x;
    const dy = event.clientY - interaction.y;
    setPanes(current => {
      const pane = current[interaction.id];
      if (interaction.kind === 'drag') {
        return { ...current, [interaction.id]: { ...pane, left: Math.max(8, Math.min(stage.width - pane.width - 8, interaction.left + dx)), top: Math.max(48, Math.min(stage.height - pane.height - 8, interaction.top + dy)) } };
      }
      return { ...current, [interaction.id]: { ...pane, width: Math.max(290, Math.min(stage.width - pane.left - 8, interaction.width + dx)), height: Math.max(180, Math.min(stage.height - pane.top - 8, interaction.height + dy)) } };
    });
  }

  return (
    <div className="demo-shell">
      <div className="demo-toolbar">
        <span>LIVE PRODUCT SURFACE</span>
        <div><i className={`status-led ${status}`} />{statusLabel}</div>
        <button type="button" onClick={() => { setPanes(defaults); setInteraction(null); }}>Reset layout</button>
      </div>
      <div ref={stageRef} className="demo-stage" onPointerMove={move} onPointerUp={() => setInteraction(null)} onPointerCancel={() => setInteraction(null)} onLostPointerCapture={() => setInteraction(null)}>
        <StageWallpaper />
        <DemoWindow id="workspace" pane={panes.workspace} title="private-relay / workspace" onDrag={beginDrag} onResize={beginResize}>
          <div className="workspace-grid">
            <nav aria-label="Demo tasks">{demoIds.map(id => <button type="button" key={id} className={id === demoId ? 'is-active' : ''} onClick={() => pick(id)}><span>0{demoIds.indexOf(id) + 1}</span>{demos[id].label}</button>)}</nav>
            <div className="workspace-code"><p className="mono-label">RUNBOOK</p><h3>{demo.label}</h3><code>$ {demo.command}</code><div className="policy-lines"><span>+ remote reasoning</span><span>+ local custody</span><span>+ file citations</span><span className="deny">− write access</span></div></div>
          </div>
        </DemoWindow>
        <DemoWindow id="agent" pane={panes.agent} title="agent / control" onDrag={beginDrag} onResize={beginResize}>
          <form className="agent-console" onSubmit={run}>
            <div className="model-row"><span><i /> ASTRON</span><b>astron-code-latest</b></div>
            <label htmlFor="demo-key">Demo key</label><input id="demo-key" type="password" value={key} onChange={event => setKey(event.target.value)} placeholder="Paste access key" autoComplete="off" />
            <label htmlFor="demo-prompt">Instruction</label><textarea id="demo-prompt" value={prompt} onChange={event => setPrompt(event.target.value)} rows={5} />
            <button className="run-button" disabled={!key || status === 'running' || status === 'connecting'}>{status === 'running' || status === 'connecting' ? 'Running…' : 'Run private query'}<span>⌘↵</span></button>
          </form>
        </DemoWindow>
        <DemoWindow id="terminal" pane={panes.terminal} title="relay / events" onDrag={beginDrag} onResize={beginResize}>
          <div className="terminal" aria-live="polite">{events.map((line, index) => <p key={`${line}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span>{line}</p>)}</div>
        </DemoWindow>
        <DemoWindow id="evidence" pane={panes.evidence} title="evidence / result" onDrag={beginDrag} onResize={beginResize}>
          <div className="evidence" aria-live="polite"><p className="mono-label">{statusLabel}</p><div>{answer}</div></div>
        </DemoWindow>
      </div>
    </div>
  );
}

function DemoWindow({ id, pane, title, onDrag, onResize, children }: { id: PaneId; pane: Pane; title: string; onDrag: (id: PaneId, event: PointerEvent<HTMLDivElement>) => void; onResize: (id: PaneId, event: PointerEvent<HTMLButtonElement>) => void; children: ReactNode }) {
  return <article className={`demo-window demo-window--${id}`} style={{ left: pane.left, top: pane.top, width: pane.width, height: pane.height, zIndex: pane.z }}><div className="window-bar" onPointerDown={event => onDrag(id, event)}><span className="traffic"><i/><i/><i/></span><b>{title}</b><em>secure</em></div><div className="window-content">{children}</div><button type="button" className="resize" aria-label={`Resize ${title}`} onPointerDown={event => onResize(id, event)} /></article>;
}

function StageWallpaper() {
  return <svg className="stage-wallpaper" viewBox="0 0 1200 720" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="sky" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#d7e2d8"/><stop offset="1" stopColor="#ead8c1"/></linearGradient><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#243028" strokeOpacity=".08"/></pattern></defs><rect width="1200" height="720" fill="url(#sky)"/><rect width="1200" height="720" fill="url(#grid)"/><circle cx="975" cy="126" r="114" fill="#efff72" opacity=".72"/><path d="M0 590 160 390 270 510 430 310 590 520 785 350 960 530 1200 310V720H0Z" fill="#52675b" opacity=".22"/></svg>;
}
