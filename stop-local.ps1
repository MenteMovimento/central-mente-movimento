$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$PidFile = Join-Path $Root ".runtime\pids.json"

if (!(Test-Path -LiteralPath $PidFile)) {
  Write-Host "Nao ha processos registados para parar."
  exit 0
}

$processes = Get-Content -Raw -LiteralPath $PidFile | ConvertFrom-Json
$processIds = @()

foreach ($process in $processes) {
  $processIds += [int] $process.pid
}

$ports = @(8090, 8091, 8092, 8001, 5173)
$listeners = Get-NetTCPConnection -LocalPort $ports -State Listen -ErrorAction SilentlyContinue
foreach ($listener in $listeners) {
  $processIds += [int] $listener.OwningProcess
}

$processIds = $processIds | Sort-Object -Unique
foreach ($processId in $processIds) {
  $running = Get-Process -Id $processId -ErrorAction SilentlyContinue
  if ($running) {
    Stop-Process -Id $processId -Force
    Write-Host "Parado: $($running.ProcessName) ($processId)"
  }
}

Remove-Item -LiteralPath $PidFile -Force
