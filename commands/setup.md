---
description: 配置 claude-dash 状态栏方案
allowed-tools: Bash, Read, Edit, Write, AskUserQuestion
---

# claude-dash 配置向导

**注意**: 占位符 `{RUNTIME_PATH}`、`{PLUGIN_DIR}`、`{GENERATED_COMMAND}` 需替换为实际检测到的值。

---

## Step 1: 检测运行时与插件路径

**macOS/Linux**:

1. 查找插件目录（按版本号排序取最新）:
   ```bash
   ls -d "$HOME"/.claude/plugins/cache/claude-dash/claude-dash/*/ 2>/dev/null \
     | awk -F/ '{ print $(NF-1) "\t" $0 }' \
     | sort -t. -k1,1n -k2,2n -k3,3n -k4,4n \
     | tail -1 | cut -f2-
   ```
   如果为空，插件未安装。告知用户先通过 `/plugin install claude-dash` 安装。

2. 查找运行时（优先 bun，回退 node）:
   ```bash
   command -v bun 2>/dev/null || command -v node 2>/dev/null
   ```
   如果为空，告知用户安装 Node.js 或 Bun。

3. 根据运行时确定入口文件:
   - 如果运行时是 `bun`，使用 `src/index.ts`（原生 TypeScript 支持）
   - 否则使用 `dist/index.js`（预编译版本）

4. 生成命令:
   ```
   bash -c 'plugin_dir=$(ls -d "$HOME"/.claude/plugins/cache/claude-dash/claude-dash/*/ 2>/dev/null | awk -F/ '"'"'{ print $(NF-1) "\t" $0 }'"'"' | sort -t. -k1,1n -k2,2n -k3,3n -k4,4n | tail -1 | cut -f2-); exec "{RUNTIME_PATH}" "${plugin_dir}{SOURCE}"'
   ```

---

## Step 2: 预览所有方案

运行预览脚本展示所有 10 个方案的渲染效果（使用模拟数据）:

**如果运行时是 bun**:
```bash
{RUNTIME_PATH} {PLUGIN_DIR}src/preview.ts
```

**如果运行时是 node**:
```bash
{RUNTIME_PATH} {PLUGIN_DIR}dist/preview.js
```

如果预览命令失败（例如 `dist/preview.js` 不存在），先构建:
```bash
cd {PLUGIN_DIR} && {RUNTIME_PATH} node_modules/.bin/tsc 2>/dev/null || true
{RUNTIME_PATH} {PLUGIN_DIR}dist/preview.js
```

将预览输出完整展示给用户，让用户直观看到每种方案的样式。

---

## Step 3: 让用户选择方案

使用 AskUserQuestion:
- header: "选择显示方案"
- question: "选择你喜欢的方案 (输入名称，如 default/compact/neon):"
- options:
  - "default — 经典三行 + Block 进度条"
  - "compact — 紧凑双行"
  - "minimal — 极简双行 + 圆弧"
  - "dashboard — 仪表盘 · 标签对齐"
  - "neon — 霓虹三行 + 渐变条"
  - "zen — 禅意 · 色点指示"
  - "powerline — Powerline 风格"
  - "retro — 复古 ASCII"
  - "pro — 专业双时间"
  - "stealth — 隐身 · 绿色单色"

---

## Step 4: 保存配置

根据用户选择，写入配置文件 `~/.claude/plugins/claude-dash/config.json`（如目录不存在则创建）:

```json
{
  "preset": "{SELECTED_PRESET}"
}
```

写入示例（以 `neon` 为例）:
```bash
mkdir -p "$HOME/.claude/plugins/claude-dash"
echo '{"preset":"neon"}' > "$HOME/.claude/plugins/claude-dash/config.json"
```

如果文件已存在，读取现有内容后只更新 `preset` 字段，保留其他配置项。

---

## Step 5: 应用 statusLine 配置

读取 `~/.claude/settings.json`，合并 statusLine 配置（保留所有现有设置）:

```json
{
  "statusLine": {
    "type": "command",
    "command": "{GENERATED_COMMAND}"
  }
}
```

- 如果文件不存在，创建它
- 如果文件包含无效 JSON，报告错误，不覆盖
- 写入失败时重新读取并重试一次

---

## Step 6: 验证与完成

使用 AskUserQuestion:
- question: "配置完成！状态栏应显示在输入框下方。是否正常显示？"
- options: "是，已正常显示" / "否，有问题"

**如果正常**: 告知用户配置成功，说明：
- 重新运行 `/claude-dash:setup` 可随时切换方案
- 配置文件位于 `~/.claude/plugins/claude-dash/config.json`

**如果有问题**: 系统排查:

1. **验证配置已写入**:
   ```bash
   cat ~/.claude/settings.json | grep -A3 statusLine
   ```

2. **手动测试命令**:
   ```bash
   {GENERATED_COMMAND} 2>&1
   ```

3. **常见问题**:
   - "command not found"：运行时路径可能已变更，重新检测 `command -v bun` 或 `command -v node`
   - "No such file or directory"：插件可能未安装，检查 `ls ~/.claude/plugins/cache/claude-dash/`
   - 输出为空：检查 dist 目录是否存在，若无则运行构建
   - 权限错误：`chmod +x {RUNTIME_PATH}`
