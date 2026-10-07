import { useState, useEffect, useRef } from "react";

/* ============ GIFs ============
 Coloque seus GIFs em public/gifs/ (ex.: public/gifs/supino.gif)
 ou troque por URLs (ex.: ExerciseDB). Se o GIF não carregar, aparece um placeholder. */
const DEFAULTS = [
  { id: "e1", name: "Supino reto com barra", muscle: "Peito", sets: 4, reps: "8–12", rest: 90, gif: "/gifs/supino-reto.gif", how: "Deite no banco com os pés firmes no chão. Segure a barra um pouco além da largura dos ombros. Desça devagar até o meio do peito e empurre até estender os braços. Mantenha as escápulas para trás e use um spotter nas cargas altas." },
  { id: "e2", name: "Supino inclinado com halteres", muscle: "Peito", sets: 3, reps: "10–12", rest: 90, gif: "/gifs/supino-inclinado.gif", how: "Banco a 30°. Desça os halteres até a altura do peito com cotovelos a 45° do tronco e suba contraindo o peitoral." },
  { id: "e3", name: "Crucifixo no cabo", muscle: "Peito", sets: 3, reps: "12–15", rest: 60, gif: "/gifs/crucifixo-cabo.gif", how: "Cotovelos levemente flexionados. Traga as mãos à frente do peito em arco e retorne controlando a volta." },
  { id: "e4", name: "Tríceps corda na polia", muscle: "Tríceps", sets: 3, reps: "12–15", rest: 60, gif: "/gifs/triceps-corda.gif", how: "Cotovelos colados ao corpo. Estenda os braços abrindo a corda no final e volte devagar." },
  { id: "e5", name: "Tríceps testa", muscle: "Tríceps", sets: 3, reps: "10–12", rest: 75, gif: "/gifs/triceps-testa.gif", how: "Deitado, desça a barra em direção à testa dobrando só os cotovelos e estenda de volta." },
];
const MUSCLES = ["Peito", "Costas", "Ombros", "Bíceps", "Tríceps", "Pernas", "Core"];
const PLAN = ["e1", "e2", "e3", "e4", "e5"];
const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

/* ============ storage helpers ============ */
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const hash = (s) => btoa(unescape(encodeURIComponent(s))); // demo apenas! use backend/bcrypt em produção
const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

/* ============ ÍCONES (SVG inline, sem dependências) ============ */
const P = {
  dumbbell: "M6.5 6.5v11 M17.5 6.5v11 M3.5 9v6 M20.5 9v6 M6.5 12h11",
  calendar: "M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  chart: "M3 3v18h18 M7 15l4-4 3 3 5-6",
  clock: "M12 6v6l4 2 M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z",
  sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M12 2v2 M12 20v2 M4.9 4.9l1.4 1.4 M17.7 17.7l1.4 1.4 M2 12h2 M20 12h2 M4.9 19.1l1.4-1.4 M17.7 6.3l1.4-1.4",
  moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
  x: "M18 6 6 18 M6 6l12 12",
  plus: "M12 5v14 M5 12h14",
  pencil: "M17 3a2.8 2.8 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5z",
  check: "M20 6 9 17l-5-5",
  play: "M6 4l14 8-14 8z",
  left: "M19 12H5 M12 19l-7-7 7-7",
  right: "M5 12h14 M12 5l7 7-7 7",
};
const Icon = ({ n, s = 18 }) => (
  <svg className="i" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={P[n]} />
  </svg>
);

function Gif({ src, alt, size = 64 }) {
  const [err, setErr] = useState(false);
  return err || !src ? (
    <div className="gifph" style={{ width: size, maxWidth: "100%", aspectRatio: "1" }}><Icon n="dumbbell" s={Math.round(size / 2.5)} /></div>
  ) : (
    <img className="gif" src={src} alt={alt} style={{ width: size, maxWidth: "100%", aspectRatio: "1" }} onError={() => setErr(true)} />
  );
}

