# CEMS 后端复刻详细实施方案

> **版本**：v2.0（2026-10-16）
> **依据**：原站实测架构（Spring Boot + Vue 3.5 + Element Plus）+ 项目规范
> **目标**：生成自有真实后端，替换 `server.cjs` 的 `/api → http://cems.dev.mooke.cc` 反代
> **契约**：前端 44 个 API 模块、437 个去重路径（`src/api/cems/*.js`），响应信封 `{code:200, message, data}`

---

## 1. 原站架构分析（实测依据）

### 1.1 技术栈确认

| 层 | 原站实测 | 证据 |
|---|---|---|
| 前端 | Vue 3.5.38 + Pinia 3.0.4 + Element Plus | `/assets/index-*.js`，227 个分块 |
| 后端 | **Spring Boot**（Java） | 403 返回 `{"timestamp","status":403,"error":"Forbidden","path":"/api/..."}` 标准 Spring Boot 错误格式 |
| 网关 | Nginx 反代 | `Server: nginx` 响应头 |
| 认证 | JWT Bearer Token | 请求头 `Authorization: Bearer <token>`；401 清存储跳 `/login` |
| 存储前缀 | `erp_*` | localStorage：`erp_token`、`erp_userId`、`erp_menuTree` 等 |
| 主题色 | `#2b5a8c` | `erp-theme-color` 默认值 |

### 1.2 API 契约特征

- 基址：`/api`，axios `timeout: 15s`
- 成功判定：`code === 200`（非 HTTP 状态码）
- 分页：`{records, total, pageNum, pageSize}`（前端 `DataTable` 按此解析）
- 审计字段：`create_by/create_time/update_by/update_time` 普遍存在
- 软删除：多处"删除"实为状态变更（需 `deleted` 或 `status` 字段）

### 1.3 模块分布（437 路径）

| 模块 | 路径数 | 优先级 |
|---|---|---|
| project | 73 | P0 |
| oa | 46 | P1 |
| bid | 32 | P2 |
| finance | 31 | P0 |
| kb | 28 | P2 |
| material | 23 | P0 |
| equipment/cert | 18/18 | P1 |
| labor | 16 | P1 |
| seal | 15 | P1 |
| contract | 14 | P0 |
| attendance/salary | 12/11 | P1 |
| approval | 9 | P0 |
| org/hr | 8/8 | P0（基础） |
| message/employee | 6/6 | P1 |
| 其余 | ~40 | P2 |

---

## 2. 技术选型（对标原站）

### 2.1 后端框架：Spring Boot 3.x

**选型理由**（原站参考架构）：
1. 原站即 Spring Boot，API 行为（错误格式、路径风格、分页）1:1 对齐零成本
2. 调研 Top2 的 JeecgBoot/RuoYi 均为 Spring Boot 生态，必要时可借鉴其权限/代码生成模块
3. 团队如无 Java 背景，见 §2.4 备选方案

**版本**：Spring Boot 3.2 + JDK 17（LTS）

**核心依赖**：
```xml
- spring-boot-starter-web（REST）
- spring-boot-starter-data-jpa（ORM）
- spring-boot-starter-security + jjwt（JWT）
- spring-boot-starter-validation（参数校验）
- mybatis-plus-boot-starter（可选，复杂查询比 JPA 灵活）
- springdoc-openapi-starter-webmvc-ui（Swagger/Knife4j，契约文档）
- mysql-connector-j / postgresql（见 §2.2）
- redis（缓存 token/字典，可选 Phase 2）
```

### 2.2 数据库：MySQL 8.0

**选型理由**：原站大概率 MySQL（国内建筑行业 Java 项目主流）；MyBatis-Plus 对 MySQL 支持最成熟。

备选 PostgreSQL：如需 JSONB 存动态表单/GIS，切换成本低（JPA 屏蔽差异）。

### 2.3 项目结构规范

