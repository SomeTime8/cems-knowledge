# 17 浏览器双出口分流（东京主力 + 硅谷备份）

> 2026-10-20 实测建成并逐项验证。对象：办公服务器 xhcom 上的 Chrome。
> 目标：只有少数站点（GitHub / Google / YouTube / TikTok）需要海外出口，其余流量直连，且**不影响该机的 RDP 与系统流量**。

## 1. 背景与约束

- xhcom 是放在国内的一台 Windows 服务器（公网 `<办公服务器公网IP>`，Tailscale `<办公服务器TailscaleIP>`），日常靠 RDP 远程办公。**RDP 是命脉**：任何整机级代理（Tailscale Exit Node、全局 VPN 路由）都会造成非对称路由、回包绕远路，直接断掉 RDP——2026-10-19 已实证翻车。所以方案被限定在"只管浏览器"这一层。
- 第一版只有硅谷出口（musegg），能通但很慢。排查后确认：慢不在隧道协议，在"国内→美国"跨境段被限速（见 §4）。
- 2026-10-20 新增东京节点（musesj）后格局改变：东京成为主力，硅谷降级为自动备份。

## 2. 架构总览

```
Chrome ──PAC 判断──┬─ 命中名单 ─→ gost 127.0.0.1:1082 ─fifo→ 东京隧道 1081 ─→ musesj（东京）
                   │                                   └（东京故障时 PAC 第二顺位）→ 硅谷隧道 1080 ─→ musegg（硅谷）
                   └─ 未命中 ─→ DIRECT 直连
```

| 组件 | 端口/位置 | 作用 | 常驻方式（计划任务） |
|------|-----------|------|----------------------|
| SSH 隧道 → musegg（硅谷） | 127.0.0.1:1080 | 备份出口 | `SocksProxyToMusegg` |
| SSH 隧道 → musesj（东京） | 127.0.0.1:1081 | **主力出口** | `SocksProxyToTokyo` |
| gost v3.3.0 | 127.0.0.1:1082 | 出口调度（fifo：东京优先） | `GostBalancer` |
| PAC 托管服务（pac_server.py） | 127.0.0.1:8899 | 按请求读取 `proxy.pac` 并返回 | `PacServer` |
| Chrome 策略 ProxySettings | 注册表 HKCU\Software\Policies\Google\Chrome | 指定 pac_script + PAC 的 HTTP 地址 | — |
| windows-mcp | 8000 | 远程 GUI 操作通道（验证用） | `WindowsMcpServer` |

出口节点：

| 节点 | 位置 | 公网 IP | Tailscale IP | 本机出口实测 |
|------|------|---------|--------------|--------------|
| musegg | 腾讯云·硅谷 | `<硅谷出口公网IP>` | `<硅谷出口TailscaleIP>` | 160 Mbps（Cloudflare 25MB / 1.3s） |
| musesj | 腾讯云·东京 | `<东京出口公网IP>` | `<东京出口TailscaleIP>` | YouTube 首页 0.82s |

所有常驻任务统一用 **wscript 隐藏启动器**（`run-*.vbs`，窗口样式 0）拉起循环脚本（`*.cmd` 内 `:loop` 断线重连），开机自启、桌面无窗口。隧道只绑 127.0.0.1，不对局域网/公网监听。

## 3. 分流逻辑

- **PAC 名单**（`C:\Users\Administrator\proxy.pac`）：GitHub 全家（github.com、api.github.com、githubusercontent.com、githubassets.com、github.io）、Google 全家（google.com、googleapis.com、gstatic.com、googleusercontent.com、gmail.com、googlevideo.com 等，**含区域域名 google.com.hk、google.com.tw、google.co.jp、google.com.sg 与短链 g.co**）、YouTube（youtube.com、youtu.be、ytimg.com 等）、TikTok（tiktok.com、tiktokcdn.com、tiktokv.com 等）。子域名按后缀匹配。名单外的域名一律 `DIRECT`。
  - 注意必须带上各家的 **CDN / 视频流 / 登录子域**，否则会出现"页面能开、视频播不了、登录失败"。
