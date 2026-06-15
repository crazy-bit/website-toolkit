@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

rem ============================================================
rem  AI 建站工具 - Windows 一键初始化
rem  双击运行：依次输入项目名与级别，在当前目录生成规范化 Nuxt 3 项目
rem ============================================================

echo ============================================
echo   AI 建站工具 - 一键初始化
echo ============================================
echo.

:ask_name
set "PROJECT_NAME="
set /p "PROJECT_NAME=请输入项目名称(将作为目录名): "
if "!PROJECT_NAME!"=="" (
  echo [提示] 项目名不能为空，请重新输入。
  echo.
  goto ask_name
)

:ask_level
echo.
echo 请选择模板级别:
echo   1^) minimal   - 仅统一架构 + AGENTS 规则
echo   2^) standard  - + 日志 + 调试 + 友好错误页 ^(默认^)
echo   3^) full      - + 单测 + Playwright + 路由冒烟 + ESLint
set "LEVEL_INPUT="
set /p "LEVEL_INPUT=请输入序号或级别名 [回车默认 standard]: "

if "!LEVEL_INPUT!"=="" set "LEVEL_INPUT=standard"

set "LEVEL="
if /i "!LEVEL_INPUT!"=="1" set "LEVEL=minimal"
if /i "!LEVEL_INPUT!"=="2" set "LEVEL=standard"
if /i "!LEVEL_INPUT!"=="3" set "LEVEL=full"
if /i "!LEVEL_INPUT!"=="minimal" set "LEVEL=minimal"
if /i "!LEVEL_INPUT!"=="standard" set "LEVEL=standard"
if /i "!LEVEL_INPUT!"=="full" set "LEVEL=full"

if not defined LEVEL (
  echo [提示] 无效的级别 "!LEVEL_INPUT!"，请输入 1/2/3 或 minimal/standard/full。
  goto ask_level
)

echo.
echo 即将在 "%CD%\!PROJECT_NAME!" 初始化项目 [!PROJECT_NAME!] (级别: !LEVEL!)
echo.

rem 优先使用 Node 版 CLI，未安装 Node 时回退到 Python 版
where node >nul 2>nul
if !errorlevel! equ 0 (
  node "%~dp0create.mjs" "!PROJECT_NAME!" --level !LEVEL! --name "!PROJECT_NAME!"
  goto finish
)

where python >nul 2>nul
if !errorlevel! equ 0 (
  python "%~dp0init_site.py" "!PROJECT_NAME!" --level !LEVEL! --name "!PROJECT_NAME!"
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
  echo [完成] 项目已生成：%CD%\!PROJECT_NAME!  (级别: !LEVEL!)
  echo.
  echo 下一步：
  echo   cd !PROJECT_NAME!
  echo   npm install
  if /i "!LEVEL!"=="full" echo   npx playwright install   ^(首次安装浏览器^)
  echo   npm run dev
)
echo.
pause
endlocal
