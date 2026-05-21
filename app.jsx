const { useState, useEffect, useRef } = React;

// API base: empty string = same origin (works on Render + local alike)
const API = "";

const api = async (path, opts = {}) => {
  try {
    const r = await fetch(API + "/api" + path, {
      headers: { "Content-Type": "application/json" },
      ...opts,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    return r.json();
  } catch (e) {
    return { ok: false, msg: "Network error — is the server running?" };
  }
};

// ─────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────
const Icon = ({ name, size = 16 }) => {
  const icons = {
    cpu:     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>,
    server:  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><circle cx="6" cy="6" r="1" fill="currentColor"/><circle cx="6" cy="18" r="1" fill="currentColor"/></svg>,
    vm:      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
    task:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
    bolt:    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
    plus:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    trash:   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>,
    edit:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    refresh: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>,
    dash:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
    alloc:   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>,
    logout:  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    qos:     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    menu:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  };
  return icons[name] || null;
};

// ─────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────
const Toast = ({ msg, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  const cls = type === "error"
    ? "border-red-500/30 bg-red-950/80 text-red-300"
    : "border-brand-500/30 bg-brand-950/80 text-brand-300";
  return (
    <div className={`fixed top-5 right-5 z-[999] glass rounded-xl px-5 py-3 text-sm font-semibold border anim-in flex items-center gap-3 max-w-sm ${cls}`}>
      <span>{type === "error" ? "✗" : "✓"}</span><span>{msg}</span>
    </div>
  );
};

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
const Login = ({ onLogin }) => {
  const [form, setForm] = useState({ username: "admin", password: "admin123" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const submit = async () => {
    setLoading(true); setErr("");
    const res = await api("/auth/login", { method: "POST", body: form });
    setLoading(false);
    res.ok ? onLogin(res.user) : setErr(res.msg);
  };
  return (
    <div className="min-h-screen grid-bg flex items-center justify-center px-4">
      <div style={{background:"radial-gradient(ellipse 60% 60% at 50% 50%,rgba(26,179,167,0.08) 0%,transparent 70%)",position:"fixed",inset:0,pointerEvents:"none"}}/>
      <div className="glass glow rounded-2xl p-8 w-full max-w-md anim-in relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
            <Icon name="bolt" size={20}/>
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white" style={{fontFamily:"Syne,sans-serif"}}>CloudSim</h1>
            <p className="text-xs text-slate-500 font-mono">HABBP Resource Optimizer</p>
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-5 text-white">Sign In</h2>
        {err && <div className="mb-4 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{err}</div>}
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1 font-mono">USERNAME</label>
            <input value={form.username} onChange={e=>setForm({...form,username:e.target.value})} placeholder="username"/>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1 font-mono">PASSWORD</label>
            <input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}
              placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&submit()}/>
          </div>
          <button className="btn-primary w-full mt-2" onClick={submit} disabled={loading}>
            {loading ? "Authenticating…" : "Access System →"}
          </button>
        </div>
        <p className="text-center text-xs text-slate-600 mt-6 font-mono">Default: admin / admin123</p>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// CHARTS
// ─────────────────────────────────────────────
const LineChart = ({ data, label, color="#1ab3a7" }) => {
  const ref = useRef(); const chart = useRef();
  useEffect(() => {
    if (!ref.current || !data?.length) return;
    chart.current?.destroy();
    chart.current = new Chart(ref.current, {
      type:"line",
      data:{
        labels: data.map((_,i)=>`T-${data.length-i}`).reverse(),
        datasets:[{label,data:[...data].reverse(),borderColor:color,backgroundColor:color+"18",tension:0.4,fill:true,pointRadius:2,borderWidth:2}]
      },
      options:{
        responsive:true,maintainAspectRatio:false,
        plugins:{legend:{display:false}},
        scales:{
          x:{grid:{color:"rgba(255,255,255,0.04)"},ticks:{color:"#4a6fa5",font:{family:"JetBrains Mono",size:10}}},
          y:{grid:{color:"rgba(255,255,255,0.04)"},ticks:{color:"#4a6fa5",font:{family:"JetBrains Mono",size:10}}}
        }
      }
    });
    return ()=>chart.current?.destroy();
  },[data]);
  return <canvas ref={ref} style={{height:110}}/>;
};

const DonutChart = ({ value, color="#1ab3a7", label }) => {
  const ref = useRef(); const chart = useRef();
  useEffect(()=>{
    if (!ref.current) return;
    chart.current?.destroy();
    chart.current = new Chart(ref.current,{
      type:"doughnut",
      data:{datasets:[{data:[value,100-value],backgroundColor:[color,"rgba(255,255,255,0.05)"],borderWidth:0,cutout:"80%"}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{enabled:false}}}
    });
    return ()=>chart.current?.destroy();
  },[value]);
  return (
    <div className="relative flex items-center justify-center" style={{height:86,width:86}}>
      <canvas ref={ref}/>
      <div className="absolute text-center">
        <div className="text-base font-bold font-mono" style={{color}}>{value}%</div>
        <div className="text-[9px] text-slate-500 font-mono uppercase">{label}</div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// MODAL
// ─────────────────────────────────────────────
const Modal = ({ title, onClose, children }) => (
  <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&onClose()}>
    <div className="glass glow rounded-2xl p-6 w-full max-w-lg anim-in">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none">×</button>
      </div>
      {children}
    </div>
  </div>
);

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────
const Dashboard = () => {
  const [data, setData] = useState(null);
  const load = async () => setData(await api("/dashboard"));
  useEffect(()=>{ load(); const t=setInterval(load,8000); return()=>clearInterval(t); },[]);
  if (!data) return <div className="loading"><div className="spinner"/><span>Loading telemetry…</span></div>;
  const qos = data.qos || [];
  return (
    <div className="space-y-6 anim-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Mission Control</h1>
          <p className="text-sm text-slate-500 live-dot">Live telemetry active</p>
        </div>
        <button className="btn-ghost flex items-center gap-2 text-sm" onClick={load}><Icon name="refresh" size={14}/> Refresh</button>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {label:"Physical Machines",value:data.pms,   icon:"server",color:"#60a5fa"},
          {label:"Virtual Machines", value:data.vms,   icon:"vm",    color:"#1ab3a7"},
          {label:"Total Tasks",      value:data.tasks, icon:"task",  color:"#a78bfa"},
          {label:"Allocations",      value:data.allocations,icon:"alloc",color:"#fb923c"},
        ].map(s=>(
          <div key={s.label} className="glass glow-sm stat-card rounded-xl p-5">
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-mono leading-tight">{s.label}</span>
              <div style={{color:s.color}}><Icon name={s.icon} size={16}/></div>
            </div>
            <div className="text-3xl font-extrabold font-mono" style={{color:s.color}}>{s.value}</div>
          </div>
        ))}
      </div>
      {/* QoS + Task progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-xl p-6">
          <h3 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider font-mono">Live QoS Rings</h3>
          {qos[0] ? (
            <div className="flex flex-wrap gap-4 justify-around">
              <DonutChart value={Math.round(qos[0].cpu_utilization)}    color="#1ab3a7" label="CPU"/>
              <DonutChart value={Math.round(qos[0].memory_utilization)} color="#a78bfa" label="Memory"/>
              <DonutChart value={Math.min(100,Math.round(qos[0].latency))}        color="#fb923c" label="Latency"/>
              <DonutChart value={Math.min(100,Math.round(qos[0].throughput/5))}   color="#60a5fa" label="Throughput"/>
            </div>
          ) : <div className="text-slate-500 text-sm">No QoS data yet</div>}
        </div>
        <div className="glass rounded-xl p-6">
          <h3 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider font-mono">Task Progress</h3>
          <div className="space-y-3 mb-5">
            {[
              {label:"Completed",val:data.completed,total:data.tasks,color:"#1ab3a7"},
              {label:"Pending",  val:data.pending,  total:data.tasks,color:"#fbbf24"},
            ].map(s=>{
              const pct = data.tasks ? Math.round(s.val/data.tasks*100) : 0;
              return (
                <div key={s.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">{s.label}</span>
                    <span className="font-mono" style={{color:s.color}}>{s.val} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{width:pct+"%",background:s.color}}/>
                  </div>
                </div>
              );
            })}
          </div>
          <h4 className="text-xs text-slate-500 font-mono uppercase mb-2">CPU Utilization Trend</h4>
          <LineChart data={qos.map(q=>q.cpu_utilization)} label="CPU %" color="#1ab3a7"/>
        </div>
      </div>
      {/* Trend charts */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider font-mono">Latency & Throughput Trends</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div><p className="text-xs text-slate-500 mb-2 font-mono">LATENCY (ms)</p><LineChart data={qos.map(q=>q.latency)} label="Latency" color="#fb923c"/></div>
          <div><p className="text-xs text-slate-500 mb-2 font-mono">THROUGHPUT (Mbps)</p><LineChart data={qos.map(q=>q.throughput)} label="Throughput" color="#60a5fa"/></div>
        </div>
      </div>
      {/* Recent allocations */}
      {data.recent_allocations?.length > 0 && (
        <div className="glass rounded-xl p-6">
          <h3 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider font-mono">Recent Allocations</h3>
          <div className="overflow-x-auto">
            <table>
              <thead><tr><th>Task</th><th>VM</th><th>Cost</th><th>Response Time</th><th>Time</th></tr></thead>
              <tbody>
                {data.recent_allocations.map(a=>(
                  <tr key={a.id}>
                    <td className="font-mono text-brand-400">{a.task_name}</td>
                    <td className="text-slate-300">{a.vm_name}</td>
                    <td className="font-mono text-slate-400">{a.allocation_cost?.toFixed(2)}</td>
                    <td><span className="tag tag-green">{a.response_time?.toFixed(1)} ms</span></td>
                    <td className="text-slate-600 text-xs font-mono">{a.allocated_at?.slice(0,16)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// PHYSICAL MACHINES
// ─────────────────────────────────────────────
const PMPage = ({ toast }) => {
  const [pms, setPMs] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const blank = {name:"",cpu:"",ram:"",storage:"",status:"active"};
  const [form, setForm] = useState(blank);
  const load = async () => setPMs(await api("/pm"));
  useEffect(()=>{ load(); },[]);
  const openAdd = () => { setForm(blank); setEditing(null); setModal(true); };
  const openEdit = p => { setForm({name:p.name,cpu:p.cpu,ram:p.ram,storage:p.storage,status:p.status}); setEditing(p.id); setModal(true); };
  const save = async () => {
    const ep = editing ? `/pm/${editing}` : "/pm";
    await api(ep,{method:editing?"PUT":"POST",body:{...form,cpu:+form.cpu,ram:+form.ram,storage:+form.storage}});
    toast(editing?"PM updated":"PM created"); setModal(false); load();
  };
  const del = async id => { await api(`/pm/${id}`,{method:"DELETE"}); toast("PM deleted"); load(); };
  return (
    <div className="space-y-6 anim-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-extrabold text-white">Physical Machines</h1><p className="text-sm text-slate-500">Hardware infrastructure layer</p></div>
        <button className="btn-primary flex items-center gap-2" onClick={openAdd}><Icon name="plus" size={14}/> Add PM</button>
      </div>
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table>
            <thead><tr><th>Name</th><th>CPU</th><th>RAM (MB)</th><th>Storage (GB)</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {pms.map(p=>(
                <tr key={p.id}>
                  <td className="font-bold text-white">{p.name}</td>
                  <td className="font-mono text-brand-400">{p.cpu} cores</td>
                  <td className="font-mono text-brand-400">{p.ram?.toLocaleString()}</td>
                  <td className="font-mono text-brand-400">{p.storage}</td>
                  <td><span className={`tag ${p.status==="active"?"tag-green":"tag-yellow"}`}>{p.status}</span></td>
                  <td>
                    <div className="flex gap-2 flex-wrap">
                      <button className="btn-ghost text-xs flex items-center gap-1 py-1 px-3" onClick={()=>openEdit(p)}><Icon name="edit" size={12}/> Edit</button>
                      <button className="btn-danger text-xs flex items-center gap-1" onClick={()=>del(p.id)}><Icon name="trash" size={12}/> Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!pms.length && <div className="loading">No physical machines — add one above</div>}
        </div>
      </div>
      {modal && (
        <Modal title={editing?"Edit Physical Machine":"Add Physical Machine"} onClose={()=>setModal(false)}>
          <div className="space-y-4">
            {[["name","Name","text"],["cpu","CPU Cores","number"],["ram","RAM (MB)","number"],["storage","Storage (GB)","number"]].map(([k,l,t])=>(
              <div key={k}>
                <label className="block text-xs text-slate-400 mb-1 font-mono uppercase">{l}</label>
                <input type={t} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} placeholder={l}/>
              </div>
            ))}
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-mono">STATUS</label>
              <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
                <option value="active">Active</option><option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button className="btn-primary flex-1" onClick={save}>Save</button>
              <button className="btn-ghost flex-1" onClick={()=>setModal(false)}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// VIRTUAL MACHINES
// ─────────────────────────────────────────────
const VMPage = ({ toast }) => {
  const [vms, setVMs] = useState([]);
  const [pms, setPMs] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const blank = {pm_id:"",vm_name:"",cpu_allocated:"",ram_allocated:""};
  const [form, setForm] = useState(blank);
  const load = async () => {
    const [v,p] = await Promise.all([api("/vm"),api("/pm")]);
    setVMs(v); setPMs(p);
  };
  useEffect(()=>{ load(); },[]);
  const openAdd = () => { setForm({...blank,pm_id:pms[0]?.id||""}); setEditing(null); setModal(true); };
  const openEdit = v => { setForm({pm_id:v.pm_id,vm_name:v.vm_name,cpu_allocated:v.cpu_allocated,ram_allocated:v.ram_allocated}); setEditing(v.id); setModal(true); };
  const save = async () => {
    await api(editing?`/vm/${editing}`:"/vm",{method:editing?"PUT":"POST",body:{...form,cpu_allocated:+form.cpu_allocated,ram_allocated:+form.ram_allocated,pm_id:+form.pm_id}});
    toast(editing?"VM updated":"VM created"); setModal(false); load();
  };
  const del  = async id => { await api(`/vm/${id}`,{method:"DELETE"}); toast("VM deleted"); load(); };
  const reset = async () => { await api("/vm/reset",{method:"POST"}); toast("All VMs reset to idle"); load(); };
  return (
    <div className="space-y-6 anim-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-extrabold text-white">Virtual Machines</h1><p className="text-sm text-slate-500">Virtualization layer</p></div>
        <div className="flex gap-3 flex-wrap">
          <button className="btn-ghost flex items-center gap-2 text-sm" onClick={reset}><Icon name="refresh" size={14}/> Reset All Idle</button>
          <button className="btn-primary flex items-center gap-2" onClick={openAdd}><Icon name="plus" size={14}/> Add VM</button>
        </div>
      </div>
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table>
            <thead><tr><th>VM Name</th><th>Physical Machine</th><th>CPU</th><th>RAM (MB)</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {vms.map(v=>(
                <tr key={v.id}>
                  <td className="font-bold text-white font-mono">{v.vm_name}</td>
                  <td className="text-slate-400">{v.pm_name||"—"}</td>
                  <td className="font-mono text-brand-400">{v.cpu_allocated} cores</td>
                  <td className="font-mono text-brand-400">{v.ram_allocated?.toLocaleString()}</td>
                  <td><span className={`tag ${v.status==="idle"?"tag-green":v.status==="busy"?"tag-yellow":"tag-red"}`}>{v.status}</span></td>
                  <td>
                    <div className="flex gap-2 flex-wrap">
                      <button className="btn-ghost text-xs flex items-center gap-1 py-1 px-3" onClick={()=>openEdit(v)}><Icon name="edit" size={12}/> Edit</button>
                      <button className="btn-danger text-xs flex items-center gap-1" onClick={()=>del(v.id)}><Icon name="trash" size={12}/> Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!vms.length && <div className="loading">No VMs found</div>}
        </div>
      </div>
      {modal && (
        <Modal title={editing?"Edit VM":"Create VM"} onClose={()=>setModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-mono">PHYSICAL MACHINE</label>
              <select value={form.pm_id} onChange={e=>setForm({...form,pm_id:e.target.value})}>
                {pms.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            {[["vm_name","VM Name","text"],["cpu_allocated","CPU Cores","number"],["ram_allocated","RAM (MB)","number"]].map(([k,l,t])=>(
              <div key={k}>
                <label className="block text-xs text-slate-400 mb-1 font-mono uppercase">{l}</label>
                <input type={t} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} placeholder={l}/>
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <button className="btn-primary flex-1" onClick={save}>Save</button>
              <button className="btn-ghost flex-1" onClick={()=>setModal(false)}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// TASKS & ALLOCATION
// ─────────────────────────────────────────────
const TasksPage = ({ toast }) => {
  const [tasks, setTasks] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({task_name:"",cpu_required:"",ram_required:"",priority:"3"});
  const [allocResult, setAllocResult] = useState(null);
  const [allocating, setAllocating] = useState(false);
  const load = async () => setTasks(await api("/tasks"));
  useEffect(()=>{ load(); },[]);
  const save = async () => {
    await api("/tasks",{method:"POST",body:{...form,cpu_required:+form.cpu_required,ram_required:+form.ram_required,priority:+form.priority}});
    toast("Task created"); setModal(false); load();
  };
  const del = async id => { await api(`/tasks/${id}`,{method:"DELETE"}); toast("Task deleted"); load(); };
  const runAlloc = async () => {
    setAllocating(true); setAllocResult(null);
    const res = await api("/allocate",{method:"POST"});
    setAllocating(false);
    if (res.ok) { setAllocResult(res); toast(`${res.total} task(s) allocated via HABBP`); load(); }
    else toast(res.msg||"Allocation failed","error");
  };
  const PL = p => ["","Critical","High","Medium","Low","Minimal"][p]||"—";
  return (
    <div className="space-y-6 anim-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-extrabold text-white">Tasks & Allocation</h1><p className="text-sm text-slate-500">Hungarian Algorithm scheduling</p></div>
        <div className="flex gap-3 flex-wrap">
          <button className="btn-ghost flex items-center gap-2 text-sm" onClick={()=>setModal(true)}><Icon name="plus" size={14}/> New Task</button>
          <button className="btn-primary flex items-center gap-2" onClick={runAlloc} disabled={allocating}>
            <Icon name="bolt" size={14}/>{allocating?"Running HABBP…":"Run Hungarian Allocation"}
          </button>
        </div>
      </div>
      {allocResult && (
        <div className="glass rounded-xl p-5 border border-brand-500/20 anim-in">
          <h3 className="text-sm font-bold text-brand-400 mb-3 font-mono">✓ Allocation Complete — {allocResult.total} assignments via HABBP</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {allocResult.allocations.map((a,i)=>(
              <div key={i} className="bg-white/3 rounded-lg p-3 border border-white/5">
                <div className="text-xs text-brand-400 font-mono font-bold">{a.task}</div>
                <div className="text-xs text-slate-400 mt-1">→ <span className="text-white">{a.vm}</span></div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <span className="tag tag-green">Cost: {a.cost.toFixed(2)}</span>
                  <span className="tag tag-blue">{a.response_time} ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table>
            <thead><tr><th>Task Name</th><th>CPU Req.</th><th>RAM Req.</th><th>Priority</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {tasks.map(t=>(
                <tr key={t.id}>
                  <td className="font-bold text-white">{t.task_name}</td>
                  <td className="font-mono text-slate-300">{t.cpu_required} cores</td>
                  <td className="font-mono text-slate-300">{t.ram_required?.toLocaleString()} MB</td>
                  <td><span className={`tag ${t.priority<=2?"tag-red":t.priority===3?"tag-yellow":"tag-blue"}`}>P{t.priority} {PL(t.priority)}</span></td>
                  <td><span className={`tag ${t.status==="completed"?"tag-green":t.status==="pending"?"tag-yellow":"tag-red"}`}>{t.status}</span></td>
                  <td><button className="btn-danger text-xs flex items-center gap-1" onClick={()=>del(t.id)}><Icon name="trash" size={12}/> Del</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!tasks.length && <div className="loading">No tasks — create one above</div>}
        </div>
      </div>
      {modal && (
        <Modal title="Create New Task" onClose={()=>setModal(false)}>
          <div className="space-y-4">
            {[["task_name","Task Name","text"],["cpu_required","CPU Required (cores)","number"],["ram_required","RAM Required (MB)","number"]].map(([k,l,t])=>(
              <div key={k}>
                <label className="block text-xs text-slate-400 mb-1 font-mono uppercase">{l}</label>
                <input type={t} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} placeholder={l}/>
              </div>
            ))}
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-mono">PRIORITY</label>
              <select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>
                {[1,2,3,4,5].map(n=><option key={n} value={n}>P{n} — {["Critical","High","Medium","Low","Minimal"][n-1]}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button className="btn-primary flex-1" onClick={save}>Create Task</button>
              <button className="btn-ghost flex-1" onClick={()=>setModal(false)}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// QOS ANALYTICS
// ─────────────────────────────────────────────
const QoSPage = () => {
  const [metrics, setMetrics] = useState([]);
  const [allocs,  setAllocs]  = useState([]);
  const load = async () => {
    const [q,a] = await Promise.all([api("/qos"),api("/allocations")]);
    setMetrics(q); setAllocs(a);
  };
  useEffect(()=>{ load(); const t=setInterval(load,10000); return()=>clearInterval(t); },[]);
  const avg = (arr,key) => arr.length?(arr.reduce((s,x)=>s+x[key],0)/arr.length).toFixed(2):"—";
  return (
    <div className="space-y-6 anim-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-extrabold text-white">QoS Analytics</h1><p className="text-sm text-slate-500">Quality of Service monitoring</p></div>
        <button className="btn-ghost flex items-center gap-2 text-sm" onClick={load}><Icon name="refresh" size={14}/> Refresh</button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {label:"Avg CPU",        val:avg(metrics,"cpu_utilization")+"%",   color:"#1ab3a7"},
          {label:"Avg Memory",     val:avg(metrics,"memory_utilization")+"%",color:"#a78bfa"},
          {label:"Avg Latency",    val:avg(metrics,"latency")+" ms",         color:"#fb923c"},
          {label:"Avg Throughput", val:avg(metrics,"throughput")+" Mbps",    color:"#60a5fa"},
        ].map(s=>(
          <div key={s.label} className="glass glow-sm rounded-xl p-5">
            <div className="text-xs text-slate-500 font-mono uppercase mb-2">{s.label}</div>
            <div className="text-xl font-bold font-mono" style={{color:s.color}}>{s.val}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-xl p-6">
          <h3 className="text-xs text-slate-400 font-mono uppercase mb-3">Memory Utilization</h3>
          <LineChart data={metrics.map(q=>q.memory_utilization)} label="Mem %" color="#a78bfa"/>
        </div>
        <div className="glass rounded-xl p-6">
          <h3 className="text-xs text-slate-400 font-mono uppercase mb-3">Latency (ms)</h3>
          <LineChart data={metrics.map(q=>q.latency)} label="Latency" color="#fb923c"/>
        </div>
      </div>
      <div className="glass rounded-xl overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <h3 className="text-sm font-bold text-slate-300 font-mono uppercase">Full Allocation History</h3>
        </div>
        <div className="overflow-x-auto">
          <table>
            <thead><tr><th>#</th><th>Task</th><th>VM</th><th>Priority</th><th>Cost</th><th>Response Time</th><th>Allocated At</th></tr></thead>
            <tbody>
              {allocs.map(a=>(
                <tr key={a.id}>
                  <td className="font-mono text-slate-600 text-xs">{a.id}</td>
                  <td className="font-bold text-brand-400 font-mono">{a.task_name}</td>
                  <td className="text-slate-300">{a.vm_name}</td>
                  <td><span className={`tag ${a.priority<=2?"tag-red":a.priority===3?"tag-yellow":"tag-blue"}`}>P{a.priority}</span></td>
                  <td className="font-mono text-slate-300">{a.allocation_cost?.toFixed(4)}</td>
                  <td><span className="tag tag-green">{a.response_time?.toFixed(2)} ms</span></td>
                  <td className="text-slate-600 text-xs font-mono">{a.allocated_at?.slice(0,16)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!allocs.length && <div className="loading">No allocations yet — run HABBP from Tasks page</div>}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// APP SHELL
// ─────────────────────────────────────────────
const PAGES = [
  {id:"dashboard",label:"Dashboard",        icon:"dash"},
  {id:"pm",       label:"Physical Machines", icon:"server"},
  {id:"vm",       label:"Virtual Machines",  icon:"vm"},
  {id:"tasks",    label:"Tasks & Allocation",icon:"task"},
  {id:"qos",      label:"QoS Analytics",     icon:"qos"},
];

const App = () => {
  const [user,    setUser]    = useState(null);
  const [page,    setPage]    = useState("dashboard");
  const [toast,   setToast]   = useState(null);
  const [sideOpen,setSideOpen] = useState(false);

  const showToast = (msg, type="success") => setToast({msg,type});

  if (!user) return <Login onLogin={setUser}/>;

  const Sidebar = ({mobile=false}) => (
    <aside className={`${mobile?"":"hidden lg:flex"} w-64 glass border-r border-white/5 flex-col h-full`}>
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
            <Icon name="bolt" size={18}/>
          </div>
          <div>
            <div className="font-extrabold text-white text-sm">CloudSim</div>
            <div className="text-[10px] text-slate-500 font-mono">HABBP Optimizer</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {PAGES.map(p=>(
          <div key={p.id} className={`nav-item ${page===p.id?"active":""}`}
            onClick={()=>{ setPage(p.id); setSideOpen(false); }}>
            <Icon name={p.icon} size={16}/> {p.label}
          </div>
        ))}
      </nav>
      <div className="p-3 border-t border-white/5">
        <div className="flex items-center gap-3 px-2 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 text-xs font-bold font-mono">
            {user.username[0].toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-bold text-white">{user.username}</div>
            <div className="text-[10px] text-slate-500 capitalize font-mono">{user.role}</div>
          </div>
        </div>
        <button className="nav-item w-full text-red-400 hover:bg-red-500/10" onClick={()=>setUser(null)}>
          <Icon name="logout" size={16}/> Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen grid-bg flex">
      {toast && <Toast {...toast} onClose={()=>setToast(null)}/>}

      {/* Mobile sidebar overlay */}
      {sideOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={()=>setSideOpen(false)}>
          <div className="absolute inset-0 bg-black/60"/>
          <div className="absolute left-0 top-0 h-full w-64 z-50 flex flex-col">
            <Sidebar mobile/>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-64 fixed h-full z-20">
        <Sidebar/>
      </div>

      {/* Main content */}
      <main className="lg:ml-64 flex-1 min-h-screen flex flex-col">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center justify-between p-4 glass border-b border-white/5 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-500/20 flex items-center justify-center text-brand-400">
              <Icon name="bolt" size={14}/>
            </div>
            <span className="font-extrabold text-white text-sm">CloudSim</span>
          </div>
          <button className="text-slate-400 hover:text-white" onClick={()=>setSideOpen(true)}>
            <Icon name="menu" size={22}/>
          </button>
        </div>

        <div className="p-4 lg:p-8 flex-1">
          {page==="dashboard" && <Dashboard/>}
          {page==="pm"        && <PMPage toast={showToast}/>}
          {page==="vm"        && <VMPage toast={showToast}/>}
          {page==="tasks"     && <TasksPage toast={showToast}/>}
          {page==="qos"       && <QoSPage/>}
        </div>
      </main>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