```
cems-backend/
├── pom.xml
├── src/main/
│   ├── java/com/cems/
│   │   ├── CemsApplication.java
│   │   ├── common/                  # 通用：响应信封、分页、异常、JWT
│   │   │   ├── result/Result.java   # {code,message,data,timestamp,success}
│   │   │   ├── page/PageResult.java # {records,total,pageNum,pageSize}
│   │   │   ├── exception/
│   │   │   └── security/
│   │   ├── modules/                 # 业务模块（1:1 对应前端 src/api/cems/*.js）
│   │   │   ├── auth/
│   │   │   │   ├── controller/AuthController.java
│   │   │   │   ├── service/
│   │   │   │   ├── entity/
│   │   │   │   ├── dto/
│   │   │   │   └── mapper/
│   │   │   ├── approval/
│   │   │   ├── project/
│   │   │   ├── contract/
│   │   │   └── ...（44 个模块）
│   │   └── config/                  # 跨域、Jackson、MyBatis-Plus、Swagger
│   └── resources/
│       ├── application.yml
│       ├── application-dev.yml
│       └── db/migration/            # Flyway 迁移脚本（V1__init.sql…）
└── src/test/                        # 契约测试（§6）
```

**命名规范**：
- Controller：`XxxController`，`@RequestMapping("/api/xxx")`（路径与前端契约逐字一致）
- 方法名：`page/list/getById/create/update/delete`（对应前端 `getXxxPage` 等）
- Entity：`XxxEntity` → 表 `xxx`（下划线命名）
- DTO：`XxxQueryDTO`（查询参数）、`XxxCreateDTO`（新建）

### 2.4 备选方案（团队无 Java 背景时）

NestJS + PostgreSQL（v1.0 计划案）。代价：API 行为需逐个对齐 Spring Boot 细节（如错误格式、分页），约 +20% 联调成本。

---

## 3. 详细实施步骤

### Phase 0：工程初始化 + 契约提取（0.5 天）

**0.1 初始化**
```bash
# Spring Initializr（或手动）
# 依赖：Web, JPA, Security, Validation, MySQL Driver, SpringDoc
```

**0.2 契约提取脚本**（`tools/contract-gen.py`）
- 输入：`src/api/cems/*.js`
- 解析每个 `export const xxx = (params) => request.<method>("<path>")`
- 输出：`api-contract.json`（437 条：method/path/params/module）
- 输出：Controller 空架子（每个路径返回 `501` + `Result.fail("未实现")`）

**0.3 通用层**
- `Result.java`：`{code:200, message:"操作成功", data, timestamp, success:true}`（对标原站）
- `PageResult.java`：`{records, total, pageNum, pageSize}`
- 全局异常：`@RestControllerAdvice` → 业务异常转 `code:500` 信封；Spring 原生 403 保持原格式（前端已兼容）
- JWT：`jjwt`，accessToken 2h + refreshToken 7d；`SecurityFilterChain` 放行 `/api/auth/login`
- 跨域：开发环境允许 `http://134.175.44.110:5173`
- Flyway：`db/migration/V1__init.sql`

**交付**：`mvn spring-boot:run` 启动，437 路径全部 501，Swagger 可见。

### Phase 1：基础底座（3–5 天）

按依赖顺序实现，前端登录链路优先：

| # | 模块 | 接口 | 表 | 种子数据 |
|---|---|---|---|---|
| 1 | auth | `POST /api/auth/login`、`GET /api/auth/current-user`、`POST /api/auth/refresh` | `sys_user`（含 password_hash） | admin/admin123（bcrypt） |
| 2 | menu | `GET /api/menu/user-tree`（19 组）、`GET /api/menu/all`（355 条） | `sys_menu` | 从原站 `GET /api/menu/all` 实测灌入 |
| 3 | user | CRUD + 分页 | `sys_user` | `sample-data/org/user-page.json` |
| 4 | org | 公司/部门/岗位/树 | `sys_org`、`sys_dept`、`sys_post` | `sample-data/org/` |
| 5 | dict | 字典查询 | `sys_dict` | 前端硬编码枚举反推 |

**关键细节**：
- `user-tree` 返回结构必须与原站一致（含 `children` 嵌套），前端 `initRouter()` 依赖
- 密码：`BCryptPasswordEncoder`，强度 10
- 菜单权限：`sys_role_menu` 关联表，admin 角色 `*:*:*`

