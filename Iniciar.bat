@echo off
REM Sobe o servidor Flask da Ficha Avalon na porta 5050.
setlocal
cd /d "%~dp0"

REM Garante Flask instalado (silencioso se ja instalado)
python -m pip install --quiet flask >nul 2>&1

echo.
echo ============================================================
echo   Ficha Avalon - servidor local
echo   http://127.0.0.1:5050
echo.
echo   Para acesso externo (celular fora de casa), abra tambem
echo   scripts\Iniciar-Tunel-Ngrok.bat em outra janela.
echo ============================================================
echo.
python app.py
endlocal
