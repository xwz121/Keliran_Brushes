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
