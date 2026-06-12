#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI 建站工具脚手架初始化器
===========================

执行后将指定目录初始化为符合《AI 建站工具方案》规范的项目骨架，
用户在该目录中用 AI 开发即自动遵循统一架构 / 日志 / 测试 / 调试规范。

技术栈：Nuxt 3 + Nuxt UI 3 + Tailwind + GSAP + Lenis + Iconify + TypeScript

用法：
    python init_site.py <目标目录> [--level minimal|standard|full] [--name 项目名] [--force]

示例：
    python init_site.py ./my-site
    python init_site.py ./my-site --level full --name my-cool-site
    python init_site.py . --level standard --force

分级（累加）：
    minimal   仅统一架构 + AGENTS 规则
    standard  + 日志系统 + 调试能力（推荐，默认）
    full      + Vitest 单测 + Playwright E2E + 路由冒烟
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from pathlib import Path

# Windows 控制台默认 GBK，强制 UTF-8 输出，避免中文/符号编码错误
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
    except Exception:
        pass

# ---------------------------------------------------------------------------
# 常量
# ---------------------------------------------------------------------------
TOOL_DIR = Path(__file__).resolve().parent
TEMPLATES_DIR = TOOL_DIR / "templates"

# 各级别累加的模板层
LEVEL_LAYERS = {
    "minimal": ["base"],
    "standard": ["base", "standard"],
    "full": ["base", "standard", "full"],
}

# 文本文件后缀（做 token 替换），其余按二进制原样拷贝
TEXT_SUFFIXES = {
    ".ts", ".js", ".mjs", ".cjs", ".vue", ".json", ".css", ".md",
    ".html", ".txt", ".yml", ".yaml", ".gitignore", ".env",
}

NAME_TOKEN = "__PROJECT_NAME__"

# 依赖版本（与参考实现 maoxianjia 对齐）
BASE_DEPS = {
    "@iconify-json/lucide": "^1.2.30",
    "@iconify-json/mdi": "^1.2.2",
    "@nuxt/ui": "^3.0.0",
    "gsap": "^3.12.7",
    "lenis": "^1.2.3",
    "nuxt": "^3.16.0",
    "vue": "^3.5.13",
    "vue-router": "^4.5.0",
}
BASE_DEV_DEPS = {
    "@iconify/vue": "^4.3.0",
    "@nuxtjs/color-mode": "^3.5.2",
    "typescript": "^5.7.0",
    "vue-tsc": "^2.2.0",
}
FULL_DEV_DEPS = {
    "vitest": "^3.0.0",
    "@nuxt/test-utils": "^3.15.0",
    "@vue/test-utils": "^2.4.6",
    "happy-dom": "^16.0.0",
    "@playwright/test": "^1.50.0",
    "fast-glob": "^3.3.3",
}


# ---------------------------------------------------------------------------
# 颜色输出（无依赖）
# ---------------------------------------------------------------------------
def _c(code: str, text: str) -> str:
    if not sys.stdout.isatty():
        return text
    return f"\033[{code}m{text}\033[0m"


def info(msg: str) -> None:
    print(f"{_c('36', '›')} {msg}")


def ok(msg: str) -> None:
    print(f"{_c('32', '✓')} {msg}")


def warn(msg: str) -> None:
    print(f"{_c('33', '!')} {msg}")


def err(msg: str) -> None:
    print(f"{_c('31', '✗')} {msg}", file=sys.stderr)


# ---------------------------------------------------------------------------
# package.json 生成（按级别）
# ---------------------------------------------------------------------------
def build_package_json(name: str, level: str) -> str:
    scripts = {
        "dev": "nuxt dev",
        "build": "nuxt build",
        "generate": "nuxt generate",
        "preview": "nuxt preview",
        "postinstall": "nuxt prepare",
        "typecheck": "nuxt typecheck",
        "new:page": "node scripts/new-page.mjs",
    }
    dev_deps = dict(BASE_DEV_DEPS)

    if level in ("standard", "full"):
        scripts["doctor"] = "node scripts/doctor.mjs"

    if level == "full":
        dev_deps.update(FULL_DEV_DEPS)
        scripts.update({
            "test:unit": "vitest run",
            "test:e2e": "playwright test",
            "test:smoke": "playwright test tests/e2e/smoke.routes.spec.ts",
            "check": "nuxt typecheck && vitest run && playwright test tests/e2e/smoke.routes.spec.ts",
        })
    else:
        scripts["check"] = "nuxt typecheck"

    pkg = {
        "name": name,
        "private": True,
        "type": "module",
        "scripts": dict(sorted(scripts.items())),
        "dependencies": dict(sorted(BASE_DEPS.items())),
        "devDependencies": dict(sorted(dev_deps.items())),
    }
    return json.dumps(pkg, indent=2, ensure_ascii=False) + "\n"


