Add-Type -AssemblyName System.Drawing

function New-Icon([int]$size, [string]$out) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $g.TextRenderingHint = 'AntiAliasGridFit'

  # Nền gradient hồng -> tím
  $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
  $c1 = [System.Drawing.Color]::FromArgb(255, 255, 93, 143)
  $c2 = [System.Drawing.Color]::FromArgb(255, 124, 92, 255)
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $c1, $c2, 45)
  $g.FillRectangle($brush, $rect)

  # Ký hiệu tiền tệ ₫ màu trắng ở giữa
  $fontSize = [int]($size * 0.52)
  $font = New-Object System.Drawing.Font('Segoe UI', $fontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $white = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
  $sf = New-Object System.Drawing.StringFormat
  $sf.Alignment = 'Center'
  $sf.LineAlignment = 'Center'
  $g.DrawString([char]0x20AB, $font, $white, ($size / 2), ($size / 2 - $size * 0.03), $sf)

  $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
  Write-Host "Created $out"
}

New-Icon 192 (Join-Path $PSScriptRoot 'icon-192.png')
New-Icon 512 (Join-Path $PSScriptRoot 'icon-512.png')
