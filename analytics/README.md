# eightold 匿名访问统计后台

该目录提供一个隐私友好的访问统计系统：GitHub Pages 继续托管学习站，两个 Cloudflare Worker 共用一个 D1 数据库。

```text
学习站 ──POST /v1/events──> 公开采集 Worker ──> D1
                                                ▲
管理员 ──Cloudflare Access──> 私有管理 Worker ──┘
```

## 能看到什么

- PV、匿名访客数、会话数、热门页面和每日趋势；
- 来源站点、浏览器、系统、设备和近似地区；
- 每个匿名访客的首次/最后访问时间和访问次数；
- 最近访问事件。

匿名访客 ID 由浏览器随机生成，进入 Worker 后只保存 HMAC 哈希。系统不保存原始 IP，也不能识别现实中的姓名。若要显示 GitHub 或站内账号，必须另外增加登录并取得用户知情授权。

## 为什么拆成两个 Worker

采集接口必须公开给学习站调用，管理后台必须私有。将管理 Worker 整体放在 Cloudflare Access 后面，可以避免把管理员密码或 API Token 写进公开的 GitHub Pages。

## 部署

前提：Cloudflare 账号、已启用的 Workers/D1 和 Zero Trust Access。

1. 登录并创建数据库：

   ```bash
   npx wrangler@latest login
   npx wrangler@latest d1 create eightold-analytics
   ```

2. 将命令返回的 `database_id` 同时写入 `wrangler.ingest.jsonc` 与 `wrangler.admin.jsonc`。

3. 初始化远程数据库：

   ```bash
   npx wrangler@latest d1 migrations apply eightold-analytics --remote --config wrangler.ingest.jsonc
   ```

4. 给采集 Worker 设置匿名 ID 的 HMAC 密钥：

   ```bash
   npx wrangler@latest secret put ANON_HMAC_KEY --config wrangler.ingest.jsonc
   ```

   使用密码管理器生成至少 32 字节的随机值，不要把真实密钥提交到仓库。

5. 部署两个 Worker：

   ```bash
   npm run deploy:ingest
   npm run deploy:admin
   ```

6. 打开 Cloudflare → Workers & Pages → `eightold-analytics-admin` → Settings → Domains & Routes，在 `workers.dev` 旁点击 **Enable Cloudflare Access**。进入 **Manage Cloudflare Access**，把 Allow 策略限制为你的确切邮箱。把该 Access 应用的 Team Domain 和 Application Audience（AUD）写入 `ACCESS_TEAM_DOMAIN`、`ACCESS_AUD`。再把同一个登录邮箱保存为管理 Worker 的 Secret（多个邮箱用英文逗号分隔）：

   ```bash
   npx wrangler@latest secret put ADMIN_EMAILS --config wrangler.admin.jsonc
   ```

   然后重新部署管理 Worker。Worker 本身还会校验 Access JWT 的签名、签发者、Audience、有效时间和邮箱白名单。不要直接假定 Git 提交邮箱就是你的 Cloudflare 登录邮箱。

7. 将采集 Worker 地址写入 `Java/JavaGuide/index.html`：

   ```html
   <meta name="analytics-endpoint" content="https://eightold-analytics-ingest.<subdomain>.workers.dev" />
   ```

   留空时网站不会出现授权提示，也不会发送任何统计事件。

## 本地开发

复制 `.dev.vars.example` 为 `.dev.vars`，临时把 `ALLOWED_ORIGINS` 改为本地网站 Origin。初始化本地 D1 后分别运行：

```bash
npx wrangler@latest d1 migrations apply eightold-analytics --local --config wrangler.ingest.jsonc
npm run dev:ingest
npm run dev:admin
```

管理 Worker 默认强制校验 Cloudflare Access，因此完整鉴权流程应在已配置 Access 的线上环境验证。

## 隐私与安全约束

- 上线前必须保留学习站中的隐私说明和明确选择；
- 采集接口只允许 `https://plastictong.github.io` 的浏览器跨域请求；
- CORS 不能阻止伪造请求，因此服务端还做全局/访客双层限流、8 KB 请求体上限、UUID 与字段校验和事件 ID 幂等校验；
- 原始事件默认保存 90 天，Cron 每日清理；
- 管理响应禁止缓存，页面使用严格 CSP，Access 策略之外还会再次核对管理员邮箱；
- 不要在日志中打印事件正文、请求头、匿名原 ID 或 IP。

官方部署参考：[Cloudflare D1](https://developers.cloudflare.com/d1/get-started/)、[workers.dev 与一键 Access](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/)、[Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)、[Workers Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)、[Workers Rate Limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)。
