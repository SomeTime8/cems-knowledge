# CEMS 知识库（GitHub + VitePress）

> 来源：2026-10-14 经远程服务器 HTTP 实测整理。CEMS = `http://cems.dev.mooke.cc/`「CEMS - 建筑企业综合管理平台」。

## 本地预览

```bash
npm install
npm run docs:dev
# 打开 http://localhost:5173/cems-knowledge/
```

## 构建

```bash
npm run docs:build
# 产物在 docs/.vitepress/dist/
```

## 推送到 GitHub（首次）

```bash
# 1. 在 GitHub 上新建仓库，建议名：cems-knowledge
#    私有 / 公开按你的需要选。公开前确认：本仓库不含密码、Token、PII 明文。
# 2. 本地初始化并推送
cd github-kb
git init
git add .
git commit -m "feat: CEMS 知识库初始版（2026-10-14 实测）"
git branch -M main
git remote add origin https://github.com/<你的用户名>/cems-knowledge.git
git push -u origin main
```

## 开启 GitHub Pages（自动部署）

1. GitHub 仓库 → Settings → Pages → Build and deployment → Source 选 **GitHub Actions**
2. 推送到 `main` 后，Actions 会自动构建并部署
3. 访问地址：`https://<你的用户名>.github.io/cems-knowledge/`

> 注意：`docs/.vitepress/config.mts` 中 `base: '/cems-knowledge/'` 需与仓库名一致。
> 如果仓库名为 `<你的用户名>.github.io`，把 `base` 改为 `'/'`。

## 目录

```
docs/
  index.md                  # 首页
  cems/
    01-overview.md
    02-function-modules.md
    03-api-inventory.md
    04-data-quality.md
    05-issues-and-risks.md
    06-optimization.md
    07-access-method.md
  public/data/
    api-inventory.json      # 718 个 API 模式
    api-probe-results.json  # 198 个探针结果
  .vitepress/config.mts
.github/workflows/deploy.yml  # GitHub Pages 自动部署
```

## 新增文章规范

每篇 Markdown 顶部加 frontmatter：

```yaml
---
title: 标题
description: 一句话摘要
date: 2026-10-14
source: 远程服务器实测 / 官方文档 / 会议纪要
status: verified / drafting / outdated
tags: [CEMS, P0]
---
```

- `raw/`（可选）：只放原始证据，不写结论
- 绝不提交：密码、Token、身份证/银行卡/手机号等敏感明文
