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
                        [--agent codebuddy|claude-code|claude-internal|workbuddy|other]
                        [--entry 入口文件] [--ai-dir AI目录]

示例：
    python init_site.py ./my-site
    python init_site.py ./my-site --level full --name my-cool-site
    python init_site.py . --level standard --force
    python init_site.py ./my-site --agent claude-code
    python init_site.py ./my-site --agent other --entry MYTOOL.md --ai-dir .mytool

分级（累加）：
    minimal   仅统一架构 + AGENTS 规则
    standard  + 日志系统 + 调试能力（推荐，默认）
    full      + Vitest 单测 + Playwright E2E + 路由冒烟

Agent（决定默认加载的入口文件与 AI(skill/rule) 存放目录）：
    codebuddy           CODEBUDDY.md  + .codebuddy/   （默认）
    claude-code         CLAUDE.md     + .claude/
    claude-internal     CLAUDE.md     + .claude/
    workbuddy           CODEBUDDY.md  + .codebuddy/
    other               由 --entry / --ai-dir 自定义
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

# Agent 工具预设：决定「默认加载的入口文件」与「AI(skill/rule)存放目录」
# other 表示自定义，需由 --entry / --ai-dir 指定
AGENT_PRESETS = {
    "codebuddy":       {"entry": "CODEBUDDY.md", "ai_dir": ".codebuddy", "label": "CodeBuddy"},
    "claude-code":     {"entry": "CLAUDE.md",    "ai_dir": ".claude",    "label": "Claude Code"},
    "claude-internal": {"entry": "CLAUDE.md",    "ai_dir": ".claude",    "label": "Claude"},
    "workbuddy":       {"entry": "CODEBUDDY.md", "ai_dir": ".codebuddy", "label": "WorkBuddy"},
}
AGENT_CHOICES = list(AGENT_PRESETS.keys()) + ["other"]

# 文本文件后缀（做 token 替换），其余按二进制原样拷贝
TEXT_SUFFIXES = {
    ".ts", ".js", ".mjs", ".cjs", ".vue", ".json", ".css", ".md",
    ".html", ".txt", ".yml", ".yaml", ".gitignore", ".env",
}

NAME_TOKEN = "__PROJECT_NAME__"

# 依赖版本（采用经过验证的稳定组合）
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
    "@types/node": "^22.10.0",
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
    "eslint": "^9.0.0",
    "@nuxt/eslint": "^1.0.0",
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
            "lint": "eslint .",
            "lint:fix": "eslint . --fix",
            "test:unit": "vitest run",
            "test:e2e": "playwright test",
            "test:smoke": "playwright test tests/e2e/smoke.routes.spec.ts",
            "check": "npm run lint && nuxt typecheck && vitest run && playwright test tests/e2e/smoke.routes.spec.ts",
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
# Agent 入口文件 / AI 目录
# ---------------------------------------------------------------------------
def resolve_agent(agent: str, entry: str | None, ai_dir: str | None) -> tuple[str, str, str]:
    """返回 (入口文件名, AI 目录名, 展示标签)。"""
    if agent in AGENT_PRESETS:
        p = AGENT_PRESETS[agent]
        return entry or p["entry"], ai_dir or p["ai_dir"], p["label"]
    # other：必须显式指定入口文件与 AI 目录
    if not entry or not ai_dir:
        err("agent=other 时必须同时提供 --entry 与 --ai-dir")
        err("例如：--agent other --entry MYTOOL.md --ai-dir .mytool")
        sys.exit(1)
    label = Path(entry).stem or "AI"
    return entry, ai_dir, label


def build_entry_file(label: str) -> str:
    return (
        f"# {label} / AI 助手入口规则\n\n"
        f"> 本文件是 {label} 默认加载的项目规则入口。\n"
        "> 完整 AI 协作规范见根目录 `AGENTS.md`，请严格遵守其中的技术栈、目录约定、\n"
        "> 命名规范、日志规范、测试工作流等全部要求。\n\n"
        "简述：Nuxt 3 + Nuxt UI 3 + Tailwind + GSAP + Lenis + Iconify + TypeScript。\n"
        "新页面放 pages/；逻辑放 composables/；请求走 useApi.ts；日志用 useLogger；\n"
        "禁止裸 console.log / 组件内直接 fetch / 新增同类库。改完跑 npm run check。\n"
    )