/* ============ AUTH ============ */
function Auth({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [f, setF] = useState({ name: "", email: "", pass: "", pass2: "" });
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    const users = load("form_users", []);
    const email = f.email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("E-mail inválido.");
    if (f.pass.length < 6) return setErr("A senha precisa ter ao menos 6 caracteres.");
    if (mode === "signup") {
      if (!f.name.trim()) return setErr("Informe seu nome.");
      if (f.pass !== f.pass2) return setErr("As senhas não coincidem.");
      if (users.some((u) => u.email === email)) return setErr("Este e-mail já está cadastrado.");
      const u = { name: f.name.trim(), email, pass: hash(f.pass) };
      save("form_users", [...users, u]);
      onLogin({ name: u.name, email });
    } else {
      const u = users.find((u) => u.email === email && u.pass === hash(f.pass));
      if (!u) return setErr("E-mail ou senha incorretos.");
      onLogin({ name: u.name, email });
    }
  };

  return (
    <div className="auth">
      <div className="logo big"><span className="lg"><Icon n="dumbbell" s={18} /></span> HYPERFORM.</div>
      <h1>{mode === "login" ? "Bem-vindo de volta." : "Crie sua conta."}</h1>
      <p className="sub">{mode === "login" ? "Entre para continuar seu treino." : "Comece a construir sua rotina."}</p>
      <form onSubmit={submit}>
        {mode === "signup" && <input placeholder="Nome" value={f.name} onChange={set("name")} />}
        <input placeholder="E-mail" type="email" value={f.email} onChange={set("email")} />
        <input placeholder="Senha" type="password" value={f.pass} onChange={set("pass")} />
        {mode === "signup" && <input placeholder="Confirmar senha" type="password" value={f.pass2} onChange={set("pass2")} />}
        {err && <div className="err">{err}</div>}
        <button className="cta" type="submit">{mode === "login" ? "Entrar" : "Inscrever-se"}</button>
      </form>
      <button className="link" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErr(""); }}>
        {mode === "login" ? "Não tem conta? Inscreva-se" : "Já tem conta? Entrar"}
      </button>
    </div>
  );
}

/* ============ PLANNER ============ */
function Planner({ exercises, plan, setPlan, onStart, onAdd }) {
  const today = new Date();
  const dow = (today.getDay() + 6) % 7;
  const monday = new Date(today); monday.setDate(today.getDate() - dow);
  const list = plan.map((id) => exercises.find((e) => e.id === id)).filter(Boolean);
  const sets = list.reduce((a, e) => a + e.sets, 0);
  const [picking, setPicking] = useState(false);

  return (
    <>
      <h1>Sua semana.<br />Seu ritmo.</h1>
      <p className="sub">Crie uma rotina. Apareça. Fique mais forte.</p>
      <div className="week">
        {DAYS.map((d, i) => {
          const dt = new Date(monday); dt.setDate(monday.getDate() + i);
          return (
            <div key={d} className={"day" + (i === dow ? " on" : "")}>
              <small>{d}</small><b>{dt.getDate()}</b><i />
            </div>
          );
        })}
      </div>
      <div className="card">
        <div className="row"><span className="tag lime">{DAYS[dow]} · Hoje</span><span className="tag">Plano inicial</span></div>
        <h2>Peito & Tríceps</h2>
        <p className="sub">Consistência é seu músculo mais forte. Vamos treinar.</p>
      </div>
      <div className="row between mt">
        <h3>A fila <span className="tag">{list.length}</span></h3>
        <button className="link" onClick={() => setPicking(!picking)}><Icon n="plus" s={16} /> Adicionar exercício</button>
      </div>
      {picking && (
        <div className="card">
          {exercises.filter((e) => !plan.includes(e.id)).map((e) => (
            <button key={e.id} className="pick" onClick={() => { setPlan([...plan, e.id]); setPicking(false); }}>{e.name}</button>
          ))}
          {exercises.every((e) => plan.includes(e.id)) && <p className="sub">Todos os exercícios já estão no plano.</p>}
        </div>
      )}
      <div className="grid">
      {list.map((e) => (
        <div className="card ex" key={e.id}>
          <Gif src={e.gif} alt={e.name} />
          <div className="grow">
            <b>{e.name}</b>
            <div className="row"><span className="tag">{e.muscle}</span><small>{e.sets} séries × {e.reps} reps</small></div>
            <small className="ic"><Icon n="clock" s={12} /> {e.rest}s de descanso</small>
          </div>
          <button className="ico" onClick={() => setPlan(plan.filter((x) => x !== e.id))} title="Remover" aria-label="Remover"><Icon n="x" /></button>
        </div>
      ))}
      </div>
      <div className="sticky">
        <small>{list.length} exercícios · {sets} séries · ~{Math.round(sets * 1.5)} min</small>
        <button className="cta" disabled={!list.length} onClick={() => onStart(list)}><Icon n="play" s={16} /> Iniciar treino</button>
      </div>
    </>
  );
}

