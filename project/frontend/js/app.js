const API_BASE='';
const MediResQ={
 role:localStorage.getItem('mr_role')||'ambulance',
 emergencyId:localStorage.getItem('mr_emergency_id')||null,
 toast(msg){const r=document.getElementById('toast-root');if(!r)return;const d=document.createElement('div');d.className='toast';d.textContent=msg;r.appendChild(d);setTimeout(()=>d.remove(),2800)},
 setRole(r){localStorage.setItem('mr_role',r);this.role=r},
 async api(path,options={}){
   const res=await fetch(API_BASE+path,{headers:{'Content-Type':'application/json',...(options.headers||{})},...options});
   const data=await res.json().catch(()=>({}));
   if(!res.ok) throw new Error(data.error||'Request failed');
   return data;
 },
 async loadBlood(){return this.api('/api/blood')},
 async loadHospitals(){return this.api('/api/hospitals')},
 async createEmergency(payload){const data=await this.api('/api/emergencies',{method:'POST',body:JSON.stringify(payload)});this.emergencyId=data.emergency.id;localStorage.setItem('mr_emergency_id',data.emergency.id);return data;}
};

document.addEventListener('DOMContentLoaded',()=>{
 document.querySelectorAll('.role-btn').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.role-btn').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');const r=b.dataset.role;const e=document.getElementById('email');if(e)e.value=r==='admin'?'admin@mediresq.demo':r+'@mediresq.demo'}));
 const login=document.getElementById('loginBtn');
 if(login) login.onclick=async()=>{
   try{
     login.disabled=true;
     const email=document.getElementById('email')?.value||'';
     const password=document.getElementById('password')?.value||'';
     const data=await MediResQ.api('/api/login',{method:'POST',body:JSON.stringify({email,password})});
     MediResQ.setRole(data.user.role);
     localStorage.setItem('mr_user',JSON.stringify(data.user));
     location.href=data.user.role==='hospital'?'hospital.html':data.user.role==='bloodbank'?'bloodbank.html':data.user.role==='admin'?'admin.html':'ambulance.html';
   }catch(e){MediResQ.toast(e.message)}finally{login.disabled=false}
 };
 const logout=document.getElementById('logoutBtn');if(logout)logout.onclick=()=>{localStorage.removeItem('mr_role');localStorage.removeItem('mr_user');location.href='login.html'};
 const page=document.body.dataset.page;document.querySelector(`[data-nav="${page}"]`)?.classList.add('active');
 const notify=document.getElementById('notifyBtn');if(notify)notify.onclick=()=>MediResQ.toast('Live notifications are connected to the demo API');
});
