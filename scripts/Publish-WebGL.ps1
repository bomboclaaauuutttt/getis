param(
    [string]$Source = "WebGL",
    [string]$Destination = "web-dist"
)

$ErrorActionPreference = "Stop"
$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$sourcePath = Join-Path $projectRoot $Source
$destinationPath = Join-Path $projectRoot $Destination
$headersPath = Join-Path $destinationPath "_headers"

if (-not (Test-Path -LiteralPath $sourcePath)) {
    throw "WebGL build folder was not found: $sourcePath. Build the Unity WebGL version first."
}

if (-not (Test-Path -LiteralPath (Join-Path $sourcePath "index.html"))) {
    throw "index.html was not found in $sourcePath. Select the WebGL build folder itself, not its parent."
}

if (Test-Path -LiteralPath $destinationPath) {
    Remove-Item -LiteralPath $destinationPath -Recurse -Force
}

New-Item -ItemType Directory -Path $destinationPath | Out-Null
Copy-Item -Path (Join-Path $sourcePath "*") -Destination $destinationPath -Recurse -Force

$buildPath = Join-Path $destinationPath "Build"
$gzipFiles = Get-ChildItem -LiteralPath $buildPath -Filter "*.gz" -File -ErrorAction SilentlyContinue

foreach ($gzipFile in $gzipFiles) {
    $outputPath = Join-Path $gzipFile.DirectoryName $gzipFile.BaseName
    $inputStream = [System.IO.File]::OpenRead($gzipFile.FullName)
    try {
        $gzipStream = [System.IO.Compression.GZipStream]::new($inputStream, [System.IO.Compression.CompressionMode]::Decompress)
        try {
            $outputStream = [System.IO.File]::Create($outputPath)
            try {
                $gzipStream.CopyTo($outputStream)
            } finally {
                $outputStream.Dispose()
            }
        } finally {
            $gzipStream.Dispose()
        }
    } finally {
        $inputStream.Dispose()
    }
}

$indexPath = Join-Path $destinationPath "index.html"
$indexHtml = Get-Content -LiteralPath $indexPath -Raw
$indexHtml = $indexHtml -replace '\.data\.gz"', '.data"'
$indexHtml = $indexHtml -replace '\.framework\.js\.gz"', '.framework.js"'
$indexHtml = $indexHtml -replace '\.wasm\.gz"', '.wasm"'
Set-Content -LiteralPath $indexPath -Value $indexHtml -NoNewline

@"
/Build/*.data
  Content-Type: application/octet-stream

/Build/*.wasm
  Content-Type: application/wasm

/Build/*.framework.js
  Content-Type: application/javascript

/Build/*.js
  Content-Type: application/javascript

/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
"@ | Set-Content -LiteralPath $headersPath -NoNewline

Write-Host "Copied $Source to $Destination. Push the repo and set Cloudflare Pages output directory to: web-dist"
