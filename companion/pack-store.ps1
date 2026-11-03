# Pack Starfix.exe into an MSIX for the Microsoft Store.
# The Store package is full trust, writes under LocalAppData, and does not
# replace itself from GitHub. Identity values come from Partner Center.

param(
  [Parameter(Mandatory = $true)][string]$Exe,
  [Parameter(Mandatory = $true)][string]$Icon,
  [Parameter(Mandatory = $true)][string]$Version,
  [Parameter(Mandatory = $true)][string]$IdentityName,
  [Parameter(Mandatory = $true)][string]$Publisher,
  [Parameter(Mandatory = $true)][string]$PublisherDisplayName,
  [Parameter(Mandatory = $true)][string]$Out
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

function XmlText([string]$Value) {
  return [System.Security.SecurityElement]::Escape($Value)
}

function New-Logo([string]$Source, [string]$Dest, [int]$Size) {
  $image = [System.Drawing.Image]::FromFile($Source)
  try {
    $canvas = New-Object System.Drawing.Bitmap $Size, $Size
    $draw = [System.Drawing.Graphics]::FromImage($canvas)
    $draw.Clear([System.Drawing.Color]::FromArgb(255, 2, 8, 4))
    $draw.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $scale = [Math]::Min($Size / $image.Width, $Size / $image.Height)
    $w = [int]($image.Width * $scale)
    $h = [int]($image.Height * $scale)
    $x = [int](($Size - $w) / 2)
    $y = [int](($Size - $h) / 2)
    $draw.DrawImage($image, $x, $y, $w, $h)
    $draw.Dispose()
    $canvas.Save($Dest, [System.Drawing.Imaging.ImageFormat]::Png)
    $canvas.Dispose()
  } finally {
    $image.Dispose()
  }
}

$parts = $Version.Trim() -split '\.'
if ($parts.Count -lt 4) {
  $parts = @($parts + @('0', '0', '0', '0'))[0..3]
}
$packageVersion = ($parts[0..3] -join '.')

$layout = Join-Path ([System.IO.Path]::GetTempPath()) ("starfix-msix-" + [guid]::NewGuid().ToString("N"))
$assets = Join-Path $layout "Assets"
New-Item -ItemType Directory -Path $assets | Out-Null
Copy-Item -LiteralPath $Exe -Destination (Join-Path $layout "Starfix.exe")
New-Logo $Icon (Join-Path $assets "Square44x44Logo.png") 44
New-Logo $Icon (Join-Path $assets "Square150x150Logo.png") 150
New-Logo $Icon (Join-Path $assets "StoreLogo.png") 50

$manifest = @"
<?xml version="1.0" encoding="utf-8"?>
<Package xmlns="http://schemas.microsoft.com/appx/manifest/foundation/windows10" xmlns:uap="http://schemas.microsoft.com/appx/manifest/uap/windows10" xmlns:rescap="http://schemas.microsoft.com/appx/manifest/foundation/windows10/restrictedcapabilities" IgnorableNamespaces="uap rescap">
  <Identity Name="$(XmlText $IdentityName)" Publisher="$(XmlText $Publisher)" Version="$packageVersion" ProcessorArchitecture="x64" />
  <Properties>
    <DisplayName>Starfix</DisplayName>
    <PublisherDisplayName>$(XmlText $PublisherDisplayName)</PublisherDisplayName>
    <Logo>Assets\StoreLogo.png</Logo>
    <Description>Reads Game.log on this computer and sends a place to a room you confirm. Unofficial fan tool.</Description>
  </Properties>
  <Dependencies>
    <TargetDeviceFamily Name="Windows.Desktop" MinVersion="10.0.17763.0" MaxVersionTested="10.0.26100.0" />
  </Dependencies>
  <Resources>
    <Resource Language="en-us" />
  </Resources>
  <Applications>
    <Application Id="Starfix" Executable="Starfix.exe" EntryPoint="Windows.FullTrustApplication">
      <uap:VisualElements DisplayName="Starfix" Description="Reads a local Game.log and sends your place to a confirmed room." Square150x150Logo="Assets\Square150x150Logo.png" Square44x44Logo="Assets\Square44x44Logo.png" BackgroundColor="#020804" />
    </Application>
  </Applications>
  <Capabilities>
    <rescap:Capability Name="runFullTrust" />
  </Capabilities>
</Package>
"@
$utf8 = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText((Join-Path $layout "AppxManifest.xml"), $manifest.Trim(), $utf8)

$kitRoot = "C:\Program Files (x86)\Windows Kits\10\bin"
$kit = Get-ChildItem $kitRoot -Directory | Sort-Object Name -Descending | Select-Object -First 1
if (-not $kit) { throw "Windows SDK was not found." }
$makeappx = Join-Path $kit.FullName "x64\makeappx.exe"
$signtool = Join-Path $kit.FullName "x64\signtool.exe"
if (-not (Test-Path $makeappx)) { throw "makeappx.exe was not found." }

$unsigned = Join-Path $layout "Starfix.msix"
& $makeappx pack /d $layout /p $unsigned /o
if ($LASTEXITCODE -ne 0) { throw "makeappx failed." }

$cert = New-SelfSignedCertificate -Type Custom -Subject $Publisher -KeyUsage DigitalSignature -FriendlyName "Starfix store" -CertStoreLocation "Cert:\CurrentUser\My" -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.3")
$pfx = Join-Path $layout "store.pfx"
$secret = "starfix-store"
$secure = ConvertTo-SecureString -String $secret -Force -AsPlainText
Export-PfxCertificate -Cert $cert -FilePath $pfx -Password $secure | Out-Null
& $signtool sign /fd SHA256 /f $pfx /p $secret $unsigned
if ($LASTEXITCODE -ne 0) { throw "signtool failed." }

New-Item -ItemType Directory -Path (Split-Path -Parent $Out) -Force | Out-Null
Copy-Item -LiteralPath $unsigned -Destination $Out -Force
Remove-Item -LiteralPath $layout -Recurse -Force
Write-Host $Out
