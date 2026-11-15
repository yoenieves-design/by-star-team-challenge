$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$version = (Get-Content -Raw -LiteralPath (Join-Path $root 'package.json') | ConvertFrom-Json).version
$distribution = Join-Path $root 'dist'
$loader = Join-Path $root 'wordpress/snippets/by-star-loader.php'
$guide = Join-Path $root 'docs/WORDPRESS-SETUP.md'

foreach ($file in @('assets/by-star-app.js', 'assets/by-star-app.css', 'simulation/streams/personal.json')) {
    if (-not (Test-Path -LiteralPath (Join-Path $distribution $file) -PathType Leaf)) {
        throw 'Build the demo with npm run build before packaging it.'
    }
}

$release = Join-Path $root 'release'
New-Item -ItemType Directory -Force $release | Out-Null
$destination = Join-Path $release "BY-STAR-WordPress-$version.zip"
$temporary = Join-Path $release ([System.IO.Path]::GetRandomFileName())
try {
    $archive = [System.IO.Compression.ZipFile]::Open($temporary, [System.IO.Compression.ZipArchiveMode]::Create)
    try {
        foreach ($file in Get-ChildItem -LiteralPath $distribution -File -Recurse) {
            $relative = [System.IO.Path]::GetRelativePath($distribution, $file.FullName).Replace('\', '/')
            $entry = "by-star/v$version/$relative"
            [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $file.FullName, $entry) | Out-Null
        }
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $loader, 'by-star-loader.php') | Out-Null
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $guide, 'INSTALL.md') | Out-Null
    }
    finally {
        $archive.Dispose()
    }
    [System.IO.File]::Move($temporary, $destination, $true)
    Write-Output $destination
}
finally {
    if (Test-Path -LiteralPath $temporary -PathType Leaf) {
        Remove-Item -LiteralPath $temporary
    }
}