/* ============ EXERCÍCIOS ============ */
function Exercises({ exercises, setExercises }) {
  const [q, setQ] = useState("");
  const [m, setM] = useState("Todos");
  const [modal, setModal] = useState(null); // null | {…exercício}
  const [open, setOpen] = useState(null);
  const shown = exercises.filter((e) => (m === "Todos" || e.muscle === m) && e.name.toLowerCase().includes(q.toLowerCase()));

  const saveEx = () => {
    if (!modal.name.trim()) return;
    const ex = { ...modal, id: modal.id || "c" + Date.now() };
    setExercises(modal.id ? exercises.map((e) => (e.id === ex.id ? ex : e)) : [...exercises, ex]);
    setModal(null);
  };
  const blank = { name: "", muscle: "Peito", how: "", sets: 3, reps: "10–12", rest: 90, gif: "" };

  return (
    <>
      <h1>Encontre seu próximo movimento.</h1>
      <p className="sub">Os exercícios certos para o seu treino.</p>
      <input placeholder="Buscar exercícios..." value={q} onChange={(e) => setQ(e.target.value)} />
      <button className="cta" onClick={() => setModal(blank)}><Icon n="plus" s={18} /> Exercício personalizado</button>
      <div className="chips">
        {["Todos", ...MUSCLES].map((x) => <button key={x} className={"chip" + (m === x ? " on" : "")} onClick={() => setM(x)}>{x}</button>)}
      </div>
      <small className="sub">{shown.length} exercícios · Toque para ver as instruções</small>
      <div className="grid">
      {shown.map((e) => (
        <div className="card" key={e.id}>
          <div className="ex" onClick={() => setOpen(open === e.id ? null : e.id)}>
            <Gif src={e.gif} alt={e.name} />
            <div className="grow">
              <b>{e.name}</b>
              <div className="row"><span className="tag">{e.muscle}</span><small>{e.sets} séries × {e.reps} reps</small></div>
              <small className="ic"><Icon n="clock" s={12} /> {e.rest}s de descanso</small>
            </div>
            <button className="ico" onClick={(ev) => { ev.stopPropagation(); setModal(e); }} aria-label="Editar"><Icon n="pencil" /></button>
          </div>
          {open === e.id && (
            <div className="detail">
              <Gif src={e.gif} alt={e.name} size={220} />
              <p>{e.how || "Sem instruções."}</p>
            </div>
          )}
        </div>
      ))}
      </div>
      {modal && (
        <div className="overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="row between"><h3>{modal.id ? "Editar exercício" : "Faça o seu"}</h3><button className="ico" onClick={() => setModal(null)} aria-label="Fechar"><Icon n="x" /></button></div>
            <label>Nome do exercício</label>
            <input placeholder="ex.: Stiff com halteres" value={modal.name} onChange={(e) => setModal({ ...modal, name: e.target.value })} />
            <label>Músculo alvo</label>
            <div className="chips wrap">{MUSCLES.map((x) => <button key={x} className={"chip" + (modal.muscle === x ? " on" : "")} onClick={() => setModal({ ...modal, muscle: x })}>{x}</button>)}</div>
            <label>URL do GIF (opcional)</label>
            <input placeholder="https://.../exercicio.gif" value={modal.gif} onChange={(e) => setModal({ ...modal, gif: e.target.value })} />
            <label>Instruções</label>
            <textarea rows={3} placeholder="Descreva o movimento, a postura e a técnica..." value={modal.how} onChange={(e) => setModal({ ...modal, how: e.target.value })} />
            <div className="three">
              <div><label>Séries</label><input type="number" value={modal.sets} onChange={(e) => setModal({ ...modal, sets: +e.target.value })} /></div>
              <div><label>Reps</label><input value={modal.reps} onChange={(e) => setModal({ ...modal, reps: e.target.value })} /></div>
              <div><label>Desc. (s)</label><input type="number" value={modal.rest} onChange={(e) => setModal({ ...modal, rest: +e.target.value })} /></div>
            </div>
            <button className="cta" onClick={saveEx}><Icon n="check" s={18} /> {modal.id ? "Salvar" : "Criar exercício"}</button>
          </div>
        </div>
      )}
    </>
  );
}

