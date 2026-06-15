@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

rem ============================================================
rem  AI 建站工具 - Windows 一键初始化 (级别: standard)
rem  双击运行：提示输入项目名后，在当前目录生成规范化 Nuxt 3 项目
rem ============================================================

echo ============================================
echo   AI 建站工具 - 一键初始化 (standard)
echo ============================================
echo.

:ask
set "PROJECT_NAME="
set /p "PROJECT_NAME=请输入项目名称(将作为目录名): "
if "!PROJECT_NAME!"=="" (
  echo [提示] 项目名不能为空，请重新输入。
  echo.
  goto ask
)

echo.
echo 即将在 "%CD%\!PROJECT_NAME!" 初始化项目 [!PROJECT_NAME!] (级别: standard)
echo.

rem 优先使用 Node 版 CLI，未安装 Node 时回退到 Python 版
where node >nul 2>nul
if !errorlevel! equ 0 (
  node "%~dp0create.mjs" "!PROJECT_NAME!" --level standard --name "!PROJECT_NAME!"
  goto finish
)

where python >nul 2>nul
if !errorlevel! equ 0 (
  python "%~dp0init_site.py" "!PROJECT_NAME!" --level standard --name "!PROJECT_NAME!"
  goto finish
)

echo [错误] 未检测到 Node 或 Python。
echo        请先安装 Node.js 18+ ^(https://nodejs.org^) 后重试。
echo.
pause
exit /b 1

:finish
echo.
if !errorlevel! neq 0 (
  echo [失败] 初始化未成功，请查看上方报错信息。
) else (
  echo [完成] 项目已生成：%CD%\!PROJECT_NAME!
  echo.
  echo 下一步：
  echo   cd !PROJECT_NAME!
  echo   npm install
  echo   npm run dev
)
echo.
pause
endlocal
