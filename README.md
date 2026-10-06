# LogicSim - 逻辑表达式模拟器

一个基于逆波兰表达式的逻辑电路可视化工具，支持逻辑与、或、非、推出、等价，以及全称量词(∀)和存在量词(∃)。

## 在线体验

- **改造版（新版）**：[在线地址待部署后填写]
- **原版**：https://kuangdash.gitlab.io/logicsim

## 改造内容

基于 2021 年的 [原版项目](https://gitlab.com/kuangdash/logicsim) 进行了以下改造：

### 1. 新增量词支持
- **全称量词 `A` (∀)**：`x A` 表示「对所有 x」
- **存在量词 `E` (∃)**：`x E` 表示「存在某个 x」
- 量词可与其他操作符自由组合，如 `x A y .` 表示「对所有 x，x 与 y」

### 2. UI 现代化
- 使用 Tailwind CSS 重新设计界面
- 添加暗色模式支持
- 响应式布局，可折叠侧边栏
- 帮助模态框和示例按钮
- 更清晰的节点颜色和图形

### 3. 保留的操作符
| 操作符 | 含义 | 示例 |
|--------|------|------|
| `.` | 逻辑与 (AND) | `a b .` |
| `,` | 逻辑或 (OR) | `a b ,` |
| `<` | 逻辑非 (NOT) | `a <` |
| `>` | 逻辑推出 (IMPLIES) | `a b >` |
| `=` | 逻辑等价 (EQUALS) | `a b =` |
| `A` | 全称量词 ∀ (FORALL) | `x A` |
| `E` | 存在量词 ∃ (EXISTS) | `x E` |

## 本地运行

直接打开 `index.html` 即可，或用任意静态服务器：

```bash
npx serve .
```

## 技术栈

- **图形引擎**：JointJS（Rappid 开源版）
- **布局算法**：Dagre 有向图布局
- **UI 框架**：Tailwind CSS
- **核心库**：jQuery, Lodash, Backbone.js

## 部署

支持以下静态托管平台：
- Cloudflare Pages（推荐）
- Vercel
- GitHub Pages
- GitLab Pages

## License

基于原项目，保持相同许可。