/* ============ PROGRESSO ============ */
function Progress({ history }) {
  const totalSets = history.reduce((a, h) => a + h.sets, 0);
  const mins = Math.floor(history.reduce((a, h) => a + h.seconds, 0) / 60);
  return (
    <>
      <h1>Cada treino conta.</h1>
      <p className="sub">Um registro do trabalho que você fez.</p>
      <div className="card stats">
        <div><b>{history.length}</b><small>Treinos</small></div>
        <div><b>{totalSets}</b><small>Séries concluídas</small></div>
        <div><b>{mins} min</b><small>Tempo de treino</small></div>
      </div>
      <h3 className="mt">Histórico de treinos</h3>
      {history.length === 0 && <p className="sub">Nenhum treino ainda. Bora começar!</p>}
      <div className="grid">
      {[...history].reverse().map((h, i) => (
        <div className="card ex" key={i}>
          <div className="okbox"><Icon n="check" s={20} /></div>
          <div className="grow"><b>{h.title}</b><br /><small>{new Date(h.date).toLocaleDateString("pt-BR")} · {h.sets} séries</small></div>
          <b className="lime">{fmt(h.seconds)}</b>
        </div>
      ))}
      </div>
    </>
  );
}

/* ============ TREINO AO VIVO ============ */
function Live({ list, onFinish, onCancel }) {
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(() => list.map(() => 0));
  const [elapsed, setElapsed] = useState(0);
  const [rest, setRest] = useState(0);
  const [resting, setResting] = useState(false);
  const [restTotal, setRestTotal] = useState(0);
  const ref = useRef();
  useEffect(() => {
    ref.current = setInterval(() => {
      setElapsed((s) => s + 1);
      setResting((r) => { if (r) setRest((x) => x + 1); return r; });
    }, 1000);
    return () => clearInterval(ref.current);
  }, []);

  const e = list[idx];
  const mark = (n) => {
    const d = [...done]; d[idx] = d[idx] === n + 1 ? n : n + 1; setDone(d);
    if (d[idx] > done[idx]) { setResting(true); setRestTotal(0); setRest(0); }
  };
  useEffect(() => { if (resting) setRestTotal((t) => t + 0); }, [resting]);
  const finish = () => onFinish({ title: "Peito & Tríceps", date: new Date().toISOString(), sets: done.reduce((a, b) => a + b, 0), seconds: elapsed });

  return (
    <>
      <div className="row between">
        <div><h2 style={{ margin: 0 }}>Seu treino está ativo</h2><small>Peito & Tríceps</small></div>
        <span className="tag lime"><span className="dot" /> Em andamento</span>
      </div>
      <div className="card stats">
        <div><b>{fmt(elapsed)}</b><small>Total</small></div>
        <div><b>{fmt(elapsed - rest)}</b><small>Ativo</small></div>
        <div><b>{fmt(rest)}</b><small>Descanso</small></div>
      </div>
      <div className="card">
        <small>Exercício {idx + 1} de {list.length}</small>
        <div className="center"><Gif src={e.gif} alt={e.name} size={240} /></div>
        <h2>{e.name}</h2>
        <small>{e.muscle} · {e.sets} séries × {e.reps} reps · {e.rest}s</small>
        <p className="sub">{e.how}</p>
        <div className="row">
          {Array.from({ length: e.sets }).map((_, n) => (
            <button key={n} className={"setbtn" + (n < done[idx] ? " on" : "")} onClick={() => mark(n)}>{n + 1}</button>
          ))}
        </div>
        {resting && <button className="link" onClick={() => setResting(false)}><Icon n="clock" s={14} /> Descansando ({e.rest}s sugeridos) — toque para retomar</button>}
      </div>
      <div className="row mt">
        <button className="ghost" disabled={idx === 0} onClick={() => setIdx(idx - 1)}><Icon n="left" s={16} /> Anterior</button>
        {idx < list.length - 1
          ? <button className="cta" onClick={() => setIdx(idx + 1)}>Próximo <Icon n="right" s={16} /></button>
          : <button className="cta" onClick={finish}>Finalizar <Icon n="check" s={16} /></button>}
      </div>
      <button className="link" onClick={onCancel}>Cancelar treino</button>
    </>
  );
}

