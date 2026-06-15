@echo off
chcp 65001 >nul
setlocal

rem ============================================================
rem  AI Web Scaffolder - one-click init (Windows)
rem  Thin launcher: all interactive prompts (Chinese) are handled
rem  by the Node CLI, which avoids the chcp 65001 batch-parsing bug.
rem ============================================================

echo ============================================
echo   AI Web Scaffolder - Quick Init
echo ============================================
echo.

where node >nul 2>nul
if %errorlevel%==0 goto run_node
goto try_python

:run_node
rem Node CLI: interactive prompts for name/level/agent, then auto npm install.
node "%~dp0create.mjs" --install
goto done

:try_python
where python >nul 2>nul
if %errorlevel%==0 goto run_python
echo [error] Node.js or Python is required.
echo         Please install Node.js 18+ from https://nodejs.org and retry.
echo.
pause
exit /b 1

:run_python
echo [warn] Node.js not found. Falling back to the Python generator
echo        (project generation only, no auto npm install).
echo.
set "PROJECT_NAME="
set /p "PROJECT_NAME=Project name (dir): "
if "%PROJECT_NAME%"=="" set "PROJECT_NAME=my-site"
python "%~dp0init_site.py" "%PROJECT_NAME%" --level full --name "%PROJECT_NAME%" --agent codebuddy
if %errorlevel% neq 0 (
  echo.
  echo [fail] Generation failed. See messages above.
  echo.
  pause
  exit /b 1
)
echo.
echo [next] Install Node.js 18+, then:  cd %PROJECT_NAME%  ^&  npm install  ^&  npm run dev
goto done

:done
echo.
pause
endlocal
