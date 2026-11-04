param([Parameter(Mandatory=$true)][string]$InputDirectory)
# Windows OCR: processing stays on this device. Run with Windows PowerShell 5.1.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Storage.StorageFile, Windows.Storage, ContentType=WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapDecoder, Windows.Foundation, ContentType=WindowsRuntime]
$null = [Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType=WindowsRuntime]
$null = [Windows.Globalization.Language, Windows.Globalization, ContentType=WindowsRuntime]
$asTask = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' } | Select-Object -First 1
function Await-WinRT($Operation, [Type]$ResultType) {
    $task = $asTask.MakeGenericMethod($ResultType).Invoke($null, @($Operation))
    $task.Wait()
    $task.Result
}
$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage([Windows.Globalization.Language]::new('it-IT'))
$files = Get-ChildItem -LiteralPath $InputDirectory -Filter *.png -Recurse | Sort-Object FullName
$done = 0
foreach ($file in $files) {
    $target = [IO.Path]::ChangeExtension($file.FullName, '.ocr.json')
    if (Test-Path -LiteralPath $target) { continue }
    $storage = Await-WinRT ([Windows.Storage.StorageFile]::GetFileFromPathAsync($file.FullName)) ([Windows.Storage.StorageFile])
    $stream = Await-WinRT ($storage.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
    try {
        $decoder = Await-WinRT ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
        $bitmap = Await-WinRT ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
        try {
            $result = Await-WinRT ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])
            $data = @{ file=$file.Name; text=$result.Text; lines=@($result.Lines | ForEach-Object { $_.Text }); engine='Windows OCR it-IT'; reviewed=$false }
            [IO.File]::WriteAllText($target, ($data | ConvertTo-Json -Depth 5), [Text.UTF8Encoding]::new($false))
        } finally { $bitmap.Dispose() }
    } finally { $stream.Dispose() }
    $done++
    if ($done % 20 -eq 0) { Write-Output "OCR: $done pages processed" }
}
Write-Output "OCR finished: $done new pages"
