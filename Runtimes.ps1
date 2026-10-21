function Find-Node {
 $command=Get-Command node.exe -ErrorAction SilentlyContinue
 if($command){return $command.Source}
 $bundled=Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
 if(Test-Path -LiteralPath $bundled){return $bundled}
 throw 'Instale Node.js 22 ou superior em https://nodejs.org e abra novamente.'
}
function Find-Python {
 $candidates=@()
 $launcher=Get-Command py.exe -ErrorAction SilentlyContinue
 if($launcher){try{$found=& $launcher.Source -3 -c 'import sys; print(sys.executable)' 2>$null;if($LASTEXITCODE -eq 0 -and $found){$candidates+=$found}}catch{}}
 $command=Get-Command python.exe -ErrorAction SilentlyContinue
 if($command -and $command.Source -notlike '*\WindowsApps\*'){$candidates+=$command.Source}
 $candidates+=(Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe')
 foreach($candidate in $candidates){if(Test-Path -LiteralPath $candidate){return $candidate}}
 throw 'Instale Python 3.10 ou superior em https://www.python.org/downloads/windows/ e abra novamente.'
}
