@echo off
setlocal
title Iniciar pyApy
pushd "%~dp0"
if errorlevel 1 exit /b 1

echo.
echo   pyApy
echo   1. Iniciar la web conectada (React + API + PostgreSQL)
echo   2. Abrir la demostracion HTML estatica
echo   3. Salir
echo.
choice /c 123 /n /m "Elige una opcion [1-3]: "
if errorlevel 3 goto fin
if errorlevel 2 goto html

where node >nul 2>&1
if errorlevel 1 (
  echo No se encontro Node.js. Instala Node.js 24 y vuelve a intentarlo.
  goto error
)
node -e "process.exit(Number(process.versions.node.split('.')[0]) === 24 ? 0 : 1)"
if errorlevel 1 (
  echo Este proyecto requiere Node.js 24.
  goto error
)
where npm >nul 2>&1
if errorlevel 1 (
  echo No se encontro npm. Revisa la instalacion de Node.js.
  goto error
)
if not exist "node_modules\vite\bin\vite.js" (
  echo Faltan dependencias. Ejecuta npm ci desde esta carpeta.
  goto error
)
if not exist ".env" goto sinconfig
if not exist ".local\postgres\PG_VERSION" goto sinconfig

echo.
echo Iniciando PostgreSQL local...
call npm run db:local
if errorlevel 1 goto error
echo.
echo Iniciando la web y la API...
echo Abre la URL que aparecera como "pyApy web".
echo Deja esta ventana abierta. Para detener la web y la API, pulsa Ctrl+C.
echo PostgreSQL seguira disponible en segundo plano.
echo.
call npm run dev
if errorlevel 1 goto error
goto fin

:sinconfig
echo Falta preparar el entorno local.
echo Consulta docs\DEVELOPMENT.md e instala PostgreSQL 16.
echo Luego ejecuta npm run setup desde esta carpeta una sola vez.
goto error

:html
if not exist "index.html" (
  echo No se encontro index.html en la carpeta del proyecto.
  goto error
)
start "" "%CD%\index.html"
if errorlevel 1 goto error
goto fin

:error
echo.
echo No se pudo iniciar pyApy. Revisa el mensaje anterior.
pause
popd
endlocal
exit /b 1

:fin
popd
endlocal
exit /b 0
