# Server Configuration
$ServerIP = "121.48.45.133"
$User = "root"

Write-Host "=== Deploy to Intranet Server: $ServerIP ==="
Write-Host "You will be prompted for password TWICE."
Write-Host ""

# 1. Upload deploy.zip and setup_remote.sh
Write-Host "[1/2] Uploading files (enter password)..."
scp deploy.zip setup_remote.sh ${User}@${ServerIP}:/root/
if ($LASTEXITCODE -ne 0) {
    Write-Error "Upload failed (exit code $LASTEXITCODE). Check VPN and retry."
    exit 1
}
Write-Host "Upload OK."
Write-Host ""

# 2. Run setup on remote
Write-Host "[2/2] Running remote setup (enter password)..."
ssh ${User}@${ServerIP} "sed -i 's/\r//' /root/setup_remote.sh; bash /root/setup_remote.sh"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Remote setup failed."
    exit 1
}

Write-Host ""
Write-Host "=== Done! App running at http://${ServerIP}/ ==="
