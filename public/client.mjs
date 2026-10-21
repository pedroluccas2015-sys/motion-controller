import {features,classify} from './gestures.mjs';
const $=id=>document.getElementById(id),socket=io({transports:['websocket','polling']});
const session=new URLSearchParams(location.search).get('session');let paired=false,running=false,mode='sensor',stream=null,pose=null,frame=0,lastSend=0,lastVideo=-1,acc={x:0,y:0,z:0},ori={alpha:0,beta:0,gamma:0},button=false,lastSensor=0,base=null,samples=[],calibrateAt=0,previous=null,lastGestureAt=0,gravity={x:0,y:0,z:0},starting=false;
function notice(t){$('notice').textContent=t;}
socket.on('connect',()=>{socket.emit('join_session',{session},r=>{paired=!!r?.ok;$('connection').textContent=paired?'Conectado ao PC ✓':r?.error||'Falha ao parear';$('start').disabled=!paired;if(paired)notice('Escolha um modo e toque em Iniciar captura. Depois, ative as teclas no painel do PC.');});});
socket.on('disconnect',()=>{paired=false;stop();$('connection').textContent='Conexão perdida. Reconectando…';$('start').disabled=true;});
$('capture').onchange=()=>{stop();mode=$('capture').value;const cam=mode==='camera';$('facing-label').classList.toggle('hidden',!cam);$('camera-panel').classList.toggle('hidden',!cam);$('sensor-panel').classList.toggle('hidden',cam);$('instructions').textContent=cam?'Apoie o celular na vertical ou horizontal, a 2–3 metros. Os pés e a cabeça precisam aparecer.':'Segure o celular com firmeza. Balance para os lados ou toque em Ação.';};
$('facing').onchange=stop;
function motion(e){lastSensor=performance.now();const a=e.acceleration;for(const k of ['x','y','z']){if(a&&a[k]!=null)acc[k]=a[k];else{const v=e.accelerationIncludingGravity?.[k]||0;gravity[k]=.92*gravity[k]+.08*v;acc[k]=v-gravity[k];}}}
function orientation(e){for(const k of ['alpha','beta','gamma'])ori[k]=e[k]||0;}
function stop(){running=false;cancelAnimationFrame(frame);window.removeEventListener('devicemotion',motion);window.removeEventListener('deviceorientation',orientation);stream?.getTracks().forEach(t=>t.stop());stream=null;$('video').srcObject=null;button=false;base=null;previous=null;samples=[];socket.emit('stop_capture');$('start').disabled=!paired;$('capture').disabled=false;$('facing').disabled=false;notice('Captura parada. Teclas pausadas no PC.');}
$('stop').onclick=stop;
$('start').onclick=async()=>{if(starting)return;starting=true;$('start').disabled=true;try{
 if(!isSecureContext)throw Error('O navegador bloqueou a captura: abra o endereço HTTPS pelo QR Code e confira o certificado local.');
 if(mode==='sensor'){
  const asks=[];for(const api of [window.DeviceMotionEvent,window.DeviceOrientationEvent])if(typeof api?.requestPermission==='function')asks.push(api.requestPermission());
  const permissions=await Promise.all(asks);if(permissions.some(x=>x!=='granted'))throw Error('Permissão de movimento negada. Libere nas configurações do navegador e tente novamente.');
  if(!window.DeviceMotionEvent)throw Error('Este navegador não disponibiliza sensores. Experimente o modo câmera.');
  window.addEventListener('devicemotion',motion);window.addEventListener('deviceorientation',orientation);lastSensor=0;
 }else{
  if(!navigator.mediaDevices?.getUserMedia)throw Error('Câmera indisponível neste navegador. Abra em Safari ou Chrome usando HTTPS.');
  notice('Abrindo câmera e carregando detector corporal…');
  stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:$('facing').value},width:{ideal:640},height:{ideal:480},frameRate:{ideal:30,max:30}}});
  $('video').srcObject=stream;await $('video').play();
  if(!pose){const {FilesetResolver,PoseLandmarker}=await import('/vendor/vision_bundle.mjs');const vision=await FilesetResolver.forVisionTasks('/vendor/wasm');pose=await PoseLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:'/pose_landmarker_lite.task'},runningMode:'VIDEO',numPoses:1,minPoseDetectionConfidence:.6,minPosePresenceConfidence:.6,minTrackingConfidence:.6});}
  calibrateAt=performance.now()+5000;samples=[];base=null;lastVideo=-1;
 }
 running=true;$('capture').disabled=true;$('facing').disabled=true;notice('Captura ativa. No PC, confira os movimentos e ative as teclas quando estiver pronto.');frame=requestAnimationFrame(loop);
 }catch(e){stop();notice('Não foi possível iniciar: '+e.message);}finally{starting=false;$('start').disabled=running||!paired;}};
