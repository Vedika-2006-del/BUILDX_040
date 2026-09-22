// ---------- Tabs ----------
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.twist-tab').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.twist-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.twist-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  }));

  initSurgeTab();
  initBlackoutTab();
  initOverflowTab();
  initGoldenHourTab();
});

// ================= 1. EMERGENCY SURGE (mass casualty) =================
function patientRowHtml(n = '', a = '', t = 'URGENT') {
  return `<div class="patient-row">
    <input class="p-name" placeholder="Patient name" value="${n}">
    <input class="p-age" type="number" placeholder="Age" value="${a}">
    <select class="p-triage"><option ${t==='CRITICAL'?'selected':''}>CRITICAL</option><option ${t==='URGENT'?'selected':''}>URGENT</option><option ${t==='STABLE'?'selected':''}>STABLE</option></select>
    <button class="danger-btn" onclick="this.closest('.patient-row').remove()">✕</button>
  </div>`;
}
function initSurgeTab() {
  const rows = document.getElementById('patientRows');
  if (!rows) return;
  rows.insertAdjacentHTML('beforeend', patientRowHtml('Patient 1', '30', 'URGENT'));
  rows.insertAdjacentHTML('beforeend', patientRowHtml('Patient 2', '45', 'CRITICAL'));

  document.getElementById('addPatient').onclick = () => rows.insertAdjacentHTML('beforeend', patientRowHtml());
  document.getElementById('fillDemo').onclick = () => {
    rows.innerHTML = '';
    const demo = [['Rohan', 27, 'CRITICAL'], ['Aisha', 34, 'CRITICAL'], ['Vikram', 52, 'URGENT'], ['Sneha', 19, 'STABLE'], ['Imran', 41, 'URGENT'], ['Priya', 8, 'CRITICAL']];
    demo.forEach(([n, a, t]) => rows.insertAdjacentHTML('beforeend', patientRowHtml(n, a, t)));
  };

  document.getElementById('dispatchAll').onclick = async () => {
    const btn = document.getElementById('dispatchAll');
    const patients = [...rows.querySelectorAll('.patient-row')].map(r => ({
      patientName: r.querySelector('.p-name').value || 'Unnamed patient',
      age: Number(r.querySelector('.p-age').value || 0),
      triage: r.querySelector('.p-triage').value,
      resources: { icu: true, bloodGroup: 'O+', bloodUnits: 1 }
    }));
    if (!patients.length) { MediResQ.toast('Add at least one patient'); return; }
    try {
      btn.disabled = true; btn.textContent = 'Allocating…';
      const data = await MediResQ.api('/api/emergencies/bulk', {
        method: 'POST',
        body: JSON.stringify({ location: document.getElementById('incidentLocation').value, patients })
      });
      renderSurgeResults(data);
      MediResQ.toast(`${data.count} patients triaged & allocated • ${data.redirectedToOverflow} redirected to overflow capacity`);
      refreshGoldenHour();
    } catch (e) { MediResQ.toast(e.message); }
    finally { btn.disabled = false; btn.textContent = 'Dispatch & Allocate All →'; }
  };
}
function renderSurgeResults(data) {
  document.getElementById('surgeResults').classList.remove('hidden');
  document.getElementById('surgeSummary').innerHTML = `
   <div class="metric"><small>PATIENTS RECEIVED</small><b>${data.count}</b></div>
   <div class="metric"><small>CRITICAL</small><b class="red">${data.critical}</b></div>
   <div class="metric"><small>SENT TO HOSPITAL</small><b class="green">${data.count - data.redirectedToOverflow}</b></div>
   <div class="metric"><small>REDIRECTED (OVERFLOW)</small><b class="yellow">${data.redirectedToOverflow}</b></div>`;
  document.getElementById('surgeTableBody').innerHTML = data.emergencies.map(e => `
   <tr><td>${e.patientName}</td><td><span class="tri-badge tri-${e.triage}">${e.triage}</span></td><td>${e.ambulance}</td>
   <td>${e.destinationName || e.hospitalId}${e.destinationType==='hospital'?'':' (camp/partner)'}</td>
   <td>${e.overflow ? '<span class="yellow">Redirected</span>' : 'Direct'}</td></tr>`).join('');
}

// ================= 2. NETWORK BLACKOUT (offline-first) =================
const QUEUE_KEY = 'mr_offline_queue';
let simulatedOffline = false;
function isOffline() { return simulatedOffline || !navigator.onLine; }
function getQueue() { try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch { return []; } }
function setQueue(q) { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); }

