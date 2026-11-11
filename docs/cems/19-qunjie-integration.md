# 19 - 群杰智能印章对接（2026-10-27 立项）

> 定位：**超越项**（原站本身也是 Mock 未接入），单独立项、不混复刻对齐。施工依据与全量测绘在 `tasks/qunjie-integration/`（MAPPING.md / INTRO.md / BUILD-REPORT.md，官方文档全文提取 qunjie-v5-api.txt）。

## 对端与文档

- 江苏群杰物联科技有限公司（南京），实体印章物联网管控专长：管控平台 V5.0 + 用印宝（智能章筒）/ 印控台 / 智能印章柜终端；事前授权→事中监控（人脸/影像/GPS/次数）→事后台账闭环；客户为集团型多分支组织（万达、远东控股、南通三建等）。
- 接口文档：《V5.0 印章管控平台对外开放接口方案 V1.4》（365 页），**官方公开渠道无此文档**（官网/云市场只有产品页），随私有化交付；用户已提供，我方持有全文。
- 用户侧为**私有化部署**：设备连内网群杰平台，我方后端与之做平台间 API 对接。

## 对接契约（三链）

- 鉴权：`POST api/token/getToken`（rest 账号 → Bearer JWT，2h，缓存）。
- 授权：`POST api/item/sealAuthorize`（multipart，workflowApplyParam：title/callBackUrl/applyerUserName/usedSealParamList[sealId, applyCount, sealerUserName, takeOut…]）→ 返回 **applyId** 全链关联键；关闭 `POST api/item/finishWorkflowApply`。
- 记录：2.9.2 私有化回调（start/press/end 事件推 callBackUrl，**次数非最终账**）+ 2.9.5/2.9.6 查询对账 + 2.10 盖章影像。设备在线 2.7.10、六类预警 2.11 与我方设备台账/预警页对应。

## 我方实现（一期已落地，默认未启用）

- 配置块 `cems.qunjie.*`（环境变量覆盖），**enabled=false 时现行为逐字不变**（Mock 状态条与本地授权原样）。
- QunjieClient（token 缓存、授权/关闭/记录查询/设备在线/印章列表，信封 status==0 口径）；grant 先下发后落状态（缺映射明确报错、不假授权）；回调端点 `POST /api/seal/qunjie/callback`（permitAll + 端点内密钥校验，仿 OnlyOffice 先例，全量落 callback_log）；5 分钟同步任务对账落记录（来源分「事件回调」/「群杰同步」）；映射表 qunjie_seal_map / qunjie_user_map + 维护端点（迁移 V90）。
- **按时长口径（定案）**：文档 2.9.1 全节无授权有效期字段（唯一起止是外带预计时间）→ 按次数取 authValue、按时长取申请份数，到期由同步任务调 finishWorkflowApply 关闭，不静默降级为无限期。
- 假对端 `tasks/qunjie-integration/fake-qunjie/`（按契约实现 + 模拟盖章控制面），自测 14 项全过；整树编译与闸 S1 已过，假对端全链联调在收口中完成。

## 切真清单（等用户侧三件）

1. 部署基址（host:port，如 `http://<内网地址>:<接口服务端口>/api` 形态）与所在网段（定我方生产服务器与群杰平台双向连通路径）；
2. restname/password（600 权限文件交付，不进聊天/文档）；
3. 后台版本号与文档 V1.4 差异确认。
到手后：getToken 一调验基址口径 → 2.8.3 拉印章列表落映射 → 人员账号映射核对 → 真单联调（授权→盖章→回调→对账→关闭）。

## 服务器实勘（2026-10-27，只读）

- 群杰服务器 `<群杰服务器地址>`（腾讯云 CentOS 7，经跳板 SSH，公钥已授权）：平台 **P5 Pro v5.5.x**，docker-compose 工程在宿主机工程目录（zuul 网关 / web / file / connector / eureka 注册中心 / nginx 等服务，对外仅控制台入口）；生产服务器侧仅控制台入口与 SSH 端口可达（正合对接所需）。
- **关键发现：本机未部署 InterfaceService（对外接口服务）**——nginx `/api` 路由存在但 upstream 无后端、实测 502；SSO/Job 等接口配套服务同缺。切真前置变为：群杰侧须先加装/启用接口服务并开通 rest 账号，此为当前唯一硬阻塞；基址候选为其控制台入口同址的 `/api` 路径 待接口服务上线后以 getToken 定版。全量实勘见 `tasks/qunjie-integration/SERVER-SURVEY.md`。