**验收**：前端登录 → 171 菜单 → dashboard 渲染，无需刷新。

### Phase 2：核心业务模块（2–3 周）

每模块标准动作（1–2 天/模块）：
1. 按 `api-contract.json` 建 Entity + Flyway 迁移
2. 实现 Controller（先 `page` 列表，再详情/新建/更新/删除）
3. 灌 `sample-data/<模块>/` 种子数据
4. 跑契约测试（§6）
5. 用 PAGE-AUDIT 报告核对字段映射

**模块顺序**（按前端使用频率 + 依赖）：

| 周 | 模块 | 说明 |
|---|---|---|
| W1 | approval、contract | 审批流状态机（待审批→通过/驳回）；合同提醒 |
| W1 | hr/employee | 员工列表（0 行 bug 已修，按真实字段） |
| W2 | project（73 接口） | 表最多，先 `page` 类；进度/质量/安全分子模块 |
| W2 | finance | 支出/收入登记（含序号/流水号生成规则） |
| W3 | material、equipment | 库存（5 统计卡逻辑）、设备台账 |
| W3 | cert、labor、seal | 证件到期预警、劳务队伍、用印申请 |
| W3 | message、oa、kb | 消息中心（5 统计卡）、公文、知识库 |

**字段映射依据**：`PAGE-AUDIT-*.md` 4 份报告已记录原站真实字段名（如 `certType/certNo/certLevel/issuer/expireDate`），实现时逐表核对。

### Phase 3：写操作 + 文件 + 工作流（1 周）

1. **写操作落库**：前端 44 模块的 POST/PUT/DELETE 真实写入（去掉"只读复刻"提示）
   - 幂等：新建接口接受客户端 `requestId` 防重提交
   - 审计：自动填 `create_by/update_by`（从 JWT 取 userId）
2. **文件存储**：MinIO（S3 协议），合同附件/证件扫描/发票
   - 表：`sys_file`（id/original_name/oss_key/size/mime）
   - 接口：`POST /api/file/upload` → 返回 `{url, id}`
3. **审批流**：
   - 简单：状态机（DRAFT→PENDING→APPROVED/REJECTED），`approval` 模块内实现
   - 复杂（Phase 4+）：引入 Flowable（JeecgBoot 同款），按需

### Phase 4：切换 + 验收（2–3 天）

1. **契约测试全量**（§6）：437 接口自动化，断言 `code===200` + `data` 结构
2. **种子数据**：`sample-data/` 13 模块灌入（Flyway `V900__seed.sql` 或独立脚本）
3. **切换**：`server.cjs` 反代目标改为 `http://127.0.0.1:8080`（Spring Boot 默认端口）
4. **前端冒烟**：登录 → 20 个核心页面截图对比（复用 PAGE-AUDIT 方法）
5. **回滚预案**：保留原反代配置 1 周，Nginx 一键切回

---

## 4. 数据库设计（核心表）

```sql
-- 用户体系
sys_user(id, username, password_hash, real_name, phone, email, status, dept_id, ...)
sys_role(id, role_code, role_name)                    -- admin/boss/hr_manager
sys_user_role(user_id, role_id)
sys_menu(id, parent_id, menu_name, path, component, perms, sort, ...)  -- 355 条
sys_role_menu(role_id, menu_id)

-- 组织
sys_org(id, parent_id, org_name, org_code, type)     -- 公司/分支
sys_dept(id, org_id, parent_id, dept_name, leader)
sys_post(id, post_code, post_name, level, description, status)

-- 业务（示例：项目/合同/员工）
biz_project(id, project_code, project_name, org_id, manager, status,
            start_date, end_date, contract_amount, deleted_at, ...)
biz_contract(id, contract_no, contract_name, project_id, amount,
             sign_date, expire_date, status, ...)
biz_employee(id, emp_no, real_name, gender, phone, org_id, post_id,
              entry_date, status, ...)

-- 通用
sys_dict(dict_type, dict_key, dict_value, sort)
sys_file(id, original_name, oss_key, size, mime, create_by, create_time)
```

