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

# 3. Obfuscate and Copy Backend Files
Write-Host "3. Obfuscating backend source files..."
$obfuscator = ".\node_modules\.bin\javascript-obfuscator.cmd"
if (-not (Test-Path $obfuscator)) {
    Write-Error "javascript-obfuscator not found. Run: npm install --save-dev javascript-obfuscator"
    exit 1
}
& $obfuscator server.js   --output deploy_temp/server.js   --compact true --string-array true --string-array-encoding base64 --control-flow-flattening false --identifier-names-generator mangled
& $obfuscator database.js --output deploy_temp/database.js --compact true --string-array true --string-array-encoding base64 --control-flow-flattening false --identifier-names-generator mangled

if (Test-Path services) {
    $servicesRoot = (Resolve-Path services).Path
    Get-ChildItem -LiteralPath $servicesRoot -Recurse -File -Filter *.js | ForEach-Object {
        $relativePath = $_.FullName.Substring($servicesRoot.Length).TrimStart([IO.Path]::DirectorySeparatorChar)
        $destination = Join-Path "deploy_temp/services" $relativePath
        New-Item -ItemType Directory -Path (Split-Path $destination -Parent) -Force | Out-Null
        & $obfuscator $_.FullName --output $destination --compact true --string-array true --string-array-encoding base64 --control-flow-flattening false --identifier-names-generator mangled
    }
}

Write-Host "3. Copying package files..."
Copy-Item package.json -Destination deploy_temp
if (Test-Path package-lock.json) { Copy-Item package-lock.json -Destination deploy_temp }

# 3.1. Keep the deployment package database-free.
# The production server owns /root/work-permit/work_permits.db; shipping a local
# test database would overwrite customer data when the zip is unpacked.
Write-Host "3.1. Skipping local database file; production data will be preserved on the server."

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