def build_ai_dir_rule(label: str) -> str:
    return (
        "# 项目规则（rule）\n\n"
        f"本目录用于存放 {label} 的技能（skill）与规则（rule）。\n"
        "项目的完整 AI 协作规范见根目录 `AGENTS.md`，新增规则 / 技能请放在本目录下，\n"
        "并保持与 `AGENTS.md` 一致，不要与其冲突。\n"
    )


def write_agent_files(target: Path, entry: str, ai_dir: str, label: str) -> int:
    """生成 agent 入口文件与 AI 目录下的规则文件，返回写入文件数。"""
    (target / entry).write_text(build_entry_file(label), encoding="utf-8")
    rules_dir = target / ai_dir / "rules"
    rules_dir.mkdir(parents=True, exist_ok=True)
    (rules_dir / "project.md").write_text(build_ai_dir_rule(label), encoding="utf-8")
    return 2


# ---------------------------------------------------------------------------
# 模板拷贝
# ---------------------------------------------------------------------------
def is_text_file(path: Path) -> bool:
    if path.suffix.lower() in TEXT_SUFFIXES:
        return True
    # 处理 .gitignore / .env 等无标准后缀的点文件
    return path.name in {".gitignore", ".env", "AGENTS.md"}


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
        "_env": ".env",
    }
    return mapping.get(part, part)


# ---------------------------------------------------------------------------
# 主流程
# ---------------------------------------------------------------------------
def init(target: Path, level: str, name: str, force: bool,
         agent: str, entry: str | None, ai_dir: str | None) -> None:
    if not TEMPLATES_DIR.is_dir():
        err(f"找不到模板目录：{TEMPLATES_DIR}")
        sys.exit(1)

    entry_file, ai_dir_name, label = resolve_agent(agent, entry, ai_dir)

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
    info(f"Agent：{_c('1', label)}（入口 {entry_file} / AI 目录 {ai_dir_name}）")
    print()

    total = 0
    for layer in LEVEL_LAYERS[level]:
        n = copy_layer(layer, target, name, force)
        total += n
        ok(f"应用模板层 {_c('1', layer)}：{n} 个文件")

    # agent 入口文件 + AI 目录
    total += write_agent_files(target, entry_file, ai_dir_name, label)
    ok(f"生成 agent 入口 {_c('1', entry_file)} 与 AI 目录 {_c('1', ai_dir_name + '/')}")

    # package.json 动态生成
    (target / "package.json").write_text(
        build_package_json(name, level), encoding="utf-8"
    )
    ok("生成 package.json（按级别裁剪依赖与脚本）")

    print()
    ok(f"完成！共写入 {total + 1} 个文件")
    print_next_steps(target, level, entry_file)


def print_next_steps(target: Path, level: str, entry_file: str) -> None:
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
    print(f"  · 根目录 {entry_file} / AGENTS.md 会让 AI 自动遵循规范")
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
    parser.add_argument(
        "--agent", "-a",
        choices=AGENT_CHOICES,
        default="codebuddy",
        help="使用的 AI agent 工具（决定入口文件与 AI 目录，默认 codebuddy）",
    )
    parser.add_argument(
        "--entry",
        default=None,
        help="默认加载的入口文件名（agent=other 时必填，可覆盖预设）",
    )
    parser.add_argument(
        "--ai-dir",
        dest="ai_dir",
        default=None,
        help="AI(skill/rule) 存放目录（agent=other 时必填，可覆盖预设）",
    )
    args = parser.parse_args(argv)

    target = Path(args.target)
    name = args.name or target.resolve().name
    name = _normalize_name(name)

    init(target, args.level, name, args.force, args.agent, args.entry, args.ai_dir)


def _normalize_name(name: str) -> str:
    # npm 包名规范：小写、允许 - 和数字
    n = name.strip().lower()
    n = re.sub(r"[^a-z0-9._-]+", "-", n)
    n = n.strip("-._") or "my-site"
    return n


if __name__ == "__main__":
    main()
