---
layout: home
hero:
  name: CEMS 知识库
  text: 建筑企业综合管理平台
  tagline: 实测分析 · API 盘点 · 问题与优化，不写猜测，只写证据
  actions:
    - theme: brand
      text: 开始阅读 →
      link: /cems/01-overview
    - theme: alt
      text: 问题清单 P0/P1/P2
      link: /cems/05-issues-and-risks
features:
  - title: 实测为准
    details: 2026-10-14 经远程服务器 HTTP 实测，718 个 API 模式、198 个 GET 探针全部 200；10-15 复测 36 个核心接口全部通过
  - title: 分层清晰
    details: 概览 / 功能 / API / 数据质量 / 问题 / 优化 / 访问方式，每篇带元数据
  - title: 无敏感明文
    details: 不记录密码、Token、身份证/银行卡/手机号
---

## 快速导航

- [01 系统概览](/cems/01-overview) — 定位、技术栈、登录权限、工作台
- [02 功能模块与实现程度](/cems/02-function-modules) — 19 个菜单组、358 个菜单、核心链路
- [03 API 盘点](/cems/03-api-inventory) — 718 个接口、正确路径、常见误判
- [04 数据量与数据质量](/cems/04-data-quality) — 项目 7、合同 9、招标 1054、员工 2
- [05 问题清单与风险](/cems/05-issues-and-risks) — P0 备份已解决、发票 OCR Mock、HTTP 明文、PII 未脱敏
- [06 优化建议](/cems/06-optimization) — 短期 / 中期 / 长期
- [07 访问方式](/cems/07-access-method) — 为什么同 URL 出现两套系统、远程服务器接入
- [08 后端复刻实施方案](/cems/08-backend-plan) — Spring Boot 3.2 + MySQL 8.0，44 模块 1:1 对应

> 数据文件：`/data/api-inventory.json`（718 条）、`/data/api-probe-results.json`（198 条探针结果）、`/data/api-probe-results-20261015.json`（36 条复测结果）
