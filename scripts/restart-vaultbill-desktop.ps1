param(
    [ValidateSet('Restart', 'Quit')]
    [string]$Action = 'Restart'
)

$metadataPath = Join-Path $env:TEMP 'vaultbill-runtime-process.json'

if (-not (Test-Path $metadataPath)) {
    throw "VaultBill process metadata was not found at $metadataPath."
}

$processInfo = Get-Content -Path $metadataPath -Raw | ConvertFrom-Json

if (-not $processInfo.pid) {
    throw 'VaultBill process metadata is missing a pid.'
}

$targetProcess = Get-Process -Id $processInfo.pid -ErrorAction Stop

if ($Action -eq 'Restart') {
    $argumentList = @()
    if ($processInfo.args) {
        $argumentList = @($processInfo.args)
    }

    Stop-Process -Id $targetProcess.Id -Force
    Wait-Process -Id $targetProcess.Id -Timeout 15 -ErrorAction SilentlyContinue

    Start-Process -FilePath $processInfo.execPath `
        -ArgumentList $argumentList `
        -WorkingDirectory $processInfo.cwd `
        -WindowStyle Hidden
    return
}

Stop-Process -Id $targetProcess.Id -Force
