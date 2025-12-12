# build_and_package.ps1
$ErrorActionPreference = "Stop"

Write-Host "=== Starting Build and Package Process ==="

# 1. Build Frontend
Write-Host "1. Building Frontend..."
Push-Location client
try {
    npm install
    npm run build
}
catch {
    Write-Error "Frontend build failed!"
    exit 1
}
finally {
    Pop-Location
}

# 2. Prepare Temporary Directory
Write-Host "2. Preparing temporary directory 'deploy_temp'..."
if (Test-Path deploy_temp) { Remove-Item -Recurse -Force deploy_temp }
New-Item -ItemType Directory deploy_temp | Out-Null

# 3. Copy Backend Files
Write-Host "3. Copying backend files..."
Copy-Item server.js, database.js, package.json -Destination deploy_temp
if (Test-Path package-lock.json) { Copy-Item package-lock.json -Destination deploy_temp }

# 3.1. Copy Database File (if exists)
if (Test-Path work_permits.db) {
    Write-Host "3.1. Copying database file..."
    Copy-Item work_permits.db -Destination deploy_temp
} else {
    Write-Host "3.1. No existing database file found (will be created on first run)"
}

# 4. Copy Frontend Build Artifacts
Write-Host "4. Copying frontend build artifacts..."
New-Item -ItemType Directory deploy_temp/client | Out-Null
if (-not (Test-Path client/dist)) {
    Write-Error "client/dist not found! Did the build succeed?"
    exit 1
}
Copy-Item -Recurse client/dist deploy_temp/client/

# 5. Create Zip Archive
Write-Host "5. Creating deploy.zip..."
if (Test-Path deploy.zip) { Remove-Item -Force deploy.zip }
Compress-Archive -Path deploy_temp/* -DestinationPath deploy.zip -Force

# 6. Cleanup
Write-Host "6. Cleaning up..."
Remove-Item -Recurse -Force deploy_temp

Write-Host "=== Build and Package Complete! ==="
Write-Host "File created: $(Resolve-Path deploy.zip)"
