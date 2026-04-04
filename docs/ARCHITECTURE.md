# 系统架构

> 基于代码生成，最后更新：2026-04-04

---

## 概述

claude-dash 是 Claude Code 的 statusLine 插件。Claude Code 在每次渲染状态栏时，将当前会话状态通过 stdin 管道以 JSON 格式传入，claude-dash 解析后输出 ANSI 彩色文本到 stdout，Claude Code 将其显示在输入框下方。

整个运行链路是**纯本地、无副作用**的：不调用 AI API，不消耗 token，不修改任何会话状态。

---

## 数据流

```
Claude Code
  │
  │ stdin (JSON)
  ▼
stdin.ts          ← 读取并解析管道数据（model / context_window / rate_limits）
  │
  ├── transcript.ts ← 解析会话记录文件（.jsonl），统计每轮模型调用
  │     └── parseSubagentEntries() ← 递归读取 subagents/ 子目录
  │
  └── usage-api.ts  ← 读取 Anthropic 用量 API（含 60s 本地缓存）
        └── readCredentials() ← 读取 ~/.claude/.credentials.json
  │
  ▼
index.ts          ← 数据编排，构建 RenderContext
  │
  ▼
render/index.ts   ← 根据 layout 选择渲染策略，处理终端宽度
  ├── identity.ts ← 第一行：模型名 + 计划 + 上下文指示器 + 对话累计
  ├── usage.ts    ← 第二行：5h/7d 配额进度条 + 刷新时间
  └── turns.ts    ← 第三行：上轮/本轮模型调用统计
        └── bars.ts   ← 进度条渲染（6 种风格）
        └── colors.ts ← ANSI 颜色工具 + 语义色映射
  │
  ▼
stdout (ANSI text) → Claude Code 状态栏
```

---

## 核心模块

### `src/index.ts` — 主入口与数据编排

- 读取 stdin，若为 TTY（无管道）则输出初始化提示后退出
- 按优先级获取用量数据：stdin.rate_limits（实时）> usage-api（API 缓存）
- 组装 `RenderContext` 并调用 `render()`
- 导出 `formatSessionDuration()`（会话时长格式化工具）

### `src/types.ts` — 类型定义中心

所有共享数据结构均在此定义：

| 类型 | 说明 |
|------|------|
| `StdinData` | Claude Code 管道数据结构 |
| `UsageData` | 用量数据（含 API 不可用状态） |
| `ModelCount` | 单轮次 O/S/H 调用次数与 token |
| `TurnStats` | 单轮次统计（ModelCount + totalTokens） |
| `SessionStats` | lastTurn / currentTurn / session 三级统计 |
| `DashConfig` | 完整配置结构（布局、风格、开关） |
| `RenderContext` | 渲染时传入所有渲染器的上下文 |

字符串联合类型（非 enum）：`BarStyle` / `ContextIndicator` / `TimeFormat` / `Layout` / `ColorScheme`

### `src/stdin.ts` — 管道数据读取

- `readStdin()`: 异步读取 stdin JSON，TTY 返回 null，解析失败返回 null
- `getContextPercent()`: 优先使用 `used_percentage`（v2.1.6+），降级为手动计算
- `getModelName()`: 从 `display_name` 或 `id` 中取模型名

### `src/transcript.ts` — 会话记录解析

逐行流式读取 `.jsonl` 会话文件，按 `type: "user"` 切割轮次边界：

1. 主文件解析：每遇到 user 消息则提交上一轮，assistant 消息中提取模型 ID 和 token 用量
2. Sub-agent 归因：读取 `{transcriptPath}/subagents/*.jsonl`，按 timestamp 区间归入对应主轮次
3. 使用不可变累加（`addModelUsage` 返回新对象，`mergeTurnStats` 返回新对象）

模型分类规则（`classifyModel`）：
- 包含 `opus` → O
- 包含 `sonnet` → S
- 包含 `haiku` → H
- 其他 → null（不计入模型计数，但 token 仍累加）

