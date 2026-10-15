---
title: 数据量与数据质量
description: 数据量快照、样本字段、质量问题
date: 2026-10-15
source: 远程服务器实测
status: verified
tags: ['CEMS', '数据质量']
---


> 数据量为实测快照，只读 GET。样本字段仅列字段名与非敏感示例，不含身份证/银行卡/手机号等 PII 明文。
> 首次快照：2026-10-14；复测：2026-10-15（36 个核心接口抽样，全部 code 200）。

## 数据量快照（探针 total）

| 模块 | 接口 | 2026-10-14 | 2026-10-15 | 变化 |
|------|------|-----------|-----------|------|
| 项目 | `/project/page` | 7 | 7 | - |
| 合同 | `/contract/page` | 9 | 9 | - |
| 招标信息 | `/bid/tender/page` | 1054 | 1054 | - |
| 中标结果 | `/bid/result/page` | 7 | 7 | - |
| 投标登记 | `/bid/registration/page` | 5 | 未复测 | - |
| 员工 | `/employee/page` | 2 | 2 | - |
| 用户 | `/user/page` | 21 | 21 | - |
| 角色 | `/role/page` | 30 | 30 | - |
| 菜单（全部，含按钮权限） | `/menu/all` | 355 | 358 | +3 |
| 菜单（用户树，仅菜单） | `/menu/user-tree` | 19组 | 19组/173菜单 | - |
| 审批模板 | `/approval/template/page` | 51 | 52 | +1 |
| 审批待办 | `/approval/tasks/pending` | 未测 | 1 | - |
| 考勤记录 | `/attendance/record/page` | 18 | 18 | - |
| 证书-人员 | `/cert/personnel/page` | 27 | 27 | - |
| 证书-提醒 | `/cert/reminder/page` | 19 | 19 | - |
| 证书-企业资质 | `/cert/enterprise/page` | 6 | 6 | - |
| 收入 | `/finance/income/page` | 6 | 6 | - |
| 支出 | `/finance/expense/page` | 13 | 13 | - |
| 发票 | `/finance/invoice/page` | 7 | 7 | - |
| 银行流水 | `/finance/bank-flow/page` | 14 | 14 | - |
| 材料 | `/material/page` | 6 | 6 | - |
| 材料供应商 | `/material/supplier/page` | 6 | 6 | - |
| 库存 | `/material/inventory/page` | 7 | 7 | - |
| 设备 | `/equipment/page` | 7 | 7 | - |
| 劳务队伍 | `/labor/crew/page` | 1 | 1 | - |
| 劳务工人 | `/labor/worker/page` | 1 | 1 | - |
| 用印申请 | `/seal/apply/page` | 6 | 6 | - |
| 知识文档 | `/kb/doc/page` | 4 | 4 | - |
| 消息 | `/message/page` | 见实测 | 2301 | - |
| OA公文 | `/oa/doc/page` | 2 | 2 | - |
| OA会议 | `/oa/meeting/page` | 0 | 0 | - |
| **系统备份** | `/system/backup/page` | 0（Mock） | **2（真实）** | ✅ Mock→真实 |
| 驾驶舱 | `/cockpit/summary` | 未测 | 200（8个指标键） | - |
| 登录日志 | `/log/login/page` | 626 | 657 | +31 |
| 操作日志 | `/log/operation/page` | 1036 | 1038 | +2 |
| 竣工 | `/project/completion/page` | 36 | 36 | - |
| 项目成本 | `/project/cost/page` | 14 | 14 | - |

## 数据为 0 的模块（实现可用但未使用/未产生数据）

审批交接 0、考勤申诉 0、班次 0、投标任务 0、人员异动 0、招聘岗位/候选/面试 0、劳务考勤/工资/分包/结算 0、借款 0、OA 资产/会议/奖罚/车辆使用 0、协作任务 0、报表列表 0、项目变更签证 0、保修工单 0。

## 样本字段（非敏感）

- **项目**：`id / name / code / type / scale / region / owner / manager / managerId / techLead / deputyManager / contractAmount / startDate / endDate / status / contractId / contractName`
  - 示例：名称“林甸县2026年高标准农田建设项目施工十三标段”，编号 `XM-2026-940`，类型 市政，规模 中型，状态 立项，合同金额 11000
- **合同**：`id / code / name / type / partyB / amount / signDate / projectName / projectId / status / approvalStatus / attachments`
  - 示例：编号 `HT-2026-005`，类型 施工，状态 执行中，审批 已通过，附件 `[]`
- **招标**：`id / name / region / publishDate / status / sourceUrl / sourceSite`
  - 示例：来源“河南省公共资源交易中心”，状态 定标，含外部 `sourceUrl`
- **驾驶舱 KPI**：项目总数 7、合同总额 408,300,000 元、本月支出 0、本月收入 0、设备总数 7、材料种类 6、劳务工人 1
- **项目汇总**：`{total:7, amount:399,011,000, finished:2, building:2}`
- **项目预算汇总**：`{actual, total:70,020,000, remain}`

## 数据质量问题（实测，详见 05）

1. **金额不一致**：某项目 `contractAmount 11000`，对应合同 `amount 0.0`；项目汇总金额 399,011,000 与驾驶舱合同总额 408,300,000 不一致。
2. **履约率全 0**：`/dashboard/contract-fulfillment` 全部 `fulfillRate 0.0 / receivedAmount 0`，与合同“执行中”矛盾。
3. **本月收支 0**：驾驶舱本月收入/支出均为 0，与收入/支出列表有数据矛盾（可能为统计口径/时间范围问题）。
4. **字段占位**：某项目 `region` 仅“林”（截断）、`owner` 为“乙方”（应为建设单位名称）；多条记录负责人均为“系统管理员”。
5. **测试数据**：员工示例含明显测试格式的身份证/银行卡/手机号，且接口未脱敏（安全问题，见 05，不在此记录明文）。
6. **招标数据**：1054 条为外部抓取的招标公告，与内部投标/中标数据量（5/7）差距大，需区分“外部信息库”与“内部业务数据”。