$('calibrate').onclick=()=>{if(!running)return;calibrateAt=performance.now()+5000;base=null;samples=[];previous=null;socket.emit('stop_capture');notice('Calibração iniciada: afaste-se e fique parado. Reative as teclas no PC depois de calibrar.');};
const action=$('action');action.onpointerdown=e=>{e.preventDefault();action.setPointerCapture(e.pointerId);button=true;navigator.vibrate?.(25);};action.onpointerup=action.onpointercancel=action.onlostpointercapture=()=>button=false;
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});window.addEventListener('pagehide',stop);
const bones=[[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],[23,25],[25,27],[24,26],[26,28],[27,31],[28,32]];
function overlay(p){const c=$('overlay'),v=$('video');c.width=v.videoWidth;c.height=v.videoHeight;const x=c.getContext('2d');if(!p)return;x.strokeStyle='#72ffbc';x.lineWidth=4;for(const[a,b]of bones)if(p[a].visibility>.5&&p[b].visibility>.5){x.beginPath();x.moveTo(p[a].x*c.width,p[a].y*c.height);x.lineTo(p[b].x*c.width,p[b].y*c.height);x.stroke();}}
function loop(t){if(!running||!paired)return;try{if(t-lastSend>=32){lastSend=t;let data={mode,acc:{...acc},ori:{...ori},button};if(mode==='camera'){
 const v=$('video');if(v.readyState<2||v.currentTime===lastVideo){frame=requestAnimationFrame(loop);return;}lastVideo=v.currentTime;
 const result=pose.detectForVideo(v,t),points=result.landmarks[0],f=features(points,result.worldLandmarks[0]);overlay(points);data.points=points;data.tracking=!!f;
 if(!f){$('tracking').textContent='Mostre o corpo inteiro, incluindo os pés. Buscando pose…';previous=null;}
 else if(!base){if(t<calibrateAt)$('tracking').textContent=`Calibrando em ${Math.ceil((calibrateAt-t)/1000)} s. Fique em pé e parado.`;else{samples.push(f);$('tracking').textContent=`Fique parado… ${samples.length}/30`;if(samples.length>=30){base={};for(const k of ['x','y','scale','ly','ry','feet','lz','rz'])base[k]=samples.reduce((s,v)=>s+v[k],0)/samples.length;notice('Calibrado! Chute, dê um passo lateral, salte ou levante os braços. Ative as teclas no PC.');}}}
 else{const gesture=classify(f,base);if(gesture&&gesture!==previous&&t-lastGestureAt>450){data.gesture=gesture;lastGestureAt=t;}$('tracking').textContent=gesture?'Gesto: '+({kick:'chute',jump:'salto',left:'esquerda',right:'direita',down:'agachar',action:'braços acima'}[gesture]):'Corpo detectado · pronto';previous=gesture;}
 }else{$('sensor-values').textContent=`X ${acc.x.toFixed(1)} · Y ${acc.y.toFixed(1)} · Z ${acc.z.toFixed(1)}`;$('sensor-status').textContent=lastSensor&&t-lastSensor<2000?'Sensores recebendo dados reais ✓':'Aguardando sensores. Se continuar assim, confira as permissões de movimento.';if(!lastSensor||t-lastSensor>2000)data={...data,acc:{x:0,y:0,z:0}};}
 socket.volatile.emit('motion',data);
 }frame=requestAnimationFrame(loop);}catch(e){stop();notice('Captura interrompida: '+e.message);}}
