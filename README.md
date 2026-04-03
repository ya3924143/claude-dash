# claude-dash

**Model-aware statusline for Claude Code**

实时追踪每轮 Opus / Sonnet / Haiku 调用次数与 token 用量，监控 5h/7d 配额并显示绝对刷新时间，以渐变圆弧可视化上下文使用率——全部呈现在 statusline 中，零额外 token 消耗。

---

## Features

- **逐轮模型追踪** — 上轮 / 本轮 / 整个对话的 O/S/H 调用次数与 token 合计
- **5h/7d 配额进度条** — 带绝对刷新时间（当天时刻 / 明天 / 跨日期三种格式）
- **上下文渐变指示器** — `○ ◔ ◑ ◕ ●` 五级圆弧 + 百分比，颜色随用量自动变化
- **10 款内置方案** — 从极简到仪表盘，开箱即用，支持自由组合覆盖任意字段
- **零额外 token 消耗** — 纯本地渲染，状态数据由 Claude Code 通过 stdin 管道传入
- **MIT 开源** — 基于 [claude-hud](https://github.com/jarrodwatts/claude-hud) by Jarrod Watts

---

## Quick Start

### 方式 1: Clone 安装（推荐）

```bash
# 1. 克隆到本地插件目录
git clone https://github.com/ya3924143/claude-dash.git ~/.claude/plugins/claude-dash

# 2. 在 ~/.claude/settings.json 中添加 statusLine 配置
# （如果已有 statusLine 字段，替换即可）
```

在 `~/.claude/settings.json` 的顶层添加：

```json
{
  "statusLine": {
    "type": "command",
    "command": "node ~/.claude/plugins/claude-dash/dist/index.js"
  }
}
```

```bash
# 3. 重启 Claude Code 即可生效
```

### 方式 2: 手动下载

如果不想用 git，直接 [下载 ZIP](https://github.com/ya3924143/claude-dash/archive/refs/heads/main.zip) 解压到 `~/.claude/plugins/claude-dash/`，然后同样配置 `statusLine`。

### 选择方案

安装后在 Claude Code 中运行：

```
/claude-dash:setup
```

或直接编辑 `~/.claude/plugins/claude-dash/config.json` 选择 preset 和自定义配置。

---

## Presets

通过 `/claude-dash:setup` 选择 preset，或在配置文件中直接指定 `"preset"` 字段。所有字段均可在 preset 基础上单独覆盖。

---

### `default` — 经典三行 · 全部显示

标准三行布局，block 风格进度条（宽度 10），vibrant 配色，绝对刷新时间，圆弧上下文指示器，完整显示 Plan 名称、上轮、本轮、对话统计。

```
[Opus 4.6 (1M context) | Max]  ○ 4%      对话 O:×28 S:×14 H:×6 384.2k
5h ██░░░░░░░░ 19% (刷新时间: 17:42)  │  7d ████░░░░░░ 41% (刷新时间: 04/08 01:00)
上轮 O:×3 S:×1 12.4k  │  本轮 O:×5 S:×2 H:×1 18.7k
```

---

### `compact` — 紧凑双行 · 全部显示

双行布局，进度条宽度缩至 8，其余与 default 相同，适合屏幕空间有限的环境。上轮/本轮统计并排显示在第二行末尾。

```
[Sonnet 4.6 | Max]  ◔ 18%      对话 O:×12 S:×31 H:×4 210.6k
5h ████░░░░ 43% (刷新时间: 19:05)  │  7d ██░░░░░░ 27% (刷新时间: 04/09 00:00)  上轮 S:×2 8.1k  │  本轮 S:×3 11.5k
```

---

### `minimal` — 极简 · 只看本轮 · 隐藏 Plan

双行布局，circle 风格进度条（barWidth: 0，不渲染条形），muted 配色，隐藏 Plan 名称和上轮统计，追求最低视觉噪音。

```
[Haiku 4.5]  ○ 6%      对话 S:×8 H:×22 47.3k
5h ○○○○○○○○○○ 12% (刷新时间: 22:30)  │  7d ●●●○○○○○○○ 34% (刷新时间: 04/09 00:00)  本轮 H:×6 5.0k
```

---

### `dashboard` — 仪表盘 · 标签对齐 · 全开

垂直仪表盘布局，每项独占一行，标签列宽统一，bar 风格上下文指示器，进度条宽度 12，适合宽屏终端深度监控。

```
  model  Opus 4.6 (1M context) | Max        tokens 891.4k
    ctx  ████████████░░░░░░░░ 67%
     5h  ████████████░░░░░░░░ 67% (刷新时间: 18:30)
     7d  █████████░░░░░░░░░░░ 44% (刷新时间: 04/10 01:00)
   上轮  O:×6 S:×1 22.1k
   本轮  O:×9 S:×3 H:×1 39.7k
  对话   O:×41 S:×19 H:×8 1.1M
```

---

### `neon` — 霓虹渐变 · 全部显示

标准三行布局，gradient 风格进度条（宽度 12），vibrant 配色，视觉冲击力最强。显示所有字段。

```
[Opus 4.6 (1M context) | Max]  ◑ 52%     对话 O:×41 S:×19 H:×7 1.2M
5h ▓▓▓▓▒▒▒░░░░░ 38% (刷新时间: 20:15)  │  7d ▓▓▓▓▓▓▒▒░░░░ 58% (刷新时间: 04/08 01:00)
上轮 O:×4 S:×2 19.8k  │  本轮 O:×7 S:×3 31.2k
```

---

### `zen` — 禅意色点 · 只看本轮

标准三行布局，dot 风格（barWidth: 0，以色点替代进度条），muted 配色，隐藏上轮统计，强调留白与克制。

```
[Sonnet 4.6 | Max]  ○ 9%      对话 S:×15 H:×3 98.7k
5h · · · · · · · · · ·  8%  │  7d · · · · · · · · · · 21% (刷新时间: 04/08 01:00)
本轮 S:×2 H:×1 7.9k
```

---

### `powerline` — Powerline 风格 · 只看本轮

紧凑双行布局，half-block 风格进度条（宽度 10），vibrant 配色，隐藏上轮统计，适合已配置 Powerline 字体的用户。

```
[Opus 4.6 (1M context) | Max]  ◔ 23%     对话 O:×18 S:×11 245.0k
5h ▐▐▐▐░░░░░░ 39% (刷新时间: 16:55)  │  7d ▐▐▐▐▐▐░░░░ 61% (刷新时间: 04/09 00:00)  本轮 O:×3 S:×1 14.2k
```

---

### `retro` — 复古 ASCII · 隐藏 Plan

标准三行布局，ascii 风格进度条（`[####------]`，宽度 10），mono-green 单色配色，隐藏 Plan 名称，像素感十足。

```
[Opus 4.6 (1M context)]  [##--------] 21%   对话 O:×9 S:×5 132.5k
5h [####------] 41% (刷新时间: 21:00)  |  7d [######----] 63% (刷新时间: 04/08 01:00)
上轮 O:×3 14.1k  |  本轮 O:×5 S:×1 20.8k
```

---

### `pro` — 专业双时间 · 全部显示

标准三行布局，block 进度条（宽度 10），vibrant 配色，timeFormat: "both" 同时显示绝对时间和相对时间，为重度用户设计。

```
[Opus 4.6 (1M context) | Max]  ◕ 79%      对话 O:×67 S:×28 H:×11 2.3M
5h ████████░░ 81% (刷新时间: 17:42 / 2h 18m)  │  7d ███░░░░░░░ 33% (刷新时间: 04/08 01:00 / 4d 22h)
上轮 O:×8 S:×2 H:×1 41.0k  │  本轮 O:×11 S:×4 61.3k
```

---

### `stealth` — 隐身 · 只看额度和上下文

紧凑双行布局，block 进度条（宽度 8），mono-green 单色配色，隐藏所有统计行、Plan 名称和刷新时间，最低调的存在感。

```
[Haiku 4.5]  ○ 3%
5h ██░░░░░░ 17%  │  7d ███░░░░░ 36%
```

---

## Configuration

配置文件路径：`~/.claude/plugins/claude-dash/config.json`

以下为完整配置示例（所有字段均有默认值，只需填写需要覆盖的部分）：

```json
{
  "preset": "default",
  "layout": "standard",
  "barStyle": "block",
  "contextIndicator": "circle",
  "timeFormat": "absolute",
  "colorScheme": "vibrant",
  "showLastTurn": true,
  "showCurrentTurn": true,
  "showSessionStats": true,
  "showPlanName": true,
  "showResetTime": true,
  "barWidth": 10
}
```

### 配置项参考

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `preset` | `string` | `"default"` | 预设方案名称，作为基础配置加载 |
| `layout` | `"compact"` \| `"standard"` \| `"dashboard"` | `"standard"` | 整体布局模式 |
| `barStyle` | `"block"` \| `"half"` \| `"gradient"` \| `"dot"` \| `"circle"` \| `"ascii"` | `"block"` | 进度条样式 |
| `contextIndicator` | `"bar"` \| `"circle"` | `"circle"` | 上下文指示器类型（圆弧或条形） |
| `timeFormat` | `"absolute"` \| `"relative"` \| `"both"` | `"absolute"` | 配额刷新时间格式 |
| `colorScheme` | `"vibrant"` \| `"muted"` \| `"mono-green"` \| `"mono-blue"` | `"vibrant"` | 配色方案 |
| `showLastTurn` | `boolean` | `true` | 是否显示上一轮模型统计 |
| `showCurrentTurn` | `boolean` | `true` | 是否显示当前轮模型统计 |
| `showSessionStats` | `boolean` | `true` | 是否显示对话累计统计（显示在第一行） |
| `showPlanName` | `boolean` | `true` | 是否显示 Max / Pro 套餐标识 |
| `showResetTime` | `boolean` | `true` | 是否显示配额刷新时间 |
| `barWidth` | `number` | `10` | 进度条宽度（字符数），`0` 表示不渲染条形 |

---

### 自定义组合示例

任何字段均可独立覆盖，不受 preset 限制。

**示例 1：只看本轮 + 隐藏刷新时间**

```json
{
  "preset": "default",
  "showLastTurn": false,
  "showResetTime": false
}
```

```
[Sonnet 4.6 | Max]  ◔ 31%      对话 S:×18 H:×4 156.3k
5h ███░░░░░░░ 31%  │  7d █████░░░░░ 52%
本轮 S:×3 H:×1 22.6k
```

---

**示例 2：纯净模式 — 只保留模型和进度条**

```json
{
  "preset": "stealth",
  "showLastTurn": false,
  "showCurrentTurn": false,
  "showSessionStats": false,
  "showPlanName": false,
  "showResetTime": false
}
```

```
[Haiku 4.5]  ○ 7%
5h ██░░░░░░ 22%  │  7d ████░░░░ 43%
```

---

**示例 3：信息全开 + 双时间**

```json
{
  "preset": "pro",
  "showLastTurn": true,
  "showCurrentTurn": true,
  "showSessionStats": true,
  "showPlanName": true,
  "showResetTime": true,
  "timeFormat": "both",
  "barWidth": 12
}
```

```
[Opus 4.6 (1M context) | Max]  ◕ 74%      对话 O:×52 S:×23 H:×9 1.8M
5h ████████████░░░░░░░░ 74% (刷新时间: 18:05 / 1h 55m)  │  7d ██████░░░░░░░░░░░░░░ 48% (刷新时间: 04/08 01:00 / 4d 19h)
上轮 O:×7 S:×2 35.4k  │  本轮 O:×10 S:×4 57.1k
```

---

## FAQ

**会消耗额外的 token 吗？**

不会。claude-dash 纯本地渲染，Claude Code 通过 stdin 管道传入状态数据，不调用任何 AI API。Usage 数据通过 Anthropic OAuth API 读取（和官方插件相同机制），不计入 token 消耗。

**会导致封号吗？**

不会。statusline 是 Claude Code 官方支持的插件类型，Usage API 是公开的 OAuth 接口。

**和 claude-hud 是什么关系？**

claude-dash 基于 [claude-hud](https://github.com/jarrodwatts/claude-hud)（MIT License，by Jarrod Watts）的架构思路开发，在此基础上增加了模型使用统计、轮次追踪、绝对刷新时间、可配置开关等功能。感谢 Jarrod Watts 的开源贡献。

**如何自定义组合？**

编辑 `~/.claude/plugins/claude-dash/config.json`，任何配置项都可以独立开关或覆盖，不受 preset 限制。修改后无需重启，下一次 statusline 渲染时自动生效。

---

## Acknowledgments

Based on [claude-hud](https://github.com/jarrodwatts/claude-hud) by **Jarrod Watts** — MIT License.

---

## License

MIT © claude-dash contributors
