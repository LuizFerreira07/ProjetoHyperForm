import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "./supabaseClient";

/* ============ BIBLIOTECA DE EXERCÍCIOS ============
 GIFs: arquivos em public/gifs/<id>.gif (veja public/gifs/LEIA-ME.txt)
 ou defina VITE_GIF_BASE no .env para apontar para um CDN. */
const GIF_BASE = import.meta.env?.VITE_GIF_BASE || "/gifs";
const slug = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const EQUIP = ["Barra", "Halteres", "Polia", "Máquina", "Peso corporal"];
const EQ_LABEL = { Barra: "com barra", Halteres: "com halteres", Polia: "na polia", "Máquina": "na máquina", "Peso corporal": "com peso corporal" };
const EQ_CUE = { Barra: "Pegada firme e coluna neutra.", Halteres: "Use amplitude completa, sem balançar o tronco.", Polia: "Mantenha a tensão constante no cabo.", "Máquina": "Ajuste banco e apoios antes de começar.", "Peso corporal": "Controle o movimento, sem usar impulso." };
const CUE = { Peito: "Escápulas para trás, controle a descida e contraia o peitoral na subida.", Costas: "Peito aberto, puxe com as costas e não com os braços, controlando a volta.", Ombros: "Ombros longe das orelhas, movimento controlado sem roubar com o tronco.", "Bíceps": "Cotovelos fixos ao lado do corpo, sem balançar, contraindo no topo.", "Tríceps": "Cotovelos parados, estenda por completo e volte devagar.", Pernas: "Joelhos alinhados com os pés, tronco firme e amplitude confortável.", Core: "Abdômen contraído, lombar protegida e respiração controlada." };
// [músculo, movimento, equipamentos, séries, reps, descanso]
const BASE = [
 ["Peito","Supino reto",["Barra","Halteres","Máquina"],4,"8–12",90],["Peito","Supino inclinado",["Barra","Halteres","Máquina"],3,"10–12",90],["Peito","Supino declinado",["Barra","Halteres"],3,"10–12",90],
 ["Peito","Crucifixo",["Halteres","Polia","Máquina"],3,"12–15",60],["Peito","Crucifixo inclinado",["Halteres","Polia"],3,"12–15",60],["Peito","Crossover",["Polia"],3,"12–15",60],["Peito","Flexão de braços",["Peso corporal"],3,"10–20",60],
 ["Costas","Remada curvada",["Barra","Halteres"],4,"8–12",90],["Costas","Remada baixa",["Polia","Máquina"],3,"10–12",75],["Costas","Remada unilateral",["Halteres","Polia"],3,"10–12",75],["Costas","Remada cavalinho",["Barra","Máquina"],3,"10–12",75],
 ["Costas","Puxada frontal",["Polia","Máquina"],4,"8–12",75],["Costas","Pulldown",["Polia"],3,"12–15",60],["Costas","Barra fixa",["Peso corporal"],3,"6–10",90],["Costas","Levantamento terra",["Barra","Halteres"],4,"5–8",120],
 ["Ombros","Desenvolvimento",["Barra","Halteres","Máquina"],4,"8–12",90],["Ombros","Elevação lateral",["Halteres","Polia","Máquina"],3,"12–15",60],["Ombros","Elevação frontal",["Halteres","Polia","Barra"],3,"12–15",60],
 ["Ombros","Crucifixo inverso",["Halteres","Polia","Máquina"],3,"12–15",60],["Ombros","Encolhimento",["Barra","Halteres"],3,"12–15",60],["Ombros","Face pull",["Polia"],3,"12–15",60],
 ["Bíceps","Rosca direta",["Barra","Polia","Halteres"],3,"10–12",60],["Bíceps","Rosca alternada",["Halteres"],3,"10–12",60],["Bíceps","Rosca martelo",["Halteres","Polia"],3,"10–12",60],["Bíceps","Rosca scott",["Barra","Halteres","Máquina"],3,"10–12",60],["Bíceps","Rosca concentrada",["Halteres"],3,"10–12",60],
 ["Tríceps","Tríceps testa",["Barra","Halteres","Polia"],3,"10–12",75],["Tríceps","Tríceps pulley",["Polia"],3,"12–15",60],["Tríceps","Tríceps corda",["Polia"],3,"12–15",60],["Tríceps","Tríceps francês",["Halteres","Polia"],3,"10–12",75],["Tríceps","Tríceps coice",["Halteres","Polia"],3,"12–15",60],["Tríceps","Mergulho",["Peso corporal","Máquina"],3,"8–12",75],
 ["Pernas","Agachamento",["Barra","Halteres","Máquina","Peso corporal"],4,"8–12",120],["Pernas","Agachamento búlgaro",["Halteres","Peso corporal"],3,"10–12",90],["Pernas","Afundo",["Halteres","Barra","Peso corporal"],3,"10–12",90],["Pernas","Leg press",["Máquina"],4,"10–15",90],
 ["Pernas","Cadeira extensora",["Máquina"],3,"12–15",60],["Pernas","Mesa flexora",["Máquina"],3,"12–15",60],["Pernas","Stiff",["Barra","Halteres"],3,"8–12",90],["Pernas","Elevação pélvica",["Barra","Halteres","Máquina"],4,"8–12",90],
 ["Pernas","Panturrilha em pé",["Máquina","Halteres"],4,"12–20",45],["Pernas","Cadeira abdutora",["Máquina"],3,"12–15",60],["Pernas","Cadeira adutora",["Máquina"],3,"12–15",60],
 ["Core","Abdominal supra",["Peso corporal","Máquina","Polia"],3,"12–20",45],["Core","Abdominal oblíquo",["Polia","Halteres","Peso corporal"],3,"12–20",45],["Core","Elevação de pernas",["Peso corporal"],3,"10–15",45],["Core","Prancha",["Peso corporal"],3,"30–60s",45],
];
const LIB = BASE.flatMap(([muscle, mov, eqs, sets, reps, rest]) => eqs.map((equip) => {
  const name = `${mov} ${EQ_LABEL[equip]}`;
  return { id: slug(name), name, muscle, equip, sets, reps, rest, gif: `${GIF_BASE}/${slug(name)}.gif`, how: `${CUE[muscle]} ${EQ_CUE[equip]}` };
}));
const MUSCLES = ["Peito", "Costas", "Ombros", "Bíceps", "Tríceps", "Pernas", "Core"];
const PLAN = ["supino-reto-com-barra", "supino-inclinado-com-halteres", "crucifixo-na-polia", "triceps-corda-na-polia", "triceps-testa-com-barra"];
const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

