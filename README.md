<div align="center">

# ⚡ claude-dash

**Model-aware statusline for Claude Code**

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)
[![Claude Code](https://img.shields.io/badge/Claude_Code-Plugin-blueviolet.svg)](https://claude.ai/code)

实时追踪 Opus / Sonnet / Haiku 调用次数与 token 用量<br>
监控 5h/7d 配额 · 绝对刷新时间 · 渐变上下文指示器<br>
**零额外 token 消耗 · 不会封号 · 纯本地渲染**

</div>

---

## 特性

- **逐轮模型追踪** — 上轮 / 本轮 / 对话累计的 O·S·H 调用次数 + token
- **配额进度条** — 5h / 7d 用量 + 绝对刷新时间（如 `17:42`）
- **上下文指示器** — `○ ◔ ◑ ◕ ●` 五级圆弧，颜色随用量渐变
- **10 款内置方案** — 经典 / 极简 / 仪表盘 / 霓虹 / 复古 等，开箱即用
- **完全可配置** — 每个元素独立开关，自由组合
- **安全无副作用** — 零 token 消耗，不调 AI API，不会封号

---

## 安装

在 Claude Code 中直接说：

> **帮我安装 claude-dash 插件：https://github.com/ya3924143/claude-dash**

Claude 会自动完成 clone、配置 statusLine、重启生效。

<details>
<summary>📋 或者手动安装（两步）</summary>

```bash
git clone https://github.com/ya3924143/claude-dash.git ~/.claude/plugins/claude-dash
```

在 `~/.claude/settings.json` 顶层添加：

```json
"statusLine": {
  "type": "command",
  "command": "node ~/.claude/plugins/claude-dash/dist/index.js"
}
```

重启 Claude Code 即可。

</details>

---

## 方案一览

安装后输入 `/claude-dash:setup` 选择方案，或直接编辑配置文件。

### `default` — 经典三行 · 全部显示

```
[Opus 4.6 (1M context) | Max]  ○ 4%      对话 O:×28 S:×14 H:×6 384.2k
5h ██░░░░░░░░ 19% (刷新时间: 17:42)  │  7d ████░░░░░░ 41% (刷新时间: 04/08 01:00)
上轮 O:×3 S:×1 12.4k  │  本轮 O:×5 S:×2 H:×1 18.7k
```

### `compact` — 紧凑双行

```
[Sonnet 4.6 | Max]  ◔ 18%      对话 O:×12 S:×31 H:×4 210.6k
5h ████░░░░ 43% (刷新时间: 19:05)  │  7d ██░░░░░░ 27% (刷新时间: 04/09 00:00)
上轮 S:×2 8.1k  │  本轮 S:×3 11.5k
```

### `minimal` — 极简 · 只看本轮 · 隐藏 Plan

```
[Haiku 4.5]  ○ 6%      对话 S:×8 H:×22 47.3k
5h ○ 12% (刷新时间: 22:30)  │  7d ◔ 34% (刷新时间: 04/09 00:00)
本轮 H:×6 5.0k
```

### `dashboard` — 仪表盘 · 标签对齐

```
  model  Opus 4.6 (1M context) | Max        tokens 891.4k
    ctx  █████████░░░░░░░░░░░ 67%
     5h  ████████░░░░░░░░░░░░ 67% (刷新时间: 18:30)
     7d  █████░░░░░░░░░░░░░░░ 44% (刷新时间: 04/10 01:00)
   上轮  O:×6 S:×1 22.1k
   本轮  O:×9 S:×3 H:×1 39.7k
```

### `neon` — 霓虹渐变

```
[Opus 4.6 (1M context) | Max]  ◑ 52%     对话 O:×41 S:×19 H:×7 1.2M
5h ▏▎▍▌▋▊▉█░░░░ 38% (刷新时间: 20:15)  │  7d ▏▎▍▌▋▊▉████░ 58% (刷新时间: 04/08)
上轮 O:×4 S:×2 19.8k  │  本轮 O:×7 S:×3 31.2k
```

### `zen` — 禅意色点 · 只看本轮

```
[Sonnet 4.6 | Max]  ○ 9%      对话 S:×15 H:×3 98.7k
5h ● 8% (刷新时间: 22:30)  │  7d ● 21% (刷新时间: 04/08 01:00)
本轮 S:×2 H:×1 7.9k
```

### `powerline` — Powerline · 只看本轮

```
[Opus 4.6 (1M context) | Max]  ◔ 23%     对话 O:×18 S:×11 245.0k
5h ▓▓▓▓░░░░░░ 39% (刷新时间: 16:55)  │  7d ▓▓▓▓▓▓░░░░ 61% (刷新时间: 04/09)
本轮 O:×3 S:×1 14.2k
```

### `retro` — 复古 ASCII · 隐藏 Plan

```
[Opus 4.6 (1M context)]  ○ 21%   对话 O:×9 S:×5 132.5k
5h [####------] 41% (刷新时间: 21:00)  |  7d [######----] 63% (刷新时间: 04/08)
上轮 O:×3 14.1k  |  本轮 O:×5 S:×1 20.8k
```

### `pro` — 专业双时间 · 全部显示

```
[Opus 4.6 (1M context) | Max]  ◕ 79%      对话 O:×67 S:×28 H:×11 2.3M
5h ████████░░ 81% (刷新时间: 17:42 / 2h 18m)  │  7d ███░░░░░░░ 33% (刷新时间: 04/08 / 4d 22h)
上轮 O:×8 S:×2 H:×1 41.0k  │  本轮 O:×11 S:×4 61.3k
```

### `stealth` — 隐身 · 只看额度

```
[Opus 4.6 (1M context)]  ○ 3%
5h ██░░░░░░ 17%  │  7d ███░░░░░ 36%
```

---

## 配置

配置文件：`~/.claude/plugins/claude-dash/config.json`

只需写你要改的字段，其余沿用 preset 默认值：

```json
{
  "preset": "default",
  "showLastTurn": false,
  "showResetTime": false
}
```

### 全部配置项

| 配置项 | 可选值 | 默认 | 说明 |
|--------|--------|------|------|
| `preset` | 方案名称 | `"default"` | 基础方案 |
| `layout` | `compact` · `standard` · `dashboard` | `standard` | 布局 |
| `barStyle` | `block` · `half` · `gradient` · `dot` · `circle` · `ascii` | `block` | 进度条 |
| `contextIndicator` | `bar` · `circle` | `circle` | 上下文指示器 |
| `timeFormat` | `absolute` · `relative` · `both` | `absolute` | 时间格式 |
| `colorScheme` | `vibrant` · `muted` · `mono-green` · `mono-blue` | `vibrant` | 配色 |
| `barWidth` | 数字 | `10` | 进度条宽度，`0` = 不显示条形 |
| `showLastTurn` | `true` / `false` | `true` | 上一轮统计 |
| `showCurrentTurn` | `true` / `false` | `true` | 当前轮统计 |
| `showSessionStats` | `true` / `false` | `true` | 对话累计 |
| `showPlanName` | `true` / `false` | `true` | Max/Pro 标识 |
| `showResetTime` | `true` / `false` | `true` | 刷新时间 |

### 组合示例

<details>
<summary><b>只看本轮 + 隐藏刷新时间</b></summary>

```json
{ "showLastTurn": false, "showResetTime": false }
```
```
[Sonnet 4.6 | Max]  ◔ 31%      对话 S:×18 H:×4 156.3k
5h ███░░░░░░░ 31%  │  7d █████░░░░░ 52%
本轮 S:×3 H:×1 22.6k
```
</details>

<details>
<summary><b>纯净模式 — 只保留进度条</b></summary>

```json
{ "preset": "stealth", "showResetTime": false }
```
```
[Haiku 4.5]  ○ 7%
5h ██░░░░░░ 22%  │  7d ████░░░░ 43%
```
</details>

<details>
<summary><b>信息全开 + 双时间 + 宽进度条</b></summary>

```json
{ "preset": "pro", "barWidth": 12 }
```
```
[Opus 4.6 (1M context) | Max]  ◕ 74%      对话 O:×52 S:×23 H:×9 1.8M
5h ████████████░░░░░░░░ 74% (刷新时间: 18:05 / 1h 55m)  │  7d ██████░░░░░░░░░░░░ 48% (刷新时间: 04/08 / 4d 19h)
上轮 O:×7 S:×2 35.4k  │  本轮 O:×10 S:×4 57.1k
```
</details>

---

## FAQ

<details>
<summary><b>会消耗额外的 token 吗？</b></summary>

不会。claude-dash 是纯本地渲染，Claude Code 通过 stdin 管道传入状态数据，不调用任何 AI API。Usage 数据通过 Anthropic OAuth API 读取（和官方插件相同机制），不计入 token 消耗。
</details>

<details>
<summary><b>会导致封号吗？</b></summary>

不会。statusline 是 Claude Code 官方支持的插件类型，Usage API 是公开的 OAuth 接口。
</details>

<details>
<summary><b>和 claude-hud 是什么关系？</b></summary>

claude-dash 基于 [claude-hud](https://github.com/jarrodwatts/claude-hud)（MIT License, by Jarrod Watts）的架构思路开发，在此基础上增加了模型使用统计、轮次追踪、绝对刷新时间、可配置开关等功能。感谢 Jarrod Watts 的开源贡献。
</details>

<details>
<summary><b>如何切换方案？</b></summary>

在 Claude Code 中输入 `/claude-dash:setup`，或直接编辑 `~/.claude/plugins/claude-dash/config.json`。修改后无需重启，下次渲染自动生效。
</details>

---

<div align="center">

## 致谢

Based on [claude-hud](https://github.com/jarrodwatts/claude-hud) by **Jarrod Watts** · MIT License

**MIT © claude-dash contributors**

</div>
