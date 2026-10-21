const assert=require('node:assert/strict'),{io}=require('socket.io-client');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function run(){
 const {features,classify}=await import('./public/gestures.mjs');
 const b={x:.5,y:.5,scale:.2,feet:.9,ly:2,ry:2,lz:0,rz:0};
 assert.equal(classify({...b},b),null);assert.equal(classify({...b,ly:1},b),'kick');assert.equal(classify({...b,y:.42,feet:.82},b),'jump');assert.equal(classify({...b,x:.65},b),'left');assert.equal(classify({...b,x:.35},b),'right');assert.equal(classify({...b,y:.57},b),'down');assert.equal(features(null),null);
 const info=await fetch('http://127.0.0.1:3001/api/session').then(r=>r.json());
 const initial=await fetch('http://127.0.0.1:3001/api/status').then(r=>r.json());
 assert.equal(initial.bridge,false,'Encerre a ponte Windows antes deste teste de integracao: os testes nao devem enviar teclas reais.');
 assert.equal(initial.connected,false,'Desconecte o celular antes de testar.');
 const headers={'X-Control-Token':info.secret,'Content-Type':'application/json'};
 const control=data=>fetch('http://127.0.0.1:3001/api/control',{method:'POST',headers,body:JSON.stringify(data)}).then(r=>r.json());
 const input=()=>fetch('http://127.0.0.1:3001/api/input',{headers}).then(r=>r.json());
 const status=()=>fetch('http://127.0.0.1:3001/api/status').then(r=>r.json());
 assert.equal((await fetch('http://127.0.0.1:3001/api/control',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"armed":true}'})).status,403);
 const s=io('https://127.0.0.1:3000',{rejectUnauthorized:false,transports:['websocket'],reconnection:false});await new Promise((resolve,reject)=>{s.once('connect',resolve);s.once('connect_error',reject)});
 const join=token=>new Promise(r=>s.emit('join_session',{session:token},r));
 assert.equal((await join('bad')).ok,false);
 s.emit('motion',{mode:'camera',tracking:true,gesture:'kick'});await sleep(70);assert.equal((await status()).latest,null);
 assert.equal((await join(info.session)).ok,true);
 await input();await control({armed:true});s.emit('motion',{mode:'camera',tracking:true,gesture:'kick'});await sleep(70);assert.equal((await input()).keys[0].key,'SPACE');
 await sleep(400);await control({armed:false});s.emit('motion',{mode:'camera',tracking:true,gesture:'left'});await sleep(60);assert.equal((await input()).keys.length,0);
 await sleep(400);await control({armed:true});s.emit('motion',{mode:'sensor',acc:{x:20,y:0,z:0}});await sleep(60);assert.equal((await input()).keys[0].key,'RIGHT');
 s.emit('stop_capture');await sleep(70);assert.equal((await status()).armed,false);
 await control({armed:true});s.disconnect();await sleep(70);assert.equal((await status()).armed,false);
 for(const resource of ['/client.html','/client.mjs','/pose_landmarker_lite.task','/vendor/vision_bundle.mjs','/vendor/wasm/vision_wasm_internal.wasm']){const https=require('https');await new Promise((resolve,reject)=>https.get('https://127.0.0.1:3000'+resource,{rejectUnauthorized:false},r=>{assert.equal(r.statusCode,200,resource);r.resume();r.on('end',resolve)}).on('error',reject));}
 console.log('PASS: gestos sinteticos, pareamento, rejeicao de sessao invalida, teclas, pausa, desconexao e recursos locais.');
}
run().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)});
