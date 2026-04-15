# claude-dash

Claude Code 的模型感知状态栏插件——实时追踪模型调用次数、token 用量与配额进度。

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)

---

## 功能特性

- **逐轮模型追踪** — 上轮 / 本轮 / 对话累计的 Opus·Sonnet·Haiku 调用次数与 token
- **Sonnet 专项配额** — 独立显示 Sonnet-only 周用量进度条（Max 5× 订阅适用）
- **项目名显示** — 第一行末尾以蓝色方括号显示当前工作目录名
- **Sub-agent 归因** — 自动将 sub-agent 的 token 消耗归入对应主轮次
- **配额进度条** — 5h / 7d 用量 + 刷新时间（绝对/相对/双显）
- **上下文指示器** — 五级圆弧 `○ ◔ ◑ ◕ ●`，颜色随用量渐变
- **10 款内置方案** — default / compact / minimal / dashboard / neon / zen / powerline / retro / pro / stealth
- **完全可配置** — 每个显示元素独立开关，支持自定义布局、进度条风格、配色方案
- **零 token 消耗** — 纯本地渲染，不调用 AI API

---

## 快速上手（3 步）

### 第 1 步：安装插件

**推荐：Claude Code 插件管理器**

```
/plugin install https://github.com/ya3924143/claude-dash
```

**或手动克隆：**

```bash
git clone https://github.com/ya3924143/claude-dash.git ~/.claude/plugins/claude-dash
```

---

### 第 2 步：配置 statusLine

编辑 `~/.claude/settings.json`，在顶层添加 `statusLine` 字段：

**使用 bun（推荐，原生 TypeScript，无需编译）：**

```json
{
  "statusLine": {
    "type": "command",
    "command": "bun ~/.claude/plugins/claude-dash/src/index.ts"
  }
}
```

**使用 node（需要 dist/ 目录）：**

```json
{
  "statusLine": {
    "type": "command",
    "command": "node ~/.claude/plugins/claude-dash/dist/index.js"
  }
}
```

> 如果通过插件管理器安装，路径为
> `~/.claude/plugins/cache/claude-dash/claude-dash/<version>/`，
> 运行 `/claude-dash:setup` 可自动检测并写入正确路径。

---

### 第 3 步：选择方案

**交互式向导（推荐）：**

```
/claude-dash:setup
```

**或直接写入配置文件：**

```bash
echo '{"preset":"default"}' > ~/.claude/plugins/claude-dash/config.json
```

重启 Claude Code 后状态栏即可显示。

---

## 方案预览

> 以下为纯文本模拟效果；实际运行时各部分带有 ANSI 颜色。
> 运行 `bun src/preview.ts` 可在终端中查看带颜色的真实效果。

### 极简类

**`minimal`** — 一行极简，只看本轮，无 Plan 名

```
[Sonnet]  ◑ 45%  5h ●●●●░░ 42%  │  7d ●●░░░░ 19%
本轮 S:×2  10.2k
```

**`stealth`** — 隐身模式，仅配额 + 上下文

```
[Sonnet]  ◑ 45%  5h ████░░░░ 42%  │  7d ██░░░░░░ 19%
```

**`zen`** — 禅意色点，无进度条数字，只看本轮

```
[Sonnet | Max]  ◑ 45%  对话 S:×5 O:×2  42.1k  [my-project]
5h ● 42%  │  7d ● 19%
本轮 S:×2  10.2k
```

---

### 标准类

**`default`** — 经典三行，全部信息

```
[Sonnet | Max]  ◑ 45%  对话 S:×5 O:×2  42.1k  [my-project]
5h ████░░░░░░ 42% (刷新时间: 14:30)  │  7d ██░░░░░░░░ 19% (刷新时间: 明天 09:00)
上轮 O:×1 S:×3  25.6k  │  本轮 S:×2  10.2k  │  Sonnet Only ████░░ 27%
```

**`compact`** — 双行紧凑，同等信息量