/* ============ helpers ============ */
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const hash = (s) => btoa(unescape(encodeURIComponent(s))); // demo! use backend/bcrypt em produção
const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
const dk = (d) => { d = new Date(d); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
function usePersist(key, make, uid) {
  const [v, set] = useState(() => make(null));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let on = true;
    supabase.from("user_data").select("value").eq("user_id", uid).eq("key", key).maybeSingle()
      .then(({ data }) => { if (on) { set(make(data?.value ?? null)); setReady(true); } });
    return () => { on = false; };
  }, [uid, key]);
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => supabase.from("user_data").upsert({ user_id: uid, key, value: v }), 400);
    return () => clearTimeout(t);
  }, [v, ready]);
  return [v, set, ready];
}
function progressions(hist) {
  const best = {}, out = [];
  [...hist].sort((a, b) => new Date(a.date) - new Date(b.date)).forEach((h) => (h.logs || []).forEach((l) => {
    if (!l.sets.length) return;
    const kg = Math.max(...l.sets.map((s) => s.kg));
    const reps = Math.max(...l.sets.filter((s) => s.kg === kg).map((s) => s.reps));
    const p = best[l.exId];
    if (p && kg > p.kg) out.push({ date: h.date, name: l.name, type: "carga", from: p.kg, to: kg });
    else if (p && kg === p.kg && reps > p.reps) out.push({ date: h.date, name: l.name, type: "reps", from: p.reps, to: reps, kg });
    if (!p || kg > p.kg || (kg === p.kg && reps > p.reps)) best[l.exId] = { kg, reps };
  }));
  return out.reverse();
}

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
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  trend: "M3 17l6-6 4 4 8-8 M15 7h6v6",
  copy: "M9 9h11v11H9z M5 15H4V4h11v1",
  minus: "M5 12h14",
  trash: "M3 6h18 M8 6V4h8v2 M6 6l1 14h10l1-14 M10 11v6 M14 11v6",
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
function Auth() {
  const [mode, setMode] = useState("login");
  const [f, setF] = useState({ name: "", email: "", pass: "", pass2: "", role: "aluno", code: "" });
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setInfo("");
    const email = f.email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("E-mail inválido.");
    if (f.pass.length < 6) return setErr("A senha precisa ter ao menos 6 caracteres.");
    setBusy(true);
    try {
      if (mode === "signup") {
        if (!f.name.trim()) return setErr("Informe seu nome.");
        if (f.pass !== f.pass2) return setErr("As senhas não coincidem.");
        let pc = "";
        if (f.role === "aluno" && f.code.trim()) {
          const { data } = await supabase.rpc("find_personal", { c: f.code });
          if (!data?.length) return setErr("Código do personal não encontrado.");
          pc = data[0].code;
        }
        const { data, error } = await supabase.auth.signUp({ email, password: f.pass, options: { data: { name: f.name.trim(), role: f.role, personal_code: pc } } });
        if (error) return setErr(error.message);
        if (!data.session) setInfo("Conta criada! Confirme o link enviado ao seu e-mail e depois entre.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: f.pass });
        if (error) setErr("E-mail ou senha incorretos.");
      }
    } finally { setBusy(false); }
  };

  return (
    <div className="auth">
      <div className="logo big"><span className="lg"><Icon n="dumbbell" s={18} /></span> HYPERFORM.</div>
      <h1>{mode === "login" ? "Bem-vindo de volta." : "Crie sua conta."}</h1>
      <p className="sub">{mode === "login" ? "Entre para continuar seu treino." : "Escolha seu perfil e comece."}</p>
      <form onSubmit={submit}>
        {mode === "signup" && (
          <>
            <div className="seg">
              {[["aluno", "Sou aluno"], ["personal", "Sou personal"]].map(([v, l]) => (
                <button type="button" key={v} className={"chip" + (f.role === v ? " on" : "")} onClick={() => setF({ ...f, role: v })}>{l}</button>
              ))}
            </div>
            <input placeholder="Nome" value={f.name} onChange={set("name")} />
          </>
        )}
        <input placeholder="E-mail" type="email" value={f.email} onChange={set("email")} />
        <input placeholder="Senha" type="password" value={f.pass} onChange={set("pass")} />
        {mode === "signup" && <input placeholder="Confirmar senha" type="password" value={f.pass2} onChange={set("pass2")} />}
        {mode === "signup" && f.role === "aluno" && <input placeholder="Código do personal (opcional)" value={f.code} onChange={set("code")} />}
        {err && <div className="err">{err}</div>}
        {info && <div className="sub lime">{info}</div>}
        <button className="cta" type="submit" disabled={busy}>{busy ? "Aguarde..." : mode === "login" ? "Entrar" : "Inscrever-se"}</button>
      </form>
      <button className="link" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErr(""); setInfo(""); }}>
        {mode === "login" ? "Não tem conta? Inscreva-se" : "Já tem conta? Entrar"}
      </button>
    </div>
  );
}

