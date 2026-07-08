param(
  [string]$Root = "Vakibh-media"
)

$ErrorActionPreference = "Stop"
$win1252 = [System.Text.Encoding]::GetEncoding(1252)
$utf8 = [System.Text.Encoding]::UTF8
$patterns = 'à¤|à¥|â€|Â'
$extensions = @("*.html", "*.css", "*.js")
$changed = 0

foreach ($extension in $extensions) {
  Get-ChildItem -Path $Root -Recurse -Filter $extension | ForEach-Object {
    $text = Get-Content -Raw -Encoding UTF8 -LiteralPath $_.FullName
    if ($text -notmatch $patterns) {
      return
    }

    $fixed = $utf8.GetString($win1252.GetBytes($text))
    $fixed = $fixed -replace [char]0x00A0, ' '
    Set-Content -LiteralPath $_.FullName -Value $fixed -Encoding UTF8
    $changed++
  }
}

Write-Host "Fixed mojibake files: $changed"
