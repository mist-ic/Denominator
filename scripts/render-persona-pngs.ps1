Add-Type -AssemblyName System.Drawing

function Draw-Avatar {
  param([string]$Path, [string]$Letter, [string]$Hex)
  $c = [System.Drawing.ColorTranslator]::FromHtml($Hex)
  $bmp = New-Object System.Drawing.Bitmap 256, 256
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = "AntiAlias"
  $g.TextRenderingHint = "AntiAlias"
  $g.Clear([System.Drawing.Color]::FromArgb(255, 18, 18, 26))
  $rect = New-Object Drawing.Rectangle 0, 0, 256, 256
  $brushBg = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $rect, $c, [System.Drawing.Color]::FromArgb(255, 12, 12, 22), 42
  )
  $g.FillEllipse($brushBg, 12, 12, 232, 232)
  $font = New-Object System.Drawing.Font(
    "Segoe UI", 98, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel
  )
  $white = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(245, 245, 250))
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = "Center"
  $format.LineAlignment = "Center"
  $g.DrawString($Letter, $font, $white, (New-Object Drawing.RectangleF 0, 0, 256, 256), $format)
  $g.Dispose()
  $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}

$root = Split-Path -Parent $PSScriptRoot
$dir = Join-Path $root "public\personas"
Draw-Avatar (Join-Path $dir "anshuman.png") "A" "#5caafc"
Draw-Avatar (Join-Path $dir "abhimanyu.png") "B" "#fc5c8a"
Draw-Avatar (Join-Path $dir "kshitij.png") "K" "#5cfcaa"
