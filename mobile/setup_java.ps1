$ErrorActionPreference = "Stop"
$JavaDir = "$env:LOCALAPPDATA\Java"
$JdkDir = "$JavaDir\jdk-17"

Write-Host "Creating Java directory..."
New-Item -ItemType Directory -Force -Path $JavaDir | Out-Null

$ZipPath = "$env:TEMP\jdk17.zip"
Write-Host "Downloading OpenJDK 17 via curl..."
curl.exe -L -o $ZipPath "https://aka.ms/download-jdk/microsoft-jdk-17-windows-x64.zip"

Write-Host "Extracting..."
Expand-Archive -Path $ZipPath -DestinationPath "$env:TEMP\jdk17-extracted" -Force

Write-Host "Installing JDK 17..."
# The zip contains a single folder like 'jdk-17.0.x+y'
$ExtractedFolder = Get-ChildItem "$env:TEMP\jdk17-extracted" | Select-Object -First 1
Move-Item -Path $ExtractedFolder.FullName -Destination $JdkDir -Force

Write-Host "Java 17 successfully installed at $JdkDir!"
