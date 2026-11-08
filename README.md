# Keliran

Keliran 双产品线官网：机柜与设备密封件、工业条刷。使用 Next.js 16、Payload 3 和 PostgreSQL，保留仓库名 `Keliran_Sealing`。前台支持英、法、德、西、意、日、韩及繁体中文，后台使用中文。

## 当前交付状态

界面、产品目录、采购资料、联系渠道、短询盘与技术 RFQ 已实现。内容种子包含 118 条英文草稿、16 个产品、14 个分类、17 种材料及采购指南、解决方案和典型场景。每个产品使用独立配图；图片为示意图，案例明确标注为典型场景。

118 条正文已完成八语翻译、独立 API 审核与逐项修订；20 张示意素材获用户批准，英国公司资料已补齐，均已由 Vercel 写入生产数据库。[keliran.com](https://keliran.com) 新版已上线。正式验收范围及真实询盘/邮件验证边界见 [本次发布记录](docs/execution/EXEC-20260924-production-release.md)，历史代码验收见 [最终检查](docs/FINAL-CHECK.md)。

`main` 关联 Vercel 自动部署。本次固定内容包由 Vercel Production 使用其 `DATABASE_URL` 执行：应用构建 → 数据快照 → 迁移 → 事务发布。失败阻止部署晋升；数据库完成回执防止后续部署覆盖编辑。Preview 不执行该任务，具体保护和恢复边界见 [部署说明](docs/deployment.md)。

## 首波询盘验证改进 · 2026-09-24

围绕 21 天取得首波有效询盘，首页主入口改为发送图纸/尺寸，两条产品线各突出 4 个现有入口产品。Request for Quotation（询价请求，RFQ）表先收基础需求，技术与商业细节按需展开；成功页提供参考号和邮件补交图纸入口。产品页短询盘保存实际产品线。

询盘另存入口页面、外部来源域名及 Urchin Tracking Module（渠道追踪参数，UTM）标签，用于复盘。仅在当前分页暂存最长 24 小时，不保存完整查询串；后台记录是访客提供的信息，不能自动视为有效买家或已核实来源。部署需要新增 `20260924_112728_inquiry_attribution` 迁移。

本次检查、测试证据、来源标记约定和上线前清单见 [首波询盘承接记录](docs/execution/EXEC-20260924-inquiry-sprint.md)。现有内容审核及真实服务验收边界保持独立记录。

## 采购审核与渠道承接优化 · 2026-09-24

依据 [采购与渠道审计](../Keliran_Website_Procurement_Channel_Audit_2026-09-25.md)：首页首屏与标题先说明两条产品线；产品页显示产品系列参考号与“依规格报价”状态，不暗示现货；询价表、WhatsApp 预填消息和结构化数据使用同一参考号。产品页可直达公司资料与供应商准入资料，供应商准入指南侧栏给出登记所需公司资料，页脚显示英国公司法定信息，法律页与指南提示付款资料核验。询价页提供保密协议路径；从 WhatsApp 聊天链接进入的访客会被告知无需重复提交。打印页面保留正文、在线地址与公司信息。

渠道链接与 16 个产品参考号见 [渠道入口链接](docs/channel-links.md)；实现与验收见 [EXEC-20260924-procurement-audit](docs/execution/EXEC-20260924-procurement-audit.md)。新增界面文案待人工语言审核。

## SEO 与采购路径完善 · 2026-09-26

资料页与产品页共享去重和采购关系模块；核心材料、应用、问题、测量指南可直接通向对应家族及带主题的询价。刷丝、背槽、刷座字段分开，询价上下文与产品标识由服务器核验，切换语言保留允许的主题参数。材料译名只用于显示，存储值与筛选键保持不变。

旧地址与业务参考号保留，分类页标识为选型指南。测量指南直达既有清单，供应商指南增加八语空白记录。Sitemap 按实际发布语言生成，补列表语言映射和去重；产品页补可见层级对应的结构化面包屑。实施、部署与验证详见 [SEO/GEO Execution](docs/execution/EXEC-20260926-seo-geo.md)，来源与未核实业务资料见 [证据清单](reports/keliran-content-evidence-gaps.md)。

## 本地开发

建议使用 Node.js 24 LTS 和 pnpm 10.15.0。`.env` 可能保存线上连接信息，本地命令统一使用 `scripts/local-env.mjs`：它固定连接 `127.0.0.1:55439/keliran_redesign`，关闭真实 R2、邮件、AI 与 Turnstile，不改写 `.env`。

已有本地审核库时：

```sh
pnpm install --frozen-lockfile
pnpm db:start
pnpm dev:local
```

官网为 <http://127.0.0.1:3000/en>，后台为 <http://127.0.0.1:3000/admin>。通过本地管理员登录后，打开 `/api/preview?path=/en` 启用一小时草稿预览。未翻译正文在认证预览中回退英文，并显示提示。请始终使用 `127.0.0.1`，避免与 `localhost` 的 Cookie 混用。

首次建立全新审核库：

```sh
pnpm install --frozen-lockfile
pnpm db:start
# 仅首次创建；已有数据库时跳过。PG_BIN 可指向自己的 PostgreSQL 安装目录。
"${PG_BIN:-/opt/homebrew/opt/postgresql@14/bin}/createdb" -h 127.0.0.1 -p 55439 -U keliran keliran_redesign
node scripts/local-env.mjs pnpm migrate
pnpm seed:local
pnpm contacts:local
pnpm review:setup
pnpm dev:local
```

`db:start` 默认使用 Homebrew PostgreSQL 14，只监听本机。`pnpm db:stop` 停止项目专用实例。本地管理员凭据保存于被 Git 忽略的 `.local/redesign-admin.json`。不要在已由开发模式自动同步 schema 的审核库重复运行迁移；迁移命令用于全新数据库及独立部署流程。

`seed:local` 保留已编辑内容。`--refresh-drafts` 会改写英文种子草稿，仅在确认差异后使用。`contacts:local` 只允许更新隔离审核库中的公开公司资料。

## 内容管理与发布

1. 编辑英文草稿，确认供货描述、技术信息、主体资料和素材。
2. 为引用图片填写八语替代文本，并批准允许公开的素材。
3. 在「多语发布中心」运行翻译、技术审核、语言审核及确定性检查。
4. 所有语言通过后，统一发布八种语言；失败时事务回滚。

源内容、译文、共享参数、术语或模型配置改变后，必须重新检查。审核记录保存模型响应、意见、轮次和用量。测试中的模拟响应只验证流程，不代表真实正文审核通过。

正常 CMS 发布会刷新官网缓存。通过 CLI 导入时需另行清理部署环境的 Data Cache。旧版导入脚本仅适用于其指定的数据结构与空白目标库，不应用于本次改版上线。

## 询盘与文件

短询盘和技术 RFQ 先校验并写入数据库，再通过持久化任务发送销售通知。RFQ 按密封件或条刷保存技术字段，安全相关需求进入待复核状态。重复提交 ID 不会重复创建记录；IP 与邮箱限流键使用 HMAC。

通知收件人来自服务器 `SALES_EMAIL`，客户邮箱只作为 Reply-To。邮件未配置时显示 `not-configured`，不声称邮件已送达。管理员可在后台跟进询盘。

RFQ 支持最多 5 个、每个 10 MB 的 PDF、CAD 或图片附件。附件使用独立的 `R2_PRIVATE_BUCKET`，经验证会话直接上传；服务器核对对象大小、类型和文件头。管理员下载链接短时有效，定时任务回收到期文件。私有桶必须与公开媒体桶分离，并关闭公开访问。

未配置私有桶时，页面提供邮件提交图纸的说明，文字询盘仍可使用。真实 R2、Turnstile 和 Resend 服务需在 staging/生产环境单独验收。

## 验收

```sh
node scripts/local-env.mjs pnpm typecheck
node scripts/local-env.mjs pnpm test
RUN_INTEGRATION=true node scripts/local-env.mjs pnpm test tests/payload.integration.test.ts
pnpm format:check
pnpm build:local
# 停止开发服务后，以生产构建启动本地站点：
node scripts/local-env.mjs pnpm start
# 在另一终端运行（先运行浏览器测试生成认证状态）：
node scripts/local-env.mjs pnpm test:e2e
node scripts/local-env.mjs pnpm verify:http
pnpm audit:release:local
```

集成测试只连接本机数据库，并使用模拟 AI 响应，不发送真实邮件。Playwright 使用本机 Chrome。HTTP 验收动态读取本地 CMS，覆盖八语全部列表/详情路径、引用图片、安全入口及 SEO；发布审查追加 `--strict` 会在存在发布阻塞时非零退出。

## 部署资料

环境变量见 [.env.example](.env.example)，部署流程见 [部署说明](docs/deployment.md)。架构为 Vercel Pro + Neon PostgreSQL + Cloudflare R2 + Resend；翻译任务通过服务器端 OpenAI API 执行。生产 Cron 每分钟处理队列，使用 `CRON_SECRET` 验证。密钥、数据库备份和管理员凭据均不提交 Git。

- [改版交付说明](docs/REDESIGN-HANDOFF.md)：改版范围、私有桶配置与迁移步骤。
- [多语发布审查](docs/MULTILINGUAL-RELEASE-REVIEW.md)：正文、公司资料和发布待办。
- [产品配图记录](docs/product-images.md)：独立配图及来源。
- [设计说明](DESIGN.md)：视觉与交互约定。
