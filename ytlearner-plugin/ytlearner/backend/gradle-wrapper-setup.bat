@echo off
REM Gradle Wrapper Setup Script (Batch Version)
REM This script downloads and installs the gradle-wrapper.jar file

setlocal enabledelayedexpansion

cd /d "%~dp0"

echo.
echo ========================================
echo Gradle Wrapper Installation Script
echo ========================================
echo.

set "WRAPPER_DIR=%CD%\gradle\wrapper"
set "WRAPPER_JAR=%WRAPPER_DIR%\gradle-wrapper.jar"
set "DOWNLOAD_FILE=%TEMP%\gradle-8.5-bin.zip"
set "EXTRACT_DIR=%TEMP%\gradle-extract"

REM Check if wrapper dir exists
if not exist "%WRAPPER_DIR%" (
    mkdir "%WRAPPER_DIR%"
    echo Created gradle\wrapper directory
)

REM Remove old jar if exists
if exist "%WRAPPER_JAR%" (
    echo Removing old gradle-wrapper.jar...
    del /f /q "%WRAPPER_JAR%"
)

REM Download Gradle distribution
echo.
echo Downloading Gradle 8.5 binary distribution...
echo This may take a minute or two...
echo.

powershell -Command "^
    $ProgressPreference = 'SilentlyContinue'; ^
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12; ^
    try { ^
        Invoke-WebRequest -Uri 'https://services.gradle.org/distributions/gradle-8.5-bin.zip' ^
            -OutFile '%DOWNLOAD_FILE%' -UseBasicParsing -TimeoutSec 300 -ErrorAction Stop; ^
        Write-Host '[+] Download complete'; ^
    } catch { ^
        Write-Host '[!] Download failed: ' $_.Exception.Message; ^
        exit 1; ^
    } ^
"

if errorlevel 1 (
    echo Error: Download failed
    exit /b 1
)

REM Extract
echo Extracting...
powershell -Command "^
    try { ^
        if (Test-Path '%EXTRACT_DIR%') { Remove-Item '%EXTRACT_DIR%' -Recurse -Force } ^
        New-Item -ItemType Directory -Path '%EXTRACT_DIR%' -Force | Out-Null; ^
        Expand-Archive -Path '%DOWNLOAD_FILE%' -DestinationPath '%EXTRACT_DIR%' -Force; ^
        Write-Host '[+] Extraction complete'; ^
    } catch { ^
        Write-Host '[!] Extraction failed: ' $_.Exception.Message; ^
        exit 1; ^
    } ^
"

if errorlevel 1 (
    echo Error: Extraction failed
    exit /b 1
)

REM Copy wrapper jar
echo Copying gradle-wrapper.jar...
powershell -Command "^
    $src = '%EXTRACT_DIR%\gradle-8.5\lib\gradle-wrapper-8.5.jar'; ^
    $dst = '%WRAPPER_JAR%'; ^
    if (Test-Path $src) { ^
        Copy-Item $src -Destination $dst -Force; ^
        $size = [math]::Round((Get-Item $dst).Length/1KB, 2); ^
        Write-Host '[+] gradle-wrapper.jar installed (' $size 'KB)'; ^
    } else { ^
        Write-Host '[!] Wrapper jar not found at ' $src; ^
        exit 1; ^
    } ^
"

if errorlevel 1 (
    echo Error: Failed to copy gradle wrapper jar
    exit /b 1
)

REM Cleanup
echo.
echo Cleaning up temporary files...
if exist "%DOWNLOAD_FILE%" del /f /q "%DOWNLOAD_FILE%"
if exist "%EXTRACT_DIR%" rmdir /s /q "%EXTRACT_DIR%"
echo Cleanup complete

REM Test
echo.
echo Testing gradle wrapper...
call gradlew.bat --version
if errorlevel 1 (
    echo.
    echo WARNING: Gradle wrapper test failed
    echo Please check your Java installation
    exit /b 1
)

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo You can now use Gradle with:
echo   gradlew.bat build

endlocal