/* ============ CALENDÁRIO ============ */
function Calendar({ history, sched, setSched, start }) {
  const [base, setBase] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [sel, setSel] = useState(dk(new Date()));
  const todayK = dk(new Date());
  const done = {};
  history.forEach((h) => (done[dk(h.date)] ??= []).push(h));
  const y = base.getFullYear(), mo = base.getMonth();
  const total = new Date(y, mo + 1, 0).getDate();
  const lead = (new Date(y, mo, 1).getDay() + 6) % 7;
  const status = (k, wd) => (done[k] ? "trained" : k < todayK && k >= start && sched.includes(wd) ? "missed" : "");
  let nT = 0, nM = 0;
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(<span key={"b" + i} />);
  for (let d = 1; d <= total; d++) {
    const dt = new Date(y, mo, d), k = dk(dt), st = status(k, (dt.getDay() + 6) % 7);
    if (st === "trained") nT++; if (st === "missed") nM++;
    cells.push(<button key={k} className={`cell ${st}${k === todayK ? " today" : ""}${k === sel ? " sel" : ""}`} onClick={() => setSel(k)}>{d}</button>);
  }
  const sd = new Date(sel + "T12:00:00"), swd = (sd.getDay() + 6) % 7;
  return (
    <div className="card">
      <div className="row between">
        <button className="ico" aria-label="Mês anterior" onClick={() => setBase(new Date(y, mo - 1, 1))}><Icon n="left" /></button>
        <b style={{ textTransform: "capitalize" }}>{base.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</b>
        <button className="ico" aria-label="Próximo mês" onClick={() => setBase(new Date(y, mo + 1, 1))}><Icon n="right" /></button>
      </div>
      <div className="cal">{DAYS.map((d) => <small key={d} style={{ textAlign: "center" }}>{d}</small>)}{cells}</div>
      <div className="row" style={{ margin: "10px 0" }}>
        <span className="tag lime">Treinou: {nT}</span><span className="tag" style={{ color: "#ff6b6b" }}>Faltou: {nM}</span>
      </div>
      <div className="detail" style={{ textAlign: "left" }}>
        <b>{sd.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</b>
        {done[sel] ? done[sel].map((h, i) => <p key={i} className="lime">{h.title} · {h.sets} séries · {fmt(h.seconds)}</p>)
          : <p>{status(sel, swd) === "missed" ? "Você faltou ao treino neste dia." : sched.includes(swd) ? (sel > todayK ? "Treino previsto." : sel === todayK ? "Treino de hoje." : "Sem treino registrado.") : "Dia de descanso."}</p>}
      </div>
      <label>Seus dias de treino (para contar faltas)</label>
      <div className="chips wrap">{DAYS.map((d, i) => (
        <button key={d} className={"chip" + (sched.includes(i) ? " on" : "")} style={{ padding: "0 12px" }} onClick={() => setSched(sched.includes(i) ? sched.filter((x) => x !== i) : [...sched, i])}>{d}</button>
      ))}</div>
    </div>
  );
}

/* ============ PLANNER ============ */
function Step({ label, value, onChange, min, max, step, suffix = "" }) {
  const clamp = (v) => Math.min(max, Math.max(min, v));
  return (
    <div className="step">
      <label>{label}</label>
      <div className="stp">
        <button type="button" className="ico" aria-label="Diminuir" onClick={() => onChange(clamp(value - step))}><Icon n="minus" /></button>
        <span><input type="number" inputMode="numeric" value={value} onChange={(e) => onChange(clamp(parseInt(e.target.value) || min))} />{suffix}</span>
        <button type="button" className="ico" aria-label="Aumentar" onClick={() => onChange(clamp(value + step))}><Icon n="plus" /></button>
      </div>
    </div>
  );
}

function Planner({ exercises, workouts, setWorkouts, onStart, history, sched, setSched, start }) {
  const [openId, setOpenId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [picker, setPicker] = useState(false);
  const [q, setQ] = useState("");

  const today = new Date();
  const dow = (today.getDay() + 6) % 7;
  const monday = new Date(today); monday.setDate(today.getDate() - dow);

  const byId = (id) => exercises.find((e) => e.id === id);
  const resolve = (w) => w.items.map((it) => { const e = byId(it.exId); return e ? { ...e, sets: it.sets, rest: it.rest } : null; }).filter(Boolean);
  const upd = (id, fn) => setWorkouts(workouts.map((w) => (w.id === id ? fn(w) : w)));
  const create = () => {
    const name = newName.trim();
    if (!name) return;
    const w = { id: "w" + Date.now(), name, items: [] };
    setWorkouts([...workouts, w]); setNewName(""); setCreating(false); setOpenId(w.id);
  };
  const w = workouts.find((x) => x.id === openId);

  /* ---------- EDITOR DO TREINO ---------- */
  if (w) {
    const list = resolve(w);
    const totalSets = list.reduce((a, e) => a + e.sets, 0);
    const setItem = (i, patch) => upd(w.id, (x) => ({ ...x, items: x.items.map((it, j) => (j === i ? { ...it, ...patch } : it)) }));
    const shown = exercises.filter((e) => `${e.name} ${e.muscle} ${e.equip}`.toLowerCase().includes(q.toLowerCase()));
    return (
      <>
        <button className="link" onClick={() => setOpenId(null)}><Icon n="left" s={16} /> Meus treinos</button>
        <label>Nome do treino</label>
        <input value={w.name} onChange={(e) => upd(w.id, (x) => ({ ...x, name: e.target.value }))} />
        <div className="row between mt">
          <h3>Exercícios <span className="tag">{w.items.length}</span></h3>
          <button className="link" onClick={() => { setQ(""); setPicker(true); }}><Icon n="plus" s={16} /> Adicionar exercício</button>
        </div>
        {w.items.length === 0 && <p className="sub">Nenhum exercício ainda. Adicione qualquer exercício disponível no app.</p>}
        <div className="grid">
          {w.items.map((it, i) => {
            const e = byId(it.exId);
            if (!e) return null;
            return (
              <div className="card" key={it.exId}>
                <div className="ex" style={{ cursor: "default" }}>
                  <Gif src={e.gif} alt={e.name} />
                  <div className="grow"><b>{e.name}</b><br /><span className="tag">{e.muscle}</span></div>
                  <button className="ico" aria-label="Remover" onClick={() => upd(w.id, (x) => ({ ...x, items: x.items.filter((_, j) => j !== i) }))}><Icon n="x" /></button>
                </div>
                <div className="steps">
                  <Step label="Séries" value={it.sets} min={1} max={20} step={1} onChange={(v) => setItem(i, { sets: v })} />
                  <Step label="Descanso" value={it.rest} min={0} max={600} step={5} suffix="s" onChange={(v) => setItem(i, { rest: v })} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="sticky">
          <small>{list.length} exercícios · {totalSets} séries</small>
          <button className="cta" disabled={!list.length} onClick={() => onStart({ name: w.name.trim() || "Treino", list })}><Icon n="play" s={16} /> Iniciar treino</button>
        </div>
        {picker && (
          <div className="overlay" onClick={() => setPicker(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="row between"><h3>Adicionar exercício</h3><button className="ico" aria-label="Fechar" onClick={() => setPicker(false)}><Icon n="x" /></button></div>
              <input placeholder="Buscar exercícios..." value={q} onChange={(e) => setQ(e.target.value)} />
              {shown.map((e) => {
                const added = w.items.some((it) => it.exId === e.id);
                return (
                  <div className="ex pickrow" key={e.id} style={{ cursor: "default" }}>
                    <Gif src={e.gif} alt={e.name} size={48} />
                    <div className="grow"><b>{e.name}</b><br /><small>{e.muscle} · {e.equip} · {e.sets}×{e.reps}</small></div>
                    <button className="ico" disabled={added} aria-label="Adicionar" style={added ? { color: "var(--lime)" } : {}}
                      onClick={() => upd(w.id, (x) => ({ ...x, items: [...x.items, { exId: e.id, sets: e.sets, rest: e.rest }] }))}>
                      <Icon n={added ? "check" : "plus"} />
                    </button>
                  </div>
                );
              })}
              <button className="cta" onClick={() => setPicker(false)}>Concluído</button>
            </div>
          </div>
        )}
      </>
    );
  }

  /* ---------- LISTA DE TREINOS ---------- */
  return (
    <>
      <h1>Sua semana.<br />Seu ritmo.</h1>
      <p className="sub">Crie seus treinos. Apareça. Fique mais forte.</p>
      <Calendar history={history} sched={sched} setSched={setSched} start={start} />
      <div className="row between mt">
        <h3>Meus treinos <span className="tag">{workouts.length}</span></h3>
        <button className="link" onClick={() => setCreating(!creating)}><Icon n="plus" s={16} /> Novo treino</button>
      </div>
      {creating && (
        <div className="card">
          <label>Nome do treino</label>
          <input autoFocus placeholder="ex.: Costas e Bíceps" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && create()} />
          <button className="cta" onClick={create}>Criar treino</button>
        </div>
      )}
      {workouts.length === 0 && !creating && <p className="sub">Você ainda não tem treinos. Toque em "Novo treino" para criar o primeiro.</p>}
      <div className="grid">
        {workouts.map((x) => {
          const list = resolve(x);
          const sets = list.reduce((a, e) => a + e.sets, 0);
          return (
            <div className="card" key={x.id}>
              <div className="row between">
                <h2 style={{ margin: 0 }}>{x.name}</h2>
                <button className="ico" aria-label="Excluir treino" onClick={() => window.confirm(`Excluir "${x.name}"?`) && setWorkouts(workouts.filter((y) => y.id !== x.id))}><Icon n="trash" /></button>
              </div>
              <small>{list.length} exercícios · {sets} séries · ~{Math.round(sets * 1.5)} min</small>
              <div className="row" style={{ marginTop: 12, flexWrap: "nowrap" }}>
                <button className="ghost" onClick={() => setOpenId(x.id)}><Icon n="pencil" s={16} /> Editar</button>
                <button className="cta" style={{ margin: 0, flex: 1, width: "auto" }} disabled={!list.length} onClick={() => onStart({ name: x.name, list })}><Icon n="play" s={16} /> Iniciar</button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ============ EXERCÍCIOS ============ */
function Exercises({ exercises, setExercises }) {
  const [q, setQ] = useState("");
  const [m, setM] = useState("Todos");
  const [eq, setEq] = useState("Todos");
  const [modal, setModal] = useState(null); // null | {…exercício}
  const [open, setOpen] = useState(null);
  const shown = exercises.filter((e) => (m === "Todos" || e.muscle === m) && (eq === "Todos" || e.equip === eq) && e.name.toLowerCase().includes(q.toLowerCase()));

  const saveEx = () => {
    if (!modal.name.trim()) return;
    const ex = { ...modal, id: modal.id || "c" + Date.now() };
    setExercises(modal.id ? exercises.map((e) => (e.id === ex.id ? ex : e)) : [...exercises, ex]);
    setModal(null);
  };
  const blank = { name: "", muscle: "Peito", equip: "Halteres", how: "", sets: 3, reps: "10–12", rest: 90, gif: "" };

  return (
    <>
      <h1>Encontre seu próximo movimento.</h1>
      <p className="sub">Os exercícios certos para o seu treino.</p>
      <input placeholder="Buscar exercícios..." value={q} onChange={(e) => setQ(e.target.value)} />
      <button className="cta" onClick={() => setModal(blank)}><Icon n="plus" s={18} /> Exercício personalizado</button>
      <div className="chips">
        {["Todos", ...MUSCLES].map((x) => <button key={x} className={"chip" + (m === x ? " on" : "")} onClick={() => setM(x)}>{x}</button>)}
      </div>
      <div className="chips">{["Todos", ...EQUIP].map((x) => <button key={x} className={"chip" + (eq === x ? " on" : "")} onClick={() => setEq(x)}>{x}</button>)}</div>
      <small className="sub">{shown.length} exercícios · Toque para ver as instruções</small>
      <div className="grid">
      {shown.map((e) => (
        <div className="card" key={e.id}>
          <div className="ex" onClick={() => setOpen(open === e.id ? null : e.id)}>
            <Gif src={e.gif} alt={e.name} />
            <div className="grow">
              <b>{e.name}</b>
              <div className="row"><span className="tag">{e.muscle}</span><span className="tag">{e.equip}</span><small>{e.sets}×{e.reps}</small></div>
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
            <label>Equipamento</label>
            <div className="chips wrap">{EQUIP.map((x) => <button key={x} className={"chip" + (modal.equip === x ? " on" : "")} onClick={() => setModal({ ...modal, equip: x })}>{x}</button>)}</div>
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
  const prog = progressions(history);
  return (
    <>
      <h1>Cada treino conta.</h1>
      <p className="sub">Um registro do trabalho que você fez.</p>
      <div className="card stats">
        <div><b>{history.length}</b><small>Treinos</small></div>
        <div><b>{totalSets}</b><small>Séries</small></div>
        <div><b>{prog.length}</b><small>Progressões</small></div>
        <div><b>{mins}m</b><small>Tempo</small></div>
      </div>
      <h3 className="mt">Progressão de carga e repetições</h3>
      {prog.length === 0 && <p className="sub">Registre carga e repetições nos treinos. Quando você aumentar, aparece aqui.</p>}
      <div className="grid">
        {prog.map((p, i) => (
          <div className="card ex" key={i} style={{ cursor: "default" }}>
            <div className="okbox"><Icon n="trend" s={20} /></div>
            <div className="grow">
              <b>{p.name}</b><br />
              <span className="lime">{p.type === "carga" ? `Carga: ${p.from} kg → ${p.to} kg (+${+(p.to - p.from).toFixed(2)} kg)` : `Repetições: ${p.from} → ${p.to} com ${p.kg} kg`}</span><br />
              <small>{new Date(p.date).toLocaleDateString("pt-BR")}</small>
            </div>
          </div>
        ))}
      </div>
      <h3 className="mt">Histórico de treinos</h3>
      {history.length === 0 && <p className="sub">Nenhum treino ainda. Bora começar!</p>}
      <div className="grid">
        {[...history].reverse().map((h, i) => (
          <div className="card ex" key={i} style={{ cursor: "default" }}>
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
function Live({ workout, history, onFinish, onCancel }) {
  const list = workout.list;
  const last = (id) => [...history].reverse().map((h) => (h.logs || []).find((l) => l.exId === id)).find(Boolean)?.sets || [];
  const [idx, setIdx] = useState(0);
  const [rows, setRows] = useState(() => list.map((e) => { const l = last(e.id); return Array.from({ length: e.sets }, (_, n) => { const p = l[n] || l[l.length - 1]; return { kg: p ? p.kg : "", reps: p ? p.reps : parseInt(e.reps) || "", done: false }; }); }));
  const [, tick] = useState(0);
  const t = useRef({ elapsed: 0, restLeft: 0, restTotal: 0, pending: null });
  useEffect(() => {
    const id = setInterval(() => {
      const r = t.current;
      r.elapsed++;
      if (r.restLeft > 0) { r.restLeft--; r.restTotal++; if (r.restLeft === 0 && r.pending != null) { setIdx(r.pending); r.pending = null; } }
      tick((n) => n + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const e = list[idx], r = t.current;
  const setRow = (n, patch) => setRows(rows.map((rs, i) => (i === idx ? rs.map((x, j) => (j === n ? { ...x, ...patch } : x)) : rs)));
  const toggle = (n) => {
    const was = rows[idx][n].done;
    setRow(n, { done: !was });
    r.restLeft = !was && n < e.sets - 1 ? e.rest : 0;
  };
  const skip = () => { r.restLeft = 0; if (r.pending != null) { setIdx(r.pending); r.pending = null; } tick((x) => x + 1); };
  const next = () => {
    if (e.rest > 0) { r.restLeft = e.rest; r.pending = idx + 1; tick((x) => x + 1); } else setIdx(idx + 1);
  };
  const go = (i) => { r.restLeft = 0; r.pending = null; setIdx(i); };
  const finish = () => {
    const logs = list.map((x, i) => ({ exId: x.id, name: x.name, sets: rows[i].filter((s) => s.done).map((s) => ({ kg: +s.kg || 0, reps: +s.reps || 0 })) })).filter((l) => l.sets.length);
    onFinish({ title: workout.name, date: new Date().toISOString(), sets: logs.reduce((a, l) => a + l.sets.length, 0), seconds: r.elapsed, logs });
  };

  return (
    <>
      <div className="row between">
        <div><h2 style={{ margin: 0 }}>Seu treino está ativo</h2><small>{workout.name}</small></div>
        <span className="tag lime"><span className="dot" /> Em andamento</span>
      </div>
      <div className="card stats">
        <div><b>{fmt(r.elapsed)}</b><small>Total</small></div>
        <div><b>{fmt(r.elapsed - r.restTotal)}</b><small>Ativo</small></div>
        <div><b>{fmt(r.restTotal)}</b><small>Descanso</small></div>
      </div>
      <div className="card">
        <small>Exercício {idx + 1} de {list.length}</small>
        <div className="center"><Gif src={e.gif} alt={e.name} size={240} /></div>
        <h2>{e.name}</h2>
        <small>{e.muscle} · {e.equip} · {e.sets} séries × {e.reps} reps · descanso de {e.rest}s</small>
        <p className="sub">{e.how}</p>
        <div className="setrow head"><span /><small>Carga (kg)</small><small>Reps</small><span /></div>
        {rows[idx].map((s, n) => (
          <div className={"setrow" + (s.done ? " on" : "")} key={n}>
            <b>{n + 1}</b>
            <input type="number" inputMode="decimal" placeholder="kg" value={s.kg} onChange={(ev) => setRow(n, { kg: ev.target.value })} />
            <input type="number" inputMode="numeric" placeholder="reps" value={s.reps} onChange={(ev) => setRow(n, { reps: ev.target.value })} />
            <button className={"setbtn" + (s.done ? " on" : "")} aria-label="Concluir série" onClick={() => toggle(n)}><Icon n="check" s={20} /></button>
          </div>
        ))}
        {r.restLeft > 0 && (
          <div className="restbox">
            <span className="ic"><Icon n="clock" s={16} /> {r.pending != null ? `Próximo: ${list[r.pending].name}` : "Descansando"}</span>
            <b className="lime">{fmt(r.restLeft)}</b>
            <button className="link" onClick={skip}>Pular descanso</button>
          </div>
        )}
      </div>
      <div className="row mt" style={{ flexWrap: "nowrap" }}>
        <button className="ghost" disabled={idx === 0} onClick={() => go(idx - 1)}><Icon n="left" s={16} /> Anterior</button>
        {idx < list.length - 1
          ? <button className="cta" style={{ flex: 1, width: "auto", margin: 0 }} disabled={r.pending != null} onClick={next}>Próximo <Icon n="right" s={16} /></button>
          : <button className="cta" style={{ flex: 1, width: "auto", margin: 0 }} onClick={finish}>Finalizar <Icon n="check" s={16} /></button>}
      </div>
      <button className="link" onClick={onCancel}>Cancelar treino</button>
    </>
  );
}

/* ============ PERFIL DO ALUNO ============ */
function Profile({ user, updateUser, onLogout }) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [pt, setPt] = useState(null);
  useEffect(() => {
    if (!user.personal_code) return setPt(null);
    supabase.rpc("find_personal", { c: user.personal_code }).then(({ data }) => setPt(data?.[0] || null));
  }, [user.personal_code]);
  const link = async () => {
    const { data } = await supabase.rpc("find_personal", { c: code });
    if (!data?.length) return setErr("Código não encontrado.");
    await updateUser({ personal_code: data[0].code }); setCode(""); setErr("");
  };
  return (
    <>
      <h1>Seu perfil.</h1>
      <div className="card"><b>{user.name}</b><br /><small>{user.email} · Aluno</small></div>
      <h3 className="mt">Meu personal</h3>
      {user.personal_code && pt ? (
        <div className="card ex" style={{ cursor: "default" }}>
          <div className="okbox"><Icon n="user" s={20} /></div>
          <div className="grow"><b>{pt.name}</b><br /><small>Código {pt.code}</small></div>
          <button className="ghost" style={{ flex: "none" }} onClick={() => updateUser({ personal_code: null })}>Desvincular</button>
        </div>
      ) : (
        <div className="card">
          <p className="sub">Digite o código que seu personal passou para ele acompanhar seus treinos.</p>
          <input placeholder="Ex.: PT-AB12CD" value={code} onChange={(e) => setCode(e.target.value)} />
          {err && <div className="err">{err}</div>}
          <button className="cta" onClick={link}>Vincular ao personal</button>
        </div>
      )}
      <button className="ghost" style={{ width: "100%", marginTop: 16 }} onClick={onLogout}><Icon n="logout" s={16} /> Sair</button>
    </>
  );
}

/* ============ ÁREA DO ALUNO ============ */
function Student({ user, updateUser, onLogout }) {
  const uid = user.id;
  const [tab, setTab] = useState("planner");
  const [exercises, setExercises, r1] = usePersist("ex2", (s) => (s ? [...s, ...LIB.filter((l) => !s.some((x) => x.id === l.id))] : LIB), uid);
  const [workouts, setWorkouts, r2] = usePersist("workouts", (s) => s ?? [{ id: "w1", name: "Peito & Tríceps", items: PLAN.map((id) => { const e = LIB.find((x) => x.id === id); return { exId: id, sets: e.sets, rest: e.rest }; }) }], uid);
  const [history, setHistory, r3] = usePersist("hist", (s) => s ?? [], uid);
  const [sched, setSched, r4] = usePersist("sched", (s) => s ?? [0, 2, 4], uid);
  const [start, , r5] = usePersist("start", (s) => s ?? dk(new Date()), uid);
  const [live, setLive] = useState(null);
  if (!(r1 && r2 && r3 && r4 && r5)) return <main><p className="sub">Carregando seus dados...</p></main>;
  const tabs = [["planner", "calendar", "Treinos"], ["exercises", "dumbbell", "Exercícios"], ["progress", "chart", "Progresso"], ["profile", "user", "Perfil"]];
  return (
    <>
      <main>
        {live ? <Live workout={live} history={history} onCancel={() => setLive(null)} onFinish={(h) => { setHistory([...history, h]); setLive(null); setTab("progress"); }} />
          : tab === "planner" ? <Planner exercises={exercises} workouts={workouts} setWorkouts={setWorkouts} onStart={setLive} history={history} sched={sched} setSched={setSched} start={start} />
          : tab === "exercises" ? <Exercises exercises={exercises} setExercises={setExercises} />
          : tab === "progress" ? <Progress history={history} />
          : <Profile user={user} updateUser={updateUser} onLogout={onLogout} />}
      </main>
      <Nav tabs={tabs} tab={live ? null : tab} onTab={(k) => { setLive(null); setTab(k); }} />
    </>
  );
}
const Nav = ({ tabs, tab, onTab }) => (
  <nav>{tabs.map(([k, i, l]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => onTab(k)}><Icon n={i} s={22} /><span>{l}</span></button>)}</nav>
);

/* ============ ÁREA DO PERSONAL ============ */
function Personal({ user, onLogout }) {
  const [tab, setTab] = useState("students");
  const [open, setOpen] = useState(null);
  const [copied, setCopied] = useState(false);
  const [students, setStudents] = useState([]);
  const [hists, setHists] = useState({});
  useEffect(() => {
    (async () => {
      const { data: st } = await supabase.from("profiles").select("*").eq("role", "aluno").eq("personal_code", user.code);
      setStudents(st || []);
      if (st?.length) {
        const { data: ud } = await supabase.from("user_data").select("user_id,value").eq("key", "hist").in("user_id", st.map((s) => s.id));
        setHists(Object.fromEntries((ud || []).map((r) => [r.user_id, r.value || []])));
      }
    })();
  }, [user.code, tab]);
  const copy = () => { try { navigator.clipboard.writeText(user.code); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {} };
  return (
    <>
      <main>
        {tab === "students" ? (
          <>
            <h1>Seus alunos.</h1>
            <p className="sub">{students.length} aluno(s) vinculado(s). Compartilhe seu código para adicionar mais.</p>
            {students.length === 0 && <div className="card"><p className="sub">Nenhum aluno ainda. Passe o código ou o QR da aba "Meu código".</p></div>}
            <div className="grid">
              {students.map((s) => {
                const hist = hists[s.id] || [];
                const lastH = hist[hist.length - 1];
                const prog = progressions(hist);
                const days = lastH ? Math.floor((Date.now() - new Date(lastH.date)) / 864e5) : null;
                return (
                  <div className="card" key={s.email}>
                    <div className="ex" onClick={() => setOpen(open === s.email ? null : s.email)}>
                      <div className="okbox"><Icon n="user" s={20} /></div>
                      <div className="grow"><b>{s.name}</b><br /><small>{s.email}</small></div>
                    </div>
                    <div className="row" style={{ marginTop: 10 }}>
                      <span className="tag lime">{hist.length} treinos</span>
                      <span className="tag">{prog.length} progressões</span>
                      <span className="tag">{lastH ? (days === 0 ? "Treinou hoje" : `Último treino há ${days}d`) : "Sem treinos"}</span>
                    </div>
                    {open === s.email && (
                      <div className="detail" style={{ textAlign: "left" }}>
                        <b>Progressões recentes</b>
                        {prog.slice(0, 4).map((p, i) => <p key={i}>{p.name}: <span className="lime">{p.type === "carga" ? `${p.from} → ${p.to} kg` : `${p.from} → ${p.to} reps (${p.kg} kg)`}</span></p>)}
                        {prog.length === 0 && <p>Nenhuma ainda.</p>}
                        <b>Últimos treinos</b>
                        {[...hist].reverse().slice(0, 5).map((h, i) => <p key={i}>{new Date(h.date).toLocaleDateString("pt-BR")} · {h.title} · {h.sets} séries · {fmt(h.seconds)}</p>)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <h1>Meu código.</h1>
            <p className="sub">O aluno digita o código no cadastro ou no perfil dele, ou lê o QR.</p>
            <div className="card center" style={{ flexDirection: "column", gap: 14 }}>
              <div className="qr"><QRCodeSVG value={user.code} size={200} /></div>
              <div className="code">{user.code}</div>
              <button className="ghost" style={{ flex: "none", width: "100%" }} onClick={copy}><Icon n={copied ? "check" : "copy"} s={16} /> {copied ? "Copiado" : "Copiar código"}</button>
            </div>
            <div className="card"><b>{user.name}</b><br /><small>{user.email} · Personal</small></div>
            <button className="ghost" style={{ width: "100%", marginTop: 8 }} onClick={onLogout}><Icon n="logout" s={16} /> Sair</button>
          </>
        )}
      </main>
      <Nav tabs={[["students", "user", "Alunos"], ["code", "dumbbell", "Meu código"]]} tab={tab} onTab={setTab} />
    </>
  );
}

/* ============ APP ============ */
export default function FormApp() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [light, setLight] = useState(false);
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) { setUser(null); setLoading(false); return; }
      setTimeout(async () => {
        const { data: p } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        setUser(p); setLoading(false);
      }, 0);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  const logout = () => supabase.auth.signOut();
  const updateUser = async (patch) => {
    const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
    if (!error) setUser({ ...user, ...patch });
  };
  return (
    <div className={"app" + (user ? " in" : "") + (light ? " light" : "")}>
      <style>{CSS}</style>
      {loading ? <div className="auth"><p className="sub">Carregando...</p></div> : !user ? <Auth /> : (
        <>
          <header>
            <div className="logo"><span className="lg"><Icon n="dumbbell" s={18} /></span> HYPERFORM.</div>
            <div className="row">
              <button className="ico" onClick={() => setLight(!light)} aria-label="Alternar tema"><Icon n={light ? "moon" : "sun"} /></button>
              <button className="ico" onClick={logout} aria-label="Sair"><Icon n="logout" /></button>
            </div>
          </header>
          {user.role === "personal" ? <Personal key={user.id} user={user} onLogout={logout} /> : <Student key={user.id} user={user} updateUser={updateUser} onLogout={logout} />}
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
.steps{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}
.stp{display:flex;align-items:center;justify-content:space-between;background:var(--bg);border:1px solid var(--line);border-radius:12px;margin-top:4px}
.stp span{display:flex;align-items:center;gap:2px;color:var(--mut);font-size:13px}
.stp input{width:52px;text-align:center;margin:0;padding:8px 0;border:0;background:transparent;font-weight:700}
.stp input::-webkit-inner-spin-button{-webkit-appearance:none}
.stp .ico{width:40px;height:44px}
.pickrow{padding:10px 0;border-bottom:1px solid var(--line)}
.restbox{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:14px;padding:6px 12px;background:var(--bg);border:1px solid var(--line);border-radius:12px}
.restbox b{font-size:22px}
.cal{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-top:8px}
.cell{aspect-ratio:1;min-height:36px;border-radius:10px;background:var(--bg);border:1px solid var(--line);color:var(--tx);cursor:pointer;font:inherit}
.cell.trained{background:var(--lime);color:#111;font-weight:700;border-color:var(--lime)}
.cell.missed{border-color:#ff6b6b;color:#ff6b6b}.cell.today{outline:2px solid var(--lime)}.cell.sel{box-shadow:0 0 0 2px var(--tx)}
.setrow{display:grid;grid-template-columns:22px 1fr 1fr 48px;gap:8px;align-items:center;margin:8px 0}
.setrow input{margin:0;text-align:center;padding:10px 4px}.setrow.on input{border-color:var(--lime)}.setrow.head{margin:12px 0 0}.setrow.head small{text-align:center}
.qr{background:#fff;padding:14px;border-radius:16px;line-height:0}.code{font-size:28px;font-weight:800;letter-spacing:2px;color:var(--lime)}
.seg{display:flex;gap:8px;margin-bottom:6px}.seg .chip{flex:1}
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
