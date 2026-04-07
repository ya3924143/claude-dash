# claude-dash

> 基于代码生成，最后更新：2026-04-04

Claude Code 的模型感知状态栏插件——实时追踪模型调用次数、token 用量与配额进度。

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)

---

## 功能特性

- **逐轮模型追踪** — 上轮 / 本轮 / 对话累计的 Opus·Sonnet·Haiku 调用次数与 token
- **项目名显示** — 第一行末尾以蓝色方括号显示当前工作目录名
- **Sub-agent 归因** — 自动将 sub-agent 的 token 消耗归入对应主轮次
- **配额进度条** — 5h / 7d 用量 + 刷新时间（绝对/相对/双显）
- **上下文指示器** — 五级圆弧 `○ ◔ ◑ ◕ ●`，颜色随用量渐变
- **10 款内置方案** — default / compact / minimal / dashboard / neon / zen / powerline / retro / pro / stealth
- **完全可配置** — 每个显示元素独立开关，支持自定义布局、进度条风格、配色方案
- **零 token 消耗** — 纯本地渲染，不调用 AI API

---

## 安装

### 推荐：通过 Claude Code 插件机制

在 Claude Code 中运行：

```
/plugin install https://github.com/ya3924143/claude-dash
```

安装完成后执行 `/claude-dash:setup` 交互式选择方案。

### 手动安装

```bash
git clone https://github.com/ya3924143/claude-dash.git ~/.claude/plugins/claude-dash
```

在 `~/.claude/settings.json` 中添加 `statusLine` 配置（见 [docs/OPERATIONS.md](docs/OPERATIONS.md)）。

---

## 方案预览

安装后运行预览脚本查看所有方案渲染效果：

```bash
# 使用 bun（推荐）
bun ~/.claude/plugins/claude-dash/src/preview.ts

# 使用 node
node ~/.claude/plugins/claude-dash/dist/preview.js
```

内置方案一览：

| 方案 | 布局 | 说明 |
|------|------|------|
| `default` | standard | 经典三行，全部显示 |
| `compact` | compact | 紧凑双行，全部显示 |
| `minimal` | compact | 极简，只看本轮，隐藏 Plan |
| `dashboard` | dashboard | 仪表盘，标签对齐 |
| `neon` | standard | 霓虹渐变进度条 |
| `zen` | standard | 禅意色点，只看本轮 |
| `powerline` | compact | Powerline 风格，只看本轮 |
| `retro` | standard | 复古 ASCII 进度条 |
| `pro` | standard | 双时间显示，全部信息 |
| `stealth` | compact | 隐身，只看配额和上下文 |

---

## 配置

配置文件路径：`~/.claude/plugins/claude-dash/config.json`（见 [docs/OPERATIONS.md](docs/OPERATIONS.md)）

只需写要覆盖的字段，其余沿用方案默认值：

```json
{
  "preset": "default",
  "showLastTurn": false,
  "showResetTime": false
}
```

完整配置项说明见 [docs/OPERATIONS.md](docs/OPERATIONS.md)。

---

## 目录结构

```
claude-dash/
├── src/
│   ├── index.ts          # 主入口，数据编排与输出
│   ├── types.ts          # 所有 TypeScript 类型定义
│   ├── config.ts         # 配置加载与持久化
│   ├── constants.ts      # 路径常量
│   ├── presets.ts        # 10 款内置方案定义
│   ├── stdin.ts          # 读取 Claude Code stdin 管道数据
│   ├── transcript.ts     # 解析会话记录，统计模型调用
│   ├── usage-api.ts      # 读取 Anthropic 用量 API（含缓存）
│   └── render/
│       ├── index.ts      # 渲染编排，终端宽度适配
│       ├── bars.ts       # 进度条样式渲染（6 种）
│       ├── colors.ts     # ANSI 颜色工具与语义色函数
│       ├── identity.ts   # 第一行：模型 + 上下文 + 对话累计 + 项目名
│       ├── turns.ts      # 第三行：上轮/本轮模型统计
│       └── usage.ts      # 第二行：5h/7d 配额进度条
├── commands/
│   └── setup.md          # /claude-dash:setup 交互配置向导
├── dist/                 # TypeScript 编译输出（随版本发布）
├── docs/
│   ├── ARCHITECTURE.md   # 系统架构文档
│   └── OPERATIONS.md     # 安装、配置、运维手册
├── package.json
└── tsconfig.json
```

---

## 开发

```bash
# 安装依赖
npm install

# 编译
npm run build

# 监听模式
npm run dev

# 预览所有方案（需先编译）
npm run preview

# 运行测试
npm test

# 测试覆盖率
npm run test:coverage
```

**运行环境要求：** Node.js >= 18

---

## 致谢

基于 [claude-hud](https://github.com/jarrodwatts/claude-hud)（MIT License，作者 Jarrod Watts）架构思路开发。

**MIT © claude-dash contributors**
