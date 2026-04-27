// ESP32 telas — captive portal e dashboard local

// ───── ESP32: Captive Portal — passo idioma + seed ─────
function ESPCaptiveSeed({ scale = 1 }) {
  return (
    <div style={{ width: 375, height: 720, background: 'var(--bg)', fontFamily: 'var(--f-sans)', color: 'var(--fg)', overflow: 'hidden', position: 'relative' }}>
      <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <GSprout size={18}/>
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.18em' }}>S A F R A S E N S E</span>
        </div>
        <span className="eyebrow-tight">2 / 5</span>
      </div>

      <div style={{ padding: '24px 20px 0' }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>P A S S O 0 2</div>
        <h1 className="serif" style={{ fontSize: 26, lineHeight: 1.15, margin: 0, fontWeight: 500 }}>
          Sua chave-mestre.<br/>
          <span style={{ color: 'var(--fg-3)', fontStyle: 'italic' }}>Doze palavras.</span>
        </h1>
        <p style={{ fontSize: 12, lineHeight: 1.55, color: 'var(--fg-2)', marginTop: 14 }}>
          Anote em papel. Sem cópia em nuvem, sem custódia. Quem tem as palavras, tem a identidade.
        </p>
      </div>

      <div style={{ margin: '22px 20px', border: '1px solid var(--primary-line)', background: 'var(--paper-tint)', padding: '18px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px 12px', fontFamily: 'var(--f-mono)', fontSize: 12 }}>
          {['raven','forest','silent','copper','moss','river','cinder','linen','willow','agate','harvest','quill'].map((w,i)=>(
            <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ color: 'var(--fg-4)', fontSize: 9 }}>{String(i+1).padStart(2,'0')}</span>
              <span>{w}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', gap: 8, marginBottom: 16 }}>
        <button className="btn btn-ghost" style={{ flex: 1, fontSize: 11, padding: '9px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Icon d={I.copy} size={13}/> Copiar
        </button>
        <button className="btn btn-ghost" style={{ flex: 1, fontSize: 11, padding: '9px 0' }}>
          Já tenho seed
        </button>
      </div>

      <div style={{ padding: '0 20px', fontSize: 10, color: 'var(--bad)', display: 'flex', gap: 8, alignItems: 'flex-start', lineHeight: 1.5 }}>
        <Icon d={I.alert} size={14}/>
        <span>Se perder, perde o acesso. Não há recuperação central.</span>
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 20px', borderTop: '1px solid var(--line)', background: 'var(--bg)', display: 'flex', gap: 8 }}>
        <button className="btn btn-ghost" style={{ width: 80, fontSize: 11 }}>Voltar</button>
        <button className="btn btn-primary" style={{ flex: 1, fontSize: 11 }}>Anotei. Continuar</button>
      </div>
    </div>
  );
}

// ───── ESP32: Captive Portal — Wi-Fi + servidores ─────
function ESPCaptiveWifi({ scale = 1 }) {
  const networks = [
    { name: 'casa-fibra', dbm: -42, sec: true },
    { name: 'estufa-mesh', dbm: -58, sec: true },
    { name: 'vizinho-2.4', dbm: -71, sec: true },
    { name: 'AndroidAP', dbm: -78, sec: false },
  ];
  return (
    <div style={{ width: 375, height: 720, background: 'var(--bg)', fontFamily: 'var(--f-sans)', color: 'var(--fg)', overflow: 'hidden', position: 'relative' }}>
      <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <GSprout size={18}/>
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.18em' }}>S A F R A S E N S E</span>
        </div>
        <span className="eyebrow-tight">3 / 5</span>
      </div>

      <div style={{ padding: '24px 20px 12px' }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>P A S S O 0 3</div>
        <h1 className="serif" style={{ fontSize: 24, lineHeight: 1.15, margin: 0, fontWeight: 500 }}>
          Conecte-se à rede.
        </h1>
      </div>

      <div style={{ padding: '0 20px' }}>
        {networks.map((n, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Icon d={I.wifi} size={16}/>
              <span style={{ fontSize: 13 }}>{n.name}</span>
              {n.sec && <Icon d={I.lock} size={11}/>}
            </div>
            <span className="mono" style={{ fontSize: 10, color: 'var(--fg-3)' }}>{n.dbm} dBm</span>
          </div>
        ))}
        <div style={{ padding: '12px 0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--fg-3)', cursor: 'pointer' }}>
          <Icon d={I.plus} size={12}/> Adicionar rede manualmente
        </div>
      </div>

      <div style={{ margin: '12px 20px 0', padding: 16, border: '1px solid var(--line)', background: 'var(--bg-card)' }}>
        <div className="eyebrow-tight" style={{ marginBottom: 8 }}>S E N H A — casa-fibra</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--line-strong)', paddingBottom: 6 }}>
          <input placeholder="••••••••••" style={{ flex: 1, border: 0, background: 'transparent', fontSize: 14, fontFamily: 'var(--f-mono)', color: 'var(--fg)', outline: 'none' }}/>
          <Icon d={I.eye} size={14}/>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 20px', borderTop: '1px solid var(--line)', background: 'var(--bg)', display: 'flex', gap: 8 }}>
        <button className="btn btn-ghost" style={{ width: 80, fontSize: 11 }}>Voltar</button>
        <button className="btn btn-primary" style={{ flex: 1, fontSize: 11 }}>Conectar</button>
      </div>
    </div>
  );
}

// ───── ESP32: Captive Portal — servidores ─────
function ESPCaptiveServers() {
  return (
    <div style={{ width: 375, height: 720, background: 'var(--bg)', fontFamily: 'var(--f-sans)', color: 'var(--fg)', overflow: 'hidden', position: 'relative' }}>
      <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <GSprout size={18}/>
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.18em' }}>S A F R A S E N S E</span>
        </div>
        <span className="eyebrow-tight">4 / 5</span>
      </div>

      <div style={{ padding: '24px 20px 12px' }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>P A S S O 0 4</div>
        <h1 className="serif" style={{ fontSize: 24, lineHeight: 1.15, margin: 0, fontWeight: 500 }}>
          Para onde a telemetria vai?
        </h1>
        <p style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 10, lineHeight: 1.5 }}>
          Você decide. Nada é obrigatório.
        </p>
      </div>

      <div style={{ padding: '0 20px' }}>
        <div className="eyebrow-tight" style={{ marginBottom: 10, color: 'var(--primary)' }}>S E R V I D O R E S{'   '}P Ú B L I C O S</div>
        <div style={{ border: '1px solid var(--primary-line)', background: 'var(--paper-tint)', padding: 14, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>Arateki</div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', marginTop: 2 }}>app.arateki.com</div>
            </div>
            <Icon d={I.check} size={14}/>
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--fg-3)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 22, cursor: 'pointer' }}>
          <Icon d={I.plus} size={12}/> Adicionar outro
        </div>

        <div className="eyebrow-tight" style={{ marginBottom: 10 }}>S E R V I D O R L O C A L (opcional)</div>
        <input defaultValue="raiznet.local:3001" className="mono" style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1px solid var(--line)', background: 'var(--bg-card)', fontSize: 12, color: 'var(--fg)', outline: 'none' }}/>
        <div style={{ fontSize: 10, color: 'var(--fg-3)', marginTop: 6, lineHeight: 1.5 }}>
          Para guardar dados que não saem da sua rede.
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 20px', borderTop: '1px solid var(--line)', background: 'var(--bg)', display: 'flex', gap: 8 }}>
        <button className="btn btn-ghost" style={{ width: 80, fontSize: 11 }}>Voltar</button>
        <button className="btn btn-primary" style={{ flex: 1, fontSize: 11 }}>Continuar</button>
      </div>
    </div>
  );
}

// ───── ESP32: Dashboard local ─────
function ESPDashboard() {
  const sensors = [
    { l: 'Temperatura ar', v: '24.6', u: '°C', icon: I.thermo, ok: true, range: 'ideal 18–26' },
    { l: 'Umidade', v: '68', u: '%', icon: I.drop, ok: true, range: 'ideal 60–80' },
    { l: 'Nutrientes EC', v: '1240', u: 'ppm', icon: I.sun, ok: true, range: 'ideal 1100–1400' },
    { l: 'Nível d\u2019água', v: '12.4', u: 'cm', icon: I.signal, ok: true, range: 'ideal > 8' },
  ];
  return (
    <div style={{ width: 375, height: 720, background: 'var(--bg)', fontFamily: 'var(--f-sans)', color: 'var(--fg)', overflow: 'hidden', position: 'relative' }} className="aquarela">
      <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <GSprout size={16}/>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Torre 01 — Alface</span>
          </div>
          <div className="mono" style={{ fontSize: 9, color: 'var(--fg-3)', marginTop: 3 }}>safrasense-a3f2.local · 7d2a8b…</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--good)' }}/>
          <span>online</span>
        </div>
      </div>

      <div style={{ padding: '0 20px 16px', borderBottom: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--fg-3)' }}>
          <span>Buffer pendente: 0</span>
          <span>Último envio: 12s</span>
          <span>Wi-Fi −44 dBm</span>
        </div>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>L E I T U R A — agora</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--line)', border: '1px solid var(--line)' }}>
          {sensors.map((s,i)=>(
            <div key={i} style={{ background: 'var(--bg-card)', padding: '14px 14px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, color: 'var(--fg-3)' }}>
                <Icon d={s.icon} size={13}/>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.ok ? 'var(--good)' : 'var(--bad)' }}/>
              </div>
              <div className="serif" style={{ fontSize: 28, lineHeight: 1, fontWeight: 500 }}>
                {s.v}<span style={{ fontSize: 12, color: 'var(--fg-3)', marginLeft: 4, fontFamily: 'var(--f-sans)' }}>{s.u}</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--fg-3)', marginTop: 6 }}>{s.l}</div>
              <div style={{ fontSize: 9, color: 'var(--fg-4)', marginTop: 2, fontFamily: 'var(--f-mono)' }}>{s.range}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>B A T E R I A</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="serif" style={{ fontSize: 24, fontWeight: 500 }}>78<span style={{ fontSize: 12, color: 'var(--fg-3)' }}>%</span></span>
          <div style={{ flex: 1, height: 4, background: 'var(--bg-inset)' }}>
            <div style={{ width: '78%', height: '100%', background: 'var(--primary)' }}/>
          </div>
          <span className="mono" style={{ fontSize: 10, color: 'var(--fg-3)' }}>3.84 V</span>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 20px', borderTop: '1px solid var(--line)', background: 'var(--bg)', display: 'flex', justifyContent: 'space-around' }}>
        {[
          { l: 'Início', i: I.cpu, on: true },
          { l: 'JSON', i: I.copy },
          { l: 'Configurar', i: I.sliders },
          { l: 'Wi-Fi', i: I.wifi },
        ].map((t,i)=>(
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: t.on ? 'var(--primary)' : 'var(--fg-3)' }}>
            <Icon d={t.i} size={16}/>
            <span style={{ fontSize: 9, letterSpacing: '0.06em' }}>{t.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ───── ESP32: Configurar — política de privacidade por campo ─────
function ESPPrivacy() {
  const fields = [
    { f: 'temp_ambient', loc: 'plain', pub: 'plain' },
    { f: 'humidity',     loc: 'plain', pub: 'plain' },
    { f: 'ph',           loc: 'plain', pub: 'encrypted' },
    { f: 'ec',           loc: 'plain', pub: 'encrypted' },
    { f: 'water_level',  loc: 'plain', pub: 'omit' },
    { f: 'bat_volts',    loc: 'plain', pub: 'omit' },
  ];
  const dot = (v) => v === 'plain' ? 'var(--good)' : v === 'encrypted' ? 'var(--warn)' : 'var(--fg-4)';
  return (
    <div style={{ width: 375, height: 720, background: 'var(--bg)', fontFamily: 'var(--f-sans)', color: 'var(--fg)', overflow: 'hidden', position: 'relative' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Icon d={I.arrow} size={16}/>
        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.1em' }}>P R I V A C I D A D E</span>
      </div>

      <div style={{ padding: '20px 20px 8px' }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>D I S P O S I T I V O</div>
        <h1 className="serif" style={{ fontSize: 22, fontWeight: 500, margin: 0 }}>O que sai daqui?</h1>
        <p style={{ fontSize: 11, color: 'var(--fg-2)', marginTop: 8, lineHeight: 1.55 }}>
          Cada leitura é montada conforme essas regras. Mude quando quiser.
        </p>
      </div>

      <div style={{ padding: '14px 20px 8px', display: 'flex', gap: 16, fontSize: 10, color: 'var(--fg-3)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width:6, height:6, background: 'var(--good)' }}/>plain</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width:6, height:6, background: 'var(--warn)' }}/>encrypted</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width:6, height:6, background: 'var(--fg-4)' }}/>omit</span>
      </div>

      <div style={{ padding: '0 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 78px 78px', fontSize: 9, letterSpacing: '0.1em', color: 'var(--fg-3)', padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
          <span>CAMPO</span>
          <span style={{ textAlign: 'center' }}>LOCAL</span>
          <span style={{ textAlign: 'center' }}>PÚBLICO</span>
        </div>
        {fields.map((r,i)=>(
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 78px 78px', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
            <span className="mono" style={{ fontSize: 11 }}>{r.f}</span>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, fontSize: 10 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot(r.loc) }}/>
              <span style={{ color: 'var(--fg-2)' }}>{r.loc}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, fontSize: 10 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot(r.pub) }}/>
              <span style={{ color: 'var(--fg-2)' }}>{r.pub}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 20px', borderTop: '1px solid var(--line)', background: 'var(--bg)', fontSize: 10, color: 'var(--fg-3)', textAlign: 'center', lineHeight: 1.5 }}>
        Já publicado permanece replicado.<br/>Política nova vale para próximas leituras.
      </div>
    </div>
  );
}

window.ESPCaptiveSeed = ESPCaptiveSeed;
window.ESPCaptiveWifi = ESPCaptiveWifi;
window.ESPCaptiveServers = ESPCaptiveServers;
window.ESPDashboard = ESPDashboard;
window.ESPPrivacy = ESPPrivacy;
