$ErrorActionPreference = 'Stop'
$taskBackend = Split-Path -Parent $PSScriptRoot
$taskSecureToken = Read-Host 'Token bot dari BotFather (input tersembunyi)' -AsSecureString
$taskTokenPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($taskSecureToken)
try {
  $env:OFFICE_TELEGRAM_BOT_TOKEN = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($taskTokenPointer)
  Push-Location -LiteralPath $taskBackend
  try { & rtk proxy node ../node_modules/tsx/dist/cli.mjs src/scripts/digital-office-telegram-setup.ts }
  finally { Pop-Location }
} finally {
  Remove-Item Env:OFFICE_TELEGRAM_BOT_TOKEN -ErrorAction SilentlyContinue
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($taskTokenPointer)
  $taskSecureToken.Dispose()
}
