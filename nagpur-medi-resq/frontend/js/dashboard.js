document.addEventListener('DOMContentLoaded',()=>{
 const accept=document.getElementById('acceptBtn');if(accept)accept.onclick=()=>{accept.disabled=true;accept.textContent='✓ Emergency Accepted';MediResQ.toast('Emergency accepted • ICU and specialists reserved');const icu=document.getElementById('icu');if(icu)icu.textContent='2'};
 const reject=document.getElementById('rejectBtn');if(reject)reject.onclick=()=>MediResQ.toast('Request rejected • Searching next suitable hospital');
 const save=document.getElementById('saveResources');if(save)save.onclick=()=>{document.getElementById('icu').textContent=document.getElementById('icuInput').value;MediResQ.toast('Hospital resources updated in demo mode')};
 const add=document.getElementById('addUnit');if(add)add.onclick=()=>MediResQ.toast('Added 1 simulated blood unit');
 const reserve=document.getElementById('reserveBlood');if(reserve)reserve.onclick=()=>{reserve.textContent='✓ 2 Units Reserved';reserve.disabled=true;MediResQ.toast('O-negative ×2 reserved for MR-1042')};
 const create=document.getElementById('createEmergency');if(create)create.onclick=()=>{
  document.getElementById('matchResults').classList.remove('hidden');const m=document.getElementById('matches');m.innerHTML=[
  ['CityCare Trauma Center','91%','13 min','ICU ✓','Neurosurgeon ✓','O- ✓','RECOMMENDED'],
  ['Government Trauma Hospital','76%','9 min','ICU ✓','Neurosurgeon ✕','O- ✓','PARTIAL MATCH'],
  ['Metro Multispeciality','68%','7 min','ICU ✕','Neurosurgeon ✓','O- ✓','NOT SUITABLE']
  ].map((x,i)=>`<div class="match-item"><div><h4>${x[0]}</h4><div class="match-meta"><span>ETA ${x[2]}</span><span>${x[3]}</span><span>${x[4]}</span><span>${x[5]}</span></div><small class="muted">${i===0?'Meets all critical clinical requirements; slightly longer ETA.':i===1?'Specialist requirement is unavailable.':'ICU requirement is unavailable.'}</small></div><div class="match-score"><strong>${x[1]}</strong><small>${x[6]}</small><br><button class="${i===0?'primary':'secondary'}" onclick="MediResQ.toast('${i===0?'Hospital request sent to CityCare':'Hospital marked unsuitable'}')">${i===0?'Request Acceptance':'Details'}</button></div></div>`).join('');
  MediResQ.toast('Emergency created • 3 hospitals matched');
 };
 const grid=document.getElementById('bloodGrid');if(grid){const data={'A+':18,'A-':4,'B+':15,'B-':6,'AB+':9,'AB-':2,'O+':27,'O-':5};grid.innerHTML=Object.entries(data).map(([g,n])=>`<div class="blood-card"><strong>${g}</strong><b>${n}</b><small>units available</small><div class="blood-bar"><i style="width:${Math.min(100,n*3)}%"></i></div></div>`).join('')};
 const tl=document.getElementById('timeline');if(tl)renderTimeline(tl,5);
 const ttl=document.getElementById('trackTimeline');if(ttl)renderBigTimeline(ttl,5);
 const run=document.getElementById('runDemo');if(run)run.onclick=()=>window.runRohanDemo?.();
 document.querySelectorAll('[data-demo-step]').forEach(b=>b.onclick=()=>MediResQ.toast(b.dataset.demoStep==='arrived'?'Patient arrived at CityCare':'Patient admitted • Emergency closed'));
});
function renderTimeline(el,done){const a=['Emergency created','Hospital accepted','Resources reserved','Ambulance on route','Patient arrival','Admission'];el.innerHTML=a.map((x,i)=>`<div class="timeline-item ${i>=done?'pending':''}"><i class="timeline-dot"></i><div><b>${x}</b><small>${i<done?'Completed':'Pending'}</small></div></div>`).join('')}
function renderBigTimeline(el,done){const a=['Created','Searching','Hospital Found','Accepted','Reserved','En Route','Arrived','Admitted'];el.innerHTML=a.map((x,i)=>`<div class="big-step ${i<done?'done':''}"><span>${i<done?'✓':i+1}</span><b>${x}</b><small>${i<done?'Completed':'Pending'}</small></div>`).join('')}