- **命中后**返回 `SOCKS5 127.0.0.1:1082; SOCKS5 127.0.0.1:1080`：先经 gost 调度（东京优先），gost 本身或东京链路不可用时，Chrome 按 PAC 第二顺位自动改走硅谷隧道。
- gost 配置（`C:\Users\Administrator\gost\gost.yaml`）：一个 hop 内放 tokyo、siliconvalley 两个 node，selector 策略 `fifo`（首选节点可用时恒用首选，故障才切换）。**不要用命令行双 `-F`**，那是多跳链，不是二选一（见 §6-8）。
- **加新站点**：往 `proxy.pac` 名单里添域名 → 重启 Chrome（PAC 是会话级缓存，不重启不生效）。不用动策略和隧道。

## 4. 性能实测（2026-10-20）

| 测项 | 硅谷 musegg | 东京 musesj |
|------|-------------|-------------|
| 延迟（Tailscale ping） | ~180ms+ | **67ms** |
| 跨境段单连接吞吐（scp 10/20MB） | 44–49 KB/s | **1580 KB/s（36 倍）** |
| 跨境段 4 连接并行聚合 | 89 KB/s（总量疑似被限在 ~0.7Mbps 一档） | — |
| YouTube 首页端到端（经代理，约 950KB） | 44–60 秒 | **4.35 秒** |

结论：两台海外机自身出口都很快，瓶颈纯在跨境段，且按目的地分别限速——**换近的出口（东京）是治本，多开连接只是治标**。选出口先测"办公机→出口机"这一段，不要只测出口机自己的带宽。

## 5. 关键配置要点

- **Chrome 策略只用一条** `ProxySettings`（字符串，JSON）：
  `{"ProxyMode":"pac_script","ProxyPacUrl":"http://127.0.0.1:8899/proxy.pac","ProxyPacMandatory":true}`
  旧的 `ProxyMode` / `ProxyPacUrl` 两个独立值在 Chrome 157 中已"已弃用"、实际不生效（见 §6-1），已删除（备份在 xhcom 的 `chrome-policy-backup.reg`）。
- **PAC 必须用 HTTP 托管**，不能用 `file://`（见 §6-1）。`pac_server.py` 监听 127.0.0.1:8899，每次请求实时读盘上的 `proxy.pac` 返回，改文件即生效（浏览器侧仍需重启刷新缓存）。
- **Defender 白名单**：gost 这类代理工具会被 Windows Defender 当"潜在不受欢迎软件"拦截，连 zip 一起隔离。处理：先 `Add-MpPreference -ExclusionPath C:\Users\Administrator\gost` + `-ExclusionProcess gost.exe`，再把安装包**直接下载到该目录内**解压。排除范围仅限该目录与该进程，不扩大。
- **密钥存放**（只记位置、不记值）：xhcom 的 SSH 私钥 `C:\Users\Administrator\.ssh\id_ed25519`（去两台出口机免密）；出口机侧公钥放在 `C:\ProgramData\ssh\administrators_authorized_keys`（管理员组必须用这个路径，且 ACL 只给 SYSTEM 与 Administrators）。

## 6. 踩坑记录

