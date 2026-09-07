import { ProductDemoSurface } from './components/ProductDemoSurface';

export default function Home() {
  const sessionId = process.env.PI_SESSION_ID || 'unavailable via shell';
  const vercelAuthPreview = process.env.VERCEL_ENV === 'preview';
  return (
    <main>
      <nav className="site-nav"><a href="#top" className="wordmark">PRIVATE RELAY<span>°</span></a><div><a href="#demo">Live demo</a><a href="#film">Pitch film</a><a href="#thesis">Thesis</a><a href="#security">Security</a></div><a className="nav-cta" href="#demo">Run it</a></nav>

      <section className="pitch-hero" id="top">
        <div className="hero-index">01 / DATA SOVEREIGNTY</div>
        <div className="hero-grid">
          <div><p className="hero-kicker">Remote intelligence. Local custody.</p><h1>Your AI should reach the data.<br/><em>The data should never leave.</em></h1></div>
          <div className="hero-side"><p>Private Relay gives cloud agents a narrow, audited path into local files and systems—without uploading the underlying data.</p><a href="#demo">Try the live relay <span>↘</span></a></div>
        </div>
        <div className="proof-strip"><span><b>03</b> read-only tools</span><span><b>00</b> write permissions</span><span><b>01</b> governed data root</span><span><b>∞</b> private systems</span></div>
      </section>

      <section className="demo-section" id="demo">
        <div className="section-head"><div><span>02 / PRODUCT</span><h2>Watch the boundary work.</h2></div><p>{vercelAuthPreview ? 'Sign in with your Vercel account. The protected preview discovers tools, calls the local MCP server, and returns cited evidence.' : 'Choose a task. Add your demo key. The cloud agent discovers tools, calls the local MCP server, and returns cited evidence.'}</p></div>
        <ProductDemoSurface vercelAuthPreview={vercelAuthPreview} />
      </section>

      <section className="film" id="film">
        <div className="section-head"><div><span>03 / PITCH FILM</span><h2>Thirty seconds.<br/>One investable wedge.</h2></div><p>Use this silent cut as a meeting opener, website embed, or background loop while you explain the secure last mile.</p></div>
        <div className="film-frame"><video controls muted loop playsInline preload="metadata" aria-label="Private Relay thirty-second pitch film"><source src="/private-relay-pitch.mp4" type="video/mp4"/>Your browser does not support embedded video.</video><span>30 SEC · 1920×1080 · SILENT CUT</span></div>
      </section>

      <section className="thesis" id="thesis">
        <div className="section-head"><div><span>04 / THESIS</span><h2>The enterprise AI stack is missing a secure last mile.</h2></div></div>
        <div className="thesis-grid">
          <article><span>THE OLD CHOICE</span><h3>Upload everything<br/>or automate nothing.</h3><p>RAG pipelines duplicate sensitive data, drift from source systems, and expand the compliance surface.</p></article>
          <article className="accent-card"><span>THE NARROW DOOR</span><h3>Bring governed tools<br/>to the source.</h3><p>Private Relay exposes actions, not databases. Every capability is explicit, scoped, and replaceable.</p></article>
          <article><span>THE WEDGE</span><h3>One protocol.<br/>Every private system.</h3><p>Start with files. Expand to ERP, data warehouses, lab instruments, NAS, and internal services through MCP.</p></article>
        </div>
      </section>

      <section className="security" id="security">
        <div><span>05 / DEFENSIBILITY</span><h2>Security is not a feature.<br/>It is the product shape.</h2></div>
        <ol><li><b>01</b><span><strong>Local custody</strong>Raw files remain on infrastructure the customer already controls.</span></li><li><b>02</b><span><strong>Capability allowlist</strong>Agents see named tools, not a general shell or unrestricted filesystem.</span></li><li><b>03</b><span><strong>Two trust boundaries</strong>Public product access and private MCP transport use separate credentials.</span></li><li><b>04</b><span><strong>Evidence by default</strong>Every local claim carries its source path back to the operator.</span></li></ol>
      </section>

      <section className="closing"><p>THE PITCH</p><h2>Make every private system<br/>agent-accessible—<em>without making it public.</em></h2><a href="#demo">Run Private Relay</a></section>
      <footer><span>Private Relay © 2026</span><span>Source: /Users/liushiyuwin/vercel-local-mcp-agent-demo</span><span>Pi session ID: {sessionId}</span></footer>
    </main>
  );
}
