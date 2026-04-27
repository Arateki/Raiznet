// Servidor Raiznet — Onboarding + Dashboard

function Sidebar({ active = 'dash' }) {
  const items = [
    { k: 'dash', l: 'Visão Geral', i: I.network },
    { k: 'devices', l: 'Dispositivos', i: I.cpu },
    { k: 'map', l: 'Mapa', i: I.map },
    { k: 'crops', l: 'Cultivos', i: null, glyph: 'sprout' },
    { k: 'safras', l: 'Safras', i: null, glyph: 'leaf' },
    { k: 'filters', l: 'Filtros', i: I.filter },
    { k: 'mat', l: 'Materiais', i: I.book },
    { k: 'net', l: 'Redes', i: I.globe },
  ];
  return (
    <aside style={{ width: 220, borderRight: '1px solid var(--line)', background: 'var(--bg-2)', padding: '24px 0', display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ padding: '0 22px 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <GRoot size={22}/>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.18em' }}>R A I Z N E T</div>
          <div className="mono" style={{ fontSize: 9, color: 'var(--fg-3)', marginTop: 2 }}>v0.1 · hybrid</div>
        </div>
      </div>
      <div className="eyebrow-tight" style={{ padding: '0 22px 8px' }}>R E D E</div>
      {items.map(it => (
        <div key={it.k} style={{
          padding: '9px 22px',
          display: 'flex', alignItems: 'center', gap: 10,
          fontSize: 12,
          color: it.k === active ? 'var(--fg)' : 'var(--fg-2)',
          background: it.k === active ? 'var(--bg-card)' : 'transparent',
          borderLeft: it.k === active ? '2px solid var(--primary)' : '2px solid transparent',
          cursor: 'pointer',
        }}>
          {it.glyph === 'sprout' ? <GSprout size={14}/> : it.glyph === 'leaf' ? <GLeaf size={14}/> : <Icon d={it.i} size={14}/>}
          <span>{it.l}</span>
        </div>
      ))}
      <div style={{ marginTop: 'auto', padding: '20px 22px', borderTop: '1px solid var(--line)' }}>
        <div className="eyebrow-tight" style={{ marginBottom: 8 }}>I D E N T I D A D E</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, border: '1px solid var(--line-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="serif" style={{ fontSize: 14 }}>L</span>
          </div>
          <div>
            <div style={{ fontSize: 11 }}>Lia Marques</div>
            <div className="mono" style={{ fontSize: 9, color: 'var(--fg-3)' }}>4f8b…2a91</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

// Onboarding seed (server)
function ServerOnboardSeed() {
  return (
    <div style={{ width: 1280, height: 800, background: 'var(--bg)', fontFamily: 'var(--f-sans)', color: 'var(--fg)', display: 'flex' }} className="aquarela">
      <div style={{ flex: 1, padding: '60px 80px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <GRoot size={28}/>
            <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.22em' }}>R A I Z N E T</span>
          </div>
          <div style={{ marginTop: 80 }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>P A S S O 0 1 — I D E N T I D A D E</div>
            <h1 className="serif" style={{ fontSize: 56, lineHeight: 1.05, margin: 0, fontWeight: 400, maxWidth: 540 }}>
              Sua rede começa<br/>
              <span style={{ fontStyle: 'italic', color: 'var(--primary)' }}>com doze palavras.</span>
            </h1>
            <p style={{ fontSize: 14, color: 'var(--fg-2)', marginTop: 22, lineHeight: 1.6, maxWidth: 460 }}>
              Sem cadastro, sem servidor central. Estas palavras geram seu par Ed25519 — a raiz da sua autoridade sobre dispositivos, filtros e redes.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--fg-3)' }}>
          <span>Brasil · pt-BR</span>
          <span>·</span>
          <span>local-first</span>
          <span>·</span>
          <span>Hypercore protocol</span>
        </div>
      </div>

      <div style={{ flex: 1, padding: '60px 80px 60px 0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ background: 'var(--paper-tint)', border: '1px solid var(--primary-line)', padding: '36px 40px' }}>
          <div className="eyebrow-tight" style={{ color: 'var(--primary)', marginBottom: 18 }}>S E E D P H R A S E</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px 24px', fontFamily: 'var(--f-mono)', fontSize: 14 }}>
            {['raven','forest','silent','copper','moss','river','cinder','linen','willow','agate','harvest','quill'].map((w,i)=>(
              <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8, paddingBottom: 6, borderBottom: '1px solid var(--line)' }}>
                <span style={{ color: 'var(--fg-4)', fontSize: 10 }}>{String(i+1).padStart(2,'0')}</span>
                <span>{w}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 22 }}>
            <button className="btn btn-ghost" style={{ flex: 1, fontSize: 11 }}><Icon d={I.copy} size={12}/> Copiar</button>
            <button className="btn btn-ghost" style={{ flex: 1, fontSize: 11 }}><Icon d={I.download} size={12}/> Baixar PDF</button>
            <button className="btn btn-ghost" style={{ flex: 1, fontSize: 11 }}>Já tenho seed</button>
          </div>
          <div style={{ fontSize: 11, color: 'var(--bad)', marginTop: 22, display: 'flex', gap: 10, alignItems: 'flex-start', lineHeight: 1.6 }}>
            <Icon d={I.alert} size={14}/>
            <span>Anote em papel ou guarde em gerenciador de senhas. Perder a seed = perder o acesso. Não há recuperação central.</span>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
          <button className="btn btn-primary" style={{ padding: '14px 28px', fontSize: 12 }}>Anotei. Continuar →</button>
        </div>
      </div>
    </div>
  );
}

// Onboarding mode + networks (servidor)
function ServerOnboardMode() {
  const modes = [
    { k: 'public', t: 'Público', d: 'Conectado ao Hyperswarm. Você publica e replica para o mundo.', dot: '●●', selected: false },
    { k: 'hybrid', t: 'Híbrido', d: 'Conectado, mas cada device decide o que sai. O mais comum.', dot: '●○', selected: true },
    { k: 'local',  t: 'Apenas local', d: 'Sem swarm. Só sua LAN sabe que esse nó existe.', dot: '○○', selected: false },
  ];
  const networks = [
    { name: 'raiznet:public:arateki:v1', d: 'Rede oficial Arateki — filtro padrão verificado', members: 1284, selected: true, founder: 'arateki' },
    { name: 'raiznet:public:coop-verdao:v1', d: 'Cooperativa Verdão — Sul / hortifrúti', members: 78, selected: true, founder: 'coop-verdao' },
    { name: 'raiznet:public:embrapa-ne:v1', d: 'Catálogo de cultivos do semiárido', members: 41, selected: false, founder: 'embrapa-ne' },
  ];
  return (
    <div style={{ width: 1280, height: 800, background: 'var(--bg)', fontFamily: 'var(--f-sans)', color: 'var(--fg)', padding: '48px 80px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 38 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <GRoot size={22}/>
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.22em' }}>R A I Z N E T</span>
        </div>
        <div className="eyebrow">P A S S O 0 3 / 0 4</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, flex: 1 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 12 }}>M O D O D O N Ó</div>
          <h2 className="serif" style={{ fontSize: 36, fontWeight: 400, margin: 0, lineHeight: 1.15 }}>Como esse servidor<br/>se comporta na rede.</h2>
          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 0 }}>
            {modes.map(m => (
              <div key={m.k} style={{
                padding: '20px 0',
                borderTop: '1px solid var(--line)',
                borderBottom: m.k === 'local' ? '1px solid var(--line)' : 'none',
                display: 'grid', gridTemplateColumns: '40px 1fr 80px', gap: 16, alignItems: 'center',
                background: m.selected ? 'var(--paper-tint)' : 'transparent',
                paddingLeft: m.selected ? 16 : 0,
                paddingRight: m.selected ? 16 : 0,
                borderLeft: m.selected ? '2px solid var(--primary)' : '2px solid transparent',
              }}>
                <span className="mono" style={{ fontSize: 14, color: m.selected ? 'var(--primary)' : 'var(--fg-3)' }}>{m.dot}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{m.t}</div>
                  <div style={{ fontSize: 11, color: 'var(--fg-2)', marginTop: 4 }}>{m.d}</div>
                </div>
                <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1px solid var(--line-strong)', justifySelf: 'end', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {m.selected && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)' }}/>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="eyebrow" style={{ marginBottom: 12 }}>R E D E S{'   '}P A R A{'   '}I N G R E S S A R</div>
          <h2 className="serif" style={{ fontSize: 36, fontWeight: 400, margin: 0, lineHeight: 1.15 }}>Você pode estar<br/>em quantas quiser.</h2>
          <div style={{ marginTop: 32 }}>
            {networks.map((n,i) => (
              <div key={i} style={{ padding: '16px 0', borderTop: '1px solid var(--line)', display: 'grid', gridTemplateColumns: '24px 1fr 100px', gap: 14, alignItems: 'center' }}>
                <div style={{ width: 16, height: 16, border: '1px solid var(--line-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {n.selected && <Icon d={I.check} size={11}/>}
                </div>
                <div>
                  <div className="mono" style={{ fontSize: 11 }}>{n.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--fg-2)', marginTop: 4 }}>{n.d}</div>
                </div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', textAlign: 'right' }}>{n.members} peers</div>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--line)', padding: '16px 0', fontSize: 11, color: 'var(--fg-3)', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <Icon d={I.plus} size={12}/> Adicionar outra rede pelo topic / criar nova
            </div>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--line)', paddingTop: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>Pode mudar tudo isso depois em <span style={{ color: 'var(--fg)' }}>Configurações → Rede</span>.</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost">Voltar</button>
          <button className="btn btn-primary">Iniciar nó</button>
        </div>
      </div>
    </div>
  );
}

// helper: sparkline
function Spark({ data, w = 120, h = 32, color = 'var(--primary)', area = true }) {
  const max = Math.max(...data), min = Math.min(...data);
  const r = max - min || 1;
  const pts = data.map((v,i)=> [(i/(data.length-1))*w, h - ((v-min)/r)*(h-2) - 1]);
  const d = pts.map((p,i)=>`${i?'L':'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const dArea = `${d} L${w} ${h} L0 ${h} Z`;
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      {area && <path d={dArea} fill={color} fillOpacity="0.12"/>}
      <path d={d} fill="none" stroke={color} strokeWidth="1.4"/>
    </svg>
  );
}

// Server Dashboard — variant A (editorial / espaçoso)
function ServerDashA() {
  const peers = 47, devices = 124, networks = 2, points = 12840;
  const top = [
    { name: 'Torre 01 — Alface', loc: 'Fortaleza-CE · res 9', last: '12s', ph: '6.4', ec: 1240, t: 24.6 },
    { name: 'Bancada Estufa B', loc: 'Petrolina-PE · res 9', last: '38s', ph: '5.9', ec: 1180, t: 28.1 },
    { name: 'Hidroponia 03', loc: 'Cascavel-PR · res 9', last: '1m', ph: '6.2', ec: 1450, t: 21.4 },
    { name: 'Coop Verdão #14', loc: 'Lages-SC · res 7', last: '2m', ph: '6.0', ec: 1320, t: 18.9 },
    { name: 'Roça do João', loc: 'Sertânia-PE · res 9', last: '4m', ph: '5.7', ec: 980, t: 32.0 },
  ];
  const sparkData = [12, 14, 13, 15, 18, 17, 19, 22, 21, 24, 26, 25, 28, 30, 29, 32];
  return (
    <div style={{ width: 1440, height: 900, background: 'var(--bg)', fontFamily: 'var(--f-sans)', color: 'var(--fg)', display: 'flex' }} className="aquarela">
      <Sidebar active="dash"/>
      <main style={{ flex: 1, padding: '40px 56px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>V I S Ã O G E R A L · arateki:v1</div>
            <h1 className="serif" style={{ fontSize: 44, fontWeight: 400, margin: 0, lineHeight: 1.1 }}>
              A rede está <span style={{ fontStyle: 'italic', color: 'var(--primary)' }}>respirando.</span>
            </h1>
            <p style={{ fontSize: 13, color: 'var(--fg-2)', marginTop: 12 }}>
              {points.toLocaleString('pt-BR')} leituras nas últimas 24h · {peers} peers online · {devices} dispositivos ativos
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" style={{ fontSize: 11 }}>24h</button>
            <button className="btn" style={{ fontSize: 11, background: 'var(--fg)', color: 'var(--bg)' }}>7d</button>
            <button className="btn btn-ghost" style={{ fontSize: 11 }}>30d</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: 'var(--line)', border: '1px solid var(--line)', marginBottom: 48 }}>
          {[
            { l: 'PEERS ATIVOS', v: peers, sub: '+3 desde ontem' },
            { l: 'DISPOSITIVOS', v: devices, sub: 'em 18 cidades' },
            { l: 'REDES', v: networks, sub: 'arateki, coop-verdao' },
            { l: 'LEITURAS / 24H', v: points.toLocaleString('pt-BR'), sub: '534/h média' },
          ].map((k,i)=>(
            <div key={i} style={{ background: 'var(--bg-card)', padding: '24px 24px 20px' }}>
              <div className="eyebrow-tight" style={{ marginBottom: 16 }}>{k.l}</div>
              <div className="serif" style={{ fontSize: 38, fontWeight: 400, lineHeight: 1, margin: 0 }}>{k.v}</div>
              <div style={{ fontSize: 10, color: 'var(--fg-3)', marginTop: 8 }}>{k.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 48 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div className="eyebrow">D I S P O S I T I V O S{'   '}R E C E N T E S</div>
              <span className="mono" style={{ fontSize: 10, color: 'var(--fg-3)' }}>top 5 / 124</span>
            </div>
            <div style={{ borderTop: '1px solid var(--line-strong)' }}>
              {top.map((d,i)=>(
                <div key={i} style={{ padding: '18px 0', borderBottom: '1px solid var(--line)', display: 'grid', gridTemplateColumns: '1.4fr 1fr 60px 60px 60px 60px', gap: 16, alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{d.name}</div>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', marginTop: 2 }}>{d.loc}</div>
                  </div>
                  <Spark data={sparkData.map(v => v + (i%3))} w={120} h={28}/>
                  <span className="mono" style={{ fontSize: 11, textAlign: 'right' }}>{d.t}°</span>
                  <span className="mono" style={{ fontSize: 11, textAlign: 'right' }}>{d.ph}<span style={{ fontSize: 9, color: 'var(--fg-3)' }}> pH</span></span>
                  <span className="mono" style={{ fontSize: 11, textAlign: 'right' }}>{d.ec}</span>
                  <span style={{ fontSize: 10, color: 'var(--fg-3)', textAlign: 'right' }}>{d.last}</span>
                </div>
              ))}
            </div>
          </div>

          <aside>
            <div className="eyebrow" style={{ marginBottom: 18 }}>F I L T R O A T I V O</div>
            <div style={{ borderTop: '1px solid var(--line-strong)', paddingTop: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Arateki — verificados</div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', marginTop: 4 }}>4f8b…2a91 · allowlist</div>
              <div style={{ fontSize: 11, color: 'var(--fg-2)', marginTop: 12, lineHeight: 1.5 }}>
                12.847 MACs aceitos · padrão da rede arateki:v1 segundo o NetworkManifest.
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
                <span style={{ fontSize: 10, padding: '3px 8px', border: '1px solid var(--line)', color: 'var(--fg-2)' }}>União</span>
                <span style={{ fontSize: 10, padding: '3px 8px', background: 'var(--fg)', color: 'var(--bg)' }}>+ Coop-Verdão</span>
              </div>
            </div>

            <div className="eyebrow" style={{ marginTop: 36, marginBottom: 18 }}>S A Ú D E{'   '}D O S{'   '}W A R M</div>
            <div style={{ borderTop: '1px solid var(--line-strong)', paddingTop: 14 }}>
              {[
                { l: 'Replicação', v: '99.4%' },
                { l: 'Latência média', v: '142 ms' },
                { l: 'Disco usado', v: '2.4 GB' },
                { l: 'Cores ativos', v: '124' },
              ].map((s,i)=>(
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--line)', fontSize: 11 }}>
                  <span style={{ color: 'var(--fg-2)' }}>{s.l}</span>
                  <span className="mono">{s.v}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

// Server Dashboard — variant B (terminal/dark vibe — uses card-line)
function ServerDashB() {
  const top = [
    { name: 'torre-01-alface', t: 24.6, h: 68, ph: 6.4, ec: 1240, status: 'ok' },
    { name: 'bancada-estufa-b', t: 28.1, h: 72, ph: 5.9, ec: 1180, status: 'warn' },
    { name: 'hidroponia-03', t: 21.4, h: 64, ph: 6.2, ec: 1450, status: 'ok' },
    { name: 'coop-verdao-14', t: 18.9, h: 80, ph: 6.0, ec: 1320, status: 'ok' },
    { name: 'roca-do-joao', t: 32.0, h: 41, ph: 5.7, ec: 980, status: 'bad' },
  ];
  const dotColor = (s) => s === 'ok' ? 'var(--good)' : s === 'warn' ? 'var(--warn)' : 'var(--bad)';
  return (
    <div style={{ width: 1440, height: 900, background: 'var(--bg)', fontFamily: 'var(--f-mono)', color: 'var(--fg)', display: 'flex' }}>
      <Sidebar active="dash"/>
      <main style={{ flex: 1, padding: '32px 40px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, fontFamily: 'var(--f-sans)' }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.22em', color: 'var(--fg-3)' }}>R A I Z N E T / D A S H — terminal</div>
            <h1 style={{ fontSize: 22, fontWeight: 600, margin: '6px 0 0' }}>raiznet:public:arateki:v1</h1>
          </div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--f-mono)' }}>
            <span>peers <b style={{ color: 'var(--primary)' }}>47</b></span>
            <span>·</span>
            <span>devices <b style={{ color: 'var(--fg)' }}>124</b></span>
            <span>·</span>
            <span>uptime <b>14d 6h</b></span>
            <span style={{ width: 6, height: 6, background: 'var(--good)' }}/>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
          <div className="card-line" style={{ padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, fontFamily: 'var(--f-sans)' }}>
              <span className="eyebrow">L E I T U R A S — 24h</span>
              <div style={{ display: 'flex', gap: 12, fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--f-mono)' }}>
                <span><span style={{ color: 'var(--primary)' }}>━</span> ph média</span>
                <span><span style={{ color: 'var(--warn)' }}>━</span> ec média</span>
                <span><span style={{ color: 'var(--fg-2)' }}>━</span> temp ar</span>
              </div>
            </div>
            <svg viewBox="0 0 600 200" width="100%" height="200" preserveAspectRatio="none">
              {[0,1,2,3,4].map(i=>(
                <line key={i} x1="0" x2="600" y1={i*50} y2={i*50} stroke="var(--line)" strokeDasharray="2 4"/>
              ))}
              <path d="M0 140 Q 60 120 100 130 T 200 100 T 300 80 T 400 90 T 500 70 T 600 60" fill="none" stroke="var(--primary)" strokeWidth="1.5"/>
              <path d="M0 100 Q 60 110 100 95 T 200 110 T 300 95 T 400 85 T 500 95 T 600 80" fill="none" stroke="var(--warn)" strokeWidth="1.2" strokeDasharray="3 2"/>
              <path d="M0 160 Q 60 145 100 155 T 200 130 T 300 145 T 400 120 T 500 130 T 600 115" fill="none" stroke="var(--fg-2)" strokeWidth="1"/>
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--fg-3)', marginTop: 8 }}>
              {['00:00','04:00','08:00','12:00','16:00','20:00','agora'].map(t=> <span key={t}>{t}</span>)}
            </div>
          </div>

          <div className="card-line" style={{ padding: 22 }}>
            <div className="eyebrow" style={{ fontFamily: 'var(--f-sans)', marginBottom: 16 }}>P E E R S</div>
            {[
              { p: 'arateki-gateway-01', addr: '94.130.…ab12', latency: 42, role: 'gateway' },
              { p: 'coop-verdao-relay', addr: '177.18.…fc09', latency: 88, role: 'relay' },
              { p: 'pi-no-quintal', addr: '192.168.…0014', latency: 4, role: 'self' },
              { p: 'embrapa-ne', addr: '200.20.…77a3', latency: 156, role: 'peer' },
            ].map((p,i)=>(
              <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid var(--line)', fontSize: 11 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600 }}>{p.p}</span>
                  <span style={{ color: p.latency < 60 ? 'var(--good)' : p.latency < 120 ? 'var(--warn)' : 'var(--bad)', fontSize: 10 }}>{p.latency}ms</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--fg-3)', fontSize: 10, marginTop: 3 }}>
                  <span>{p.addr}</span>
                  <span>{p.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-line" style={{ marginTop: 14, padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, fontFamily: 'var(--f-sans)' }}>
            <span className="eyebrow">D I S P O S I T I V O S</span>
            <span style={{ fontSize: 10, color: 'var(--fg-3)' }}>top 5 por última leitura</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '20px 2fr 90px 90px 90px 110px 120px', gap: 12, fontSize: 9, color: 'var(--fg-3)', padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
            <span/><span>NAME</span><span style={{ textAlign: 'right' }}>TEMP</span><span style={{ textAlign: 'right' }}>HUM</span><span style={{ textAlign: 'right' }}>PH</span><span style={{ textAlign: 'right' }}>EC ppm</span><span style={{ textAlign: 'right' }}>SPARK</span>
          </div>
          {top.map((d,i)=>(
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '20px 2fr 90px 90px 90px 110px 120px', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--line)', fontSize: 12, alignItems: 'center' }}>
              <span style={{ width: 7, height: 7, background: dotColor(d.status) }}/>
              <span style={{ fontWeight: 500 }}>{d.name}</span>
              <span style={{ textAlign: 'right' }}>{d.t.toFixed(1)}°</span>
              <span style={{ textAlign: 'right' }}>{d.h}%</span>
              <span style={{ textAlign: 'right' }}>{d.ph.toFixed(1)}</span>
              <span style={{ textAlign: 'right' }}>{d.ec}</span>
              <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Spark data={[1,2,1,3,2,4,3,5,4,5,6,5,7]} w={110} h={20} color={dotColor(d.status)}/>
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

window.ServerOnboardSeed = ServerOnboardSeed;
window.ServerOnboardMode = ServerOnboardMode;
window.ServerDashA = ServerDashA;
window.ServerDashB = ServerDashB;
window.Sidebar = Sidebar;
window.Spark = Spark;
