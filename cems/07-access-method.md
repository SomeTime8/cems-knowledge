---
title: 访问方式
description: DNS/协议差异、远程服务器接入
date: 2026-10-14
source: 远程服务器实测
status: verified
tags: ['CEMS', '访问']
---


## 现象（实测）

- 本地 VM `curl http://cems.dev.mooke.cc/` → CEMS，标题 `CEMS - 建筑企业综合管理平台`，无跳转
- 本地浏览器访问同一 URL → 自动升级到 HTTPS，标题 `astro_nexus_admin`，页面为 Astro Nexus 管理后台
- 远程服务器 `curl http://cems.dev.mooke.cc/` → CEMS，标题同上
- 远程服务器 `curl -sk https://cems.dev.mooke.cc/` → Astro Nexus

## 根因

- **DNS 不同**：远程服务器解析 `cems.dev.mooke.cc` 为 `<DNS解析IP-CEMS>`（CEMS）；本地 VM 解析为 `<DNS解析IP-Astro>`（Astro Nexus 路径）。
- **协议不同**：HTTP 走 CEMS，HTTPS 走 Astro Nexus。浏览器因 HTTPS-First / HSTS 强制升级到 HTTPS，因此进错系统。
- **结论**：不是用户看错，也不是 URL 错，是网络路径（DNS + 协议）不同导致同一域名返回两套系统。以用户确认的 HTTP 版 CEMS 为准。

## 正确访问方式

- 只用 HTTP：`http://cems.dev.mooke.cc/`，不要用 HTTPS。
- 从能正确解析到 `<DNS解析IP-CEMS>` 的网络访问，如用户提供的远程服务器。
- 在远程服务器上 `curl` 验证：`curl -s http://cems.dev.mooke.cc/ | grep -o '<title>[^<]*</title>'` 应为 CEMS。

## 远程服务器接入（实测）

- 服务器：用户提供，`root@<服务器IP>`，主机名 `<主机名>`，系统 OpenCloudOS 9.6，有 `curl` / `python3`，无 `node / npm / chrome`。
- SSH：需在 Muse 设置 → Permissions → Direct network protocols 中将 `ssh` 从 Deny 改为 Ask，否则出站 SSH 被挡。
- SSH 公钥：需将助手公钥加入服务器 `/root/.ssh/authorized_keys`（一行一条，多条公钥追加即可，权限 `.ssh 700` / `authorized_keys 600`）。
- **关键**：助手 VM 中 `whoami` 为 `root`，但 `HOME=/home/hatch`，`ssh` 默认找 `/root/.ssh/`（VM 重启后丢失），因此必须显式指定 `-i <本地密钥路径>`：
  ```bash
  ssh -i <本地密钥路径> -o BatchMode=yes -o StrictHostKeyChecking=accept-new root@<服务器IP> "echo SSH_OK"
  scp -i <本地密钥路径> -o BatchMode=yes -o StrictHostKeyChecking=accept-new root@<服务器IP>:/tmp/xxx /tmp/xxx
  ```
- 登录 CEMS：从远程服务器用 Python `urllib` 调用 `POST /api/auth/login`（账号为登录页展示的默认账号，不在文档中记录密码），Token 存远程 `/tmp/cems_token.txt`，后续以 `Authorization: Bearer` 调用只读 GET。
- **只读原则**：分析时只用 GET 列表/统计接口，不新建、编辑、删除、提交业务数据，不改配置。

## 工具脚本

- 本地 `~/workspace/tools/cems_*.py`（`cems_remote_check.py`、`cems_api_discover.py`、`cems_api_all.py`、`cems_api_probe.py`、`cems_deep_probe.py`、`cems_mock_check.py` 等），通过 `scp -i ...` 传到远程 `/tmp/` 后 `python3` 执行。
- 注意：`~/workspace/tools/` 为助手本地工具，远程服务器无 Node/Chrome，因此分析以 Python + curl 的 API 探针为主，非浏览器 UI 实测。
