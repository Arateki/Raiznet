// Servidor Raiznet — Crops/Safras, Filtros, Materiais, Settings, Mobile

// ─────────────────────────────────────────────────────────────────────────────
// CROPS / CULTIVO PROFILES
function ServerCrops() {
  const cats = [
    { name: 'Folhosas', count: 14, sel: true },
    { name: 'Frutos', count: 8 },
    { name: 'Raízes', count: 6 },
    { name: 'Ervas medicinais', count: 11 },
    { name: 'Cogumelos', count: 4 },
    { name: 'Customizados', count: 3 },
  ];
  const crops = [
    { name: 'Alface crespa', id: 'builtin:alface-crespa:v2', ph: '5.8–6.8', ec: '1100–1400', t: '15–22°', d: 35, by: 'arateki', verified: true, active: 18 },
    { name: 'Manjericão', id: 'builtin:manjericao:v1', ph: '5.5–6.5', ec: '1200–1600', t: '20–28°', d: 60, by: 'arateki', verified: true, active: 7 },
    { name: 'Rúcula', id: 'builtin:rucula:v3', ph: '6.0–7.0', ec: '1000–1300', t: '15–20°', d: 28, by: 'arateki', verified: true, active: 12 },
    { name: 'Espinafre baby', id: 'coop-verdao:espinafre-baby:v1', ph: '6.0–7.5', ec: '1200–1500', t: '14–22°', d: 32, by: 'coop-verdao', verified: false, active: 4 },
    { name: 'Couve manteiga', id: 'builtin:couve:v2', ph: '6.0–7.0', ec: '1500–1800', t: '15–25°', d: 50, by: 'arateki', verified: true, active: 9 },
    { name: 'Hortelã', id: 'lia.local:hortela-quintal:v1', ph: '6.0–7.0', ec: '1200–1500', t: '18–24°', d: 45, by: 'você', verified: false, active: 1 },
  ];
  return (
    <div style={{ width: 1440, height: 900, background: 'var(--bg)', fontFamily: 'var(--f-sans)', color: 'var(--fg)', display: 'flex' }} className="aquarela">
      <Sidebar active="crops"/>
      <main style={{ flex: 1, padding: '40px 56px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 36 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>C U L T I V O S</div>
            <h1 className="serif" style={{ fontSize: 42, fontWeight: 400, margin: 0 }}>
              Cada planta tem <span style={{ fontStyle: 'italic', color: 'var(--primary)' }}>seu próprio idioma.</span>
            </h1>
            <p style={{ fontSize: 13, color: 'var(--fg-2)', marginTop: 12, maxWidth: 560 }}>
              CropProfiles definem a janela ideal de pH, EC, temperatura e duração. Eles informam alertas, ajustes automáticos, e o que cada safra deveria estar fazendo.
            </p>
          </div>
          <button className="btn btn-primary" style={{ fontSize: 11 }}><Icon d={I.plus} size={12}/> Novo perfil</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 48 }}>
          <aside>
            <div className="eyebrow" style={{ marginBottom: 14 }}>C A T E G O R I A S</div>
            <div style={{ borderTop: '1px solid var(--line-strong)' }}>
              {cats.map((c,i)=>(
                <div key={i} style={{
                  padding: '12px 0', borderBottom: '1px solid var(--line)',
                  display: 'flex', justifyContent: 'space-between', fontSize: 12,
                  color: c.sel ? 'var(--fg)' : 'var(--fg-2)',
                  fontWeight: c.sel ? 600 : 400,
                  paddingLeft: c.sel ? 8 : 0,
                  borderLeft: c.sel ? '2px solid var(--primary)' : '2px solid transparent',
                  cursor: 'pointer',
                }}>
                  <span>{c.name}</span>
                  <span className="mono" style={{ color: 'var(--fg-3)' }}>{c.count}</span>
                </div>
              ))}
            </div>
          </aside>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div className="eyebrow">F O L H O S A S — 14 perfis</div>
              <div style={{ display: 'flex', gap: 8, fontSize: 10 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--fg-3)' }}>
                  <Icon d={I.shield} size={12}/> verificado pela rede
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 1, background: 'var(--line)', border: '1px solid var(--line)' }}>
              {crops.map((c,i)=>(
                <div key={i} style={{ background: 'var(--bg-card)', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <GSprout size={18}/>
                      <div>
                        <div className="serif" style={{ fontSize: 22 }}>{c.name}</div>
                        <div className="mono" style={{ fontSize: 9, color: 'var(--fg-3)', marginTop: 4 }}>{c.id}</div>
                      </div>
                    </div>
                    {c.verified && <Icon d={I.shield} size={14}/>}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
                    <div>
                      <div className="eyebrow-tight">P H</div>
                      <div className="mono" style={{ fontSize: 12, marginTop: 4 }}>{c.ph}</div>
                    </div>
                    <div>
                      <div className="eyebrow-tight">E C ppm</div>
                      <div className="mono" style={{ fontSize: 12, marginTop: 4 }}>{c.ec}</div>
                    </div>
                    <div>
                      <div className="eyebrow-tight">T E M P</div>
                      <div className="mono" style={{ fontSize: 12, marginTop: 4 }}>{c.t}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--fg-3)', alignItems: 'center', marginTop: 4 }}>
                    <span>por <span style={{ color: 'var(--fg-2)' }}>{c.by}</span> · {c.d}d</span>
                    <span><b style={{ color: 'var(--primary)' }}>{c.active}</b> safras ativas</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FILTROS — set algebra
function ServerFilters() {
  const filters = [
    { name: 'Arateki — verificados', id: '4f8b…2a91', kind: 'allowlist', size: 12847, by: 'arateki', active: true },
    { name: 'Coop Verdão — sócios', id: '8a3c…1f04', kind: 'allowlist', size: 78, by: 'coop-verdao', active: true },
    { name: 'Conhecidos confiáveis', id: 'lia.local', kind: 'allowlist', size: 14, by: 'você (local)' },
    { name: 'Banidos da rede arateki', id: 'arateki:bans', kind: 'denylist', size: 23, by: 'arateki' },
  ];
  return (
    <div style={{ width: 1440, height: 900, background: 'var(--bg)', fontFamily: 'var(--f-sans)', color: 'var(--fg)', display: 'flex' }} className="aquarela">
      <Sidebar active="filters"/>
      <main style={{ flex: 1, padding: '40px 56px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 36 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>F I L T R O S</div>
            <h1 className="serif" style={{ fontSize: 42, fontWeight: 400, margin: 0 }}>
              Você decide <span style={{ fontStyle: 'italic', color: 'var(--primary)' }}>quem entra</span> na sua janela.
            </h1>
            <p style={{ fontSize: 13, color: 'var(--fg-2)', marginTop: 12, maxWidth: 600 }}>
              Filtros são listas assinadas de MACs. Combine-os por união, interseção e diferença para construir exatamente o conjunto de dispositivos que você quer ouvir — sem precisar de moderação central.
            </p>
          </div>
          <button className="btn btn-primary" style={{ fontSize: 11 }}><Icon d={I.plus} size={12}/> Criar filtro</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 56 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 14 }}>F I L T R O S A S S I N A D O S — disponíveis na sua rede</div>
            <div style={{ borderTop: '1px solid var(--line-strong)' }}>
              {filters.map((f,i)=>(
                <div key={i} style={{ padding: '20px 0', borderBottom: '1px solid var(--line)', display: 'grid', gridTemplateColumns: '20px 1fr 110px 90px 70px', gap: 14, alignItems: 'center' }}>
                  <div style={{ width: 14, height: 14, border: '1px solid var(--line-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {f.active && <Icon d={I.check} size={10}/>}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {f.name}
                      {f.kind === 'denylist' && <span style={{ fontSize: 9, padding: '2px 6px', background: 'var(--bad)', color: 'var(--bg)' }}>DENY</span>}
                    </div>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', marginTop: 4 }}>{f.id} · por {f.by}</div>
                  </div>
                  <span className="mono" style={{ fontSize: 11 }}>{f.size.toLocaleString('pt-BR')} MACs</span>
                  <span style={{ fontSize: 10, color: 'var(--fg-3)' }}>{f.kind}</span>
                  <button className="btn btn-ghost" style={{ fontSize: 10, padding: '6px 10px', justifySelf: 'end' }}>Editar</button>
                </div>
              ))}
            </div>
          </div>

          <aside>
            <div className="eyebrow" style={{ marginBottom: 14 }}>C O M P O S I Ç Ã O — visão atual</div>
            <div className="card-paper" style={{ padding: 24, border: '1px solid var(--primary-line)' }}>
              <div style={{ position: 'relative', height: 200, marginBottom: 18 }}>
                <svg viewBox="0 0 280 200" width="100%" height="200">
                  <circle cx="100" cy="100" r="70" fill="var(--primary)" fillOpacity="0.25" stroke="var(--primary)" strokeWidth="1"/>
                  <circle cx="180" cy="100" r="70" fill="var(--primary)" fillOpacity="0.25" stroke="var(--primary)" strokeWidth="1"/>
                  <text x="60" y="105" fontSize="11" fill="var(--fg)" fontFamily="var(--f-mono)">arateki</text>
                  <text x="60" y="118" fontSize="9" fill="var(--fg-3)" fontFamily="var(--f-mono)">12.847</text>
                  <text x="195" y="105" fontSize="11" fill="var(--fg)" fontFamily="var(--f-mono)">verdão</text>
                  <text x="195" y="118" fontSize="9" fill="var(--fg-3)" fontFamily="var(--f-mono)">78</text>
                  <text x="135" y="105" fontSize="9" fill="var(--fg-2)" fontFamily="var(--f-mono)" textAnchor="middle">∩</text>
                  <text x="135" y="118" fontSize="9" fill="var(--fg-3)" fontFamily="var(--f-mono)" textAnchor="middle">14</text>
                </svg>
              </div>
              <div className="mono" style={{ fontSize: 11, lineHeight: 1.7, padding: 12, background: 'var(--bg-card)', border: '1px solid var(--line)', color: 'var(--fg-2)' }}>
                <div><span style={{ color: 'var(--primary)' }}>arateki</span> ∪ <span style={{ color: 'var(--primary)' }}>coop-verdão</span></div>
                <div style={{ marginTop: 4 }}>− <span style={{ color: 'var(--bad)' }}>arateki:bans</span></div>
              </div>
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6 }}>
                  <span style={{ color: 'var(--fg-2)' }}>Total efetivo</span>
                  <span className="mono" style={{ fontWeight: 600, color: 'var(--primary)' }}>12.902 MACs</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ color: 'var(--fg-2)' }}>Cobertura ~</span>
                  <span className="mono">96% da sua rede</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MATERIAIS / EDUCATIVOS
function ServerMaterials() {
  const tracks = [
    { t: 'Como instalar seu primeiro SafraSense', kind: 'guia · 8 min', n: 1, by: 'arateki', new: true },
    { t: 'Por que pH e EC importam para hidroponia', kind: 'artigo · 12 min', n: 2, by: 'arateki' },
    { t: 'Calibrando sondas com soluções caseiras', kind: 'vídeo · 6 min', n: 3, by: 'coop-verdão' },
    { t: 'Custos: SafraSense vs estações comerciais', kind: 'comparativo', n: 4, by: 'arateki' },
    { t: 'Sua primeira safra de alface — passo a passo', kind: 'guia · 22 min', n: 5, by: 'lia.local', new: true },
    { t: 'Manifesto: agricultura como bem comum', kind: 'leitura · 4 min', n: 6, by: 'arateki' },
  ];
  return (
    <div style={{ width: 1440, height: 900, background: 'var(--bg)', fontFamily: 'var(--f-sans)', color: 'var(--fg)', display: 'flex' }} className="aquarela">
      <Sidebar active="mat"/>
      <main style={{ flex: 1, padding: '40px 80px', overflow: 'hidden' }}>
        <div style={{ marginBottom: 48 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>M A T E R I A I S{'   '}E D U C A T I V O S</div>
          <h1 className="serif" style={{ fontSize: 56, lineHeight: 1.05, fontWeight: 400, margin: 0, maxWidth: 800 }}>
            Hardware sem manual <span style={{ fontStyle: 'italic', color: 'var(--primary)' }}>é só plástico.</span>
          </h1>
          <p style={{ fontSize: 14, color: 'var(--fg-2)', marginTop: 18, maxWidth: 620, lineHeight: 1.6 }}>
            Conteúdo de boas-vindas, calibração, montagem e cultivo, replicado pela rede como qualquer outro dado. Anyone pode publicar; a rede assina e distribui.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 56 }}>
          <div style={{ flex: 1 }}>
            <div className="eyebrow" style={{ marginBottom: 18 }}>P A R A{'   '}C O M E Ç A R</div>
            <div style={{ borderTop: '1px solid var(--line-strong)' }}>
              {tracks.map((t,i)=>(
                <div key={i} style={{ padding: '20px 0', borderBottom: '1px solid var(--line)', display: 'grid', gridTemplateColumns: '40px 1fr 140px 80px', gap: 16, alignItems: 'center' }}>
                  <span className="serif" style={{ fontSize: 28, color: 'var(--fg-4)', fontStyle: 'italic' }}>{String(t.n).padStart(2,'0')}</span>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 10 }}>
                      {t.t}
                      {t.new && <span style={{ fontSize: 9, padding: '2px 6px', background: 'var(--primary)', color: 'var(--bg-card)' }}>NOVO</span>}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 4 }}>publicado por <span style={{ color: 'var(--fg-2)' }}>{t.by}</span></div>
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--fg-3)' }}>{t.kind}</span>
                  <button className="btn btn-ghost" style={{ fontSize: 10, padding: '7px 12px', justifySelf: 'end' }}>Abrir →</button>
                </div>
              ))}
            </div>
          </div>

          <aside style={{ width: 280 }}>
            <div className="eyebrow" style={{ marginBottom: 18 }}>D E S T A Q U E</div>
            <div style={{ background: 'var(--fg)', color: 'var(--bg)', padding: 24, marginBottom: 24 }}>
              <div className="eyebrow-tight" style={{ color: 'var(--bg-card)', opacity: 0.5, marginBottom: 14 }}>L E I T U R A · 4 min</div>
              <div className="serif" style={{ fontSize: 22, lineHeight: 1.2, marginBottom: 18, fontStyle: 'italic' }}>
                "Agricultura como bem comum."
              </div>
              <div style={{ fontSize: 11, color: 'var(--fg-4)' }}>arateki — manifesto v1</div>
            </div>

            <div className="eyebrow" style={{ marginBottom: 14 }}>P U B L I C A R{'   '}N A{'   '}R E D E</div>
            <p style={{ fontSize: 11, color: 'var(--fg-2)', lineHeight: 1.6 }}>
              Tem um guia, vídeo ou artigo? Publique no seu core público — o conteúdo é replicado para todos os peers que aceitam sua chave.
            </p>
            <button className="btn" style={{ marginTop: 14, width: '100%', fontSize: 11 }}>+ Publicar material</button>
          </aside>
        </div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SETTINGS — keys, networks, advanced
function ServerSettings() {
  return (
    <div style={{ width: 1440, height: 900, background: 'var(--bg)', fontFamily: 'var(--f-sans)', color: 'var(--fg)', display: 'flex' }} className="aquarela">
      <Sidebar active="net"/>
      <main style={{ flex: 1, padding: '40px 56px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: 32 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>C O N F I G U R A Ç Õ E S</div>
          <h1 className="serif" style={{ fontSize: 36, fontWeight: 400, margin: 0 }}>O servidor é seu. Estas são as suas chaves.</h1>
        </div>

        <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--line)', marginBottom: 32 }}>
          {['Identidade','Rede','Replicação','Privacidade','Avançado'].map((t,i)=>(
            <div key={i} style={{
              padding: '12px 18px',
              fontSize: 12,
              borderBottom: i===0?'2px solid var(--fg)':'2px solid transparent',
              marginBottom: -1,
              color: i===0?'var(--fg)':'var(--fg-3)',
              fontWeight: i===0?600:400,
              cursor: 'pointer',
            }}>{t}</div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, flex: 1, minHeight: 0 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 14 }}>S U A{'   '}I D E N T I D A D E</div>
            <div className="card-paper" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                <div style={{ width: 48, height: 48, border: '1px solid var(--line-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="serif" style={{ fontSize: 26 }}>L</span>
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 500 }}>Lia Marques</div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', marginTop: 2 }}>4f8b9c2d…2a91 · ed25519</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 22px', fontSize: 11 }}>
                <div>
                  <div className="eyebrow-tight" style={{ marginBottom: 4 }}>C R I A D A{'   '}E M</div>
                  <div className="mono">14 abr 2026</div>
                </div>
                <div>
                  <div className="eyebrow-tight" style={{ marginBottom: 4 }}>D I S P O S I T I V O S</div>
                  <div className="mono">3 reivindicados</div>
                </div>
                <div>
                  <div className="eyebrow-tight" style={{ marginBottom: 4 }}>D A T A C O R E</div>
                  <div className="mono" style={{ fontSize: 10 }}>raiznet/data/4f8b…/</div>
                </div>
                <div>
                  <div className="eyebrow-tight" style={{ marginBottom: 4 }}>S E E D{'   '}B A C K U P</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 6, height: 6, background: 'var(--good)' }}/>
                    <span>verificada</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 22 }}>
                <button className="btn btn-ghost" style={{ flex: 1, fontSize: 11 }}>Re-verificar seed</button>
                <button className="btn btn-ghost" style={{ flex: 1, fontSize: 11 }}>Exportar identidade</button>
              </div>
            </div>

            <div className="eyebrow" style={{ marginTop: 36, marginBottom: 14 }}>R O T A Ç Ã O{'   '}D E{'   '}C H A V E S</div>
            <div style={{ borderTop: '1px solid var(--line)' }}>
              {[
                { v: 'v3', d: 'há 6 horas · ativa', sel: true },
                { v: 'v2', d: '14 abr 2026 · revogada' },
                { v: 'v1', d: '02 abr 2026 · revogada' },
              ].map((k,i)=>(
                <div key={i} style={{ padding: '12px 0', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ width: 6, height: 6, background: k.sel ? 'var(--primary)' : 'var(--fg-4)' }}/>
                    <span className="mono" style={{ fontSize: 12 }}>{k.v}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>{k.d}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="eyebrow" style={{ marginBottom: 14 }}>R E D E S</div>
            <div style={{ borderTop: '1px solid var(--line-strong)' }}>
              {[
                { n: 'arateki:public:arateki:v1', mode: 'Híbrido', peers: 47, sel: true },
                { n: 'raiznet:public:coop-verdao:v1', mode: 'Híbrido', peers: 12, sel: true },
                { n: 'raiznet:local:lia-quintal', mode: 'Apenas local', peers: 0, sel: true },
              ].map((n,i)=>(
                <div key={i} style={{ padding: '14px 0', borderBottom: '1px solid var(--line)', display: 'grid', gridTemplateColumns: '20px 1fr 100px 60px', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 14, height: 14, border: '1px solid var(--line-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {n.sel && <Icon d={I.check} size={10}/>}
                  </div>
                  <div>
                    <div className="mono" style={{ fontSize: 11 }}>{n.n}</div>
                    <div style={{ fontSize: 10, color: 'var(--fg-3)', marginTop: 2 }}>{n.mode}</div>
                  </div>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)', textAlign: 'right' }}>{n.peers} peers</span>
                  <button className="btn btn-ghost" style={{ fontSize: 9, padding: '5px 8px', justifySelf: 'end' }}>···</button>
                </div>
              ))}
            </div>

            <div className="eyebrow" style={{ marginTop: 36, marginBottom: 14 }}>P R I V A C I D A D E{'   '}P A D R Ã O</div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--line)', padding: 22 }}>
              <p style={{ fontSize: 11, color: 'var(--fg-2)', lineHeight: 1.7, margin: '0 0 18px' }}>
                Política aplicada a novos dispositivos. Cada um pode personalizar depois.
              </p>
              {[
                { f: 'temp_ambient · humidity', d: 'Plain', dot: 'var(--good)', sel: 0 },
                { f: 'pH · EC · nutrientes', d: 'Encrypted', dot: 'var(--warn)', sel: 1 },
                { f: 'localização exata', d: 'Omit', dot: 'var(--fg-4)', sel: 2 },
              ].map((p,i)=>(
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderTop: i===0?'none':'1px solid var(--line)' }}>
                  <span style={{ fontSize: 11, color: 'var(--fg-2)' }}>{p.f}</span>
                  <div style={{ display: 'flex', gap: 1, background: 'var(--line)', border: '1px solid var(--line)' }}>
                    {['Plain','Encrypted','Omit'].map((opt,j)=>(
                      <span key={j} style={{
                        fontSize: 10, padding: '5px 10px',
                        background: j===p.sel ? 'var(--fg)' : 'var(--bg-card)',
                        color: j===p.sel ? 'var(--bg)' : 'var(--fg-2)',
                      }}>{opt}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MOBILE — versões reduzidas (3 telas em iOS frame)
function ServerMobileDash() {
  return (
    <div style={{ width: 390, height: 760, background: 'var(--bg)', fontFamily: 'var(--f-sans)', color: 'var(--fg)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} className="aquarela">
      {/* status bar */}
      <div style={{ height: 44, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 22px', fontSize: 13, fontWeight: 600 }}>
        <span>9:41</span>
        <span className="mono" style={{ fontSize: 10, color: 'var(--fg-3)' }}>raiznet · arateki:v1</span>
        <span style={{ display: 'inline-flex', gap: 4 }}>
          <Icon d={I.signal} size={12}/><Icon d={I.wifi} size={12}/><Icon d={I.battery} size={14}/>
        </span>
      </div>

      <div style={{ padding: '12px 24px 0' }}>
        <div className="eyebrow" style={{ marginBottom: 6 }}>O L Á , L I A</div>
        <h1 className="serif" style={{ fontSize: 28, fontWeight: 400, margin: 0, lineHeight: 1.15 }}>
          A rede está <span style={{ fontStyle: 'italic', color: 'var(--primary)' }}>respirando.</span>
        </h1>
      </div>

      <div style={{ padding: '24px 24px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--line)', border: '1px solid var(--line)', margin: '20px 24px 0' }}>
        {[
          { l: 'PEERS', v: '47' },
          { l: 'DEVICES', v: '124' },
          { l: 'LEITURAS 24h', v: '12.8k' },
          { l: 'REDES', v: '2' },
        ].map((k,i)=>(
          <div key={i} style={{ background: 'var(--bg-card)', padding: 16 }}>
            <div className="eyebrow-tight">{k.l}</div>
            <div className="serif" style={{ fontSize: 26, marginTop: 6, fontWeight: 400 }}>{k.v}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: '28px 24px 12px' }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>S E U S{'   '}D I S P O S I T I V O S</div>
      </div>
      <div style={{ padding: '0 24px', flex: 1, overflow: 'hidden' }}>
        {[
          { n: 'Torre 01 — Alface', t: '24.6°', ph: '6.4', s: 'ok' },
          { n: 'Estufa B', t: '28.1°', ph: '5.9', s: 'warn' },
          { n: 'Hidroponia 03', t: '21.4°', ph: '6.2', s: 'ok' },
        ].map((d,i)=>(
          <div key={i} style={{ padding: '14px 0', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 6, height: 6, background: d.s==='ok'?'var(--good)':'var(--warn)' }}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{d.n}</div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', marginTop: 2 }}>{d.t} · pH {d.ph}</div>
            </div>
            <Spark data={[2,3,2,4,3,5,4,5]} w={70} h={20}/>
          </div>
        ))}
      </div>

      {/* tab bar */}
      <div style={{ borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-around', padding: '12px 0 24px', background: 'var(--bg-card)' }}>
        {[
          { i: I.network, l: 'Rede', sel: true },
          { i: I.cpu, l: 'Devices' },
          { i: I.map, l: 'Mapa' },
          { i: I.user, l: 'Eu' },
        ].map((t,i)=>(
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: t.sel?'var(--primary)':'var(--fg-3)' }}>
            <Icon d={t.i} size={20}/>
            <span style={{ fontSize: 9 }}>{t.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ServerMobileMap() {
  return (
    <div style={{ width: 390, height: 760, background: 'var(--bg)', fontFamily: 'var(--f-sans)', color: 'var(--fg)', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{ height: 44, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 22px', fontSize: 13, fontWeight: 600 }}>
        <span>9:41</span><span/><span style={{ display: 'inline-flex', gap: 4 }}><Icon d={I.signal} size={12}/><Icon d={I.battery} size={14}/></span>
      </div>
      <div style={{ padding: '8px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 className="serif" style={{ fontSize: 22, fontWeight: 400, margin: 0 }}>Mapa · res 7</h1>
        <div style={{ display: 'flex', gap: 4 }}>
          {['ph','ec','t°'].map((m,i)=>(
            <span key={m} style={{ fontSize: 10, padding: '5px 10px', background: i===0?'var(--fg)':'transparent', color: i===0?'var(--bg)':'var(--fg-2)', border: '1px solid var(--line-strong)' }}>{m}</span>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative', background: 'var(--bg-card)', borderTop: '1px solid var(--line)', overflow: 'hidden' }}>
        <svg viewBox="0 0 390 500" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
          {[...Array(8)].map((_,y)=>
            [...Array(7)].map((_,x)=>{
              const cx = 30 + x*48 + (y%2?24:0);
              const cy = 50 + y*48;
              const intensity = Math.max(0, 1 - Math.hypot(x - 3, y - 4)/5) * 0.9;
              return intensity > 0.15 ? (
                <HexCell key={`${x}-${y}`} cx={cx} cy={cy} r={26} fill="var(--primary)" opacity={intensity * 0.55} stroke="var(--bg)"/>
              ) : null;
            })
          )}
          <HexCell cx={30 + 3*48} cy={50 + 4*48} r={26} fill="none" stroke="var(--line-strong)"/>
        </svg>

        {/* bottom sheet */}
        <div style={{ position: 'absolute', left: 16, right: 16, bottom: 16, background: 'var(--bg-card)', border: '1px solid var(--line-strong)', padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="mono" style={{ fontSize: 9, color: 'var(--fg-3)' }}>85283473fffffff</div>
              <div className="serif" style={{ fontSize: 18, marginTop: 2 }}>Fortaleza-CE</div>
            </div>
            <span className="mono" style={{ fontSize: 11, color: 'var(--primary)' }}>14 dispositivos</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
            <div>
              <div className="eyebrow-tight">PH</div>
              <div className="mono" style={{ fontSize: 13, marginTop: 3 }}>6.4</div>
            </div>
            <div>
              <div className="eyebrow-tight">EC</div>
              <div className="mono" style={{ fontSize: 13, marginTop: 3 }}>1240</div>
            </div>
            <div>
              <div className="eyebrow-tight">T°</div>
              <div className="mono" style={{ fontSize: 13, marginTop: 3 }}>24.6</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-around', padding: '12px 0 24px', background: 'var(--bg-card)' }}>
        {[
          { i: I.network, l: 'Rede' },
          { i: I.cpu, l: 'Devices' },
          { i: I.map, l: 'Mapa', sel: true },
          { i: I.user, l: 'Eu' },
        ].map((t,i)=>(
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: t.sel?'var(--primary)':'var(--fg-3)' }}>
            <Icon d={t.i} size={20}/>
            <span style={{ fontSize: 9 }}>{t.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ServerMobileDevice() {
  return (
    <div style={{ width: 390, height: 760, background: 'var(--bg)', fontFamily: 'var(--f-sans)', color: 'var(--fg)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} className="aquarela">
      <div style={{ height: 44, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 22px', fontSize: 13, fontWeight: 600 }}>
        <span>9:41</span><span/><span style={{ display: 'inline-flex', gap: 4 }}><Icon d={I.signal} size={12}/><Icon d={I.battery} size={14}/></span>
      </div>

      <div style={{ padding: '6px 20px 0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--fg-3)' }}>
        <span style={{ fontSize: 16 }}>‹</span> Devices
      </div>

      <div style={{ padding: '14px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <GLeaf size={20}/>
          <h1 className="serif" style={{ fontSize: 24, fontWeight: 400, margin: 0 }}>Torre 01 — Alface</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 10, color: 'var(--fg-3)' }}>
          <span style={{ width: 6, height: 6, background: 'var(--good)' }}/>
          <span>ativo · 12s · Fortaleza-CE</span>
        </div>
      </div>

      <div style={{ padding: '24px 20px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--line)', border: '1px solid var(--line)', margin: '20px 20px 0' }}>
        {[
          { l: 'TEMP', v: '24.6', u: '°C' },
          { l: 'UMIDADE', v: '68', u: '%' },
          { l: 'PH', v: '6.4', u: '' },
          { l: 'EC', v: '1240', u: 'ppm' },
        ].map((k,i)=>(
          <div key={i} style={{ background: 'var(--bg-card)', padding: 16 }}>
            <div className="eyebrow-tight">{k.l}</div>
            <div className="serif" style={{ fontSize: 28, marginTop: 6, fontWeight: 400 }}>{k.v}<span style={{ fontSize: 11, color: 'var(--fg-3)', marginLeft: 4, fontFamily: 'var(--f-sans)' }}>{k.u}</span></div>
            <div style={{ marginTop: 8 }}>
              <Spark data={[2,3,2,4,3,5,4,5,6,5,7]} w={130} h={20}/>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '24px 20px' }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>S A F R A A T I V A</div>
        <div className="card-paper" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <GSprout size={16}/>
            <span className="serif" style={{ fontSize: 18 }}>Alface crespa</span>
          </div>
          <div style={{ height: 3, background: 'var(--bg-inset)' }}>
            <div style={{ width: '37%', height: '100%', background: 'var(--primary)' }}/>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--fg-3)', marginTop: 6 }}>
            <span>13 / 35 dias</span><span>colheita em 22 dias</span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 'auto', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-around', padding: '12px 0 24px', background: 'var(--bg-card)' }}>
        {[
          { i: I.network, l: 'Rede' },
          { i: I.cpu, l: 'Devices', sel: true },
          { i: I.map, l: 'Mapa' },
          { i: I.user, l: 'Eu' },
        ].map((t,i)=>(
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: t.sel?'var(--primary)':'var(--fg-3)' }}>
            <Icon d={t.i} size={20}/>
            <span style={{ fontSize: 9 }}>{t.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

window.ServerCrops = ServerCrops;
window.ServerFilters = ServerFilters;
window.ServerMaterials = ServerMaterials;
window.ServerSettings = ServerSettings;
window.ServerMobileDash = ServerMobileDash;
window.ServerMobileMap = ServerMobileMap;
window.ServerMobileDevice = ServerMobileDevice;