/* ============ APP ============ */
export default function FormApp() {
  const [user, setUser] = useState(() => load("form_session", null));
  const [tab, setTab] = useState("planner");
  const [exercises, setExercises] = useState(() => load("form_ex", DEFAULTS));
  const [plan, setPlan] = useState(() => load("form_plan", PLAN));
  const [history, setHistory] = useState(() => load("form_hist", []));
  const [live, setLive] = useState(null);
  const [light, setLight] = useState(false);

  useEffect(() => save("form_ex", exercises), [exercises]);
  useEffect(() => save("form_plan", plan), [plan]);
  useEffect(() => save("form_hist", history), [history]);

  const login = (u) => { save("form_session", u); setUser(u); };
  const logout = () => { save("form_session", null); setUser(null); setLive(null); };

  return (
    <div className={"app" + (user ? " in" : "") + (light ? " light" : "")}>
      <style>{CSS}</style>
      {!user ? <Auth onLogin={login} /> : (
        <>
          <header>
            <div className="logo"><span className="lg"><Icon n="dumbbell" s={18} /></span> HYPERFORM.</div>
            <div className="row">
              <button className="ico" onClick={() => setLight(!light)} title="Tema" aria-label="Alternar tema"><Icon n={light ? "moon" : "sun"} /></button>
              <button className="ico" onClick={logout} title={`Sair (${user.name})`} aria-label="Sair"><Icon n="logout" /></button>
            </div>
          </header>
          <main>
            {live ? (
              <Live list={live} onCancel={() => setLive(null)} onFinish={(h) => { setHistory([...history, h]); setLive(null); setTab("progress"); }} />
            ) : tab === "planner" ? (
              <Planner exercises={exercises} plan={plan} setPlan={setPlan} onStart={setLive} />
            ) : tab === "exercises" ? (
              <Exercises exercises={exercises} setExercises={setExercises} />
            ) : (
              <Progress history={history} />
            )}
          </main>
          <nav>
            {[["planner", "calendar", "Planner"], ["exercises", "dumbbell", "Exercícios"], ["progress", "chart", "Progresso"]].map(([k, i, l]) => (
              <button key={k} className={tab === k && !live ? "on" : ""} onClick={() => { setLive(null); setTab(k); }}><Icon n={i} s={22} /><span>{l}</span></button>
            ))}
          </nav>
        </>
      )}
    </div>
  );
}