```
[Sonnet | Max]  ◑ 45%  对话 S:×5 O:×2  42.1k  [my-project]  5h ████░░░░░░ 42%  │  7d ██░░░░░░░░ 19%
上轮 O:×1 S:×3  25.6k  │  本轮 S:×2  10.2k  │  Sonnet Only ████░░ 27%
```

**`powerline`** — Powerline 风格，只看本轮

```
[Sonnet | Max]  ◑ 45%  对话 S:×5 O:×2  42.1k  [my-project]  5h ▓▓▓▓░░░░░░ 42%  │  7d ▓▓░░░░░░░░ 19%
本轮 S:×2  10.2k  │  Sonnet Only ████░░ 27%
```

---

### 全功能类

**`dashboard`** — 仪表盘，每项独占行，标签对齐

```
  model  Sonnet | Max  tokens 42.1k
    ctx  ████░░░░░░ 45%
     5h  ████░░░░░░ 42%  (刷新时间: 14:30)
     7d  ██░░░░░░░░ 19%  (刷新时间: 明天 09:00)
上轮 O:×1 S:×3  25.6k  │  本轮 S:×2  10.2k  │  Sonnet Only ████░░ 27%
```

**`neon`** — 霓虹渐变进度条，全部信息

```
[Sonnet | Max]  ◑ 45%  对话 S:×5 O:×2  42.1k  [my-project]
5h ▏▎▍▌▋▊▉█░░░░ 42% (刷新时间: 14:30)  │  7d ▏▎▍▌░░░░░░░░ 19%
上轮 O:×1 S:×3  25.6k  │  本轮 S:×2  10.2k  │  Sonnet Only ▏▎▍▌▋▊ 27%
```

**`pro`** — 双时间显示（绝对 + 相对），全部信息

```
[Sonnet | Max]  ◑ 45%  对话 S:×5 O:×2  42.1k  [my-project]
5h ████░░░░░░ 42% (刷新时间: 14:30 / 3h 42m)  │  7d ██░░░░░░░░ 19% (刷新时间: 明天 09:00 / 4d 11h)
上轮 O:×1 S:×3  25.6k  │  本轮 S:×2  10.2k  │  Sonnet Only ████░░ 27%
```

**`retro`** — 复古 ASCII 进度条，单色绿

```
[Sonnet]  ◑ 45%  对话 S:×5 O:×2  42.1k  [my-project]
5h [====------] 42% (刷新时间: 14:30)  │  7d [==--------] 19%
上轮 O:×1 S:×3  25.6k  │  本轮 S:×2  10.2k  │  Sonnet Only [===---] 27%
```

---

## 配置示例：从简到繁

### 最简配置（只看 quota）

```json
{
  "preset": "stealth"
}
```

### 推荐日常配置

```json
{
  "preset": "default"
}
```

### 省空间配置（终端较窄时）

```json
{
  "preset": "compact",
  "barWidth": 8,
  "showLastTurn": false
}
```

### 深色终端 · 霓虹风格

```json
{
  "preset": "neon",
  "colorScheme": "vibrant",
  "barWidth": 14,
  "timeFormat": "both"
}
```

### 极简禅意（无进度条，只看颜色变化）

```json
{
  "preset": "zen",
  "showLastTurn": false,
  "showResetTime": false
}
```

### Max 5× 用户（关注 Sonnet 专项配额）

```json
{
  "preset": "default",
  "showSessionStats": true,
  "timeFormat": "both",
  "barWidth": 12
}
```

> Sonnet Only 进度条会在第三行自动显示，追踪 `seven_day_sonnet` 独立周配额。

### 单色绿 · 复古终端

```json
{
  "preset": "retro",
  "colorScheme": "mono-green",
  "barStyle": "ascii",
  "barWidth": 12
}
```

### 全功能仪表盘

