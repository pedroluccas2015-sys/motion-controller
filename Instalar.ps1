$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'Runtimes.ps1')
$nodeExe=Find-Node
$pythonExe=Find-Python
Set-Location -LiteralPath $PSScriptRoot
$npmExe=Join-Path (Split-Path $nodeExe) 'npm.cmd'
if(!(Test-Path -LiteralPath $npmExe)){$npmExe=(Get-Command npm.cmd -ErrorAction Stop).Source}
& $npmExe ci --offline=false --no-audit --no-fund --cache .npm-cache
if($LASTEXITCODE -ne 0){throw 'Falha ao instalar dependencias. Confira a conexao com a internet.'}
& $nodeExe setup.js
if($LASTEXITCODE -ne 0){throw 'Falha ao baixar o modelo corporal.'}
Write-Host 'Instalacao concluida. Agora abra Iniciar.cmd.'