1. **Chrome 157 代理策略弃用 + 不读 file:// PAC**：策略页显示"已应用"，浏览器却全程直连（YouTube 超时、GitHub 时好时坏）。换 ProxySettings JSON + HTTP 托管 PAC 后解决。判断浏览器有没有真走代理，看证据：`netstat` 里 Chrome 的 NetworkService 进程若对目标 IP 一堆 `SYN_SENT`、对本机代理端口零连接，就是没走代理的铁证。
2. **"GitHub 能打开"是个假象**：github.com 在国内直连偶尔能开，会误判成分流已生效。验证必须用直连必死的站点（YouTube）+ 出口 IP 回显（ip.sb）双确认。
3. **服务器别开 Exit Node**：需接收入站连接（RDP）的机器开 exit node，回包绕出口造成非对称路由、RDP 直接断。Exit Node 只给纯客户端设备。
4. **进程常驻方式**：无头会话里 `Start-Process` 起的进程随会话死亡；必须用计划任务。且**服务本体不能住在可见 cmd 窗口里**——关窗即杀服务（2026-10-20 曾因此三服务全灭）。正解：wscript 隐藏启动器 + 循环脚本，桌面零窗口。
5. **schtasks 两个坑**：`/change` 改任务动作会卡在"输入 Administrator 密码"提示上，只能删除重建；PowerShell 里把输出 `Out-Null` 会吞掉 create 失败（曾出现任务删了没建回、服务静默消失）。关键步骤保留输出逐项核对。
6. **gost 双 `-F` 是多跳链**：`-F A -F B` 表示"经 A 再经 B"，第二个地址会被当成从 A 的落点去连（127.0.0.1 指向 A 所在机器）必然不通。双出口要用 YAML：一个 hop、多个 node + selector 策略。
7. **gost 内部故障切换别全指望**：fifo + maxFails 配置下实测未在请求内自动切换，最终靠 PAC 第二顺位实现浏览器级兜底——分层冗余比单点机制可靠。
8. **无头 Chrome 在该机不可用**：`--headless --dump-dom` 对任何页面都返回空，验证只能走真实 GUI（截图比对）或 curl + netstat，别在无头上浪费时间。
9. **区域域名跳转漏名单（2026-10-20 15:40 实测）**：google.com 对中国用户 302 跳转到 `www.google.com.hk`，.hk 不在名单里就会直连硬闯、12 秒超时，表现为"Google 难打开"而 YouTube 等一切正常。凡是会按地区跳转的站点，区域域名必须一并进名单；排查口诀：先 `curl -I` 看跳转目标在不在名单，再谈速度。
10. **云电脑侧连 xhcom 的通道**：SSH 须经尾网代理（`ProxyCommand` 走 `<出口代理>`），windows-mcp 须经同一隧道代理访问 8000 端口；代理凭证会轮换，407 时从当前环境重取。

## 7. 运维速查

状态检查（xhcom 上 PowerShell）：

```powershell
netstat -ano | Select-String ":1080|:1081|:1082|:8899|:8000" | Select-String "LISTENING"
curl.exe -s --socks5-hostname 127.0.0.1:1081 http://ip.sb   # 应回 <东京出口公网IP>（东京）
curl.exe -s --socks5-hostname 127.0.0.1:1080 http://ip.sb   # 应回 <硅谷出口公网IP>（硅谷）
curl.exe -s --socks5-hostname 127.0.0.1:1082 http://ip.sb   # 应回东京（gost 调度结果）
```

| 现象 | 先查 | 处理 |
|------|------|------|
| 名单内站点超时 | 1082/1081 是否监听、gost 进程在否 | 任务计划里手动运行 `GostBalancer` / `SocksProxyToTokyo` |
| 全部名单站点走直连（慢/超时） | 8899 是否监听、策略 ProxySettings 是否在 | PAC 服务挂了 Chrome 会回退直连；重启 `PacServer` 并重启 Chrome |
| 只有某个站异常 | PAC 名单是否漏了它的 CDN/登录域 | 补域名后重启 Chrome |
| 页面能开但视频转圈 | googlevideo.com / tiktokcdn.com 是否在名单 | 同上 |
| RDP 断了 | 是否有人开了 Exit Node / 改了系统路由 | 关掉；本方案全程不碰系统路由 |

## 8. 安全边界

- 敏感值（密码、私钥、Token）不写入本文档与聊天；只记录存放位置。
- Defender 排除仅针对单一工具目录与单一进程名，工具来源为 GitHub 官方 Release（gost v3.3.0），已校验解压后可执行文件大小与版本输出。
- 全部代理组件仅监听 127.0.0.1，不对局域网开放，不改变系统路由与防火墙入站规则。
