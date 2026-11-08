# 部署到 Vercel / PostgreSQL / Cloudflare R2（brushes.keliran.com）

本站是从 keliran.com 拆分出的独立项目：独立 Vercel 项目、独立 Neon 数据库、独立 Payload 后台。R2 账户和两个桶与 keliran.com 共用，本站对象全部写在 `brushes/` 前缀下。构建不执行任何内容导入；数据库迁移与内容迁移都是显式命令。

## 准备服务

| 配置                                                          | 用途                                                     | 与 keliran.com                                         |
| ------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------ |
| `DATABASE_URL`                                                | Neon pooled 连接串（SSL）                                | **独立新库**，不要从主站数据库分支                     |
| `DATABASE_URL_UNPOOLED`                                       | 迁移使用的直连串，脚本优先使用                           | 独立                                                   |
| `PAYLOAD_SECRET`                                              | 至少 32 字节随机密钥；同时用于询盘会话与限流 HMAC        | **必须不同**                                           |
| `CRON_SECRET`                                                 | Vercel Cron Bearer 验证                                  | **必须不同**                                           |
| `R2_BUCKET` / `R2_PUBLIC_URL`                                 | 公开图片桶与其公开域名；本站写入 `brushes/` 前缀         | 共用                                                   |
| `R2_PRIVATE_BUCKET`                                           | 私有附件桶；本站写入 `brushes/inquiries/`                | 共用；CORS 需允许 `https://brushes.keliran.com` 的 PUT |
| `R2_ENDPOINT` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`   | R2 访问                                                  | 共用                                                   |
| `RESEND_API_KEY` / `EMAIL_FROM` / `SALES_EMAIL`               | 销售通知邮件；主题带 `[brushes.keliran.com]`             | 可共用                                                 |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY`     | 服务器校验主机名必须为 `brushes.keliran.com`             | 可共用一个小组件，需加入新主机名                       |
| `OPENAI_API_KEY` / `AI_TRANSLATION_MODEL` / `AI_REVIEW_MODEL` | 多语发布中心的翻译与复审                                 | 可共用                                                 |
| `NEXT_PUBLIC_SERVER_URL`                                      | 预览环境的地址；生产固定为 `https://brushes.keliran.com` | —                                                      |

不设置 `LEGACY_HOSTS`（本站没有旧域名）。值只填写在 Vercel 环境变量或被忽略的 `.env`，不要提交 Git 或粘贴到聊天。更换 `NEXT_PUBLIC_*` 后需重新构建。

两站在同一个桶里互不影响：媒体前缀不同，删除只删除自己记录的对象；附件清理任务各自只列举自己的前缀（主站 `inquiries/`，本站 `brushes/inquiries/`）。

## 首次初始化

