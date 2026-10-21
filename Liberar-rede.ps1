# Execute como administrador apenas se o celular nao conseguir abrir o endereco local.
$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'Runtimes.ps1')
$nodeExe=Find-Node
$ruleName='MotionController-LAN-3000'
if(!(Get-NetFirewallRule -Name $ruleName -ErrorAction SilentlyContinue)) {
 New-NetFirewallRule -Name $ruleName -DisplayName 'Motion Controller - celular na rede local' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3000 -RemoteAddress LocalSubnet -Profile Any -Program $nodeExe | Out-Null
}
Write-Host 'Acesso liberado para a porta 3000 somente na sub-rede local.'