**规范**：
- 主键：雪花 ID（`BIGINT`）或 UUID（分布式友好）
- 审计：`create_by/create_time/update_by/update_time/deleted_at` 每表必备
- 索引：外键 + 常查字段（`status`、`org_id`、`create_time`）
- 迁移：Flyway 版本化，`V1__init.sql` → `V2__business.sql` → …

---

## 5. 接口规范（前后端契约）

### 5.1 成功响应
```json
{ "code": 200, "message": "操作成功", "data": {}, "timestamp": 1792081748958, "success": true }
```

### 5.2 分页响应
```json
{ "code": 200, "message": "操作成功",
  "data": { "records": [], "total": 0, "pageNum": 1, "pageSize": 10 } }
```

### 5.3 错误响应
```json
{ "code": 500, "message": "系统繁忙，请稍后再试", "data": null, "timestamp": 0, "success": false }
```
（401/403 走 Spring Security 原生格式，前端已兼容）

### 5.4 分页参数
`pageNum`（默认 1）、`pageSize`（默认 10），Controller 统一用 `PageQuery` 对象接收。

---

## 6. 测试规范

### 6.1 契约测试（自动化，必须）
- 框架：JUnit 5 + MockMvc（或 TestRestTemplate 跑真实端口）
- 数据源：`api-contract.json` 驱动，437 接口全覆盖
- 断言：`$.code == 200` 且 `$.data` 非 null（列表接口断言 `$.data.records` 为数组）
- 目标：Phase 4 切换前 100% 通过

### 6.2 业务测试
- 每模块至少 1 个核心流程测试（如：创建项目→查询列表→更新状态→删除）
- 审批流：状态机流转测试

### 6.3 前端联调
- 用现有复刻站做 E2E：登录 → 20 个核心页面，截图对比 PAGE-AUDIT 基准

---

## 7. 部署规范

```
134.175.44.110
├── :5173  cems-replica（前端静态，server.cjs）
├── :8080  cems-backend（Spring Boot，systemd 服务）
├── :3306  MySQL 8.0（docker 或原生）
└── :9000  MinIO（docker，Phase 3）
```

- 后端 systemd 服务：`cems-backend`，自启，`Restart=always`
- JVM 参数：`-Xms512m -Xmx2g`（初期）
- 日志：`/var/log/cems-backend/`，按天滚动
- 备份：MySQL 每日 dump 到 `/www/backup/`

---

## 8. 工作量与里程碑

| 里程碑 | 内容 | 时间 |
|---|---|---|
| M0 | Phase 0：脚手架+437 契约+通用层 | 0.5 天 |
| M1 | Phase 1：登录+菜单+组织可用 | 第 1 周末 |
| M2 | Phase 2：核心业务 10 模块 | 第 3 周末 |
| M3 | Phase 2：剩余模块 | 第 4 周末 |
| M4 | Phase 3：写操作+文件 | 第 5 周末 |
| M5 | Phase 4：切换上线 | 第 5 周+2 天 |

**总计：约 5 周（单人 Java 熟手）**

**提速手段**：
- 契约脚本自动生成 Controller 空架子（省 30%）
- MyBatis-Plus 代码生成器：Entity/Mapper/Service 一键生成
- `sample-data/` 种子数据零编写

---

## 9. 风险与对策

| 风险 | 对策 |
|---|---|
| 原站字段语义不明 | PAGE-AUDIT 4 份报告已记录映射；`sample-data/` 真实值反推 |
| 审批流复杂度未知 | Phase 2 先状态机；Flowable 按需 Phase 4+ |
| 437 接口联调量大 | 契约测试自动化；Swagger 可视化 |
| 团队无 Java 背景 | 切备选方案 NestJS（§2.4），+20% 联调成本 |

---

## 10. 待确认事项

1. **技术栈终定**：Spring Boot（对标原站，推荐）vs NestJS（团队 JS 熟）——你拍板
2. **数据库**：MySQL 8.0（推荐）vs PostgreSQL
3. **启动范围**：Phase 0+1 先行（1 周交付登录可用），还是全量开工？
4. **服务器**：MySQL/PG 装 134.175.44.110 上，还是独立数据盘/机器？