const CSS = `
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
.app{--bg:#121412;--card:#1a1c1a;--line:#2a2d2a;--tx:#f2f4f0;--mut:#8c918a;--lime:#c6f432;--nav:64px;--side:230px;
 min-height:100dvh;background:var(--bg);color:var(--tx);font-family:Inter,system-ui,sans-serif;display:flex;flex-direction:column}
.app.light{--bg:#f6f7f3;--card:#fff;--line:#e2e5dc;--tx:#141612;--mut:#6b705f}
.i{flex-shrink:0;vertical-align:middle}
/* ---------- base: MOBILE ---------- */
header{position:sticky;top:0;z-index:5;background:var(--bg);display:flex;justify-content:space-between;align-items:center;padding:12px 16px;padding-top:calc(12px + env(safe-area-inset-top));border-bottom:1px solid var(--line)}
main{flex:1;width:100%;max-width:1000px;margin:0 auto;padding:16px 16px calc(var(--nav) + 150px + env(safe-area-inset-bottom))}
h1{font-size:clamp(26px,7vw,38px);line-height:1.05;margin:8px 0;font-weight:800;letter-spacing:-.5px}
h2{font-size:clamp(20px,5vw,26px);margin:8px 0;font-weight:800}h3{margin:0;font-size:17px}
.sub{color:var(--mut);font-size:14px;line-height:1.5}small{color:var(--mut);font-size:12px}
.ic{display:inline-flex;align-items:center;gap:4px}
.logo{font-weight:800;font-size:20px;display:flex;gap:8px;align-items:center}.logo.big{font-size:clamp(28px,9vw,36px);margin-bottom:24px}
.lg{background:var(--lime);color:#111;border-radius:10px;width:32px;height:32px;display:inline-flex;align-items:center;justify-content:center}
.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.between{justify-content:space-between}.grow{flex:1;min-width:0}.mt{margin-top:22px}.center{display:flex;justify-content:center;margin:10px 0}
.grid{display:grid;grid-template-columns:1fr;gap:0 14px}
.card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:14px;margin:12px 0}
.ex{display:flex;gap:12px;align-items:center;cursor:pointer}
.ex b{overflow-wrap:anywhere}
.gif,.gifph{border-radius:12px;object-fit:cover;background:#fff;flex-shrink:0}
.gifph{display:flex;align-items:center;justify-content:center;background:var(--line);color:var(--mut)}
.tag{display:inline-flex;align-items:center;gap:6px;background:var(--line);color:var(--mut);font-size:11px;padding:3px 8px;border-radius:6px}.tag.lime{color:var(--lime);background:#c6f43222}
.dot{width:7px;height:7px;border-radius:50%;background:var(--lime)}
.lime{color:var(--lime)}
input,textarea{width:100%;background:transparent;border:1px solid var(--line);border-radius:12px;padding:13px;color:var(--tx);font:inherit;font-size:16px;margin:6px 0}
input:focus,textarea:focus{outline:2px solid var(--lime)}
label{font-size:12px;color:var(--mut);display:block;margin-top:10px}
.cta,.ghost,.link{display:inline-flex;align-items:center;justify-content:center;gap:8px}
.cta{width:100%;background:var(--lime);color:#111;border:0;border-radius:14px;min-height:48px;padding:12px 15px;font-weight:700;font-size:16px;cursor:pointer;margin:8px 0}
.cta:disabled{opacity:.4}
.ghost{flex:1;background:transparent;border:1px solid var(--line);color:var(--tx);border-radius:14px;min-height:48px;padding:12px;cursor:pointer;font:inherit}
.ghost:disabled{opacity:.4}
.link{background:none;border:0;color:var(--lime);cursor:pointer;font:inherit;padding:10px 0;min-height:44px}
.ico{background:none;border:0;color:var(--mut);cursor:pointer;width:44px;height:44px;display:inline-flex;align-items:center;justify-content:center;border-radius:12px}
.ico:hover{background:var(--line)}
.week{display:grid;grid-template-columns:repeat(7,1fr);gap:5px;margin:16px 0}
.day{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:8px 0;text-align:center;display:flex;flex-direction:column;gap:4px;align-items:center}
.day b{font-size:clamp(15px,4.5vw,22px)}.day small{font-size:clamp(9px,2.8vw,12px)}.day i{width:4px;height:4px;border-radius:50%;background:var(--lime)}
.day.on{background:var(--lime);color:#111}.day.on small{color:#111}.day.on i{background:#111}
.chips{display:flex;gap:8px;overflow-x:auto;margin:14px -16px;padding:0 16px 4px;scrollbar-width:none}.chips::-webkit-scrollbar{display:none}
.chips.wrap{flex-wrap:wrap;overflow:visible;margin:8px 0;padding:0}
.chip{background:var(--card);color:var(--tx);border:1px solid var(--line);border-radius:10px;min-height:44px;padding:0 16px;cursor:pointer;white-space:nowrap;font:inherit}
.chip.on{background:var(--lime);color:#111;font-weight:700}
.pick{display:block;width:100%;text-align:left;background:none;border:0;border-bottom:1px solid var(--line);color:var(--tx);padding:12px 0;cursor:pointer;font:inherit}
.detail{margin-top:12px;text-align:center}.detail p{text-align:left;color:var(--mut);font-size:14px;line-height:1.5}
.sticky{position:fixed;left:0;right:0;bottom:calc(var(--nav) + env(safe-area-inset-bottom));background:var(--bg);border-top:1px solid var(--line);padding:10px 16px;z-index:4;display:flex;flex-direction:column;align-items:center}
.sticky .cta{max-width:480px;margin:6px 0 0}
nav{position:fixed;left:0;right:0;bottom:0;z-index:6;display:flex;background:var(--bg);border-top:1px solid var(--line);padding-bottom:env(safe-area-inset-bottom)}
nav button{flex:1;height:var(--nav);background:none;border:0;color:var(--mut);font-size:11px;cursor:pointer;display:flex;flex-direction:column;gap:4px;align-items:center;justify-content:center;font-family:inherit}
nav button.on{color:var(--lime);font-weight:700}
.stats{display:flex;justify-content:space-around;text-align:center;gap:8px}.stats b{display:block;font-size:clamp(20px,6vw,28px);color:var(--lime)}
.okbox{background:var(--line);color:var(--lime);width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.setbtn{width:48px;height:48px;border-radius:12px;background:var(--line);border:0;color:var(--tx);font-weight:700;cursor:pointer;font:inherit}
.setbtn.on{background:var(--lime);color:#111}
.overlay{position:fixed;inset:0;background:#000a;display:flex;align-items:flex-end;justify-content:center;z-index:20}
.modal{background:var(--card);border:1px solid var(--line);border-radius:20px 20px 0 0;padding:20px 16px calc(20px + env(safe-area-inset-bottom));width:100%;max-height:92dvh;overflow-y:auto}
.three{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
.auth{width:100%;max-width:420px;margin:0 auto;padding:32px 20px;display:flex;flex-direction:column;justify-content:center;min-height:100dvh}
.err{color:#ff6b6b;font-size:13px;margin:4px 0}
/* ---------- TABLET ≥ 640px ---------- */
@media (min-width:640px){
 header{padding-left:24px;padding-right:24px}
 main{padding:24px 24px calc(var(--nav) + 150px)}
 .chips{margin:14px 0;padding:0}
 .grid{grid-template-columns:1fr 1fr}
 .overlay{align-items:center;padding:16px}
 .modal{max-width:440px;border-radius:20px}
 .auth{padding:48px 24px}
}
/* ---------- DESKTOP ≥ 960px: menu lateral ---------- */
@media (min-width:960px){
 .app.in{padding-left:var(--side)}
 nav{top:0;right:auto;width:var(--side);flex-direction:column;justify-content:flex-start;gap:6px;padding:84px 12px 0;border-top:0;border-right:1px solid var(--line)}
 nav button{flex:none;height:48px;flex-direction:row;justify-content:flex-start;gap:12px;padding:0 14px;border-radius:12px;font-size:14px}
 nav button.on{background:var(--card)}
 .sticky{left:var(--side);bottom:0}
 main{padding-bottom:140px}
 .auth{margin:0 auto;padding-left:0}
}
`;