# ---------------------------------------------------------------------------
# 模板拷贝
# ---------------------------------------------------------------------------
def is_text_file(path: Path) -> bool:
    if path.suffix.lower() in TEXT_SUFFIXES:
        return True
    # 处理 .gitignore / .cursorrules 等无标准后缀的点文件
    return path.name in {".gitignore", ".cursorrules", ".env", "AGENTS.md"}


def copy_layer(layer: str, target: Path, name: str, force: bool) -> int:
    src_root = TEMPLATES_DIR / layer
    if not src_root.is_dir():
        warn(f"模板层不存在，跳过：{layer}")
        return 0
    count = 0
    for src in sorted(src_root.rglob("*")):
        if src.is_dir():
            continue
        rel = src.relative_to(src_root)
        # 模板里用 _gitignore / _cursorrules 占位避免被工具链忽略
        rel = Path(*[_unmask(p) for p in rel.parts])
        dst = target / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        # 上层（standard/full）覆盖下层同名文件属预期行为
        if is_text_file(src):
            content = src.read_text(encoding="utf-8").replace(NAME_TOKEN, name)
            dst.write_text(content, encoding="utf-8")
        else:
            shutil.copy2(src, dst)
        count += 1
    return count


def _unmask(part: str) -> str:
    mapping = {
        "_gitignore": ".gitignore",
        "_cursorrules": ".cursorrules",
        "_env": ".env",
    }
    return mapping.get(part, part)


# ---------------------------------------------------------------------------
# 主流程
# ---------------------------------------------------------------------------
def init(target: Path, level: str, name: str, force: bool) -> None:
    if not TEMPLATES_DIR.is_dir():
        err(f"找不到模板目录：{TEMPLATES_DIR}")
        sys.exit(1)

    if target.exists():
        non_empty = any(target.iterdir())
        if non_empty and not force:
            err(f"目标目录非空：{target}")
            err("如需在已有目录初始化，请加 --force（会覆盖同名文件）")
            sys.exit(1)
    target.mkdir(parents=True, exist_ok=True)

    info(f"初始化项目：{_c('1', name)}")
    info(f"目标目录：{target.resolve()}")
    info(f"级别：{_c('1', level)}（{ '+'.join(LEVEL_LAYERS[level]) }）")
    print()

    total = 0
    for layer in LEVEL_LAYERS[level]:
        n = copy_layer(layer, target, name, force)
        total += n
        ok(f"应用模板层 {_c('1', layer)}：{n} 个文件")

    # package.json 动态生成
    (target / "package.json").write_text(
        build_package_json(name, level), encoding="utf-8"
    )
    ok("生成 package.json（按级别裁剪依赖与脚本）")

    print()
    ok(f"完成！共写入 {total + 1} 个文件")
    print_next_steps(target, level)


def print_next_steps(target: Path, level: str) -> None:
    print()
    print(_c("1", "下一步："))
    try:
        rel = target.resolve().relative_to(Path.cwd())
        cd = f"  cd {rel}"
    except ValueError:
        cd = f"  cd {target.resolve()}"
    print(cd)
    print("  npm install")
    if level == "full":
        print("  npx playwright install   # 首次安装浏览器")
    print("  npm run dev              # 启动开发服务器")
    print()
    print(_c("1", "之后用 AI 开发时："))
    print("  · 项目根目录的 AGENTS.md / .cursorrules 会让 AI 自动遵循规范")
    print("  · 新建页面：npm run new:page <名字>")
    print("  · 改完检查：npm run check")
    if level in ("standard", "full"):
        print("  · 出问题打包诊断：npm run doctor，或在错误页点【复制诊断信息】")
    print()


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(
        prog="init_site",
        description="将指定目录初始化为符合《AI 建站工具方案》规范的项目骨架。",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("target", help="目标目录（不存在会自动创建）")
    parser.add_argument(
        "--level", "-l",
        choices=list(LEVEL_LAYERS.keys()),
        default="standard",
        help="模板级别（默认 standard）",
    )
    parser.add_argument(
        "--name", "-n",
        default=None,
        help="项目名（默认取目标目录名）",
    )
    parser.add_argument(
        "--force", "-f",
        action="store_true",
        help="目标目录非空时仍继续，并覆盖同名文件",
    )
    args = parser.parse_args(argv)

    target = Path(args.target)
    name = args.name or target.resolve().name
    name = _normalize_name(name)

    init(target, args.level, name, args.force)


def _normalize_name(name: str) -> str:
    # npm 包名规范：小写、允许 - 和数字
    n = name.strip().lower()
    n = re.sub(r"[^a-z0-9._-]+", "-", n)
    n = n.strip("-._") or "my-site"
    return n


if __name__ == "__main__":
    main()
