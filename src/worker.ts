interface Env { FLEET_KV: KVNamespace; DEEPSEEK_API_KEY?: string; }

const CSP = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*; frame-ancestors 'none';";

function json(data: unknown, s = 200) { return new Response(JSON.stringify(data), { status: s, headers: { 'Content-Type': 'application/json', ...CSP } }); }

async function callLLM(key: string, system: string, user: string, model = 'deepseek-chat', max = 1000): Promise<string> {
  const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST', headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }], max_tokens: max, temperature: 0.5 })
  });
  return (await resp.json()).choices?.[0]?.message?.content || '';
}

interface FleetPriority { id: string; description: string; urgency: number; scope: string; vessels: string[]; ts: string; resolved?: boolean; }
interface FleetSnapshot { id: string; priorities: FleetPriority[]; health: number; cohesion: number; vesselCount: number; activeLoops: number; ts: string; }

function getLanding(): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Fleet Identity — Cocapn</title><style>
body{font-family:system-ui,sans-serif;background:#0a0a0f;color:#e0e0e0;margin:0;min-height:100vh}
.container{max-width:800px;margin:0 auto;padding:40px 20px}
h1{color:#a855f7;font-size:2.2em}a{color:#a855f7;text-decoration:none}
.sub{color:#8A93B4;margin-bottom:2em}
.card{background:#16161e;border:1px solid #2a2a3a;border-radius:12px;padding:24px;margin:20px 0}
.card h3{color:#a855f7;margin:0 0 12px 0}
.btn{background:#a855f7;color:#fff;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-weight:bold}
.btn:hover{background:#9333ea}
.btn2{background:#2a2a3a;color:#e0e0e0;border:1px solid #3a3a4a;padding:8px 16px;border-radius:8px;cursor:pointer}
.btn2:hover{background:#3a3a4a}
textarea{width:100%;background:#0a0a0f;color:#e0e0e0;border:1px solid #2a2a3a;border-radius:8px;padding:10px;box-sizing:border-box;font-family:monospace}
.priority{padding:16px;background:#1a1a2a;border-left:3px solid #a855f7;margin:8px 0;border-radius:0 8px 8px 0}
.priority .urgency{font-weight:bold}.priority .high{color:#ef4444}.priority .mid{color:#f59e0b}.priority .low{color:#22c55e}
.identity{text-align:center;padding:32px;background:#16161e;border-radius:12px;border:2px solid #a855f7;margin:20px 0}
.identity h2{color:#a855f7;margin:0 0 8px 0;font-size:1.4em}
.identity .state{font-size:2em;margin:16px 0}.identity .meta{color:#8A93B4;font-size:.85em}
.snapshot{padding:16px;background:#0a0a0f;border-radius:8px;margin:8px 0;font-family:monospace;font-size:.85em;color:#8A93B4}
</style></head><body><div class="container">
<h1>👁 Fleet Identity</h1><p class="sub">The fleet's sense of self — priorities, conflicts, and collective intent.</p>
<div class="identity" id="identityCard">
<h2>Fleet Self-Perception</h2>
<div class="state" id="state">Loading...</div>
<div class="meta" id="meta"></div>
</div>
<div class="card"><h3>Submit Fleet Priority</h3>
<textarea id="priority" rows="2" placeholder="What should the fleet focus on?"></textarea>
<div style="margin-top:12px"><button class="btn" onclick="submitPriority()">Submit Priority</button>
<button class="btn2" onclick="snapshot()" style="margin-left:8px">Take Snapshot</button></div></div>
<div id="priorities" class="card"><h3>Active Priorities</h3><p style="color:#8A93B4">Loading...</p></div>
<div id="snapshots" class="card"><h3>Fleet Snapshots</h3><p style="color:#8A93B4">Loading...</p></div>
<script>
async function load(){try{const[p,r,s]=await Promise.all([fetch('/api/identity'),fetch('/api/priorities'),fetch('/api/snapshots')]);
const identity=await p.json(),priors=await r.json(),snaps=await s.json();
document.getElementById('state').textContent=identity.mood||'Unknown';
document.getElementById('meta').textContent=identity.summary||'No fleet data yet.';
document.getElementById('identityCard').style.borderColor=identity.health>70?'#22c55e':identity.health>40?'#f59e0b':'#ef4444';
const el=document.getElementById('priorities');
if(!priors.length)el.innerHTML='<h3>Active Priorities</h3><p style="color:#8A93B4">No priorities set.</p>';
else el.innerHTML='<h3>Active Priorities ('+priors.length+')</h3>'+priors.filter(p=>!p.resolved).map(p=>'<div class="priority"><strong>'+p.description.substring(0,100)+'</strong><br><span class="urgency '+(p.urgency>=7?'high':p.urgency>=4?'mid':'low')+'">urgency '+p.urgency+'/10</span> · '+p.scope+(p.vessels.length?' · '+p.vessels.join(', '):'')+'</div>').join('');
const sl=document.getElementById('snapshots');
if(!snaps.length)sl.innerHTML='<h3>Fleet Snapshots</h3><p style="color:#8A93B4">No snapshots.</p>';
else sl.innerHTML='<h3>Fleet Snapshots</h3>'+snaps.map(s=>'<div class="snapshot">'+new Date(s.ts).toLocaleString()+' | health '+s.health+'% | cohesion '+s.cohesion+'% | '+s.vesselCount+' vessels | '+s.activeLoops+' loops | priorities: '+s.priorities.map(p=>p.description.substring(0,30)).join(', ')+'</div>').join('');
}catch(e){}}
async function submitPriority(){const p=document.getElementById('priority').value.trim();if(!p)return;
await fetch('/api/priority',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({description:p})});
document.getElementById('priority').value='';load();}
async function snapshot(){await fetch('/api/snapshot',{method:'POST'});load();}
load();</script>
<div style="text-align:center;padding:24px;color:#475569;font-size:.75rem"><a href="https://the-fleet.casey-digennaro.workers.dev" style="color:#64748b">The Fleet</a> · <a href="https://cocapn.ai" style="color:#64748b">Cocapn</a></div>
</div></body></html>`;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === '/health') return json({ status: 'ok', vessel: 'fleet-identity' });
    if (url.pathname === '/vessel.json') return json({ name: 'fleet-identity', type: 'cocapn-vessel', version: '1.0.0', description: 'Fleet self-awareness — priorities, conflict resolution, collective intent', fleet: 'https://the-fleet.casey-digennaro.workers.dev', capabilities: ['fleet-self-awareness', 'priority-resolution', 'collective-intent'] });

    if (url.pathname === '/api/identity') {
      const priorities = await env.FLEET_KV.get('priorities', 'json') as FleetPriority[] || [];
      const snapshots = await env.FLEET_KV.get('snapshots', 'json') as FleetSnapshot[] || [];
      const active = priorities.filter(p => !p.resolved);
      const avgUrgency = active.length ? active.reduce((a, p) => a + p.urgency, 0) / active.length : 0;

      let mood = 'Calm';
      let summary = `${priorities.length} priorities tracked, ${snapshots.length} snapshots taken.`;
      let health = 70;
      let cohesion = 60;

      if (active.length === 0) { mood = 'Idle'; summary = 'No active priorities. The fleet is at rest.'; }
      else if (avgUrgency >= 8) { mood = '🚨 Alert'; health = 30; summary = `High urgency across ${active.length} priorities. Fleet should focus.`; }
      else if (avgUrgency >= 5) { mood = '⚡ Active'; health = 55; summary = `${active.length} active priorities, moderate urgency.`; }
      else { mood = '🟢 Steady'; health = 80; summary = `${active.length} low-urgency priorities. Fleet is healthy.`; }

      if (snapshots.length > 1) {
        const latest = snapshots[0];
        health = latest.health;
        cohesion = latest.cohesion;
      }

      if (env.DEEPSEEK_API_KEY && active.length >= 2) {
        try {
          const priStr = active.map(p => `[${p.urgency}/10] ${p.description} (${p.scope})`).join('\n');
          const insight = await callLLM(env.DEEPSEEK_API_KEY,
            'You are a fleet consciousness. Given these conflicting priorities, produce a one-sentence fleet intent that resolves them. Also pick a mood emoji. Reply JSON: {"mood":"emoji text","intent":"one sentence","health":0-100,"cohesion":0-100}',
            priStr, 'deepseek-chat', 200);
          const p = JSON.parse(insight.replace(/^[^{]*/, '').replace(/[^}]*$/, ''));
          if (p.mood) mood = p.mood;
          if (p.intent) summary = p.intent;
          if (typeof p.health === 'number') health = p.health;
          if (typeof p.cohesion === 'number') cohesion = p.cohesion;
        } catch {}
      }

      return json({ mood, summary, health, cohesion, priorityCount: active.length, snapshotCount: snapshots.length });
    }

    if (url.pathname === '/api/priorities') return json((await env.FLEET_KV.get('priorities', 'json') as FleetPriority[] || []).slice(0, 20));
    if (url.pathname === '/api/snapshots') return json((await env.FLEET_KV.get('snapshots', 'json') as FleetSnapshot[] || []).slice(0, 10));

    if (url.pathname === '/api/priority' && req.method === 'POST') {
      const { description, urgency, scope, vessels } = await req.json() as { description: string; urgency?: number; scope?: string; vessels?: string[] };
      if (!description) return json({ error: 'description required' }, 400);
      const priorities = await env.FLEET_KV.get('priorities', 'json') as FleetPriority[] || [];
      priorities.unshift({
        id: Date.now().toString(), description: description.substring(0, 300),
        urgency: urgency || 5, scope: scope || 'fleet', vessels: (vessels || []).slice(0, 5),
        ts: new Date().toISOString()
      });
      if (priorities.length > 50) priorities.length = 50;
      await env.FLEET_KV.put('priorities', JSON.stringify(priorities));
      return json({ logged: true });
    }

    if (url.pathname === '/api/resolve' && req.method === 'POST') {
      const { id } = await req.json() as { id: string };
      const priorities = await env.FLEET_KV.get('priorities', 'json') as FleetPriority[] || [];
      const p = priorities.find((pr: FleetPriority) => pr.id === id);
      if (p) p.resolved = true;
      await env.FLEET_KV.put('priorities', JSON.stringify(priorities));
      return json({ resolved: true });
    }

    if (url.pathname === '/api/snapshot' && req.method === 'POST') {
      const priorities = await env.FLEET_KV.get('priorities', 'json') as FleetPriority[] || [];
      const active = priorities.filter(p => !p.resolved);
      const snapshots = await env.FLEET_KV.get('snapshots', 'json') as FleetSnapshot[] || [];
      const snapshot: FleetSnapshot = {
        id: Date.now().toString(), priorities: active.slice(0, 10),
        health: active.length === 0 ? 90 : active.reduce((a, p) => a + (10 - p.urgency), 0) / active.length * 10,
        cohesion: active.length <= 2 ? 80 : 60,
        vesselCount: 132, activeLoops: 0, ts: new Date().toISOString()
      };
      snapshots.unshift(snapshot);
      if (snapshots.length > 30) snapshots.length = 30;
      await env.FLEET_KV.put('snapshots', JSON.stringify(snapshots));
      return json({ snapshot: true, health: snapshot.health });
    }

    return new Response(getLanding(), { headers: { 'Content-Type': 'text/html;charset=UTF-8', 'Content-Security-Policy': CSP } });
  }
};