```json
{
  "preset": "dashboard",
  "layout": "dashboard",
  "barStyle": "gradient",
  "colorScheme": "vibrant",
  "timeFormat": "both",
  "showLastTurn": true,
  "showCurrentTurn": true,
  "showSessionStats": true,
  "showPlanName": true,
  "showResetTime": true,
  "barWidth": 14
}
```

### 自定义混搭（powerline 布局 + 渐变条 + muted 配色）

```json
{
  "preset": "powerline",
  "barStyle": "gradient",
  "colorScheme": "muted",
  "timeFormat": "relative",
  "barWidth": 10,
  "showLastTurn": true
}
```

---

## 配置项速查

| 配置项 | 类型 | 可选值 | 说明 |
|--------|------|--------|------|
| `preset` | string | 见方案列表 | 基础方案，其余字段在其上覆盖 |
| `layout` | string | `standard` / `compact` / `dashboard` | 整体布局 |
| `barStyle` | string | `block` / `half` / `gradient` / `dot` / `circle` / `ascii` | 进度条风格 |
| `contextIndicator` | string | `circle` / `bar` | 上下文指示器类型 |
| `timeFormat` | string | `absolute` / `relative` / `both` | 配额刷新时间格式 |
| `colorScheme` | string | `vibrant` / `muted` / `mono-green` / `mono-blue` | 配色方案 |
| `barWidth` | number | 正整数（`0` 不显示条） | 进度条宽度（字符数） |
| `showLastTurn` | boolean | `true` / `false` | 显示上轮模型统计 |
| `showCurrentTurn` | boolean | `true` / `false` | 显示本轮模型统计 |
| `showSessionStats` | boolean | `true` / `false` | 显示对话累计统计 |
| `showPlanName` | boolean | `true` / `false` | 显示 Max/Pro 订阅名称 |
| `showResetTime` | boolean | `true` / `false` | 显示配额刷新时间 |

**方案列表：**

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
│   ├── usage-api.ts      # 读取 Anthropic 用量 API（含缓存 + Keychain 认证）
│   └── render/
│       ├── index.ts      # 渲染编排，终端宽度适配
│       ├── bars.ts       # 进度条样式渲染（6 种）
│       ├── colors.ts     # ANSI 颜色工具与语义色函数
│       ├── identity.ts   # 第一行：模型 + 上下文 + 对话累计 + 项目名
│       ├── turns.ts      # 第三行：上轮/本轮模型统计 + Sonnet Only 配额
│       └── usage.ts      # 第二行：5h/7d 配额进度条
├── commands/
│   └── setup.md          # /claude-dash:setup 交互配置向导
├── dist/                 # TypeScript 编译输出（随版本发布）
├── docs/
│   ├── ARCHITECTURE.md   # 系统架构文档
│   └── OPERATIONS.md     # 安装、配置、运维完整手册
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

# 预览所有方案（带颜色，需先编译）
npm run preview

# 运行测试
npm test

# 测试覆盖率
npm run test:coverage
```

**运行环境要求：** Node.js >= 18 或 bun

详细运维说明见 [docs/OPERATIONS.md](docs/OPERATIONS.md)。

---

## 常见问题

**状态栏不显示？**
检查 `~/.claude/settings.json` 中 `statusLine.command` 路径是否正确，
手动运行 `echo '{}' | node ~/.claude/plugins/claude-dash/dist/index.js` 验证。

**配额显示 `⚠`（黄色）？**
用量 API 请求失败——通常是网络问题或 `~/.claude/.credentials.json` token 过期。
macOS 用户：插件会自动从 Keychain 读取凭证，无需手动配置。

**Sonnet Only 进度条不显示？**
需要 Max 5× 订阅且 Claude Code 版本较新（支持 `seven_day_sonnet` rate limit 字段）。

---

## 致谢

基于 [claude-hud](https://github.com/jarrodwatts/claude-hud)（MIT License，作者 Jarrod Watts）架构思路开发。

**MIT © claude-dash contributors**
