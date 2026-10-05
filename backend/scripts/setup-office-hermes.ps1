$ErrorActionPreference = 'Stop'
$hermesCommand = Get-Command hermes.exe -ErrorAction Stop
$hermesPython = Join-Path (Split-Path $hermesCommand.Source) 'python.exe'
& rtk proxy $hermesPython (Join-Path $PSScriptRoot 'setup-office-hermes.py')
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
