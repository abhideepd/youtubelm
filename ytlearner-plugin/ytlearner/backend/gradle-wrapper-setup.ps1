# Gradle Wrapper Setup Script
# This script downloads and installs the gradle-wrapper.jar file

$backendDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$wrapperDir = Join-Path $backendDir "gradle\wrapper"
$wrapperJar = Join-Path $wrapperDir "gradle-wrapper.jar"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Gradle Wrapper Installation Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Ensure directory exists
if (-not (Test-Path $wrapperDir)) {
    New-Item -ItemType Directory -Path $wrapperDir -Force | Out-Null
}

# Remove existing (potentially corrupted) jar
if (Test-Path $wrapperJar) {
    Write-Host "Removing old gradle-wrapper.jar..."
    Remove-Item $wrapperJar -Force
}

# Download gradle distribution
$downloadFile = "$env:TEMP\gradle-8.5-bin.zip"
$extractDir = "$env:TEMP\gradle-extract-$([guid]::NewGuid().ToString().Substring(0,8))"

Write-Host "Downloading Gradle 8.5 binary distribution..."
Write-Host "This may take a minute or two..."

try {
    $ProgressPreference = 'SilentlyContinue'
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12

    # Download using Invoke-WebRequest as fallback
    Invoke-WebRequest -Uri "https://services.gradle.org/distributions/gradle-8.5-bin.zip" `
        -OutFile $downloadFile -UseBasicParsing -TimeoutSec 300 -ErrorAction Stop

    $dlSize = [math]::Round((Get-Item $downloadFile).Length / 1MB, 1)
    Write-Host "✓ Downloaded: $dlSize MB" -ForegroundColor Green

    Write-Host "Extracting..."
    New-Item -ItemType Directory -Path $extractDir -Force | Out-Null
    Expand-Archive -Path $downloadFile -DestinationPath $extractDir -Force

    Write-Host "✓ Extracted successfully" -ForegroundColor Green

    # Copy the wrapper jar
    $wrapperSrc = Join-Path $extractDir "gradle-8.5\lib\gradle-wrapper-8.5.jar"
    if (Test-Path $wrapperSrc) {
        Copy-Item $wrapperSrc -Destination $wrapperJar -Force
        $jarSize = [math]::Round((Get-Item $wrapperJar).Length / 1KB, 2)
        Write-Host "✓ gradle-wrapper.jar installed ($jarSize KB)" -ForegroundColor Green

        # Verify wrapper works
        Write-Host ""
        Write-Host "Testing gradle wrapper..."
        $output = & "$backendDir\gradlew.bat" --version 2>&1
        if ($output -like "*Gradle*") {
            Write-Host "✓ Gradle wrapper is working!" -ForegroundColor Green
            Write-Host ""
            Write-Host $output
        } else {
            Write-Host "✗ Wrapper test failed" -ForegroundColor Red
            Write-Host $output
        }
    } else {
        Write-Host "✗ ERROR: Wrapper jar not found at $wrapperSrc" -ForegroundColor Red
        exit 1
    }

} catch {
    Write-Host "✗ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    # Cleanup
    Write-Host ""
    Write-Host "Cleaning up temporary files..."
    if (Test-Path $downloadFile) { Remove-Item $downloadFile -Force -ErrorAction SilentlyContinue }
    if (Test-Path $extractDir) { Remove-Item $extractDir -Recurse -Force -ErrorAction SilentlyContinue }
    Write-Host "✓ Cleanup complete" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can now use Gradle with:"
Write-Host "  .\gradlew.bat build    (Windows)"
Write-Host "  ./gradlew build        (Unix/Mac/Git Bash)"

