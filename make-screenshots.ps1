Add-Type -AssemblyName System.Drawing

function New-Promo([int]$w, [int]$h, [string]$out) {
  $bmp = New-Object System.Drawing.Bitmap($w, $h)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $g.TextRenderingHint = 'AntiAliasGridFit'

  $rect = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
  $c1 = [System.Drawing.Color]::FromArgb(255, 15, 16, 32)
  $c2 = [System.Drawing.Color]::FromArgb(255, 58, 19, 48)
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $c1, $c2, 60)
  $g.FillRectangle($brush, $rect)

  $sf = New-Object System.Drawing.StringFormat
  $sf.Alignment = 'Center'; $sf.LineAlignment = 'Center'

  $pink = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 93, 143))
  $white = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
  $gray = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 154, 155, 192))

  $emojiFont = New-Object System.Drawing.Font('Segoe UI Emoji', [int]($h * 0.10), [System.Drawing.GraphicsUnit]::Pixel)
  $g.DrawString([char]::ConvertFromUtf32(0x1F469), $emojiFont, $white, ($w / 2), ($h * 0.28), $sf)

  $titleFont = New-Object System.Drawing.Font('Segoe UI', [int]($h * 0.06), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $g.DrawString('Me Thien Ha', $titleFont, $pink, ($w / 2), ($h * 0.45), $sf)

  $subFont = New-Object System.Drawing.Font('Segoe UI', [int]($h * 0.028), [System.Drawing.GraphicsUnit]::Pixel)
  $g.DrawString('Quan ly tai chinh kieu bi mang moi tiet kiem', $subFont, $white, ($w / 2), ($h * 0.54), $sf)
  $g.DrawString('tridpt.github.io/money-mom', $subFont, $gray, ($w / 2), ($h * 0.62), $sf)

  $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
  Write-Host "Created $out"
}

$dir = Join-Path $PSScriptRoot 'screenshots'
New-Item -ItemType Directory -Path $dir -Force | Out-Null
New-Promo 1080 1920 (Join-Path $dir 'promo-narrow.png')
New-Promo 1920 1080 (Join-Path $dir 'promo-wide.png')