### `src/usage-api.ts` — 用量 API 与缓存

- 从 `~/.claude/.credentials.json` 读取 OAuth access token
- 请求 `https://api.claude.ai/api/auth/usage`，10s 超时
- 成功结果缓存 60s，失败结果缓存 30s（见常量，可通过 options 覆盖）
- 缓存文件路径见 `src/constants.ts`

### `src/config.ts` — 配置加载

- 配置文件路径见 `src/constants.ts`（`CONFIG_DIR` + `CONFIG_FILE`）
- 加载逻辑：文件不存在 → 返回 default preset；文件存在 → merge 到 default preset 之上
- `saveConfig()` 供 setup 命令调用

### `src/presets.ts` — 内置方案

10 款预设方案，每款是 `DashConfig` 的完整实例。`PRESET_LIST` 数组包含名称与中文描述，供 preview 脚本和 setup 命令使用。

---

## 渲染层

### `src/render/index.ts` — 渲染编排

- 按顺序调用三个子渲染器，过滤 null（渲染器可返回 null 表示该行不显示）
- **standard/compact 布局**：每行调用 `wrapAtSeparator()` 处理超宽，在 `│` 分隔符处断行
- **dashboard 布局**：各子渲染器直接返回多行字符串，按 `\n` 拆分后逐行输出
- 终端宽度：优先读取 `COLUMNS` 环境变量，降级使用 `process.stdout.columns`，默认 120

### `src/render/bars.ts` — 进度条

6 种风格（`BarStyle`）：

| 风格 | 字符 | 说明 |
|------|------|------|
| `block` | `█ ░` | 实心方块（默认） |
| `half` | `▓ ░` | 半透明方块（Powerline 风格） |
| `gradient` | `▏▎▍▌▋▊▉█ ░` | 八级渐变（neon 方案） |
| `ascii` | `= - []` | ASCII 兼容（retro 方案） |
| `dot` | `●` | 单色点，四色阶 |
| `circle` | `○ ◔ ◑ ◕ ●` | 五级圆弧（minimal/zen） |

`dot` 和 `circle` 忽略 `barWidth` 参数，`barWidth: 0` 时 block/half/gradient/ascii 不渲染条形只显示百分比。

### `src/render/colors.ts` — ANSI 颜色

- 提供 14 个命名颜色函数（`dim` / `bold` / `red` / `green` 等）
- 三个语义色映射函数，根据 `ColorScheme` 返回 ANSI 颜色码：
  - `getContextColor(percent, scheme)` — 上下文用量色
  - `getQuotaColor(percent, scheme)` — 配额用量色
  - `getModelColor(model, scheme)` — 模型标识色

### `src/render/identity.ts` / `turns.ts` / `usage.ts`

各自负责一行的渲染逻辑，内部按 `layout` 分支处理 standard 和 dashboard 两种呈现形式。

---

## 配置系统

配置采用分层合并策略：

```
内置 default preset（src/presets.ts）
    ↓ spread merge
用户配置文件（~/.claude/plugins/claude-dash/config.json）
    ↓ 最终生效
DashConfig
```

用户只需在配置文件中写需要覆盖的字段，其余字段自动从所选 preset 继承。

---

## 编译与构建

TypeScript 编译到 `dist/`，使用 ES2022 + NodeNext 模块系统：

```
src/*.ts    →  dist/*.js + dist/*.d.ts + dist/*.js.map
src/render/ →  dist/render/
```

`dist/` 目录随版本一起发布（随插件安装），不依赖用户本地安装 TypeScript。支持 bun 直接运行 `src/*.ts`（原生 TypeScript 支持）。

---

## 依赖

**运行时依赖：** 无（仅用 Node.js 内置模块）

**开发依赖：**

| 包 | 用途 |
|----|------|
| `typescript` | 类型编译 |
| `@types/node` | Node.js 类型定义 |
| `c8` | 测试覆盖率（基于 V8） |
