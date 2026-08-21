# DevCoffer · 码柜

> 免费纯前端开发者工具箱 · 本地处理 · 无需注册

**在线：** [https://tools.livancen.top](https://tools.livancen.top)

面向前后端与 Java 开发者，提供 **195+** 工具、**8**
大分类：格式化、编解码、安全、生成与转换、代码生成、文本、调试、参考速查。顶栏搜索 / `Ctrl+K`，支持收藏与最近使用。

| 分类    | 数量 | 分类   | 数量 |
|-------|----|------|----|
| 格式化   | 28 | 代码生成 | 26 |
| 编解码   | 10 | 文本   | 16 |
| 安全    | 19 | 调试   | 27 |
| 生成与转换 | 35 | 参考   | 34 |

完整列表见 `data/tools.ts`。

---

## 快速开始

需要 Node.js **18+**（推荐 22）。

```bash
npm install
npm run dev          # 开发
npm run build && npm run preview   # 构建预览
npm run docker:up    # Docker（默认 :3000，探活 GET /health）
```

自定义端口：`$env:DEVCOFFER_PORT=8080; docker compose up -d`（PowerShell）。

其它脚本：`typecheck` / `sitemap` / `icons` / `parity` / `docker:down`。

---

## 技术栈与结构

Nuxt 3.15 SSR（Nitro `node-server`）+ Vue 3 + TypeScript；同源可选 `/__cors_proxy`。

```
pages/          # /  /c/:cat  /t/:id
components/     # 工具 UI
data/           # tools.ts、tool-impl.ts
shared/         # 纯逻辑（按分类）
server/routes/  # health、cors 代理
```

新增工具：元数据 → `data/tools.ts`，组件绑定 → `data/tool-impl.ts`，逻辑 → `shared/<分类>/`，UI →
`components/tools/<分类>/`。

---

## 隐私

- 默认浏览器本地计算，服务端不做编解码业务。
- HTTP / WS / MQTT / SSE / 视频等调试会按你填写的地址发请求；勾选代理时经 `/__cors_proxy` 转发（不落库）。
- 勿在不可信环境粘贴生产密钥与真实证件。
