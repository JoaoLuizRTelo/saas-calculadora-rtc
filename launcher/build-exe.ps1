# Gera "Sistema RTC.exe" na raiz do projeto. Rode dentro da pasta do projeto:
#   powershell -ExecutionPolicy Bypass -File launcher\build-exe.ps1
# Requer Python 3.10+ instalado. As ferramentas (PyInstaller e Pillow) ficam num ambiente
# isolado em launcher\.venv-build, criado na primeira vez; o Python global não é alterado.
$ErrorActionPreference = "Stop"
$aqui = $PSScriptRoot
$raiz = Split-Path $aqui -Parent
$venv = Join-Path $aqui ".venv-build"
$py = Join-Path $venv "Scripts\python.exe"

if (-not (Test-Path $py)) {
    Write-Host "Criando ambiente de build (só na primeira vez)..."
    python -m venv $venv
    if ($LASTEXITCODE -ne 0) { throw "Não consegui criar o ambiente virtual" }
    & $py -m pip install --quiet --disable-pip-version-check pyinstaller pillow
    if ($LASTEXITCODE -ne 0) { throw "Não consegui instalar pyinstaller/pillow" }
}

& $py "$aqui\gerar_icone.py"
if ($LASTEXITCODE -ne 0) { throw "Falhou ao gerar o ícone" }

& $py -m PyInstaller --noconfirm --clean --onefile --noconsole `
    --name "Sistema RTC" `
    --icon "$aqui\icone.ico" `
    --add-data "$aqui\icone.ico;." `
    --distpath "$aqui\dist" --workpath "$aqui\build" --specpath "$aqui\build" `
    "$aqui\launcher.py"
if ($LASTEXITCODE -ne 0) { throw "PyInstaller falhou" }

Copy-Item "$aqui\dist\Sistema RTC.exe" "$raiz\Sistema RTC.exe" -Force
Write-Host "Pronto: $raiz\Sistema RTC.exe"
