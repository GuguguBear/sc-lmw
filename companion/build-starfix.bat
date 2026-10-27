@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title 打包 Starfix

echo.
echo  正在用当前源码打包 Starfix.exe
echo.

call :find_python
if not defined PY (
  echo  没有找到 Python 3。
  echo  请先安装 Python 3，安装时勾选 Add python.exe to PATH。
  echo  https://www.python.org/downloads/
  goto :fail
)

echo  使用 "%PY%"
"%PY%" -c "import sys; print(sys.version)"
if errorlevel 1 goto :fail

"%PY%" -c "import PyInstaller" >nul 2>&1
if errorlevel 1 (
  echo.
  echo  正在安装打包工具 PyInstaller ...
  "%PY%" -m pip install --disable-pip-version-check pyinstaller
  if errorlevel 1 goto :fail
)

tasklist /FI "IMAGENAME eq Starfix.exe" /NH | find /I "Starfix.exe" >nul
if not errorlevel 1 (
  echo.
  echo  Starfix 正在运行。不关掉它，新的 exe 写不进去。
  echo  请先关闭所有 Starfix 窗口，然后按任意键继续。
  pause
  tasklist /FI "IMAGENAME eq Starfix.exe" /NH | find /I "Starfix.exe" >nul
  if not errorlevel 1 (
    echo  Starfix 仍在运行，这次没有打包。
    goto :fail
  )
)

echo.
echo  开始打包，大约需要一两分钟。
echo.

if exist "Starfix.spec" (
  "%PY%" -m PyInstaller --noconfirm --clean "Starfix.spec"
) else (
  "%PY%" -m PyInstaller --noconfirm --clean --onefile --windowed --name Starfix --icon "icon.ico" --add-data "icon.png;." --add-data "icon.ico;." --add-data "index.html;." --add-data "..\css\starmap.css;css" "app.py"
)
if errorlevel 1 goto :fail

if not exist "dist\Starfix.exe" (
  echo  打包命令结束了，但是没有找到 dist\Starfix.exe。
  goto :fail
)

echo.
echo  完成。
echo  %cd%\dist\Starfix.exe
echo.
explorer /select,"%cd%\dist\Starfix.exe"
goto :done

:find_python
set "PY="
where py >nul 2>&1
if not errorlevel 1 (
  for /f "delims=" %%E in ('py -3 -c "import sys; print(sys.executable)" 2^>nul') do (
    if not defined PY set "PY=%%E"
  )
)
if defined PY exit /b 0

for %%P in (
  "%LocalAppData%\Programs\Python\Python313\python.exe"
  "%LocalAppData%\Programs\Python\Python312\python.exe"
  "%LocalAppData%\Programs\Python\Python311\python.exe"
  "%LocalAppData%\Programs\Python\Python310\python.exe"
  "%ProgramFiles%\Python313\python.exe"
  "%ProgramFiles%\Python312\python.exe"
  "%ProgramFiles%\Python311\python.exe"
) do (
  if not defined PY if exist "%%~P" set "PY=%%~P"
)
if defined PY exit /b 0

where python >nul 2>&1
if not errorlevel 1 (
  for /f "delims=" %%W in ('where python 2^>nul') do (
    if not defined PY (
      echo %%W | find /I "\WindowsApps\" >nul
      if errorlevel 1 (
        "%%W" -c "import sys" >nul 2>&1
        if not errorlevel 1 set "PY=%%W"
      )
    )
  )
)
exit /b 0

:fail
echo.
echo  打包没有完成。
echo.
pause
exit /b 1

:done
echo.
pause
exit /b 0
