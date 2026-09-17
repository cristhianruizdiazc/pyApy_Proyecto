$ErrorActionPreference = 'Stop'
$toolsDirectory = Join-Path (Split-Path $PSScriptRoot -Parent) '.local\tools'
New-Item -ItemType Directory -Path $toolsDirectory -Force | Out-Null
function Get-VerifiedTool([string]$Uri, [string]$File, [string]$ExpectedHash) {
    if (-not (Test-Path -LiteralPath $File)) { Invoke-WebRequest -Uri $Uri -OutFile $File }
    if ((Get-FileHash -LiteralPath $File -Algorithm SHA256).Hash.ToLowerInvariant() -ne $ExpectedHash) {
        throw "Hash de descarga invalido: $File"
    }
}
$composeExecutable = Join-Path $toolsDirectory 'docker-compose.exe'
Get-VerifiedTool 'https://github.com/docker/compose/releases/download/v5.5.1/docker-compose-windows-x86_64.exe' $composeExecutable 'a3c0c73033eaede90210345d0cc2233edf4fab8fe0282a91dad8fd8436809d2f'
$phpArchive = Join-Path $toolsDirectory 'php-8.5.10.zip'
Get-VerifiedTool 'https://windows.php.net/downloads/releases/php-8.5.10-nts-Win32-vs17-x64.zip' $phpArchive '22ec430195984d233eb9e62c637a945bbcda06efca2f392d9d96d62c6acd34f8'
$phpDirectory = Join-Path $toolsDirectory 'php-8.5.10'
if (-not (Test-Path -LiteralPath (Join-Path $phpDirectory 'php.exe'))) {
    Expand-Archive -LiteralPath $phpArchive -DestinationPath $phpDirectory
}
& $composeExecutable version
& (Join-Path $phpDirectory 'php.exe') -v
