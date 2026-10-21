const fs=require('fs'),path=require('path'),os=require('os'),crypto=require('crypto');
const express=require('express'),https=require('https'),http=require('http');
const {Server}=require('socket.io'),QRCode=require('qrcode');
const root=__dirname, session=crypto.randomBytes(12).toString('hex'), secret=crypto.randomBytes(24).toString('hex');
const ips=Object.values(os.networkInterfaces()).flat().filter(x=>x.family==='IPv4'&&!x.internal).map(x=>x.address);
let controller=null,armed=false,profile='football',lastFrame=0,bridgeSeen=0,lastGesture='—',frameCount=0,hz=0,lastFire=0,lastButton=false;
let mapping={left:'LEFT',right:'RIGHT',up:'UP',down:'DOWN',kick:'SPACE',jump:'SPACE',action:'ENTER'};
let queue=[],latest=null; const app=express(),local=express();
const keys=new Set(['LEFT','RIGHT','UP','DOWN','SPACE','ENTER','W','A','S','D','J','K','X','Z']);
const localOnly=(req,res,next)=>{if(req.headers.host!=='127.0.0.1:3001'&&req.headers.host!=='localhost:3001')return res.sendStatus(403);next();};
local.use(localOnly);local.use(express.json({limit:'4kb'}));
app.use('/vendor',express.static(path.join(root,'node_modules/@mediapipe/tasks-vision')));
app.use(express.static(path.join(root,'public')));
local.use('/public',express.static(path.join(root,'public')));
local.get('/',(req,res)=>res.sendFile(path.join(root,'public','host.html')));
local.get('/api/session',async(req,res)=>{res.set('Cache-Control','no-store');res.json({session,secret,ips,clientUrl:`https://${ips[0]}:3000/client.html?session=${session}`,qr:await QRCode.toDataURL(`https://${ips[0]}:3000/client.html?session=${session}`,{width:280,margin:2})});});
local.get('/api/qr',async(req,res)=>{if(!ips.includes(req.query.ip))return res.sendStatus(400);res.type('png').send(await QRCode.toBuffer(`https://${req.query.ip}:3000/client.html?session=${session}`,{width:280,margin:2}));});
local.get('/api/status',(_,res)=>res.json({connected:!!controller,armed,profile,mapping,bridge:Date.now()-bridgeSeen<3000,active:Date.now()-lastFrame<1500,hz,lastGesture,latest}));
function auth(req,res,next){if(req.get('x-control-token')!==secret)return res.sendStatus(403);next();}
local.post('/api/control',auth,(req,res)=>{if(typeof req.body.armed==='boolean')armed=req.body.armed;
 if(['football','dance','custom'].includes(req.body.profile))profile=req.body.profile;
 if(req.body.mapping)for(const [k,v]of Object.entries(req.body.mapping))if(k in mapping&&keys.has(v))mapping[k]=v;
 queue=[];res.json({armed,profile,mapping});});
local.get('/api/input',auth,(req,res)=>{bridgeSeen=Date.now();res.json({keys:armed&&controller&&Date.now()-lastFrame<1500?queue.splice(0):[],armed});queue=[];});
local.post('/api/shutdown',auth,(_,res)=>{armed=false;res.json({ok:true});setTimeout(()=>process.exit(0),100);});
function fire(gesture){const now=Date.now();if(now-lastFire<350)return;lastFire=now;lastGesture=gesture;
 if(armed&&Date.now()-bridgeSeen<3000&&mapping[gesture])queue.push({key:mapping[gesture],expires:now+400});queue=queue.slice(-8);}
async function main(){
 fs.mkdirSync(path.join(root,'certs'),{recursive:true});
 if(!fs.existsSync(path.join(root,'certs/key.pem'))){const selfsigned=require('selfsigned');const p=await selfsigned.generate([{name:'commonName',value:'Motion Controller local'}],{days:365,keySize:2048,algorithm:'sha256',extensions:[{name:'subjectAltName',altNames:[{type:2,value:'localhost'},...['127.0.0.1',...ips].map(ip=>({type:7,ip}))]}]});fs.writeFileSync(path.join(root,'certs/key.pem'),p.private);fs.writeFileSync(path.join(root,'certs/cert.pem'),p.cert);}
 const server=https.createServer({key:fs.readFileSync(path.join(root,'certs/key.pem')),cert:fs.readFileSync(path.join(root,'certs/cert.pem'))},app);
 const io=new Server(server,{maxHttpBufferSize:32768,pingInterval:5000,pingTimeout:5000});
 io.on('connection',s=>{s.on('join_session',(data,cb)=>{if(data?.session!==session)return cb?.({ok:false,error:'QR Code expirado. Leia novamente no PC.'});if(controller&&controller!==s.id)return cb?.({ok:false,error:'Já existe outro celular conectado.'});controller=s.id;armed=false;queue=[];lastButton=false;cb?.({ok:true});});
 s.on('stop_capture',()=>{if(s.id===controller){armed=false;queue=[];latest=null;}});
 s.on('motion',d=>{if(s.id!==controller||!d||!['sensor','camera'].includes(d.mode))return;
  const now=Date.now();if(now-lastFrame<12)return;lastFrame=now;frameCount++;
  const acc={};for(const k of ['x','y','z'])acc[k]=Number.isFinite(d.acc?.[k])?Math.max(-100,Math.min(100,d.acc[k])):0;
  const ori={};for(const k of ['alpha','beta','gamma'])ori[k]=Number.isFinite(d.ori?.[k])?d.ori[k]:0;
  const points=Array.isArray(d.points)&&d.points.length===33?d.points.map(p=>({x:Number.isFinite(p.x)?p.x:0,y:Number.isFinite(p.y)?p.y:0,visibility:Number.isFinite(p.visibility)?p.visibility:0})):null;
  latest={mode:d.mode,acc,ori,points,tracking:!!d.tracking};
  if(d.mode==='sensor'){if(acc.x>14)fire('right');else if(acc.x< -14)fire('left');else if(acc.y>14)fire('up');else if(acc.y< -14)fire('down');else if(acc.z>18)fire('kick');}
  if(d.mode==='camera'&&d.tracking&&['kick','jump','left','right','down','action'].includes(d.gesture))fire(d.gesture);
  if(d.button&&!lastButton)fire('action');lastButton=!!d.button;
 });s.on('disconnect',()=>{if(controller===s.id){controller=null;armed=false;queue=[];latest=null;}});});
 setInterval(()=>{hz=frameCount;frameCount=0;if(Date.now()-lastFrame>1500){armed=false;queue=[];}},1000);
 fs.writeFileSync(path.join(root,'runtime.json'),JSON.stringify({secret,pid:process.pid}));
 server.listen(3000,'0.0.0.0',()=>console.log(`Celular: https://${ips[0]}:3000/client.html?session=${session}`));
 http.createServer(local).listen(3001,'127.0.0.1',()=>console.log('Painel: http://127.0.0.1:3001'));
}
main().catch(e=>{console.error(e);process.exit(1)});
