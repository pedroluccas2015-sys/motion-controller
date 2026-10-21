param([switch]$NaoAbrir)
$ErrorActionPreference='Stop'
$taskRoot=$PSScriptRoot
. (Join-Path $taskRoot 'Runtimes.ps1')
$nodeExe=Find-Node
$pythonExe=Find-Python
if(!(Test-Path (Join-Path $taskRoot 'node_modules\express')) -or !(Test-Path (Join-Path $taskRoot 'public\pose_landmarker_lite.task'))){throw 'Execute Instalar.cmd primeiro para instalar os componentes.'}
$already=$false
try { $r=Invoke-RestMethod 'http://127.0.0.1:3001/api/status' -TimeoutSec 2; $already=$true } catch {}
if (!$already) {
 Start-Process -FilePath $nodeExe -ArgumentList 'server.js' -WorkingDirectory $taskRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $taskRoot 'server.log') -RedirectStandardError (Join-Path $taskRoot 'server-error.log')
 $ready=$false
 for($i=0;$i -lt 40;$i++){Start-Sleep -Milliseconds 250;try{$r=Invoke-RestMethod 'http://127.0.0.1:3001/api/status' -TimeoutSec 1;$ready=$true;break}catch{}}
 if(!$ready){throw 'Servidor nao iniciou. Consulte server-error.log nesta pasta.'}
}
if(!$r.bridge){Start-Process -FilePath $pythonExe -ArgumentList 'input_mapper.py' -WorkingDirectory $taskRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $taskRoot 'input.log') -RedirectStandardError (Join-Path $taskRoot 'input-error.log')}
if(!$NaoAbrir){Start-Process 'http://127.0.0.1:3001'}
Write-Host 'Painel aberto. Leia o QR Code com o celular na mesma rede Wi-Fi.'
