---
title: CEMS 系统概览
description: 系统定位、技术栈、登录权限、工作台
date: 2026-10-14
source: 远程服务器实测
status: verified
tags: ['CEMS', '概览']
---


## 定位

- 名称：CEMS - 建筑企业综合管理平台
- 品牌标题：CEMS 建筑企业管理平台，副标题 Enterprise Resource Planning
- 面向：建筑企业，ERP / 综合管理平台
- URL：`http://cems.dev.mooke.cc/`（HTTP 版为准，见 07-access-method.md）
- 不要混淆：`https://cems.dev.mooke.cc/` 在本环境返回 Astro Nexus 管理后台，不是 CEMS。

## 技术栈（实测自前端 JS 与请求层）

- 前端：Vue 3.5.38 + Pinia 3.0.4 + Element Plus，History 模式（无 `#`），`lang="zh-CN"`
- 主 JS：`/assets/index-98TF3CtC.js`（约 807KB / 822928 字节），CSS `/assets/index-CgFj1UvP.css`
- 分块：227 个 JS 分块，含 175 个 View 分块
- 请求层：axios，`baseURL: /api`，`timeout: 15s`，请求拦截器加 `Authorization: Bearer <token>`，响应 `code===200` 为成功；401 清空存储并跳转 `/login`；403 提示“权限不足”
- 本地存储前缀：`erp_`，含 token、userId、username、realName、roles、permissions、menuTree
- 主题：`erp-theme-color` 默认 `#2b5a8c`，暗色 `erp-dark-mode`，标签页 `erp-tags-view`，侧边栏 `erp-sidebar-collapsed`
- 后端：静态 SPA + `/api`，未登录 `/api/*` 返回 403 Forbidden；无效 Token 同样 403

## 登录与权限（实测）

- 登录：`POST /api/auth/login`，注册 `POST /api/auth/register`，当前用户 `GET /api/auth/current-user`
- 登录页有默认账号提示（页面展示的演示账号），不以明文记录密码。
- 实测登录账号：`admin`，`userId 1`，`realName 系统管理员`，角色 `admin / boss / hr_manager`
- 菜单：`GET /api/menu/user-tree` 返回 19 个顶级菜单组；`GET /api/menu/all` 返回 355 条菜单（含按钮/权限点）
- 菜单字段：`id / parentId / menuName / menuType / path / component / icon / permissionCode / sortOrder / visible / status`
- 权限：55 个权限码（见 02），前端按权限过滤菜单仅为展示，后端以 Token + 权限校验为准
- 退出 / 401：清除存储并跳转 `/login`

## 部署（实测）

- HTTP：`http://cems.dev.mooke.cc/` 返回 200，`Server: nginx`，静态 SPA shell（1473 字节），深链 `/login /dashboard /project/list` 均返回 200 同一 shell（SPA fallback 生效）
- HTTPS：本环境返回 Astro Nexus，非 CEMS
- DNS 差异：远程服务器解析为 `<DNS解析IP-CEMS>`（CEMS）；本地 VM 解析为 `<DNS解析IP-Astro>`（Astro Nexus 路径）。详见 07

## 工作台 / 驾驶舱（实测）

- 工作台：`DashboardView`，含 4 个统计卡（在建项目 / 待审批 / 证件到期预警 / 合同到期预警，初始 `--`）+ 8 个快捷入口（员工档案、证件、项目、招投标、合同、用印、知识库、系统管理）
- 经营驾驶舱：`CockpitView`，`GET /api/cockpit/summary` 返回 8 个 KPI（项目总数 7、合同总额 408,300,000 元、本月支出 0、本月收入 0、设备总数 7、材料种类 6、劳务工人 1、另 1 个 KPI）；点击 KPI 可钻取 `GET /api/cockpit/drill/{code}`（如 `projectCount` 返回真实明细列与行）
- 经营看板：`BusinessDashboardView`，两个 Tab：项目产值看板 `GET /api/dashboard/output-value`、合同履约看板 `GET /api/dashboard/contract-fulfillment`
- 注意：驾驶舱本月收支 0、履约率全 0，见 04/05 数据质量问题
