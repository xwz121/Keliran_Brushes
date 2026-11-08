# 部署到 Vercel / PostgreSQL / Cloudflare R2

## 2026-09-24 已授权的一次性发布

本次以 Vercel Production 中现有 `DATABASE_URL` 为唯一数据库配置，用户明确确认其正确、本地配置错误。`vercel.json` 的构建后任务负责私有数据快照、迁移及固定八语内容包导入；事务锁防止并发，完成回执防止重复覆盖。无需把生产凭据拉到本机。详细限制、快照性质、验收与恢复方法见 [生产发布 Execution](execution/EXEC-20260924-production-release.md)。

以下是常规新环境部署参考，不代表本次必须新建 Neon 或重建已有数据。

## 准备服务

| 配置                                                      | 用途                                                       |
| --------------------------------------------------------- | ---------------------------------------------------------- |
| `DATABASE_URL`                                            | Neon pooled PostgreSQL 连接串；使用 SSL                    |
| `DATABASE_URL_UNPOOLED`                                   | 迁移时使用的直连串，脚本会优先使用                         |
| `PAYLOAD_SECRET`                                          | 生产独立随机密钥，至少 32 字节；不要使用示例或本地密钥     |
| `NEXT_PUBLIC_SERVER_URL`                                  | 正式网站的 HTTPS 域名，无结尾斜线                          |
| `R2_BUCKET`                                               | 图片 bucket                                                |
| `R2_ENDPOINT`                                             | `https://<account-id>.r2.cloudflarestorage.com`            |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`               | 仅此 bucket 的对象读写权限                                 |
| `R2_PUBLIC_URL`                                           | R2 的公开自定义图片域名，例如 `https://images.example.com` |
| `OPENAI_API_KEY`                                          | 服务器端 OpenAI API 项目密钥                               |
| `AI_TRANSLATION_MODEL`                                    | 默认 `gpt-5.6-terra`                                       |
| `AI_REVIEW_MODEL`                                         | 默认 `gpt-6-astra`                                         |
| `RESEND_API_KEY` / `EMAIL_FROM`                           | 已验证发送域名及邮件发件人                                 |
| `SALES_EMAIL`                                             | 接收销售询盘的内部邮箱                                     |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | 限定正式域名的 Turnstile 站点                              |
| `CRON_SECRET`                                             | Vercel Cron Bearer 验证密钥                                |

将值填写到服务环境变量或私有 `.env`，不要提交到 Git 或聊天。更换 `NEXT_PUBLIC_*` 值后需要重新构建。

R2 存储前缀为 `sealing`。原图及响应式尺寸由 Payload 统一维护。采用服务器上传，不需要浏览器持有 R2 凭据。R2 公共域名用于公开官网素材；内部文档不应上传到这个集合。

## 首次初始化

1. 在 Neon 创建生产数据库及单独的测试分支。
2. 配置生产连接串、应用密钥和 R2 变量，在本地终端运行 `pnpm migrate`。迁移文件已包含在 `src/migrations`；不要在生产使用 schema push。
3. 设置临时 `BOOTSTRAP_ADMIN_EMAIL` 与至少 16 字符的 `BOOTSTRAP_ADMIN_PASSWORD`，运行 `pnpm admin:create`，在对外部署前创建管理员。创建完成后移除这两个临时变量。已有账户时脚本会拒绝覆盖。
4. 运行 `pnpm seed` 导入英文草稿，或者在后台录入自己的内容。
5. 在 Vercel 导入此目录，使用 Node 24、pnpm，以及仓库中的 `vercel.json`。选择 Pro 计划以支持每分钟 Cron。
6. 配置正式域名、Vercel 环境变量，设置 `CONTENT_PREVIEW_MODE=false`。Vercel 的 Production 环境会额外强制关闭示例模式。自行托管时显式设置 `DEPLOYMENT_ENV=production`。
7. 上传确认过的真实产品图片，确认英文内容与经营主体信息，在后台运行检查并统一发布。检查真实 Turnstile、OpenAI 和 Resend 调用后再对外推广。

## 更新与恢复

- 内容更新：保存英文草稿 → 重新检查 → 统一发布。发布后清除官网内容缓存。
- Schema 更新：开发库运行 `pnpm migrate:create <name>`，检查 SQL，在 Neon 测试分支先迁移，再迁移生产。不要无保护地在并行 build 执行迁移；本次固定发布采用数据库事务锁及一次性完成回执。
- 连接生产时，`pnpm migrate` 优先使用 `DATABASE_URL_UNPOOLED` 并强制关闭 schema push。
- 保留 Neon 数据恢复能力及 R2 对象历史/备份策略；应用内内容版本不等同于数据库备份。
- 队列失败：后台检查记录显示失败原因，修改源内容或配置后重新启动检查。邮件任务可以在 Payload Jobs 中排查，询盘记录独立保留。
- 默认询盘保留日期为一年，用于后台管理参考；当前不自动删除客户记录，经营主体确认留存政策后再配置清理流程。

## 官方接口依据

- [Payload 上传存储适配器](https://payloadcms.com/docs/upload/storage-adapters)
- [Payload 任务及重试](https://payloadcms.com/docs/jobs-queue/tasks)
- [Payload 数据库事务](https://payloadcms.com/docs/database/transactions)
- [Vercel 请求 IP 标头](https://vercel.com/docs/headers/request-headers)
- [Cloudflare Turnstile 服务端验证](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)

真实云端执行与公网验收以当前 Execution 为准，本地测试不替代线上结果。
