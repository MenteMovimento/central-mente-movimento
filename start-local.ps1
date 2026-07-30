$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$RuntimeDir = Join-Path $Root ".runtime"
$PidFile = Join-Path $RuntimeDir "pids.json"
$CredentialsFile = Join-Path $RuntimeDir "local-credentials.json"
$CentralDir = Join-Path $Root "portal"
$UtentesDir = Join-Path $CentralDir "modules\utentes"
$CibersegurancaDir = Join-Path $CentralDir "modules\dispositivos"

New-Item -ItemType Directory -Force -Path $RuntimeDir | Out-Null

function New-LocalPassword {
  $bytes = New-Object byte[] 24
  $generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try {
    $generator.GetBytes($bytes)
  } finally {
    $generator.Dispose()
  }
  $randomPart = [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
  return "A!$randomPart"
}

if (Test-Path -LiteralPath $CredentialsFile) {
  $LocalCredentials = Get-Content -LiteralPath $CredentialsFile -Raw | ConvertFrom-Json
}

if (-not $LocalCredentials -or -not $LocalCredentials.centralPassword -or -not $LocalCredentials.utentesPassword) {
  $LocalCredentials = [pscustomobject]@{
    centralPassword = New-LocalPassword
    utentesPassword = New-LocalPassword
  }
  $LocalCredentials | ConvertTo-Json | Set-Content -LiteralPath $CredentialsFile -Encoding UTF8
}

function Start-LocalProcess {
  param(
    [string] $Name,
    [string] $WorkingDirectory,
    [string] $FilePath,
    [string[]] $ArgumentList,
    [hashtable] $Environment = @{}
  )

  $previousEnvironment = @{}
  foreach ($key in $Environment.Keys) {
    $previousEnvironment[$key] = [Environment]::GetEnvironmentVariable($key, "Process")
    [Environment]::SetEnvironmentVariable($key, [string] $Environment[$key], "Process")
  }

  try {
    $process = Start-Process `
      -FilePath $FilePath `
      -ArgumentList $ArgumentList `
      -WorkingDirectory $WorkingDirectory `
      -WindowStyle Hidden `
      -PassThru
  } finally {
    foreach ($key in $Environment.Keys) {
      [Environment]::SetEnvironmentVariable($key, $previousEnvironment[$key], "Process")
    }
  }

  [pscustomobject]@{
    name = $Name
    pid = $process.Id
    startedAt = (Get-Date).ToString("s")
  }
}

$processes = @()
$processes += Start-LocalProcess -Name "utentes" -WorkingDirectory $UtentesDir -FilePath "python" -ArgumentList @("app.py") -Environment @{ PORT = "8091"; UTENTES_ADMIN_PASSWORD = $LocalCredentials.utentesPassword }
$processes += Start-LocalProcess -Name "ciberseguranca" -WorkingDirectory $CibersegurancaDir -FilePath "npm.cmd" -ArgumentList @("run", "dev", "--", "--host", "127.0.0.1", "--port", "8092") -Environment @{ BROWSER = "none" }
$processes += Start-LocalProcess -Name "central" -WorkingDirectory $CentralDir -FilePath "python" -ArgumentList @("server.py") -Environment @{ CENTRAL_PORT = "8090"; CENTRAL_PASSWORD = $LocalCredentials.centralPassword }

$processes | ConvertTo-Json | Set-Content -LiteralPath $PidFile -Encoding UTF8

Write-Host ""
Write-Host "Central local: http://127.0.0.1:8090"
Write-Host "Login central local: admin@mentemovimento.local / $($LocalCredentials.centralPassword)"
Write-Host "Login Utentes local: admin@mentemovimento.local / $($LocalCredentials.utentesPassword)"
Write-Host "As credenciais ficam apenas em .runtime\local-credentials.json"
Write-Host "Socios usa a base local da Central em .runtime\central.db"
Write-Host "Utentes corre integrado na Central em /area/utentes"
Write-Host "Ciberseguranca corre integrada na Central em /area/dispositivos"
Write-Host ""
Write-Host "Areas internas:"
Write-Host "  Socios:       http://127.0.0.1:8090/area/socios"
Write-Host "  Utentes:      http://127.0.0.1:8090/area/utentes"
Write-Host "  Ciberseguranca: http://127.0.0.1:8090/area/dispositivos"
Write-Host "Para parar: .\stop-local.ps1"
