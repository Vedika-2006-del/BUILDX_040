const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, '..');
const FRONTEND = path.join(ROOT, 'frontend');
const DB_FILE = path.join(__dirname, 'data', 'db.json');

app.use(express.json({limit:'100kb'}));

function readDb(){ return JSON.parse(fs.readFileSync(DB_FILE,'utf8')); }
function writeDb(db){
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db,null,2));
  fs.renameSync(tmp, DB_FILE);
}
function id(prefix){ return `${prefix}-${crypto.randomUUID().slice(0,8)}`; }
function publicUser(u){ return {id:u.id,email:u.email,role:u.role,name:u.name}; }

app.get('/api/health',(req,res)=>res.json({ok:true,service:'Nagpur Medi-ResQ API',time:new Date().toISOString()}));

app.post('/api/login',(req,res)=>{
  const {email,password,role} = req.body || {};
  const db = readDb();
  const user = db.users.find(u => u.email === email && u.password === password && (!role || u.role === role));
  if(!user) return res.status(401).json({error:'Invalid demo credentials'});
  res.json({user:publicUser(user),token:'demo-'+user.id});
});

app.get('/api/hospitals',(req,res)=>res.json({hospitals:readDb().hospitals}));
app.get('/api/blood',(req,res)=>res.json({blood:readDb().blood}));
app.get('/api/emergencies',(req,res)=>res.json({emergencies:readDb().emergencies}));
app.get('/api/emergencies/:id',(req,res)=>{
  const e=readDb().emergencies.find(x=>x.id===req.params.id);
  if(!e) return res.status(404).json({error:'Emergency not found'});
  res.json({emergency:e});
});

function hasBlood(hospital, bloodGroup, units){
  return Number(hospital.blood?.[bloodGroup] || 0) >= units;
}
function matchHospitals(emergency, hospitals){
  const reqs = emergency.resources || {};
  return hospitals.map(h=>{
    const reasons=[];
    let possible=true;
    if(reqs.icu && h.icu < 1){possible=false;reasons.push('ICU unavailable');}
    if(reqs.neurosurgeon && !h.neurosurgeon){possible=false;reasons.push('Neurosurgeon unavailable');}
    if(reqs.orthopedic && !h.orthopedic){possible=false;reasons.push('Orthopedic unavailable');}
    if(reqs.generalSurgeon && !h.generalSurgeon){possible=false;reasons.push('General surgeon unavailable');}
    if(reqs.or && !h.or){possible=false;reasons.push('Operation room unavailable');}
    const units=reqs.bloodUnits||0;
    if(reqs.bloodGroup && !hasBlood(h,reqs.bloodGroup,units)){possible=false;reasons.push(`${reqs.bloodGroup} blood unavailable`);}
    let score=h.score - (possible?0:18) - Math.min(h.eta,30)*0.3;
    return {...h,possible,reasons,matchScore:Math.max(0,Math.round(score))};
  }).sort((a,b)=>Number(b.possible)-Number(a.possible) || b.matchScore-a.matchScore || a.eta-b.eta);
}

app.post('/api/emergencies',(req,res)=>{
  const body=req.body || {};
  if(!body.patientName || !body.location) return res.status(400).json({error:'patientName and location are required'});
  const db=readDb();
  const e={
    id:id('MR'),
    patientName:body.patientName,
    age:Number(body.age||0),
    gender:body.gender||'Not specified',
    bloodGroup:body.bloodGroup||'O-',
    location:body.location,
    description:body.description||'',
    resources:body.resources||{},
    status:'CREATED',
    createdAt:new Date().toISOString(),
    hospitalId:null,
    ambulance:'MH-31-108',
    timeline:[
      {step:'Emergency Created',status:'Completed',at:new Date().toISOString()},
      {step:'Hospital Matching',status:'Completed',at:new Date().toISOString()}
    ]
  };
  e.matches=matchHospitals(e,db.hospitals);
  const best=e.matches.find(x=>x.possible) || e.matches[0];
  if(best) e.recommendedHospitalId=best.id;
  db.emergencies.unshift(e);
  writeDb(db);
  res.status(201).json({emergency:e,matches:e.matches});
});

app.post('/api/emergencies/:id/accept',(req,res)=>updateEmergency(req,res,'HOSPITAL_ACCEPTED','Hospital Accepted'));
app.post('/api/emergencies/:id/reserve',(req,res)=>updateEmergency(req,res,'RESOURCES_RESERVED','Resources Reserved'));
app.post('/api/emergencies/:id/ambulance',(req,res)=>updateEmergency(req,res,'EN_ROUTE','Ambulance En Route'));
app.post('/api/emergencies/:id/arrived',(req,res)=>updateEmergency(req,res,'ARRIVED','Patient Arrived'));
app.post('/api/emergencies/:id/admit',(req,res)=>updateEmergency(req,res,'ADMITTED','Admitted'));

function updateEmergency(req,res,status,step){
  const db=readDb();
  const e=db.emergencies.find(x=>x.id===req.params.id);
  if(!e) return res.status(404).json({error:'Emergency not found'});
  e.status=status;
  e.timeline=e.timeline||[];
  e.timeline.push({step,status:'Completed',at:new Date().toISOString()});
  writeDb(db);
  res.json({emergency:e});
}

app.patch('/api/hospital/resources',(req,res)=>{
  const db=readDb();
  const h=db.hospitals.find(x=>x.id===(req.body?.hospitalId||'h1'));
  if(!h) return res.status(404).json({error:'Hospital not found'});
  if(req.body.icu !== undefined) h.icu=Math.max(0,Number(req.body.icu));
  if(req.body.blood && typeof req.body.blood==='object') h.blood={...h.blood,...req.body.blood};
  writeDb(db);
  res.json({hospital:h});
});

app.post('/api/blood/reserve',(req,res)=>{
  const {group='O-',units=2}=req.body||{};
  const n=Number(units);
  const db=readDb();
  if(!db.blood[group] || db.blood[group] < n) return res.status(409).json({error:'Not enough blood units available'});
  db.blood[group]-=n;
  const h=db.hospitals.find(x=>x.id==='h1');
  if(h && h.blood[group] !== undefined) h.blood[group]=Math.max(0,h.blood[group]-n);
  writeDb(db);
  res.json({message:`${group} ×${n} reserved`,blood:db.blood});
});

// Serve the existing static frontend and make the backend the only server needed.
app.use(express.static(FRONTEND));
app.get(/.*/,(req,res)=>{
  if(req.path.startsWith('/api/')) return res.status(404).json({error:'API route not found'});
  res.sendFile(path.join(FRONTEND,'index.html'));
});

app.listen(PORT,()=>console.log(`Medi-ResQ running at http://localhost:${PORT}`));
