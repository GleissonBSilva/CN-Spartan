param(
  [Parameter(Mandatory = $true)][string]$Jobs,
  [Parameter(Mandatory = $true)][string]$Voice,
  [int]$Rate = 0
)
# Sintetiza cada fala do JSON em um WAV usando a voz do Windows (System.Speech).
# Chamado por make-dub.mjs. Formato do JSON: [{ "text": "...", "file": "C:\\...\\001.wav" }]
$ErrorActionPreference = 'Stop'

try {
  Add-Type -AssemblyName System.Speech
  $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
  $synth.SelectVoice($Voice)
  $synth.Rate = [Math]::Max(-10, [Math]::Min(10, $Rate))

  $list = Get-Content -Raw -Encoding UTF8 -Path $Jobs | ConvertFrom-Json
  foreach ($job in $list) {
    $synth.SetOutputToWaveFile([string]$job.file)
    $synth.Speak([string]$job.text)
  }
  $synth.SetOutputToNull()
  $synth.Dispose()
  exit 0
} catch {
  [Console]::Error.WriteLine("[synth] " + $_.Exception.Message)
  exit 1
}
