// Servidor Raiznet — Mapa H3 (2 variações), Device, Provisionamento

// Hex grid helper for H3 visualization
function HexCell({ cx, cy, r, fill, opacity = 1, stroke }) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i + Math.PI/6;
    pts.push(`${(cx + r*Math.cos(a)).toFixed(1)},${(cy + r*Math.sin(a)).toFixed(1)}`);
  }
  return <polygon points={pts.join(' ')} fill={fill} fillOpacity={opacity} stroke={stroke || 'var(--line)'} strokeWidth="0.5"/>;
}

// Map A — editorial map, choropleth on pH
function ServerMapA() {
  const cells = [];
  // generate honeycomb
  const cols = 18, rows = 12;
  const r = 26;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cx = 80 + x * r * Math.sqrt(3) + (y % 2 ? r * Math.sqrt(3)/2 : 0);
      const cy = 80 + y * r * 1.5;
      // create some "data" pattern
      const intensity = Math.max(0, 1 - Math.hypot(x - 9, y - 6) / 10) * (0.4 + Math.random() * 0.6);
      const has = intensity > 0.18;
      cells.push({ cx, cy, intensity: has ? intensity : 0, has });
    }
  }
  return (
    <div style={{ width: 1440, height: 900, background: 'var(--bg)', fontFamily: 'var(--f-sans)', color: 'var(--fg)', display: 'flex' }} className="aquarela">
      <Sidebar active="map"/>
      <main style={{ flex: 1, padding: '32px 48px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>M A P A · res 5 · Brasil</div>
            <h1 className="serif" style={{ fontSize: 36, fontWeight: 400, margin: 0 }}>O território, em <span style={{ fontStyle: 'italic', color: 'var(--primary)' }}>colmeia</span>.</h1>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['ph','ec','temp','umidade','densidade'].map((m,i)=>(
              <button key={m} className={i===0?'btn':'btn btn-ghost'} style={{ fontSize: 10, padding: '7px 12px', background: i===0?'var(--fg)':'transparent', color: i===0?'var(--bg)':'var(--fg)' }}>{m}</button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24, minHeight: 0 }}>
          <div style={{ position: 'relative', border: '1px solid var(--line)', background: 'var(--bg-card)', overflow: 'hidden' }}>
            <svg viewBox="0 0 900 600" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
              {cells.map((c,i)=> c.has && (
                <HexCell key={i} cx={c.cx} cy={c.cy} r={r-2} fill="var(--primary)" opacity={c.intensity * 0.85} stroke="var(--bg)"/>
              ))}
              {/* highlighted cell */}
              <HexCell cx={80 + 9 * r * Math.sqrt(3) + r*Math.sqrt(3)/2} cy={80 + 6 * r * 1.5} r={r-2} fill="none" stroke="var(--line-strong)"/>
            </svg>
            <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', pointerEvents: 'none' }}>
              <div>
                <div className="eyebrow-tight">L E G E N D A — pH médio</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginTop: 8, height: 8, width: 200 }}>
                  {[0.1,0.25,0.45,0.65,0.85].map((v,i)=>(
                    <div key={i} style={{ flex: 1, height: 8, background: 'var(--primary)', opacity: v }}/>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: 200, fontSize: 9, color: 'var(--fg-3)', marginTop: 4 }}>
                  <span>5.4</span><span>6.0</span><span>6.6</span><span>7.2</span>
                </div>
              </div>
              <div className="mono" style={{ fontSize: 9, color: 'var(--fg-3)' }}>H3 res 5 · 252 km² / célula</div>
            </div>

            {/* zoom buttons */}
            <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 1, border: '1px solid var(--line-strong)' }}>
              {['+','−','◯'].map((c,i)=>(
                <div key={i} style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-card)', borderBottom: i<2?'1px solid var(--line-strong)':'none', fontSize: 14, cursor: 'pointer' }}>{c}</div>
              ))}
            </div>
          </div>

          <aside style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 12 }}>C É L U L A{'   '}S E L E C I O N A D A</div>
              <div style={{ borderTop: '1px solid var(--line-strong)', paddingTop: 14 }}>
                <div className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>85283473fffffff</div>
                <div className="serif" style={{ fontSize: 24, marginTop: 6, fontWeight: 400 }}>Fortaleza-CE · zona leste</div>
                {[
                  { l: 'Dispositivos', v: '14' },
                  { l: 'pH médio', v: '6.4' },
                  { l: 'EC médio', v: '1240 ppm' },
                  { l: 'Temp média', v: '24.6°C' },
                  { l: 'Cultivos predominantes', v: 'alface, manjericão' },
                ].map((s,i)=>(
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--line)', fontSize: 11 }}>
                    <span style={{ color: 'var(--fg-2)' }}>{s.l}</span>
                    <span className="mono">{s.v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 12 }}>R E S O L U Ç Ã O{'   '}H 3</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--line)', border: '1px solid var(--line)' }}>
                {[
                  { r: 'res 5', s: '252 km²', d: 'região', sel: true },
                  { r: 'res 7', s: '5 km²', d: 'cidade' },
                  { r: 'res 9', s: '0.1 km²', d: 'fazenda' },
                  { r: 'res 11', s: '2.500 m²', d: 'canteiro' },
                ].map((r,i)=>(
                  <div key={i} style={{ background: r.sel?'var(--paper-tint)':'var(--bg-card)', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
                    <span className="mono" style={{ color: r.sel?'var(--primary)':'var(--fg)' }}>{r.r}</span>
                    <span style={{ color: 'var(--fg-3)', fontSize: 10 }}>{r.s}</span>
                    <span style={{ color: 'var(--fg-2)', fontSize: 10 }}>{r.d}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

// Map B — terminal/dark, dot heatmap
function ServerMapB() {
  const dots = [];
  for (let i = 0; i < 240; i++) {
    dots.push({
      x: 50 + Math.random()*820, y: 30 + Math.random()*440,
      v: Math.random(),
    });
  }
  return (
    <div style={{ width: 1440, height: 900, background: 'var(--bg)', fontFamily: 'var(--f-mono)', color: 'var(--fg)', display: 'flex' }}>
      <Sidebar active="map"/>
      <main style={{ flex: 1, padding: '28px 36px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, fontFamily: 'var(--f-sans)' }}>
          <div>
            <div className="eyebrow">M A P / r e s 7 / arateki:v1</div>
            <h1 style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>$ raiznet map --metric=ec --filter=arateki</h1>
          </div>
          <div style={{ display: 'flex', gap: 14, fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--f-mono)' }}>
            <span>cells <b>1842</b></span><span>devices <b>124</b></span><span>peers <b>47</b></span>
          </div>
        </div>

        <div className="card-line" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, padding: 0 }}>
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <svg viewBox="0 0 900 500" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
              {/* grid */}
              {[...Array(20)].map((_,i)=>(
                <line key={'v'+i} x1={i*45} x2={i*45} y1="0" y2="500" stroke="var(--line)" strokeWidth="0.3"/>
              ))}
              {[...Array(12)].map((_,i)=>(
                <line key={'h'+i} x1="0" x2="900" y1={i*45} y2={i*45} stroke="var(--line)" strokeWidth="0.3"/>
              ))}
              {/* hex cells */}
              {[...Array(8)].map((_,y)=>
                [...Array(14)].map((_,x)=>{
                  const cx = 90 + x * 30 * Math.sqrt(3) + (y%2?30*Math.sqrt(3)/2:0);
                  const cy = 60 + y * 45;
                  const intensity = Math.max(0, 1 - Math.hypot(x - 6, y - 4)/8) * 0.9;
                  return intensity > 0.15 ? (
                    <HexCell key={`${x}-${y}`} cx={cx} cy={cy} r={28} fill="var(--primary)" opacity={intensity * 0.5} stroke="var(--primary-line)"/>
                  ) : null;
                })
              )}
              {/* device dots */}
              {dots.map((d,i)=>(
                <circle key={i} cx={d.x} cy={d.y} r={d.v > 0.7 ? 3 : 2} fill="var(--primary)" opacity={0.4 + d.v*0.6}/>
              ))}
            </svg>
            <div style={{ position: 'absolute', top: 10, left: 14, fontSize: 9, color: 'var(--fg-3)' }}>
              -8.05° S, -34.88° W → -33.74° S, -73.99° W
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--line)', padding: '10px 16px', fontSize: 10, color: 'var(--fg-3)', display: 'flex', justifyContent: 'space-between' }}>
            <span>granularity = res7 ~ 5km²/cell</span>
            <span>opacity ∝ density · saturation ∝ ec_avg</span>
            <span>last sync: 4s ago</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, marginTop: 14, background: 'var(--line)', border: '1px solid var(--line)' }}>
          {[
            { l: 'TOP REGIÃO', v: 'Sertão-PE', s: '34 devices' },
            { l: 'PH OUTLIER', v: '5.7 ↓', s: 'roca-do-joao' },
            { l: 'EC PICO', v: '1820 ppm', s: 'estufa-b · há 2m' },
            { l: 'COBERTURA', v: '18 cidades', s: '7 estados · 2 países' },
          ].map((c,i)=>(
            <div key={i} style={{ background: 'var(--bg-card)', padding: 16, fontFamily: 'var(--f-sans)' }}>
              <div className="eyebrow-tight" style={{ marginBottom: 10 }}>{c.l}</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{c.v}</div>
              <div style={{ fontSize: 9, color: 'var(--fg-3)', marginTop: 4 }}>{c.s}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

// Device individual — variant A (editorial, espaçoso)
function ServerDeviceA() {
  return (
    <div style={{ width: 1440, height: 900, background: 'var(--bg)', fontFamily: 'var(--f-sans)', color: 'var(--fg)', display: 'flex' }} className="aquarela">
      <Sidebar active="devices"/>
      <main style={{ flex: 1, padding: '36px 56px', overflow: 'hidden' }}>
        <div style={{ fontSize: 11, color: 'var(--fg-3)', marginBottom: 8 }}>
          <span style={{ cursor: 'pointer' }}>Dispositivos</span> &nbsp;·&nbsp; Torre 01 — Alface
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <GLeaf size={28}/>
              <h1 className="serif" style={{ fontSize: 42, fontWeight: 400, margin: 0 }}>Torre 01 — Alface</h1>
            </div>
            <div style={{ display: 'flex', gap: 18, marginTop: 12, fontSize: 11, color: 'var(--fg-3)' }}>
              <span className="mono">7d2a8b…f4e1</span>
              <span>·</span>
              <span>MAC b8:27:eb:42:1f:3a</span>
              <span>·</span>
              <span>Fortaleza-CE · res 9</span>
              <span>·</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, background: 'var(--good)' }}/> ativo · última leitura 12s
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" style={{ fontSize: 11 }}>Política</button>
            <button className="btn btn-ghost" style={{ fontSize: 11 }}>Transferir</button>
            <button className="btn btn-primary" style={{ fontSize: 11 }}>Plantar safra</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: 'var(--line)', border: '1px solid var(--line)', marginBottom: 32 }}>
          {[
            { l: 'TEMP AR', v: '24.6', u: '°C', range: '18–26 · ideal' },
            { l: 'UMIDADE', v: '68', u: '%', range: '60–80 · ideal' },
            { l: 'pH', v: '6.4', u: '', range: '5.8–6.8 · ideal' },
            { l: 'EC', v: '1240', u: 'ppm', range: '1100–1400 · ideal' },
          ].map((k,i)=>(
            <div key={i} style={{ background: 'var(--bg-card)', padding: '20px 22px' }}>
              <div className="eyebrow-tight" style={{ marginBottom: 14 }}>{k.l}</div>
              <div className="serif" style={{ fontSize: 36, fontWeight: 400, lineHeight: 1 }}>{k.v}<span style={{ fontSize: 14, color: 'var(--fg-3)', marginLeft: 4, fontFamily: 'var(--f-sans)' }}>{k.u}</span></div>
              <div style={{ fontSize: 10, color: 'var(--good)', marginTop: 8 }}>{k.range}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 40 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div className="eyebrow">L E I T U R A S — 7d</div>
              <div style={{ display: 'flex', gap: 10, fontSize: 10, color: 'var(--fg-3)' }}>
                <span><span style={{ color: 'var(--primary)' }}>━</span> pH</span>
                <span><span style={{ color: 'var(--warn)' }}>━</span> EC</span>
                <span><span style={{ color: 'var(--fg-2)' }}>━</span> temp</span>
                <span style={{ color: 'var(--fg-4)', borderBottom: '1px dashed var(--fg-4)' }}>banda ideal</span>
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--line-strong)', paddingTop: 18 }}>
              <svg viewBox="0 0 700 280" width="100%" height="280">
                <rect x="0" y="80" width="700" height="120" fill="var(--primary-soft)" opacity="0.4"/>
                <text x="6" y="76" fontSize="9" fill="var(--fg-3)" fontFamily="var(--f-mono)">banda ideal pH</text>
                {[0,1,2,3,4].map(i=>(
                  <line key={i} x1="0" x2="700" y1={i*70} y2={i*70} stroke="var(--line)"/>
                ))}
                <path d="M0 140 Q 80 130 140 145 Q 200 110 280 130 Q 360 100 420 120 Q 500 95 580 110 Q 640 90 700 105" fill="none" stroke="var(--primary)" strokeWidth="1.6"/>
                <path d="M0 90 Q 80 100 140 85 Q 200 110 280 95 Q 360 80 420 100 Q 500 75 580 90 Q 640 85 700 80" fill="none" stroke="var(--warn)" strokeWidth="1.4" strokeDasharray="3 2"/>
                <path d="M0 200 Q 80 195 140 210 Q 200 180 280 195 Q 360 170 420 185 Q 500 160 580 175 Q 640 165 700 155" fill="none" stroke="var(--fg-2)" strokeWidth="1"/>
              </svg>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--fg-3)', marginTop: 6, fontFamily: 'var(--f-mono)' }}>
                {['seg 14','ter','qua','qui','sex','sáb','dom','seg 21'].map((d,i)=> <span key={i}>{d}</span>)}
              </div>
            </div>
          </div>

          <aside>
            <div className="eyebrow" style={{ marginBottom: 12 }}>S A F R A A T I V A</div>
            <div className="card-paper" style={{ padding: 20, marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <GSprout size={20}/>
                <div className="serif" style={{ fontSize: 20 }}>Alface crespa</div>
              </div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', marginTop: 6 }}>builtin:alface-crespa:v2</div>
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6 }}>
                  <span style={{ color: 'var(--fg-2)' }}>Plantio</span>
                  <span>14 abr · 13 dias atrás</span>
                </div>
                <div style={{ height: 4, background: 'var(--bg-inset)' }}>
                  <div style={{ width: '37%', height: '100%', background: 'var(--primary)' }}/>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--fg-3)', marginTop: 6 }}>
                  <span>13 / 35 dias</span>
                  <span>colheita: 22 dias</span>
                </div>
              </div>
            </div>

            <div className="eyebrow" style={{ marginBottom: 12 }}>P O L Í T I C A — público</div>
            <div style={{ borderTop: '1px solid var(--line-strong)' }}>
              {[
                { f: 'temp_ambient', d: 'plain', c: 'var(--good)' },
                { f: 'humidity', d: 'plain', c: 'var(--good)' },
                { f: 'ph', d: 'encrypted', c: 'var(--warn)' },
                { f: 'ec', d: 'encrypted', c: 'var(--warn)' },
                { f: 'water_level', d: 'omit', c: 'var(--fg-4)' },
              ].map((p,i)=>(
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--line)', fontSize: 11 }}>
                  <span className="mono">{p.f}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--fg-2)' }}>
                    <span style={{ width: 6, height: 6, background: p.c }}/>
                    {p.d}
                  </span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

// Device — variant B (terminal, dense)
function ServerDeviceB() {
  return (
    <div style={{ width: 1440, height: 900, background: 'var(--bg)', fontFamily: 'var(--f-mono)', color: 'var(--fg)', display: 'flex' }}>
      <Sidebar active="devices"/>
      <main style={{ flex: 1, padding: '24px 32px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, fontFamily: 'var(--f-sans)' }}>
          <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>devices /</span>
          <span style={{ fontSize: 16, fontWeight: 600 }}>torre-01-alface</span>
          <span style={{ width: 7, height: 7, background: 'var(--good)' }}/>
          <span style={{ fontSize: 10, color: 'var(--fg-3)' }}>active · seq 18429 · 12s ago</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <button className="btn btn-ghost" style={{ fontSize: 10, padding: '6px 10px', fontFamily: 'var(--f-sans)' }}>policy</button>
            <button className="btn btn-ghost" style={{ fontSize: 10, padding: '6px 10px', fontFamily: 'var(--f-sans)' }}>transfer</button>
            <button className="btn btn-ghost" style={{ fontSize: 10, padding: '6px 10px', fontFamily: 'var(--f-sans)' }}>raw json</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr', gap: 1, background: 'var(--line)', border: '1px solid var(--line)' }}>
          {[
            { l: 'temp_ambient', v: '24.6', s: '24.1 / 25.2', dot: 'var(--good)' },
            { l: 'humidity', v: '68', s: '64 / 71', dot: 'var(--good)' },
            { l: 'ph', v: '6.4', s: '6.2 / 6.6', dot: 'var(--good)' },
            { l: 'ec', v: '1240', s: '1180 / 1290', dot: 'var(--good)' },
            { l: 'water_level', v: '12.4', s: '12.1 / 13.0', dot: 'var(--good)' },
            { l: 'bat_volts', v: '3.84', s: '3.71 / 3.92', dot: 'var(--warn)' },
          ].map((k,i)=>(
            <div key={i} style={{ background: 'var(--bg-card)', padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 9, color: 'var(--fg-3)' }}>
                <span>{k.l}</span><span style={{ width: 5, height: 5, background: k.dot }}/>
              </div>
              <div style={{ fontSize: 22, fontWeight: 600, marginTop: 8 }}>{k.v}</div>
              <div style={{ fontSize: 9, color: 'var(--fg-3)', marginTop: 6 }}>min / max 24h: {k.s}</div>
              <div style={{ marginTop: 8 }}>
                <Spark data={[3,4,3,5,4,6,5,7,6,5,4,5,6,7,6,5]} w={140} h={20} color={k.dot}/>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginTop: 14 }}>
          <div className="card-line" style={{ padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, fontFamily: 'var(--f-sans)' }}>
              <span className="eyebrow">T E L E M E T R Y — 7d</span>
              <div style={{ display: 'flex', gap: 8, fontSize: 9, fontFamily: 'var(--f-mono)', color: 'var(--fg-3)' }}>
                <span style={{ color: 'var(--primary)' }}>● ph</span>
                <span style={{ color: 'var(--warn)' }}>● ec</span>
                <span style={{ color: 'var(--fg-2)' }}>● temp</span>
              </div>
            </div>
            <svg viewBox="0 0 600 280" width="100%" height="280">
              <rect x="0" y="100" width="600" height="80" fill="var(--primary)" fillOpacity="0.06"/>
              {[0,1,2,3,4,5,6].map(i=>(
                <line key={i} x1={i*100} x2={i*100} y1="0" y2="280" stroke="var(--line)" strokeWidth="0.4" strokeDasharray="2 3"/>
              ))}
              <path d="M0 140 Q 60 125 100 130 T 200 110 T 300 120 T 400 100 T 500 110 T 600 95" fill="none" stroke="var(--primary)" strokeWidth="1.4"/>
              <path d="M0 100 Q 60 110 100 90 T 200 105 T 300 90 T 400 100 T 500 85 T 600 90" fill="none" stroke="var(--warn)" strokeWidth="1.2" strokeDasharray="3 2"/>
              <path d="M0 200 Q 60 195 100 210 T 200 175 T 300 190 T 400 165 T 500 175 T 600 155" fill="none" stroke="var(--fg-2)" strokeWidth="0.9"/>
            </svg>
            <div style={{ fontFamily: 'var(--f-sans)', display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--fg-3)', marginTop: 6 }}>
              {['seg','ter','qua','qui','sex','sáb','dom'].map(d=> <span key={d}>{d}</span>)}
            </div>
          </div>

          <div className="card-line" style={{ padding: 18 }}>
            <div className="eyebrow" style={{ fontFamily: 'var(--f-sans)', marginBottom: 14 }}>L O G — eventos</div>
            {[
              { t: '12s', e: 'telemetry seq=18429', c: 'var(--fg-2)' },
              { t: '3m', e: 'ec spike: 1290 ppm', c: 'var(--warn)' },
              { t: '14m', e: 'crop adjustment fired (temp>28)', c: 'var(--fg-2)' },
              { t: '2h', e: 'replicated to 3 peers', c: 'var(--good)' },
              { t: '6h', e: 'key_version=3 (rotated)', c: 'var(--primary)' },
              { t: '1d', e: 'safra: alface-crespa planted', c: 'var(--fg-2)' },
              { t: '13d', e: 'DeviceClaim signed', c: 'var(--fg-2)' },
            ].map((l,i)=>(
              <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--line)', fontSize: 11 }}>
                <span style={{ width: 30, color: 'var(--fg-3)', fontSize: 10 }}>{l.t}</span>
                <span style={{ width: 5, height: 5, background: l.c, marginTop: 5 }}/>
                <span>{l.e}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

// Provisionamento de novo device (claim)
function ServerProvision() {
  return (
    <div style={{ width: 1440, height: 900, background: 'var(--bg)', fontFamily: 'var(--f-sans)', color: 'var(--fg)', display: 'flex' }} className="aquarela">
      <Sidebar active="devices"/>
      <main style={{ flex: 1, padding: '40px 80px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 36 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>P R O V I S I O N A M E N T O</div>
            <h1 className="serif" style={{ fontSize: 38, fontWeight: 400, margin: 0 }}>Novo dispositivo na rede.</h1>
          </div>
          <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>passo 03 — DeviceClaim</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 14 }}>D I S P O S I T I V O D E T E C T A D O</div>
            <div className="card-paper" style={{ padding: 28, border: '1px solid var(--primary-line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Icon d={I.cpu} size={28}/>
                <div>
                  <div className="serif" style={{ fontSize: 22 }}>safrasense-a3f2</div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', marginTop: 4 }}>via mDNS · 192.168.1.42</div>
                </div>
              </div>
              <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px' }}>
                {[
                  { l: 'Device pubkey', v: '7d2a8b4c…f4e1' },
                  { l: 'MAC', v: 'b8:27:eb:42:1f:3a' },
                  { l: 'Modelo', v: 'SafraSense v2' },
                  { l: 'Firmware', v: '0.4.2' },
                  { l: 'Sensores', v: 'DHT, TDS, Laser, Bat' },
                  { l: 'Idioma', v: 'pt-BR' },
                ].map((f,i)=>(
                  <div key={i}>
                    <div className="eyebrow-tight" style={{ marginBottom: 4 }}>{f.l}</div>
                    <div className="mono" style={{ fontSize: 11 }}>{f.v}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="eyebrow" style={{ marginTop: 38, marginBottom: 14 }}>D A R{'   '}N O M E{'   '}A{'   '}E S T E{'   '}S E N S O R</div>
            <input defaultValue="Torre 01 — Alface" style={{ width: '100%', boxSizing: 'border-box', padding: '14px 16px', border: '1px solid var(--line-strong)', background: 'var(--bg-card)', fontSize: 16, fontFamily: 'var(--f-sans)', color: 'var(--fg)', outline: 'none' }}/>
          </div>

          <div>
            <div className="eyebrow" style={{ marginBottom: 14 }}>L O C A L I Z A Ç Ã O · escolha a granularidade</div>
            <div style={{ border: '1px solid var(--line)', padding: 22, background: 'var(--bg-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
                <svg width="100" height="80" viewBox="0 0 100 80">
                  {[...Array(3)].map((_,y)=>
                    [...Array(4)].map((_,x)=>{
                      const cx = 14 + x*22 + (y%2?11:0);
                      const cy = 14 + y*22;
                      const sel = x===1 && y===1;
                      return <HexCell key={`${x}-${y}`} cx={cx} cy={cy} r={11} fill={sel?'var(--primary)':'var(--bg-2)'} opacity={sel?0.5:1} stroke={sel?'var(--primary)':'var(--line)'}/>;
                    })
                  )}
                </svg>
                <div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>892a1072…ffff</div>
                  <div style={{ fontSize: 14, marginTop: 4 }}>Fortaleza-CE · zona leste</div>
                  <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 4 }}>~ 0.1 km² (precisão fazenda)</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, fontSize: 10 }}>
                <span style={{ color: 'var(--fg-3)' }}>res 5</span>
                <input type="range" min="5" max="11" step="2" defaultValue="9" style={{ flex: 1, margin: '0 14px', accentColor: 'var(--primary)' }}/>
                <span style={{ color: 'var(--fg-3)' }}>res 11</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--fg-4)', marginTop: 6 }}>
                <span>região</span><span>cidade</span><span style={{ color: 'var(--primary)' }}>fazenda</span><span>canteiro</span>
              </div>
            </div>

            <div className="eyebrow" style={{ marginTop: 38, marginBottom: 14 }}>A S S I N A R D E V I C E C L A I M</div>
            <p style={{ fontSize: 11, color: 'var(--fg-2)', lineHeight: 1.6 }}>
              Vamos publicar no seu core público uma declaração assinada com a sua chave de usuário, vinculando este dispositivo a você. A rede passará a aceitar leituras dele como suas.
            </p>
            <div style={{ marginTop: 18, padding: 14, background: 'var(--bg-inset)', fontFamily: 'var(--f-mono)', fontSize: 10, lineHeight: 1.7, color: 'var(--fg-2)' }}>
              <div>{`{`}</div>
              <div style={{ paddingLeft: 14 }}>type: "DeviceClaim",</div>
              <div style={{ paddingLeft: 14 }}>device_pubkey: <span style={{ color: 'var(--primary)' }}>"7d2a8b…f4e1"</span>,</div>
              <div style={{ paddingLeft: 14 }}>device_mac: "b8:27:eb:42:1f:3a",</div>
              <div style={{ paddingLeft: 14 }}>claimed_at: 1745700000000,</div>
              <div style={{ paddingLeft: 14 }}>signature: <span style={{ color: 'var(--fg-3)' }}>&lt;assinará a seguir&gt;</span></div>
              <div>{`}`}</div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }}>Voltar</button>
              <button className="btn btn-primary" style={{ flex: 2 }}>Assinar e adicionar à rede</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

window.ServerMapA = ServerMapA;
window.ServerMapB = ServerMapB;
window.ServerDeviceA = ServerDeviceA;
window.ServerDeviceB = ServerDeviceB;
window.ServerProvision = ServerProvision;
window.HexCell = HexCell;
