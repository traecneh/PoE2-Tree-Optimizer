param(
    [Parameter(Mandatory = $true)][string]$InstallPath,
    [string]$OutputDirectory = 'var\pob-evaluation-spike\runtime'
)

$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
$source = (Resolve-Path -LiteralPath $InstallPath).Path
$target = [IO.Path]::GetFullPath($OutputDirectory, $repo)
$allowedRoot = [IO.Path]::GetFullPath((Join-Path $repo 'var')) + [IO.Path]::DirectorySeparatorChar
if (-not $target.StartsWith($allowedRoot, [StringComparison]::OrdinalIgnoreCase)) {
    throw 'The experiment runtime must be inside this repository''s ignored var directory.'
}
if (Test-Path -LiteralPath $target) { throw 'The experiment destination already exists; refusing to overwrite it.' }
if (-not (Test-Path -LiteralPath (Join-Path $source 'lua51.dll'))) { throw 'The source is not a supported Windows PoB runtime.' }

New-Item -ItemType Directory -Path $target -Force | Out-Null
foreach ($name in @('Assets', 'Classes', 'Data', 'lua', 'Modules', 'SimpleGraphic', 'TreeData')) {
    Copy-Item -LiteralPath (Join-Path $source $name) -Destination $target -Recurse
}
Get-ChildItem -LiteralPath $source -File |
    Where-Object { $_.Extension -in @('.lua', '.dll') -or $_.Name -in @('manifest.xml', 'LICENSE.md') } |
    Copy-Item -Destination $target

$commit = 'bb52d6b368307457eb9c54bb13f1829993d390b1'
$helpers = @{
    '_SimpleGraphic.def.lua' = '2466CF30B4EBD7633A499374AACBA812DC8093C679C6158E47FA8E023E5957FE'
    'HeadlessWrapper.lua' = 'C23402983EE99E683108F3DA7182A67837FD76BF3594AE5CB91906CE691E16AD'
}
foreach ($name in $helpers.Keys) {
    $destination = Join-Path $target $name
    Invoke-WebRequest -Uri "https://raw.githubusercontent.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/$commit/src/$name" -OutFile $destination
    if ((Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash -ne $helpers[$name]) {
        throw "The downloaded headless helper did not match its pinned hash: $name"
    }
}
[xml]$manifest = Get-Content -LiteralPath (Join-Path $source 'manifest.xml')
$fingerprints = [ordered]@{}
foreach ($relative in @('manifest.xml', 'lua51.dll', 'Modules\Calcs.lua', 'Modules\CalcDefence.lua', 'Modules\CalcOffence.lua', 'Classes\CalcsTab.lua')) {
    $fingerprints[$relative] = (Get-FileHash -LiteralPath (Join-Path $source $relative) -Algorithm SHA256).Hash
}
$metadata = [ordered]@{
    kind = 'isolated-pob-evaluation-copy'
    version = $manifest.PoBVersion.Version.number
    helpersCommit = $commit
    installedMarkerCopied = $false
    userSettingsCopied = $false
    sourceFingerprints = $fingerprints
}
$metadata | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $target '.pob-evaluation-runtime.json') -Encoding utf8NoBOM
Write-Output "Prepared isolated PoB $($metadata.version) runtime: $target"
