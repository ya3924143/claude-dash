# 运维手册

> 基于代码生成，最后更新：2026-04-04

---

## 安装

### 方式一：Claude Code 插件管理器（推荐）

在 Claude Code 中输入：

```
/plugin install https://github.com/ya3924143/claude-dash
```

插件安装到 `~/.claude/plugins/cache/claude-dash/claude-dash/<version>/`。

安装完成后执行配置向导：

```
/claude-dash:setup
```

### 方式二：手动克隆

```bash
git clone https://github.com/ya3924143/claude-dash.git ~/.claude/plugins/claude-dash
```

确认运行时（bun 优先，降级 node）：

```bash
command -v bun 2>/dev/null || command -v node 2>/dev/null
```

在 `~/.claude/settings.json` 中添加 `statusLine` 配置（见下方"statusLine 配置"）。

---

## statusLine 配置

编辑 `~/.claude/settings.json`，在顶层添加 `statusLine` 字段：

**使用 bun（原生 TypeScript，无需编译）：**

```json
{
  "statusLine": {
    "type": "command",
    "command": "bun /path/to/claude-dash/src/index.ts"
  }
}
```

**使用 node（需要预编译的 dist/）：**

```json
{
  "statusLine": {
    "type": "command",
    "command": "node /path/to/claude-dash/dist/index.js"
  }
}
```

`/claude-dash:setup` 会自动检测运行时并写入正确路径。

---

## 用户配置文件

**路径：** `~/.claude/plugins/claude-dash/config.json`

只需写要覆盖的字段，其余继承所选方案的默认值：

```json
{
  "preset": "default"
}
```

### 全部配置项

| 配置项 | 类型 | 可选值 | 说明 |
|--------|------|--------|------|
| `preset` | string | 见下方方案列表 | 基础方案，其他字段在其基础上覆盖 |
| `layout` | string | `compact` / `standard` / `dashboard` | 整体布局 |
| `barStyle` | string | `block` / `half` / `gradient` / `dot` / `circle` / `ascii` | 进度条风格 |
| `contextIndicator` | string | `bar` / `circle` | 上下文指示器类型 |
| `timeFormat` | string | `absolute` / `relative` / `both` | 配额刷新时间格式 |
| `colorScheme` | string | `vibrant` / `muted` / `mono-green` / `mono-blue` | 配色方案 |
| `barWidth` | number | 正整数，`0` 表示不显示条形 | 进度条宽度（字符数） |
| `showLastTurn` | boolean | `true` / `false` | 显示上轮模型统计 |
| `showCurrentTurn` | boolean | `true` / `false` | 显示本轮模型统计 |
| `showSessionStats` | boolean | `true` / `false` | 显示对话累计统计 |
| `showPlanName` | boolean | `true` / `false` | 显示 Max/Pro 订阅名称 |
| `showResetTime` | boolean | `true` / `false` | 显示配额刷新时间 |

### 内置方案列表

| 方案名 | layout | 说明 |
|--------|--------|------|
| `default` | standard | 经典三行，全部信息 |
| `compact` | compact | 紧凑双行，全部信息 |
| `minimal` | compact | 极简，只看本轮，隐藏 Plan |
| `dashboard` | dashboard | 仪表盘，每项独占一行，标签对齐 |
| `neon` | standard | 霓虹渐变进度条 |
| `zen` | standard | 禅意色点，只看本轮 |
| `powerline` | compact | Powerline 风格 |
| `retro` | standard | 复古 ASCII 进度条，单色绿 |
| `pro` | standard | 双时间（绝对+相对），全部信息 |
| `stealth` | compact | 隐身，仅显示配额和上下文 |

---

## 内部缓存文件

**路径：** `~/.claude/plugins/claude-dash/.usage-cache.json`（见 `src/constants.ts`）

用量 API 响应缓存到此文件：

- 成功响应缓存 60 秒
- 失败响应（网络错误、超时、限流）缓存 30 秒

缓存过期或不存在时自动重新请求。手动删除此文件可强制刷新：

```bash
rm ~/.claude/plugins/claude-dash/.usage-cache.json
```

---

## 编译（开发环境）

如果通过 node 运行且 `dist/` 目录缺失或需要更新：

```bash
cd ~/.claude/plugins/claude-dash
npm install
npm run build
```

编译输出到 `dist/`，bun 用户无需此步骤。

---

## 切换方案

**交互式（推荐）：**

```
/claude-dash:setup
```

**手动编辑配置文件：**

```bash
# 切换到 neon 方案
echo '{"preset":"neon"}' > ~/.claude/plugins/claude-dash/config.json
```

修改后无需重启，下次状态栏渲染时自动生效。

---

## 排查常见问题

### 状态栏不显示

1. 检查 `~/.claude/settings.json` 中 `statusLine.command` 是否存在且正确
2. 手动运行命令测试：
   ```bash
   echo '{}' | node ~/.claude/plugins/claude-dash/dist/index.js
   ```
3. 检查 `dist/` 目录是否存在，不存在则运行 `npm run build`

### 显示 `[claude-dash] Initializing...`

stdin 为 TTY（未通过管道传入数据），通常在直接运行脚本而非通过 Claude Code 调用时出现，属正常现象。

### 配额数据显示 `⚠`（黄色）

`usage-api.ts` 请求 Anthropic 用量 API 失败，可能原因：

- 网络不可达
- `~/.claude/.credentials.json` 不存在或 token 已过期
- API 限流（rate-limited）

查看具体错误：修改 `statusLine.command` 临时追加 `2>&1` 输出错误信息。

### 上下文百分比不准确

Claude Code < v2.1.6 不提供 `used_percentage` 字段，`stdin.ts` 会降级使用 token 数量手动计算，结果与官方数据可能略有偏差。升级 Claude Code 可解决。

### 终端显示宽度不正确

claude-dash 读取 `COLUMNS` 环境变量或 `process.stdout.columns`。在某些终端模拟器或 tmux 中可能检测不准确，可通过设置环境变量覆盖：

```bash
export COLUMNS=120
```

---

## 数据来源与安全性

| 数据 | 来源 | 说明 |
|------|------|------|
| 模型名、上下文用量 | Claude Code stdin 管道 | 实时，每次渲染刷新 |
| 配额（5h/7d） | Claude Code stdin（优先）/ Anthropic OAuth API | stdin 含 rate_limits 时直接使用；否则调用 API |
| 模型调用统计 | 本地会话记录文件（.jsonl） | 解析 `transcript_path` 指向的文件 |
| 订阅计划名称 | `~/.claude/.credentials.json` | 仅读取，不修改 |

**claude-dash 不向任何第三方发送数据，不修改任何会话文件。**