function initBlackoutTab() {
  renderNetStatus();
  window.addEventListener('online', renderNetStatus);
  window.addEventListener('offline', renderNetStatus);

  document.getElementById('simBlackout').onclick = (e) => {
    simulatedOffline = !simulatedOffline;
    e.target.textContent = simulatedOffline ? 'Restore Network' : 'Simulate Blackout';
    renderNetStatus();
    MediResQ.toast(simulatedOffline ? 'Blackout simulated — requests now queue locally' : 'Network restored');
  };

  document.getElementById('ofSubmit').onclick = async () => {
    const payload = {
      patientName: document.getElementById('ofName').value || 'Unknown patient',
      age: Number(document.getElementById('ofAge').value || 0),
      bloodGroup: document.getElementById('ofBlood').value,
      location: document.getElementById('ofLocation').value,
      triage: 'URGENT',
      resources: {}
    };
    if (isOffline()) {
      const q = getQueue(); q.push({ ...payload, queuedAt: new Date().toISOString() }); setQueue(q);
      renderQueue();
      const sms = `MEDIRESQ EMERGENCY: ${payload.patientName}, age ${payload.age}, blood ${payload.bloodGroup}. Loc: ${payload.location}. Time: ${new Date().toLocaleTimeString()}`;
      const box = document.getElementById('smsPreview');
      box.classList.remove('hidden');
      box.textContent = sms;
      MediResQ.toast('No connection • saved locally, ready to SMS or sync');
    } else {
      try { await MediResQ.createEmergency(payload); MediResQ.toast('Emergency sent to backend'); }
      catch (err) { MediResQ.toast(err.message); }
    }
  };

  document.getElementById('syncQueue').onclick = async () => {
    const q = getQueue();
    if (!q.length) { MediResQ.toast('Queue is already empty'); return; }
    if (isOffline()) { MediResQ.toast('Still offline — restore the network first'); return; }
    try {
      await MediResQ.api('/api/emergencies/bulk', { method: 'POST', body: JSON.stringify({ patients: q }) });
      setQueue([]); renderQueue();
      MediResQ.toast(`Synced ${q.length} queued emergencies now that the network is back`);
    } catch (e) { MediResQ.toast(e.message); }
  };
  renderQueue();
}
function renderNetStatus() {
  const el = document.getElementById('netStatus');
  const txt = document.getElementById('netStatusText');
  if (!el) return;
  if (isOffline()) { el.classList.add('offline'); txt.textContent = 'OFFLINE — saving new emergencies to this device'; }
  else { el.classList.remove('offline'); txt.textContent = 'ONLINE — connected to Medi-ResQ backend'; }
}
function renderQueue() {
  const q = getQueue();
  document.getElementById('queueCount').textContent = q.length;
  document.getElementById('queueList').innerHTML = q.length ? q.map(p => `<div class="queue-item"><div><b>${p.patientName}</b><small>${p.location} • queued ${new Date(p.queuedAt).toLocaleTimeString()}</small></div><span class="tri-badge tri-${p.triage}">${p.triage}</span></div>`).join('') : '<p class="tiny">No pending cases — queue is empty.</p>';
}

// ================= 3. HOSPITAL OVERFLOW =================
function bedBar(available, total) {
  const pct = total ? Math.round((available / total) * 100) : 0;
  const cls = pct < 15 ? 'low' : pct < 40 ? 'mid' : '';
  return `<div class="bed-bar ${cls}"><i style="width:${pct}%"></i></div>`;
}
async function initOverflowTab() {
  document.getElementById('refreshCap').onclick = loadCapacity;
  await loadCapacity();
}
async function loadCapacity() {
  try {
    const [h, c] = await Promise.all([MediResQ.api('/api/hospitals'), MediResQ.api('/api/camps')]);
    document.getElementById('hospitalCapacity').innerHTML = h.hospitals.map(x => `
     <div class="capacity-card"><div class="cap-top"><span>${x.name}</span><span>${x.bedsAvailable}/${x.bedsTotal} beds</span></div>
     <small>ETA ${x.eta} min • ${x.bedsAvailable>0?'Accepting patients':'AT CAPACITY'}</small>${bedBar(x.bedsAvailable, x.bedsTotal)}</div>`).join('');
    document.getElementById('campCapacity').innerHTML = c.camps.map(x => `
     <div class="capacity-card"><div class="cap-top"><span>${x.name}</span><span>${x.bedsAvailable}/${x.bedsTotal} beds</span></div>
     <small>ETA ${x.eta} min • ${x.type==='partner'?'Partner hospital':'Temporary emergency camp'}</small>${bedBar(x.bedsAvailable, x.bedsTotal)}</div>`).join('');
  } catch (e) { MediResQ.toast(e.message); }
}

// ================= 4. GOLDEN HOUR =================
let goldenInterval = null;
async function initGoldenHourTab() {
  await refreshGoldenHour();
  await loadFleet();
}
async function refreshGoldenHour() {
  try {
    const data = await MediResQ.api('/api/emergencies');
    const latest = data.emergencies[0];
    if (goldenInterval) clearInterval(goldenInterval);
    if (!latest) return;
    document.getElementById('goldenCase').textContent = `${latest.patientName} • ${latest.triage} • created ${new Date(latest.createdAt).toLocaleTimeString()}`;
    tickGolden(latest.goldenHourDeadline);
    goldenInterval = setInterval(() => tickGolden(latest.goldenHourDeadline), 1000);
  } catch (e) { /* silent — page may load before any emergency exists */ }
}
function tickGolden(deadlineIso) {
  const box = document.getElementById('goldenTimer');
  const clock = document.getElementById('goldenClock');
  const remainingMs = new Date(deadlineIso).getTime() - Date.now();
  const mins = Math.max(0, Math.floor(remainingMs / 60000));
  const secs = Math.max(0, Math.floor((remainingMs % 60000) / 1000));
  clock.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  box.classList.remove('warn', 'danger');
  if (remainingMs <= 0) { clock.textContent = '00:00'; box.classList.add('danger'); }
  else if (remainingMs < 15 * 60000) box.classList.add('danger');
  else if (remainingMs < 30 * 60000) box.classList.add('warn');
}
async function loadFleet() {
  try {
    const data = await MediResQ.api('/api/ambulances');
    document.getElementById('ambulanceList').innerHTML = data.ambulances.map(a => `<div><span>🚑 ${a.id}</span><b class="${a.status==='available'?'green':'red'}">${a.status.toUpperCase()}</b></div>`).join('');
  } catch (e) { MediResQ.toast(e.message); }
}
