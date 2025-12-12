# Server Configuration
$ServerIP = "121.48.45.133"
$User = "root"
# Password: Wgzx_82276

Write-Host "Starting deployment to $ServerIP..."
Write-Host "Please enter the password ($User) when prompted."

# 1. Upload deploy.zip and setup script
Write-Host "Uploading deploy.zip and setup script..."
scp deploy.zip setup_remote.sh ${User}@${ServerIP}:/root/

# 2. Execute remote setup script
Write-Host "Executing remote setup..."
ssh ${User}@${ServerIP} "bash /root/setup_remote.sh"

Write-Host "Done!"
