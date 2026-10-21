const fs=require('node:fs'),path=require('node:path'),https=require('node:https'),crypto=require('node:crypto');
const destination=path.join(__dirname,'public','pose_landmarker_lite.task');
const hash='59929e1d1ee95287735ddd833b19cf4ac46d29bc7afddbbf6753c459690d574a';
const valid=data=>crypto.createHash('sha256').update(data).digest('hex')===hash;
if(fs.existsSync(destination)&&valid(fs.readFileSync(destination))){console.log('Modelo corporal verificado.');}
else{console.log('Baixando modelo oficial MediaPipe (aproximadamente 6 MB)...');
 const request=https.get('https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',response=>{
  if(response.statusCode!==200){response.resume();console.error('Download falhou: HTTP '+response.statusCode);process.exitCode=1;return;}
  const chunks=[];response.on('data',chunk=>chunks.push(chunk));response.on('error',fail);response.on('end',()=>{const data=Buffer.concat(chunks);if(!valid(data))return fail(new Error('Checksum do modelo invalido.'));fs.writeFileSync(destination,data);console.log('Modelo instalado e verificado.');});
 });request.setTimeout(60000,()=>request.destroy(new Error('Tempo de download excedido.')));request.on('error',fail);
}
function fail(error){console.error(error.message);process.exitCode=1;}
