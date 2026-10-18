# 14 - 复刻站工程说明

> CEMS 前端 1:1 复刻工程：按原站静态分析证据重建的 Vue 3 前端，接原站真实后端 API。2026-10-15 完成并部署。

## 基本信息

| 项 | 值 |
|---|---|
| 访问地址 | `http://<服务器IP>:5173` |
| 技术栈 | Vue 3.5 + Pinia 4.0 + Element Plus 2.14 + Vite |
| 视图数 | 206 个 `.vue` 文件（199 个业务视图 + 7 个基础/布局） |
| API 模块 | 44 个（`src/api/cems/`），约 771 个接口函数 |
| 后端 | 反代原站 `http://cems.dev.mooke.cc/` 真实 API（无 Mock） |
| 部署 | systemd 服务 `cems-replica`（自启），`server.cjs` 静态托管 + `/api` 反代 |

## 工程位置

- 源码：`~/workspace/server-works/tasks/cems-replicate/pure-admin-shell/`
- 构建产物：`dist/`（约 16MB，264 个 JS chunk）
- 审计报告：`tasks/cems-replicate/PAGE-AUDIT-*.md`（4 份）+ `audit-shots/` 截图

## 关键实现细节

- **路由**：vue-pure-admin 动态路由，`initRouter()` 后校验菜单非空（空则重试一次，仍空弹错而非空白页）
- **请求层**：`cems-request.js` 返回 `{code,message,data}` 信封；数组参数用 qs `repeat` 序列化
- **权限**：`v-permission` 支持 `string|string[]`，`*:*:*` 超级管理员短路
- **性能**：`server.cjs` 开 gzip（JS/CSS/HTML）+ 缓存头（`/assets/*` immutable 一年，`index.html` no-cache）；Vite `manualChunks` 拆 element-plus/echarts/vxe
- **登录态**：同时写 vue-pure-admin 的 user-info+cookie 与原 `cems-token`，解决守卫互踢问题

## 已知问题与教训

1. `cloneDeep` 会破坏 `import.meta.glob` 返回的懒加载组件函数——动态路由的 component 是函数时直接传引用，不要深拷贝（见 AGENTS.md）。
2. 原站有反爬，headless Chromium 只能拿到空 HTML；财务/材料/项目 5 页改用静态分析原站 JS 逐字节还原。
3. 部署用 rsync 直接覆盖有约 20 分钟新旧混装窗口（16MB @ ~13KB/s），`~/workspace/tools/cems-deploy.sh` 已备好原子部署脚本（staging + 毫秒切换 + 两版回滚 + 自动冒烟），待采用。

## 与后端复刻的关系

- 本复刻站目前反代**原站**真实后端；08 号文档规划的 Spring Boot 自研后端完成后，改 `server.cjs` 反代目标即可切换，无需改前端。
- 示例数据：`tasks/cems-replicate/sample-data/`（13 模块 55 API 约 250 条脱敏记录，离线/演示备用）。
