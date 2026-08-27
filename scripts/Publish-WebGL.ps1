param(
    [string]$Source = "WebGL",
    [string]$Destination = "web-dist"
)

$ErrorActionPreference = "Stop"
$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$sourcePath = Join-Path $projectRoot $Source
$destinationPath = Join-Path $projectRoot $Destination
$headersPath = Join-Path $destinationPath "_headers"
$headersBackup = $null

if (-not (Test-Path -LiteralPath $sourcePath)) {
    throw "WebGL build folder was not found: $sourcePath. Build the Unity WebGL version first."
}

if (-not (Test-Path -LiteralPath (Join-Path $sourcePath "index.html"))) {
    throw "index.html was not found in $sourcePath. Select the WebGL build folder itself, not its parent."
}

if (Test-Path -LiteralPath $headersPath) {
    $headersBackup = Get-Content -LiteralPath $headersPath -Raw
}

if (Test-Path -LiteralPath $destinationPath) {
    Remove-Item -LiteralPath $destinationPath -Recurse -Force
}

New-Item -ItemType Directory -Path $destinationPath | Out-Null
Copy-Item -Path (Join-Path $sourcePath "*") -Destination $destinationPath -Recurse -Force

if ($headersBackup) {
    Set-Content -LiteralPath $headersPath -Value $headersBackup -NoNewline
} else {
    @"
/Build/*.data.gz
  Content-Encoding: gzip
  Content-Type: application/octet-stream

/Build/*.wasm.gz
  Content-Encoding: gzip
  Content-Type: application/wasm

/Build/*.framework.js.gz
  Content-Encoding: gzip
  Content-Type: application/javascript

/Build/*.js.gz
  Content-Encoding: gzip
  Content-Type: application/javascript

/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
"@ | Set-Content -LiteralPath $headersPath -NoNewline
}

Write-Host "Copied $Source to $Destination. Push the repo and set Cloudflare Pages output directory to: web-dist"
