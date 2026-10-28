# 会话控制台 / Session Console — 安装说明

DSH Web UI 的一个插件：把所有工作区的会话收进一张卡片列表，按「需要你看 / 进行中 / 今天 / 更早」排列，点一下就切过去。不读上下文、不做摘要、不接管审批、零 LLM 调用。

## 环境要求

- 已安装 DSH（Desktop 或 Web profile），并且能用插件管理器（`plugin_manager`）安装本地 bundle。
- 不需要 Node 构建步骤：插件是纯 JavaScript。

## 安装

1. 把这个文件夹整个放到一个**固定位置**（不要留在下载目录里，插件是链接安装，删了文件夹插件就没了）：

   ```
   ~/.dsh-plugins/dsh-hecate
   ```

2. 在 DSH 里新建一个会话，把下面这句发给 agent：

   > 用 plugin_manager 安装本地 bundle：`<上一步的绝对路径>`

   对应动作是 `plugin_manager` 的 `install_bundle`，`target` 填那个绝对路径。

3. 安装完成后左侧栏出现一个新的面板图标（三个圆点 + 三条横线的图形），点开就是控制台。首次加载会在你的主目录下建一个工作区：

   ```
   ~/.dsh-hub          # Windows: C:\Users\<你>\.dsh-hub
   ```

   它会自动排在工作区列表的最上面。

## 配置（可选）

在 profile 的 `cordis.patch.yml` 里给这一行加 config：

```yaml
- insert:
    - id: session-hub
      name: dsh-hecate
      config:
        path: 'D:\my-hub'   # 控制台工作区目录，不存在会自动创建
        title: 控制台         # 仅首次创建时生效；客户端也用它识别「◈ 控制台」分组
        pin: true            # 每次加载把它移到工作区列表最上面
```

两个可调的本地设置（存在浏览器的 `localStorage`，不用改代码）：

```js
localStorage.setItem('dsh-hecate:font', '17')      // 12–22px，默认 15
localStorage.setItem('dsh-hecate:skin', 'host')    // night（默认）/ host（跟随主题）
```

## 卸载

```
plugin_manager action: remove_bundle, target: dsh-hecate
```

卸载会移除面板和预览接口，但**不会**清这三样东西，需要的话手动处理：

- 控制台工作区（侧栏里删）
- 浏览器 `localStorage` 的 `dsh-hecate:font` / `:skin` / `:finished` 三个键
- 已创建的 `~/.dsh-hub` 目录（空的可以留着）

## 使用要点

- **范围**：进行中（运行中 ∪ 正在等你）/ 全部；**时间窗**：1小时 / 今天 / 本周（只作用于「全部」）。
- **刚跑完**：会话跑完后一直保留在「需要你看」，直到你点卡片右上角的 `✓`（标记已处理）。标记存在浏览器本地，刷新仍在。
- **超过 5 分钟没勾**：升到最顶部的红组「超时未处理」，时间显示「已 N 分钟未处理」。
- **打开会话不会自动勾掉**；在那个会话里再发一句话，状态会转成运行中并自动清除标记。
- 卡片底部标注所属工作区；点卡片进入该会话，点 `✓` 只做标记、不会打开。

## 已知限制

- 客户端的会话摘要里没有「完成时间」字段，完成时刻是面板观察 `running → 停止` 那条边沿记下来的。面板刚打开时，只有 5 分钟内动过的空闲会话会被补记成「刚跑完」。
- 默认工作区目录是 `~/.dsh-hub`；如果你的 profile 里已有一个标题为「控制台」的工作区，插件会**接管**它而不是新建。
- 卡片列表最多渲染 300 张（还没有虚拟滚动）；`全部 + 本周` 很大时会提示「还有 N 个未显示」。
- 需要 DSH 的 Client 侧提供 `sessions` / `workspaces` / `uiWorkspace` 三个服务；版本过旧可能不兼容。
