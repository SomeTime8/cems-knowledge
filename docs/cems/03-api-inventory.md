---
title: API 盘点
description: 718 个接口、198 个探针
date: 2026-10-14
source: 远程服务器实测
status: verified
tags: ['CEMS', 'API']
---


## 总量

- 前端提取的 API 模式：**718** 条（见 `api-inventory.json`），覆盖全部业务模块
- 探针：**198** 个 GET 列表/统计/选项/树接口，全部返回 `code 200`（见 `api-probe-results.json`）
- 探针方式：以登录 Token 调用，只读 GET，未提交业务数据

## API 命名规律（实测）

- 列表：`GET /api/<module>/page?pageNum=1&pageSize=N`（如 `/api/project/page`、`/api/contract/page`）
- 详情/单个：`GET /api/<module>/{id}`，新建 `POST /api/<module>`，更新 `PUT /api/<module>`，删除 `DELETE /api/<module>/{id}`
- 统计：`GET /api/<module>/summary` 或 `/stats`（如 `/api/project/summary`、`/api/contract/risk/summary`）
- 选项：`GET /api/<module>/options` 或 `/all`（如 `/api/contract/options`、`/api/role/all`）
- 审批流：`POST /api/<module>/{id}/submit`（如合同、项目立项、发票、付款申请）
- 文件：`POST /api/file/upload`，`GET /api/file/` 等

## 各模块 API 示例（实测可用）

- 项目：`/project/page`、`/project/summary`、`/project/options`、`/project/team/page`、`/project/budget/page`、`/project/gantt/list`、`/project/stage/page`、`/project/milestone/page`、`/project/progress/page`、`/project/quality/page`、`/project/safety-check/page`、`/project/cost/page`、`/project/report/page`、`/project/file/page`、`/project/media/page`
- 合同：`/contract/page`、`/contract/options`、`/contract/reminder/page`、`/contract/risk/list`、`/contract/payment-plan/page`、`/contract/perf-guarantee/page`、`/contract/archive/page`
- 财务：`/finance/income/page`、`/finance/expense/page`、`/finance/payment-request/page`、`/finance/receipt/page`、`/finance/bank-flow/page`、`/finance/ar-ap/page`、`/finance/invoice/page`、`/finance/tax-rate/page`、`/finance/report/*`
- 招投标：`/bid/tender/page`、`/bid/registration/page`、`/bid/result/page`、`/bid/deposit/page`、`/bid/competitor/page`、`/bid/win-stats/summary`
- 人事：`/employee/page`（注意不是 `/hr/employee/page`）、`/attendance/record/page`、`/leave/page`、`/overtime/page`、`/salary/*/page`、`/hr/recruit/*/page`
- 证书：`/cert/enterprise/page`、`/cert/personnel/page`、`/cert/reminder/page`、`/cert/gap/page`、`/cert/usage/page`
- 材料：`/material/page`（不是 `/material/item/page`）、`/material/supplier/page`、`/material/purchase-plan/page`、`/material/inventory/page`
- 设备：`/equipment/page`、`/equipment/maintenance/page`、`/equipment/repair/page`、`/equipment/lease/page`
- 劳务：`/labor/crew/page`、`/labor/worker/page`、`/labor/contract/page`、`/labor/payroll/page`
- 用印：`/seal/apply/page`、`/seal/record/page`、`/seal/ledger/page`、`/seal/audit/page`、`/seal/device/page`
- 知识库：`/kb/doc/page`、`/kb/qa/page`、`/kb/entity/page`、`/kb/relation/page`、`/kb/stats`、`/kb/graph/data`
- 消息：`/message/page`（不是 `/message/center/page`）、`/message/unread-count`、`/message/template/page`、`/message/rule/page`
- 审批：`/approval/template/page`、`/approval/handover/page`、`/approval/tasks/pending`
- 系统：`/user/page`、`/role/page`、`/menu/all`、`/menu/user-tree`、`/dict/page`、`/org/page`、`/org/tree`、`/log/login/page`、`/log/operation/page`
- 驾驶舱：`/cockpit/summary`、`/cockpit/drill/{code}`（code 如 `projectCount`）、`/dashboard/output-value`、`/dashboard/contract-fulfillment`、`/report/page`

## 常见误判（已验证纠正）

- `/api/project/list`、`/api/contract/list`、`/api/dashboard/stats`、`/api/hr/employee/page`、`/api/system/user/page`、`/api/message/center/page`、`/api/message/list`、`/api/backup/page` 等返回 500，是因为路径错误、前端未使用，并非真实功能缺失。
- 正确路径见上表；未知路径统一返回 500 `系统繁忙，请稍后再试`，应改为 404（见 05）。
- `/api/cockpit/drill/1` 返回 `未知指标: 1` 是正确行为，正确用法是 `/api/cockpit/drill/projectCount`。
