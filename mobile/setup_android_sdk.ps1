$ErrorActionPreference = "Stop"
$SdkDir = "$env:LOCALAPPDATA\Android\Sdk"
$CmdLineToolsDir = "$SdkDir\cmdline-tools"
$LatestDir = "$CmdLineToolsDir\latest"

# 1. Create Directories
Write-Host "Creating SDK directories..."
New-Item -ItemType Directory -Force -Path $LatestDir | Out-Null

# 2. Download Command Line Tools
$ZipPath = "$env:TEMP\cmdline-tools.zip"
Write-Host "Downloading Android Command Line Tools via curl..."
curl.exe -L -o $ZipPath "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"

# 3. Extract Tools
Write-Host "Extracting..."
Expand-Archive -Path $ZipPath -DestinationPath "$env:TEMP\cmdline-tools-extracted" -Force

# 4. Move to proper structure (Sdk/cmdline-tools/latest)
Write-Host "Installing command line tools..."
Copy-Item -Path "$env:TEMP\cmdline-tools-extracted\cmdline-tools\*" -Destination $LatestDir -Recurse -Force

# 5. Set JAVA_HOME and PATH for sdkmanager
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:PATH = "$LatestDir\bin;" + $env:PATH

# 6. Accept Licenses & Install Required Packages
Write-Host "Accepting licenses and installing build-tools, platforms, and platform-tools..."
# Automate accepting licenses by piping 'y'
$yes = "y`n" * 50
$yes | sdkmanager --licenses
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"

Write-Host "Android SDK successfully installed and configured!"
