@echo off
REM Sobe um tunel ngrok pra porta 5050.
REM Pre-requisito: 1) data/.env com NGROK_AUTHTOKEN preenchido
REM                2) ngrok.exe nesta pasta (ou no PATH) -- copie o do relatorio-motoboy se preciso
REM                3) o app rodando via Iniciar.bat (porta 5050)

setlocal
SET SCRIPT_DIR=%~dp0
SET PROJETO_DIR=%SCRIPT_DIR%..
SET ENV_FILE=%PROJETO_DIR%\data\.env

REM ===== Le NGROK_AUTHTOKEN do data/.env =====
set TOKEN=
for /f "usebackq tokens=1,* delims==" %%A in ("%ENV_FILE%") do (
  if /I "%%A"=="NGROK_AUTHTOKEN" set TOKEN=%%B
)
if "%TOKEN%"=="" (
  echo NGROK_AUTHTOKEN nao definido em %ENV_FILE%.
  pause
  exit /b 1
)

REM ===== Verifica ngrok.exe =====
where ngrok >nul 2>&1
if errorlevel 1 (
  if exist "%SCRIPT_DIR%ngrok.exe" (
    SET NGROK_EXE=%SCRIPT_DIR%ngrok.exe
  ) else if exist "%PROJETO_DIR%\..\relatorio-motoboy\scripts\ngrok.exe" (
    SET NGROK_EXE=%PROJETO_DIR%\..\relatorio-motoboy\scripts\ngrok.exe
  ) else (
    echo ngrok.exe nao encontrado. Baixe em https://ngrok.com/download
    echo e coloque em scripts\ngrok.exe ou no PATH.
    pause
    exit /b 1
  )
) else (
  SET NGROK_EXE=ngrok
)

REM ===== Configura authtoken (uma vez) =====
%NGROK_EXE% config add-authtoken %TOKEN% >nul 2>&1

REM ===== Sobe o tunel =====
echo.
echo ============================================================
echo   Tunel ngrok iniciando -- porta 5050
echo   Copie a URL https://*.ngrok-free.app que aparecer abaixo
echo   e abra no celular ou em qualquer navegador.
echo.
echo   Login: usuario + senha definidos em data\.env
echo   (campos APP_USER / APP_PASS)
echo ============================================================
echo.
%NGROK_EXE% http 5050
endlocal
