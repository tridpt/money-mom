Add-Type -AssemblyName System.Drawing

function New-Shot([string]$title, [string]$sub, [string]$out) {
  $w = 800; $h = 500
  $bmp = New-Object System.Drawing.Bitmap($w, $h)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'; $g.TextRenderingHint = 'AntiAliasGridFit'
  $rect = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
  $c1 = [System.Drawing.Color]::FromArgb(255, 28, 29, 51)
  $c2 = [System.Drawing.Color]::FromArgb(255, 42, 28, 74)
  $br = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $c1, $c2, 60)
  $g.FillRectangle($br, $rect)
  $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 255, 93, 143), 4)
  $g.DrawRectangle($pen, 12, 12, $w - 24, $h - 24)
  $sf = New-Object System.Drawing.StringFormat; $sf.Alignment = 'Center'; $sf.LineAlignment = 'Center'
  $pink = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 93, 143))
  $white = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
  $gray = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 154, 155, 192))
  $f1 = New-Object System.Drawing.Font('Segoe UI', 40, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $f2 = New-Object System.Drawing.Font('Segoe UI', 22, [System.Drawing.GraphicsUnit]::Pixel)
  $f3 = New-Object System.Drawing.Font('Segoe UI', 18, [System.Drawing.GraphicsUnit]::Pixel)
  $g.DrawString($title, $f1, $pink, ($w / 2), ($h / 2 - 50), $sf)
  $g.DrawString($sub, $f2, $white, ($w / 2), ($h / 2 + 20), $sf)
  $g.DrawString('Anh minh hoa - thay bang anh chup that tu app', $f3, $gray, ($w / 2), ($h - 50), $sf)
  $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose(); Write-Host "Created $out"
}

$d = Join-Path $PSScriptRoot 'screenshots'
New-Item -ItemType Directory -Path $d -Force | Out-Null
New-Shot 'Me Thien Ha' 'Giao dien chinh' (Join-Path $d 'main.png')
New-Shot 'Bi me phan' 'Tieu hoang la bi mang' (Join-Path $d 'scold.png')
New-Shot 'Bieu do & thong ke' 'Tien di dau nhieu nhat' (Join-Path $d 'charts.png')
