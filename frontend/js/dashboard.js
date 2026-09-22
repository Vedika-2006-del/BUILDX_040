document.addEventListener('DOMContentLoaded',()=>{
 const accept=document.getElementById('acceptBtn');if(accept)accept.onclick=()=>{accept.disabled=true;accept.textContent='✓ Emergency Accepted';MediResQ.toast('Emergency accepted • ICU and specialists reserved');const icu=document.getElementById('icu');if(icu)icu.textContent='2'};
 const reject=document.getElementById('rejectBtn');if(reject)reject.onclick=()=>MediResQ.toast('Request rejected • Searching next suitable hospital');
 const save=document.getElementById('saveResources');if(save)save.onclick=async()=>{try{const icu=Number(document.getElementById('icuInput').value);const d=await MediResQ.api('/api/hospital/resources',{method:'PATCH',body:JSON.stringify({hospitalId:'h1',icu})});document.getElementById('icu').textContent=d.hospital.icu;MediResQ.toast('Hospital resources saved to backend')}catch(e){MediResQ.toast(e.message)}};
 const add=document.getElementById('addUnit');if(add)add.onclick=()=>MediResQ.toast('Added 1 simulated blood unit');
 const reserve=document.getElementById('reserveBlood');if(reserve)reserve.onclick=async()=>{try{await MediResQ.api('/api/blood/reserve',{method:'POST',body:JSON.stringify({group:'O-',units:2})});reserve.textContent='✓ 2 Units Reserved';reserve.disabled=true;MediResQ.toast('O-negative ×2 reserved and saved')}catch(e){MediResQ.toast(e.message)}};
 const create=document.getElementById('createEmergency');if(create)create.onclick=async()=>{
  try{
   create.disabled=true;
   const checks=[...document.querySelectorAll('.check-grid input[type=checkbox]')].map(x=>x.parentElement.textContent.trim());
   const data=await MediResQ.createEmergency({
    patientName:document.getElementById('patientName')?.value||'Rohan',
    age:Number(document.getElementById('patientAge')?.value||27),
    gender:document.querySelector('select:not(#bloodGroup)')?.value||'Male',
    bloodGroup:document.getElementById('bloodGroup')?.value||'O-',
    location:document.getElementById('location')?.value||'Wardha Road, near Khapri, Nagpur',
    description:document.getElementById('description')?.value||'',
    resources:{icu:checks.some(x=>x.startsWith('ICU')),neurosurgeon:checks.some(x=>x.startsWith('Neurosurgeon')),orthopedic:checks.some(x=>x.startsWith('Orthopedic')),generalSurgeon:checks.some(x=>x.startsWith('General Surgeon')),or:checks.some(x=>x.startsWith('Operation Room')),bloodGroup:document.getElementById('bloodGroup')?.value||'O-',bloodUnits:2}
   });
   document.getElementById('matchResults').classList.remove('hidden');
   const m=document.getElementById('matches');
   m.innerHTML=data.matches.map((x,i)=>`<div class="match-item"><div><h4>${x.name}</h4><div class="match-meta"><span>ETA ${x.eta} min</span><span>${x.icu>0?'ICU ✓':'ICU ✕'}</span><span>${x.neurosurgeon?'Neurosurgeon ✓':'Neurosurgeon ✕'}</span><span>${x.blood?.[data.emergency.bloodGroup]>=2?data.emergency.bloodGroup+' ✓':data.emergency.bloodGroup+' ✕'}</span></div><small class="muted">${x.possible?'Meets the required resources.':x.reasons.join(' • ')}</small></div><div class="match-score"><strong>${x.matchScore}%</strong><small>${x.possible?(i===0?'RECOMMENDED':'MATCH'):'NOT SUITABLE'}</small><br><button class="${x.possible?'primary':'secondary'}" onclick="MediResQ.toast('${x.possible?'Hospital request sent to '+x.name:'Hospital marked unsuitable'}')">${x.possible?'Request Acceptance':'Details'}</button></div></div>`).join('');
   MediResQ.toast('Emergency saved • hospital matching completed by backend');
  }catch(e){MediResQ.toast(e.message)}finally{create.disabled=false}
 };
 const grid=document.getElementById('bloodGrid');if(grid){const data={'A+':18,'A-':4,'B+':15,'B-':6,'AB+':9,'AB-':2,'O+':27,'O-':5};grid.innerHTML=Object.entries(data).map(([g,n])=>`<div class="blood-card"><strong>${g}</strong><b>${n}</b><small>units available</small><div class="blood-bar"><i style="width:${Math.min(100,n*3)}%"></i></div></div>`).join('')};
 const tl=document.getElementById('timeline');if(tl)renderTimeline(tl,5);
 const ttl=document.getElementById('trackTimeline');if(ttl)renderBigTimeline(ttl,5);
 const run=document.getElementById('runDemo');if(run)run.onclick=()=>window.runRohanDemo?.();
 document.querySelectorAll('[data-demo-step]').forEach(b=>b.onclick=()=>MediResQ.toast(b.dataset.demoStep==='arrived'?'Patient arrived at CityCare':'Patient admitted • Emergency closed'));
});
function renderTimeline(el,done){const a=['Emergency created','Hospital accepted','Resources reserved','Ambulance on route','Patient arrival','Admission'];el.innerHTML=a.map((x,i)=>`<div class="timeline-item ${i>=done?'pending':''}"><i class="timeline-dot"></i><div><b>${x}</b><small>${i<done?'Completed':'Pending'}</small></div></div>`).join('')}
function renderBigTimeline(el,done){const a=['Created','Searching','Hospital Found','Accepted','Reserved','En Route','Arrived','Admitted'];el.innerHTML=a.map((x,i)=>`<div class="big-step ${i<done?'done':''}"><span>${i<done?'✓':i+1}</span><b>${x}</b><small>${i<done?'Completed':'Pending'}</small></div>`).join('')}