1. 在 Neon 新建数据库（另建一个测试分支用于预览）。
2. 用直连串运行 `pnpm migrate`，生成完整 schema（含本站 `migration_records`）。生产不使用 schema push。
3. 用 `BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD` 运行一次 `pnpm admin:create`，随后删除这两个变量。
4. 按 [内容迁移说明](../scripts/migration/README.md) 先 `--plan` 再 `--apply` 导入；写入生产库须有当次授权。不要对生产库运行 `pnpm seed`（首导要求空库）。
5. 在 Vercel 导入本仓库（Node 24、pnpm、`vercel.json`）；每分钟 Cron 需要 Pro 计划。
6. 预览环境保持 noindex（只有 `VERCEL_ENV=production` 才允许收录）。
7. 按 [Vercel 域名文档](https://vercel.com/docs/domains/working-with-domains/add-a-domain) 添加 `brushes.keliran.com`，DNS 使用 Vercel 实际给出的记录。
8. 真实 Turnstile、R2 上传、Resend 通知分别验收并记录回执；本地测试不能代替。

## Vercel 项目设置

| 设置              | 值                                                                                                                                                          |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 导入仓库          | `xwz121/Keliran_Brushes`，Root Directory 为仓库根目录                                                                                                       |
| Framework         | Next.js（`vercel.json` 已声明）                                                                                                                             |
| Node.js           | 24.x（`package.json` engines 允许 22–26）                                                                                                                   |
| Install / Build   | 默认安装（pnpm 由锁文件与 `packageManager` 决定）；构建命令取自 `vercel.json`：`node scripts/vercel-preflight.mjs && pnpm generate:importmap && pnpm build` |
| Production Branch | `main`                                                                                                                                                      |
| Cron              | `vercel.json` 每分钟调用 `/api/jobs/run`，需要 **Pro** 计划（Hobby 不支持分钟级，部署会失败）；Vercel 自动携带 `CRON_SECRET`                                |
| 域名              | `brushes.keliran.com`，DNS 使用 Vercel 给出的记录                                                                                                           |

构建前置检查（`scripts/vercel-preflight.mjs`，可本地运行 `pnpm vercel:preflight`）只报告变量名，不输出值：

- 任何环境缺 `DATABASE_URL` 或 `PAYLOAD_SECRET` 都会失败（Payload 加载配置需要）；
- Production 另外要求 R2 五项与私有桶、`CRON_SECRET`、Turnstile 两项，`PAYLOAD_SECRET` 至少 32 字符，私有桶不能等于公开桶，`CONTENT_PREVIEW_MODE` 不能为 true；
- Production 会只读查询数据库：迁移未全部执行或缺少 `migration_records` 表即失败（说明未迁移或连错库）。所以**首次生产部署前必须先执行 `pnpm migrate`**；
- 邮件与 OpenAI 缺失只警告。Preview 中上述生产项均只警告。

### 各环境变量

| 变量                                            | Production                       | Preview                                                                                                                     |
| ----------------------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL` / `DATABASE_URL_UNPOOLED`        | 本站正式库                       | 本站库的 Neon 测试分支（不要用 keliran.com 的库或分支）                                                                     |
| `PAYLOAD_SECRET`                                | 独立随机值                       | 另一个随机值                                                                                                                |
| `CRON_SECRET`                                   | 独立随机值                       | 可不设（预览不跑定时任务）                                                                                                  |
| R2 五项、`R2_PRIVATE_BUCKET`                    | 与 keliran.com 相同的账户和桶    | 显示图片需要 R2；若预览库是正式库的分支，图片记录与正式库指向同一对象，**预览后台不要删除或替换图片**；更稳妥的是单独测试桶 |
| Turnstile 两项                                  | 小组件允许 `brushes.keliran.com` | 不设（非生产环境跳过验证），避免预览主机名不匹配                                                                            |
| `RESEND_API_KEY` / `EMAIL_FROM` / `SALES_EMAIL` | 设置                             | **不设**，避免预览测试询盘发出真实通知                                                                                      |
| `OPENAI_API_KEY` 与模型名                       | 需要多语复审时设置               | 不设                                                                                                                        |
| `NEXT_PUBLIC_SERVER_URL`                        | 不需要（生产固定域名）           | 可不设，默认使用 Vercel 分支地址                                                                                            |
| `CONTENT_PREVIEW_MODE`                          | `false`                          | `false`                                                                                                                     |

### 首次上线顺序

1. Neon 新建本站数据库；本地用直连串执行 `pnpm migrate`，再 `pnpm admin:create`（一次性 `BOOTSTRAP_ADMIN_*`）。
2. 按 [迁移说明](../scripts/migration/README.md) `--plan` → `--apply` 导入内容（生产数据写入，需当次授权）。
3. 在 Vercel 配好变量后部署 `main`；构建前置检查通过才会产出部署。
4. 添加域名，检查 HTTPS、页面、后台登录、询盘（Turnstile、附件上传、通知）、`/api/jobs/run` 定时任务、`/sitemap.xml`、`/robots.txt`、`/llms.txt`，记录回执。
5. 新站可访问后，再发布 keliran.com 的拆分与旧网址跳转。

## 更新与恢复

- 内容更新：后台保存英文草稿 → 多语发布中心检查 → 统一发布。共享资料改写发布后，从 `src/lib/shared-canonical.ts` 删除对应路径。
- Schema 更新：`pnpm migrate:create <name>`，检查 SQL，先在 Neon 测试分支迁移，再迁移生产。
- 回退应用时保留数据库中新增的询盘；Neon 时间点恢复与 R2 对象版本不等于应用内内容版本。
- 询盘默认保留一年，不自动删除客户记录。

## 官方接口依据

- [Payload 上传存储适配器](https://payloadcms.com/docs/upload/storage-adapters)
- [Payload 任务及重试](https://payloadcms.com/docs/jobs-queue/tasks)
- [Payload 数据库事务](https://payloadcms.com/docs/database/transactions)
- [Google 网址变更迁移](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes)
- [Cloudflare Turnstile 服务端验证](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
